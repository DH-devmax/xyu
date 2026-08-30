#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { access, chmod, cp, lstat, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { promisify } from 'node:util'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const rootDir = fileURLToPath(new URL('..', import.meta.url))
const harnessRootDefault = join(rootDir, 'brain/vendor/deepseek-harness')
const runtimeRelative = 'python/sdk-runtime/src/deepseek_harness_runtime/runtime'
const harnessTag = 'dsh-v0.1.2-alpha.1'
const harnessCommit = 'cd5ef8148158c3a752a658978873241fdf8e2bbc'
const harnessVersion = '0.1.2-alpha.1'
const contractVersion = 'brain.internal.v1'

// usage 输出跨平台构建器的稳定参数，避免 CI 依赖隐含的当前目录。
function usage() {
  return [
    '用法: node scripts/build-brain-runtime.mjs --output <brain-dir> --platform <linux|darwin|windows> --arch <amd64|arm64>',
    '      [--mode <native|node>] [--harness-root <path>] [--node-binary <path>]',
    '      [--dsh-runtime <path>] [--runtime-closure <path>] [--dsh-entry <path>]',
    '',
    'native 模式复制目标平台单文件 DSH；node 模式由 Node 24 carrier 启动闭包中的 dsh。',
  ].join('\n')
}

// parseArgs 解析少量长参数并拒绝未知选项，保证安装载荷不会静默缺字段。
function parseArgs(argv) {
  const values = { mode: '' }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') {
      console.log(usage())
      process.exit(0)
    }
    if (!argument?.startsWith('--')) throw new Error(`未知参数: ${argument ?? ''}`)
    const key = argument.slice(2)
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) throw new Error(`参数 ${argument} 缺少值`)
    values[key.replaceAll('-', '_')] = value
    index += 1
  }
  for (const required of ['output', 'platform', 'arch']) {
    if (!values[required]) throw new Error(`缺少 --${required}`)
  }
  return values
}

// targetTags 把产品命名转换成 Harness 官方构建产物的 platform/arch 标签。
function targetTags(platform, arch) {
  const platformTag = platform === 'darwin' ? 'macos' : platform === 'windows' ? 'win' : platform
  const archTag = arch === 'amd64' ? 'x64' : arch
  return { platformTag, archTag }
}

// assertChoice 校验平台、架构和模式，防止生成无法启动的混合载荷。
function assertChoice(platform, arch, mode) {
  if (!['linux', 'darwin', 'windows'].includes(platform)) throw new Error(`不支持的平台: ${platform}`)
  if (!['amd64', 'arm64'].includes(arch)) throw new Error(`不支持的架构: ${arch}`)
  if (platform === 'windows' && arch !== 'amd64') throw new Error('Windows 仅支持 amd64')
  if (!['native', 'node'].includes(mode)) throw new Error(`不支持的 Brain runtime 模式: ${mode}`)
  if (platform === 'darwin' && arch === 'amd64' && mode === 'native') {
    throw new Error('Intel macOS 使用 node 模式；官方无 macOS x64 原生 runtime')
  }
}

// firstExisting 返回候选中的第一个普通文件，便于本地构建和 CI 缓存共用同一入口。
async function firstExisting(...candidates) {
  for (const candidate of candidates) {
    try {
      const metadata = await stat(candidate)
      if (metadata.isFile()) return candidate
    } catch {
      // 继续尝试下一个候选。
    }
  }
  return ''
}

// copyTree 复制并解除符号链接，安装包运行时必须自包含且可审计。
async function copyTree(source, destination) {
  await mkdir(dirname(destination), { recursive: true })
  await cp(source, destination, { recursive: true, dereference: true, force: true })
}

// copyExecutable 复制一个可执行文件并统一设置跨平台运行权限。
async function copyExecutable(source, destination) {
  await mkdir(dirname(destination), { recursive: true })
  await cp(source, destination, { force: true, dereference: true })
  await chmod(destination, 0o755)
}

// sha256File 生成发布 manifest 使用的稳定文件摘要。
async function sha256File(path) {
  const digest = createHash('sha256')
  digest.update(await readFile(path))
  return digest.digest('hex')
}

// assertNoSymlinks 递归检查载荷，避免复制阶段漏掉上游 workspace 链接。
async function assertNoSymlinks(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(directory, entry.name)
    const metadata = await lstat(path)
    if (metadata.isSymbolicLink()) throw new Error(`Brain runtime 仍包含符号链接: ${path}`)
    if (metadata.isDirectory()) await assertNoSymlinks(path)
  }
}

// nodeMajor 执行待复制的 Node carrier，确保发布包不会带入 Node 22 或系统 shim。
async function nodeMajor(nodeBinary) {
  const result = await execFileAsync(nodeBinary, ['--version'], { timeout: 10_000 })
  const version = String(result.stdout).trim()
  const match = /^v(\d+)/.exec(version)
  if (match?.[1] !== '24') throw new Error(`Node carrier 必须为 24.x，实际为 ${version}`)
  return version
}

// nodeArchitecture 通过 carrier 自身报告 CPU，避免把 arm64 Node 放进 Intel 包。
async function nodeArchitecture(nodeBinary) {
  const result = await execFileAsync(nodeBinary, ['-p', 'process.arch'], { timeout: 10_000 })
  const value = String(result.stdout).trim()
  const normalized = value === 'x64' ? 'amd64' : value
  return normalized
}

// assertDarwinCarrierPortable 拒绝依赖 Homebrew 等外部动态库的 macOS Node carrier。
async function assertDarwinCarrierPortable(nodeBinary) {
  if (process.platform !== 'darwin') return
  const fileType = await execFileAsync('file', ['-b', nodeBinary], { timeout: 10_000 })
    .then(result => String(result.stdout))
    .catch(() => '')
  if (!fileType.includes('Mach-O')) return
  const dependencies = await execFileAsync('otool', ['-L', nodeBinary], { timeout: 10_000 })
    .then(result => String(result.stdout).split('\n').slice(1).map(line => line.trim().split(' ')[0]).filter(Boolean))
  const external = dependencies.filter(path => path.startsWith('@')
    || (path.startsWith('/') && !path.startsWith('/System/Library/') && !path.startsWith('/usr/lib/')))
  if (external.length > 0) {
    throw new Error(`macOS Node carrier 依赖安装包外部动态库: ${external.join(', ')}；请使用官方 Node 24 或 SEA carrier`)
  }
}

// isCurrentTarget 判断构建机是否能够直接启动目标平台的 carrier。
function isCurrentTarget(platform, arch) {
  const currentPlatform = process.platform === 'darwin' ? 'darwin' : process.platform === 'win32' ? 'windows' : process.platform
  const currentArch = process.arch === 'x64' ? 'amd64' : process.arch === 'arm64' ? 'arm64' : process.arch
  return currentPlatform === platform && currentArch === arch
}

// readJSON 读取 JSON 文件并在错误中带上明确路径。
async function readJSON(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    throw new Error(`读取 JSON 失败 ${path}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const options = parseArgs(process.argv.slice(2))
const platform = options.platform
const arch = options.arch
const harnessRoot = resolve(options.harness_root || harnessRootDefault)
const { platformTag, archTag } = targetTags(platform, arch)
const mode = options.mode || (platform === 'darwin' && arch === 'amd64' ? 'node' : 'native')
assertChoice(platform, arch, mode)

const outputBrain = resolve(options.output)
const outputRelativeToRoot = relative(rootDir, outputBrain)
const outputInsideProject = outputRelativeToRoot === '' || (!outputRelativeToRoot.startsWith('..') && !isAbsolute(outputRelativeToRoot))
const outputIsBuildArea = outputRelativeToRoot === 'dist' || outputRelativeToRoot.startsWith(`dist${sep}`)
  || outputRelativeToRoot === '.docker/brain-runtime' || outputRelativeToRoot.startsWith(`.docker${sep}brain-runtime${sep}`)
if (outputBrain === '/' || outputBrain.length < 8 || (outputInsideProject && !outputIsBuildArea)) {
  throw new Error(`拒绝清理危险 Brain 输出路径: ${outputBrain}`)
}
const outputRuntime = join(outputBrain, 'runtime')
const closureSource = resolve(options.runtime_closure || join(harnessRoot, runtimeRelative, 'node'))
const sdkSource = join(harnessRoot, 'packages/sdk/client')
const sdkLibSource = join(sdkSource, 'lib')
const sdkManifestSource = join(sdkSource, 'package.json')
const gatewaySource = join(rootDir, 'brain/gateway/index.mjs')
const profileSource = join(rootDir, 'brain/profile/customer-service.patch.yml')
const resultToolSource = join(rootDir, 'brain/runtime/result-tool.mjs')

for (const path of [closureSource, sdkLibSource, sdkManifestSource, gatewaySource, profileSource, resultToolSource]) {
  await access(path, constants.R_OK).catch(() => { throw new Error(`Brain runtime 构建输入缺失: ${path}`) })
}

const nodeBinaryInput = options.node_binary || process.execPath
const nodeBinary = isAbsolute(nodeBinaryInput) || nodeBinaryInput.includes('/') || nodeBinaryInput.includes('\\')
  ? resolve(nodeBinaryInput)
  : nodeBinaryInput
const nodeVersion = await nodeMajor(nodeBinary)
const nodeArch = await nodeArchitecture(nodeBinary)
if (nodeArch !== arch) throw new Error(`Node carrier 架构与目标不匹配: ${nodeArch} != ${arch}`)
await assertDarwinCarrierPortable(nodeBinary)
const dshExtension = platform === 'windows' ? '.exe' : ''
const generatedRuntimeRoot = join(harnessRoot, runtimeRelative)
const generatedDshName = `deepseek-harness-sdk-runtime-${platformTag}-${archTag}${dshExtension}`
const generatedDsh = await firstExisting(
  options.dsh_runtime ? resolve(options.dsh_runtime) : '',
  join(generatedRuntimeRoot, generatedDshName),
)
const generatedDshRG = generatedDsh === '' ? '' : platform === 'windows'
  ? `${generatedDsh.slice(0, -dshExtension.length)}-rg.exe`
  : `${generatedDsh}-rg`
const generatedDshSpawnHelper = generatedDsh === '' || platform !== 'darwin'
  ? ''
  : `${generatedDsh}-spawn-helper`

if (mode === 'native' && generatedDsh === '') {
  throw new Error(`未找到 ${platformTag}-${archTag} 原生 DSH；请先运行 Harness build-exe-for-python-sdk 或传入 --dsh-runtime`)
}
if (mode === 'native') {
  for (const path of [generatedDshRG, ...(platform === 'darwin' ? [generatedDshSpawnHelper] : [])]) {
    await access(path, constants.R_OK).catch(() => { throw new Error(`原生 DSH sidecar 缺失: ${path}`) })
  }
}

const sdkManifest = await readJSON(sdkManifestSource)
const dshManifestPath = join(closureSource, 'node_modules/@deepseek-ai/dsh/package.json')
const dshManifest = await readJSON(dshManifestPath)
if (sdkManifest.version !== dshManifest.version) {
  throw new Error(`SDK 与 DSH 版本不一致: ${sdkManifest.version} != ${dshManifest.version}`)
}
const productManifest = await readJSON(join(rootDir, 'product/manifest.json'))
const lockedHarness = productManifest.components?.deepseek_harness
if (lockedHarness?.tag !== harnessTag || lockedHarness?.commit !== harnessCommit) {
  throw new Error(`产品 manifest 未锁定 Harness ${harnessTag} (${harnessCommit})`)
}
if (sdkManifest.version !== harnessVersion) {
  throw new Error(`Harness SDK 版本未锁定: ${sdkManifest.version} != ${harnessVersion}`)
}

await rm(outputBrain, { recursive: true, force: true })
await mkdir(outputRuntime, { recursive: true })
await copyTree(closureSource, join(outputRuntime, 'node'))
await copyTree(sdkLibSource, join(outputRuntime, 'node/node_modules/@deepseek-ai/dsh-sdk-client/lib'))
await cp(sdkManifestSource, join(outputRuntime, 'node/node_modules/@deepseek-ai/dsh-sdk-client/package.json'), { force: true })
await mkdir(join(outputBrain, 'gateway'), { recursive: true })
await cp(gatewaySource, join(outputBrain, 'gateway/index.mjs'), { force: true })
await mkdir(join(outputBrain, 'profile'), { recursive: true })
await cp(profileSource, join(outputBrain, 'profile/customer-service.patch.yml'), { force: true })
await cp(resultToolSource, join(outputRuntime, 'result-tool.mjs'), { force: true })

const nodeCarrierName = platform === 'windows' ? 'node-carrier.exe' : 'node-carrier'
await copyExecutable(nodeBinary, join(outputRuntime, nodeCarrierName))
// 同目标构建机直接执行复制后的 carrier，避免源路径上的动态库恰好掩盖安装包缺依赖。
if (isCurrentTarget(platform, arch)) {
  await nodeMajor(join(outputRuntime, nodeCarrierName))
  const copiedArch = await nodeArchitecture(join(outputRuntime, nodeCarrierName))
  if (copiedArch !== arch) throw new Error(`复制后的 Node carrier 架构错误: ${copiedArch} != ${arch}`)
}
let dshRuntimeName = ''
let dshRGName = ''
let dshSpawnHelperName = ''
if (mode === 'native') {
  dshRuntimeName = platform === 'windows' ? 'dsh-runtime.exe' : 'dsh-runtime'
  dshRGName = platform === 'windows' ? 'dsh-runtime-rg.exe' : 'dsh-runtime-rg'
  await copyExecutable(generatedDsh, join(outputRuntime, dshRuntimeName))
  await copyExecutable(generatedDshRG, join(outputRuntime, dshRGName))
  if (platform === 'darwin') {
    dshSpawnHelperName = 'dsh-runtime-spawn-helper'
    await copyExecutable(generatedDshSpawnHelper, join(outputRuntime, dshSpawnHelperName))
  }
}

const dshEntryName = 'node/node_modules/@deepseek-ai/dsh/lib/bin.js'
const sdkEntryName = 'node/node_modules/@deepseek-ai/dsh-sdk-client/lib/index.js'
const relativeFiles = {
  gateway: 'gateway/index.mjs',
  profile: 'profile/customer-service.patch.yml',
  result_tool: 'runtime/result-tool.mjs',
  node_carrier: `runtime/${nodeCarrierName}`,
  sdk_client: `runtime/${sdkEntryName}`,
  dsh_entry: `runtime/${dshEntryName}`,
}
if (mode === 'native') {
  relativeFiles.dsh_runtime = `runtime/${dshRuntimeName}`
  relativeFiles.dsh_rg = `runtime/${dshRGName}`
  if (dshSpawnHelperName !== '') relativeFiles.dsh_spawn_helper = `runtime/${dshSpawnHelperName}`
}

const hashFiles = {}
for (const [name, relativePath] of Object.entries(relativeFiles)) {
  hashFiles[name] = await sha256File(join(outputBrain, relativePath))
}
const runtimeManifest = {
  schema_version: 1,
  contract_version: contractVersion,
  harness: {
    tag: lockedHarness.tag,
    commit: lockedHarness.commit,
    version: sdkManifest.version,
  },
  platform,
  arch,
  mode,
  node: { major: '24', version: nodeVersion, arch: nodeArch },
  paths: relativeFiles,
  sha256: hashFiles,
}
await writeFile(join(outputRuntime, 'runtime.json'), `${JSON.stringify(runtimeManifest, null, 2)}\n`)
await assertNoSymlinks(outputBrain)
console.log(JSON.stringify({ output: outputBrain, platform, arch, mode, node_version: nodeVersion, harness_version: sdkManifest.version, files: Object.keys(relativeFiles).length }, null, 2))

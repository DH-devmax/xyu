#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { access, lstat, readdir, readFile, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { promisify } from 'node:util'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)
const rootDir = fileURLToPath(new URL('..', import.meta.url))
const expectedHarnessTag = 'dsh-v0.1.2-alpha.1'
const expectedHarnessCommit = 'cd5ef8148158c3a752a658978873241fdf8e2bbc'
const expectedHarnessVersion = '0.1.2-alpha.1'

// usage 输出运行时载荷检查器的参数说明。
function usage() {
  return '用法: node scripts/check-brain-runtime-package.mjs --root <brain-dir> [--probe]'
}

// parseArgs 解析检查器参数并保留默认的结构检查模式。
function parseArgs(argv) {
  const values = { probe: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') {
      console.log(usage())
      process.exit(0)
    }
    if (argument === '--probe') {
      values.probe = true
      continue
    }
    if (argument !== '--root') throw new Error(`未知参数: ${argument ?? ''}`)
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) throw new Error('--root 缺少值')
    values.root = value
    index += 1
  }
  if (!values.root) throw new Error('缺少 --root')
  return values
}

// sha256File 计算 manifest 中关键载荷的摘要。
async function sha256File(path) {
  const digest = createHash('sha256')
  digest.update(await readFile(path))
  return digest.digest('hex')
}

// assertNoSymlinks 检查运行时闭包没有遗留 workspace 链接。
async function assertNoSymlinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    const metadata = await lstat(path)
    if (metadata.isSymbolicLink()) throw new Error(`载荷包含符号链接: ${path}`)
    if (metadata.isDirectory()) await assertNoSymlinks(path)
  }
}

// runVersion 执行一个 carrier 命令并返回标准输出，错误中不包含环境密钥。
async function runVersion(command, args) {
  const result = await execFileAsync(command, args, { timeout: 15_000, maxBuffer: 64 * 1024 })
  return String(result.stdout).trim()
}

// assertDarwinCarrierPortable 检查 macOS carrier 不依赖安装包外的动态库。
async function assertDarwinCarrierPortable(command) {
  if (process.platform !== 'darwin') return
  const fileType = await runVersion('file', ['-b', command]).catch(() => '')
  if (!fileType.includes('Mach-O')) return
  const dependencies = (await runVersion('otool', ['-L', command])).split('\n').slice(1)
    .map(line => line.trim().split(' ')[0]).filter(Boolean)
  const external = dependencies.filter(path => path.startsWith('@')
    || (path.startsWith('/') && !path.startsWith('/System/Library/') && !path.startsWith('/usr/lib/')))
  if (external.length > 0) throw new Error(`macOS Node carrier 依赖安装包外部动态库: ${external.join(', ')}`)
}

// isCurrentTarget 判断当前机器是否可以执行目标载荷的二进制探针。
function isCurrentTarget(platform, arch) {
  const currentPlatform = process.platform === 'darwin' ? 'darwin' : process.platform === 'win32' ? 'windows' : process.platform
  const currentArch = process.arch === 'x64' ? 'amd64' : process.arch === 'arm64' ? 'arm64' : process.arch
  return currentPlatform === platform && currentArch === arch
}

const options = parseArgs(process.argv.slice(2))
const brainRoot = resolve(options.root)
const runtimeRoot = join(brainRoot, 'runtime')

// payloadPath 把 manifest 相对路径限制在 Brain 根目录内，阻断路径穿越和绝对路径引用。
function payloadPath(relativePath, label) {
  if (typeof relativePath !== 'string' || relativePath === '' || isAbsolute(relativePath)) {
    throw new Error(`载荷路径无效 ${label}`)
  }
  const resolvedPath = resolve(brainRoot, relativePath)
  const relativeToRoot = relative(brainRoot, resolvedPath)
  if (relativeToRoot === '' || relativeToRoot.startsWith('..') || isAbsolute(relativeToRoot)) {
    throw new Error(`载荷路径越界 ${label}`)
  }
  return resolvedPath
}

// manifestFilePath 从 runtime manifest 解析一个相对文件，并在后续检查中复用同一边界。
function manifestFilePath(name, fallback) {
  return payloadPath(manifest.paths?.[name] || fallback, name)
}

const runtimeManifestPath = join(runtimeRoot, 'runtime.json')
await access(runtimeManifestPath, constants.R_OK).catch(() => { throw new Error(`缺少运行时 manifest: ${runtimeManifestPath}`) })
const manifest = JSON.parse(await readFile(runtimeManifestPath, 'utf8'))
if (manifest.schema_version !== 1) throw new Error(`未知运行时 manifest schema: ${manifest.schema_version}`)
if (manifest.contract_version !== 'brain.internal.v1') throw new Error(`Brain 契约版本错误: ${manifest.contract_version}`)
if (!['linux', 'darwin', 'windows'].includes(manifest.platform)) throw new Error(`运行时平台错误: ${manifest.platform}`)
if (!['amd64', 'arm64'].includes(manifest.arch)) throw new Error(`运行时架构错误: ${manifest.arch}`)
if (!['native', 'node'].includes(manifest.mode)) throw new Error(`运行时模式错误: ${manifest.mode}`)
if (manifest.platform === 'windows' && manifest.arch !== 'amd64') throw new Error('Windows 运行时架构必须为 amd64')
if (manifest.platform === 'darwin' && manifest.arch === 'amd64' && manifest.mode !== 'node') throw new Error('Intel macOS 必须使用 node 模式')
if (manifest.node?.major !== '24') throw new Error(`Node carrier 主版本错误: ${manifest.node?.major}`)
if (manifest.node?.arch !== manifest.arch) throw new Error(`Node carrier 架构记录错误: ${manifest.node?.arch}`)
if (manifest.harness?.tag !== expectedHarnessTag) throw new Error(`Harness tag 错误: ${manifest.harness?.tag}`)
if (manifest.harness?.commit !== expectedHarnessCommit) throw new Error(`Harness commit 错误: ${manifest.harness?.commit}`)
if (manifest.harness?.version !== expectedHarnessVersion) throw new Error(`Harness 版本错误: ${manifest.harness?.version}`)

const requiredRelative = ['gateway/index.mjs', 'profile/customer-service.patch.yml', 'runtime/result-tool.mjs', 'runtime/node/package.json', `runtime/${manifest.platform === 'windows' ? 'node-carrier.exe' : 'node-carrier'}`]
for (const requiredPath of requiredRelative) {
  await access(payloadPath(requiredPath, requiredPath), constants.R_OK).catch(() => { throw new Error(`载荷缺少文件: ${requiredPath}`) })
}
const sdkEntry = manifestFilePath('sdk_client', 'runtime/node/node_modules/@deepseek-ai/dsh-sdk-client/lib/index.js')
const dshEntry = manifestFilePath('dsh_entry', 'runtime/node/node_modules/@deepseek-ai/dsh/lib/bin.js')
await access(sdkEntry, constants.R_OK).catch(() => { throw new Error(`缺少 SDK 客户端入口: ${sdkEntry}`) })
await access(dshEntry, constants.R_OK).catch(() => { throw new Error(`缺少 dsh Node 入口: ${dshEntry}`) })
if (manifest.mode === 'native') {
  const nativeName = manifest.platform === 'windows' ? 'dsh-runtime.exe' : 'dsh-runtime'
  const nativePath = manifestFilePath('dsh_runtime', `runtime/${nativeName}`)
  await access(nativePath, constants.X_OK).catch(() => { throw new Error(`缺少原生 DSH: ${nativeName}`) })
  const rgName = manifest.platform === 'windows' ? 'dsh-runtime-rg.exe' : 'dsh-runtime-rg'
  const rgPath = manifestFilePath('dsh_rg', `runtime/${rgName}`)
  await access(rgPath, constants.X_OK).catch(() => { throw new Error(`缺少 DSH sidecar: ${rgName}`) })
  if (manifest.platform === 'darwin') {
    const spawnHelperPath = manifestFilePath('dsh_spawn_helper', 'runtime/dsh-runtime-spawn-helper')
    await access(spawnHelperPath, constants.X_OK).catch(() => { throw new Error('缺少 macOS spawn-helper') })
  }
}

for (const [name, digest] of Object.entries(manifest.sha256 || {})) {
  if (!/^[a-f0-9]{64}$/.test(String(digest))) throw new Error(`载荷摘要格式错误 ${name}`)
  const path = manifestFilePath(name, String(digest))
  const actual = await sha256File(path)
  if (actual !== digest) throw new Error(`载荷摘要不匹配 ${name}: ${actual}`)
}
await assertNoSymlinks(brainRoot)

const nodeCarrier = manifestFilePath('node_carrier', `runtime/${manifest.platform === 'windows' ? 'node-carrier.exe' : 'node-carrier'}`)
await assertDarwinCarrierPortable(nodeCarrier)
const nodeVersion = await runVersion(nodeCarrier, ['--version']).catch(error => {
  if (options.probe || isCurrentTarget(manifest.platform, manifest.arch)) throw error
  return 'skipped-cross-target'
})
if (nodeVersion !== 'skipped-cross-target' && !/^v24\./.test(nodeVersion)) throw new Error(`Node carrier 探针版本错误: ${nodeVersion}`)
const nodeArch = nodeVersion === 'skipped-cross-target'
  ? 'skipped-cross-target'
  : await runVersion(nodeCarrier, ['-p', 'process.arch'])
if (nodeArch !== 'skipped-cross-target' && (nodeArch === 'x64' ? 'amd64' : nodeArch) !== manifest.arch) {
  throw new Error(`Node carrier 探针架构错误: ${nodeArch}`)
}

let dshVersion = 'skipped'
if (manifest.mode === 'native') {
  const nativeName = manifest.platform === 'windows' ? 'dsh-runtime.exe' : 'dsh-runtime'
  const nativePath = manifestFilePath('dsh_runtime', `runtime/${nativeName}`)
  dshVersion = await runVersion(nativePath, ['--version']).catch(error => {
    if (options.probe || isCurrentTarget(manifest.platform, manifest.arch)) throw error
    return 'skipped-cross-target'
  })
  if (dshVersion !== 'skipped-cross-target' && dshVersion !== '0.1.2-alpha.1') throw new Error(`原生 DSH 版本探针错误: ${dshVersion}`)
} else if (nodeVersion !== 'skipped-cross-target') {
  dshVersion = await runVersion(nodeCarrier, [dshEntry, '--version'])
  if (dshVersion !== '0.1.2-alpha.1') throw new Error(`Node DSH 版本探针错误: ${dshVersion}`)
}

// SDK import probe 确认闭包内协议依赖和 ESM 入口均可由 carrier 解析。
if (nodeVersion !== 'skipped-cross-target') {
  await runVersion(nodeCarrier, ['--input-type=module', '-e', `await import(${JSON.stringify(sdkEntry)}); console.log('sdk-ok')`])
}

console.log(JSON.stringify({
  check: 'brain-runtime-package',
  root: brainRoot,
  platform: manifest.platform,
  arch: manifest.arch,
  mode: manifest.mode,
  node_version: nodeVersion,
  node_arch: nodeArch,
  dsh_version: dshVersion,
  hashed_files: Object.keys(manifest.sha256 || {}).length,
  symlinks: 0,
}, null, 2))

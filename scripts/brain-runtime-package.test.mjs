import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { chmod, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import test from 'node:test'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const buildScript = join(projectRoot, 'scripts/build-brain-runtime.mjs')
const checkScript = join(projectRoot, 'scripts/check-brain-runtime-package.mjs')
const node24Available = process.versions.node.startsWith('24.')

// runNode 执行一个产品脚本并返回 stdout/stderr，失败时保留完整诊断。
function runNode(script, args, cwd = projectRoot) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd, env: process.env })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.once('error', reject)
    child.once('close', code => resolvePromise({ code, stdout, stderr }))
  })
}

// writeFixture 写入最小闭包文件，模拟官方 deploy root 而不下载网络依赖。
async function writeFixture(root) {
  const closure = join(root, 'harness', 'runtime', 'node')
  const dshPackage = join(closure, 'node_modules/@deepseek-ai/dsh')
  const sdkPackage = join(root, 'harness', 'packages/sdk/client')
  await mkdir(join(dshPackage, 'lib'), { recursive: true })
  await mkdir(join(sdkPackage, 'lib'), { recursive: true })
  await writeFile(join(closure, 'package.json'), JSON.stringify({ type: 'module' }) + '\n')
  await writeFile(join(dshPackage, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh', version: '0.1.2-alpha.1', type: 'module' }) + '\n')
  await writeFile(join(dshPackage, 'lib/bin.js'), [
    "if (process.argv.includes('--version')) process.stdout.write('0.1.2-alpha.1\\n')",
    "else process.stdout.write('fixture\\n')",
  ].join('\n'))
  await writeFile(join(sdkPackage, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-sdk-client', version: '0.1.2-alpha.1', type: 'module' }) + '\n')
  await writeFile(join(sdkPackage, 'lib/index.js'), 'export const fixture = true\n')
  // nodeCarrier 是测试用转发器，保持 Node 24 参数和架构输出但不依赖机器 PATH。
  const nodeCarrier = join(root, 'harness', process.platform === 'win32' ? 'node-carrier.cmd' : 'node-carrier')
  if (process.platform === 'win32') {
    await writeFile(nodeCarrier, `@echo off\r\n"${process.execPath}" %*\r\n`)
  } else {
    await writeFile(nodeCarrier, `#!/bin/sh\nexec ${JSON.stringify(process.execPath)} "$@"\n`)
    await chmod(nodeCarrier, 0o755)
  }
  const nativeDsh = join(root, 'harness', 'fake-dsh')
  const nativeDshSource = '#!/bin/sh\nprintf "0.1.2-alpha.1\\n"\n'
  await writeFile(nativeDsh, nativeDshSource)
  await writeFile(`${nativeDsh}-rg`, nativeDshSource)
  await chmod(nativeDsh, 0o755)
  await chmod(`${nativeDsh}-rg`, 0o755)
  return { harnessRoot: join(root, 'harness'), closure, nativeDsh, nodeCarrier }
}

// buildAndCheck 构建一种模式并立即用 checker 重新打开 manifest 和载荷。
async function buildAndCheck(fixture, output, mode) {
  const build = await runNode(buildScript, [
    '--output', output,
    '--platform', 'linux',
    '--arch', process.arch === 'x64' ? 'amd64' : 'arm64',
    '--mode', mode,
    '--harness-root', fixture.harnessRoot,
    '--runtime-closure', fixture.closure,
    '--node-binary', fixture.nodeCarrier,
    ...(mode === 'native' ? ['--dsh-runtime', fixture.nativeDsh] : []),
  ])
  assert.equal(build.code, 0, `${mode} build failed:\n${build.stdout}\n${build.stderr}`)
  const check = await runNode(checkScript, ['--root', output, '--probe'])
  assert.equal(check.code, 0, `${mode} check failed:\n${check.stdout}\n${check.stderr}`)
  const manifest = JSON.parse(await readFile(join(output, 'runtime/runtime.json'), 'utf8'))
  assert.equal(manifest.mode, mode)
  assert.equal(manifest.node.major, '24')
  return manifest
}

test('brain runtime builder and checker cover node and native payloads', { skip: !node24Available || process.platform === 'win32' }, async () => {
  // root 是本次测试的隔离目录，结束后删除所有构建载荷。
  const root = await mkdtemp(join(tmpdir(), 'dh-brain-runtime-test-'))
  try {
    const fixture = await writeFixture(root)
    const nodeManifest = await buildAndCheck(fixture, join(root, 'node-mode'), 'node')
    const nativeManifest = process.platform === 'win32'
      ? undefined
      : await buildAndCheck(fixture, join(root, 'native-mode'), 'native')
    assert.equal(Object.keys(nodeManifest.sha256).length, 6)
    if (nativeManifest !== undefined) assert.equal(Object.keys(nativeManifest.sha256).length, 8)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('brain runtime checker rejects tampered files and symlinks', { skip: !node24Available || process.platform === 'win32' }, async () => {
  // root 是本次负向检查的隔离目录。
  const root = await mkdtemp(join(tmpdir(), 'dh-brain-runtime-tamper-'))
  try {
    const fixture = await writeFixture(root)
    const output = join(root, 'payload')
    await buildAndCheck(fixture, output, 'node')
    const manifestPath = join(output, 'runtime/runtime.json')
    const lockedManifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    lockedManifest.harness.commit = '0000000000000000000000000000000000000000'
    await writeFile(manifestPath, `${JSON.stringify(lockedManifest, null, 2)}\n`)
    const unlocked = await runNode(checkScript, ['--root', output])
    assert.notEqual(unlocked.code, 0)
    assert.match(`${unlocked.stdout}\n${unlocked.stderr}`, /Harness commit 错误/)

    await buildAndCheck(fixture, output, 'node')
    const resultTool = join(output, 'runtime/result-tool.mjs')
    await writeFile(resultTool, `${await readFile(resultTool, 'utf8')}\n// tampered\n`)
    const tampered = await runNode(checkScript, ['--root', output])
    assert.notEqual(tampered.code, 0)
    assert.match(`${tampered.stdout}\n${tampered.stderr}`, /摘要不匹配/)

    await buildAndCheck(fixture, output, 'node')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    manifest.paths.sdk_client = '../outside-sdk.js'
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    const escaped = await runNode(checkScript, ['--root', output])
    assert.notEqual(escaped.code, 0)
    assert.match(`${escaped.stdout}\n${escaped.stderr}`, /路径越界/)

    await buildAndCheck(fixture, output, 'node')
    await symlink('runtime.json', join(output, 'runtime/manifest-link'))
    const linked = await runNode(checkScript, ['--root', output])
    assert.notEqual(linked.code, 0)
    assert.match(`${linked.stdout}\n${linked.stderr}`, /符号链接/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

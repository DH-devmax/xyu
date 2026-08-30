import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { lstat, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import test from 'node:test'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// projectRoot 是产品脚本的仓库根目录。
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// normalizeScript 是本测试通过真实子进程调用的闭包归一化器。
const normalizeScript = join(projectRoot, 'scripts/normalize-harness-runtime-closure.mjs')

// runNormalizer 执行归一化器并保留成功或失败的完整输出。
function runNormalizer(root, sourceNodeModules) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [
      normalizeScript,
      '--root', root,
      '--source-node-modules', sourceNodeModules,
    ], { cwd: projectRoot, env: process.env })
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

// collectSymlinks 递归收集 fixture 中的符号链接，用于确认发布输出可独立移动。
async function collectSymlinks(directory) {
  const links = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    const metadata = await lstat(path)
    if (metadata.isSymbolicLink()) links.push(path)
    else if (metadata.isDirectory()) links.push(...await collectSymlinks(path))
  }
  return links
}

// writePackage 创建一个最小可读包，避免测试依赖完整 Harness 安装。
async function writePackage(path, name, files = {}) {
  await mkdir(path, { recursive: true })
  await writeFile(join(path, 'package.json'), `${JSON.stringify({ name, version: '1.0.0', type: 'module' })}\n`)
  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = join(path, relativePath)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, content)
  }
}

test('normalizer restores omitted packages and materializes deploy links', async () => {
  // fixtureRoot 隔离部署目标、workspace 源包和源 node_modules。
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'dh-harness-closure-'))
  try {
    const closure = join(fixtureRoot, 'runtime/node')
    const nodeModules = join(closure, 'node_modules')
    const sourceNodeModules = join(fixtureRoot, 'source-node-modules')
    const linkedSource = join(fixtureRoot, 'workspace/linked-package')
    await mkdir(join(nodeModules, '.bin'), { recursive: true })
    await mkdir(sourceNodeModules, { recursive: true })
    await writePackage(linkedSource, '@fixture/linked', {
      'lib/index.js': 'export const linked = true\n',
      'node_modules/duplicate/package.json': '{}\n',
    })
    await writePackage(join(sourceNodeModules, '@fixture/restored'), '@fixture/restored', {
      'lib/index.js': 'export const restored = true\n',
      'node_modules/duplicate/package.json': '{}\n',
    })
    await writePackage(join(sourceNodeModules, '@deepseek-ai/dsh'), '@deepseek-ai/dsh', {
      'lib/bin.js': "console.log('fixture')\n",
    })
    await symlink(linkedSource, join(nodeModules, 'linked-package'), 'dir')
    await symlink('../linked-package/lib/index.js', join(nodeModules, '.bin/tool'))
    await mkdir(closure, { recursive: true })
    await writeFile(join(closure, 'package.json'), `${JSON.stringify({
      name: 'fixture-closure',
      dependencies: {
        '@deepseek-ai/dsh': 'workspace:^',
        '@fixture/restored': 'workspace:^',
        'linked-package': 'workspace:^',
      },
    })}\n`)
    for (const name of ['README.md', 'README.zh.md', 'README.i18n.yaml']) {
      await writeFile(join(closure, name), 'deploy-only\n')
    }

    const result = await runNormalizer(closure, sourceNodeModules)
    assert.equal(result.code, 0, `${result.stdout}\n${result.stderr}`)
    assert.match(result.stdout, /harness-runtime-closure: 通过（依赖 3，恢复 2，解除链接 2）/)
    assert.equal((await collectSymlinks(nodeModules)).length, 0)
    assert.equal(await readFile(join(nodeModules, 'linked-package/lib/index.js'), 'utf8'), 'export const linked = true\n')
    assert.equal(await readFile(join(nodeModules, '@fixture/restored/lib/index.js'), 'utf8'), 'export const restored = true\n')
    await assert.rejects(readFile(join(nodeModules, 'linked-package/node_modules/duplicate/package.json'), 'utf8'))
    await assert.rejects(readFile(join(nodeModules, '@fixture/restored/node_modules/duplicate/package.json'), 'utf8'))
    await assert.rejects(readFile(join(nodeModules, '.bin/tool'), 'utf8'))
    await assert.rejects(readFile(join(closure, 'README.md'), 'utf8'))
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true })
  }
})

test('normalizer rejects a direct dependency absent from both deploy roots', async () => {
  // fixtureRoot 构造缺包输入，确认失败而不会产生不完整发布闭包。
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'dh-harness-closure-missing-'))
  try {
    const closure = join(fixtureRoot, 'runtime/node')
    const sourceNodeModules = join(fixtureRoot, 'source-node-modules')
    await mkdir(join(closure, 'node_modules'), { recursive: true })
    await mkdir(sourceNodeModules, { recursive: true })
    await writeFile(join(closure, 'package.json'), `${JSON.stringify({
      name: 'fixture-closure',
      dependencies: { '@fixture/missing': 'workspace:^' },
    })}\n`)

    const result = await runNormalizer(closure, sourceNodeModules)
    assert.notEqual(result.code, 0)
    assert.match(`${result.stdout}\n${result.stderr}`, /部署依赖 @fixture\/missing 在目标与源目录中均不存在/)
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true })
  }
})

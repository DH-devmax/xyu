#!/usr/bin/env node

import { access, cp, lstat, mkdir, readFile, readdir, realpath, rm } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'

// deployOnlyDocs 是 pnpm deploy 生成、但不属于运行时闭包的根目录文档。
const deployOnlyDocs = ['README.md', 'README.zh.md', 'README.i18n.yaml']
// requiredDshEntry 是安装包中 Node 模式的固定 DSH 入口。
const requiredDshEntry = 'node_modules/@deepseek-ai/dsh/lib/bin.js'

// usage 输出闭包归一化器的稳定命令行格式。
function usage() {
  return '用法: node scripts/normalize-harness-runtime-closure.mjs --root <deploy-dir> --source-node-modules <dir>'
}

// parseArgs 解析必需路径，拒绝默认到当前目录的破坏性操作。
function parseArgs(argv) {
  const values = {}
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help' || argument === '-h') {
      console.log(usage())
      process.exit(0)
    }
    if (argument !== '--root' && argument !== '--source-node-modules') {
      throw new Error(`未知参数: ${argument ?? ''}`)
    }
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) throw new Error(`${argument} 缺少值`)
    if (argument === '--root') values.root = value
    else values.source_node_modules = value
    index += 1
  }
  if (!values.root) throw new Error('缺少 --root')
  if (!values.source_node_modules) throw new Error('缺少 --source-node-modules')
  return values
}

// assertDirectory 确认输入目录在任何复制或删除前已存在且可读。
async function assertDirectory(path, label) {
  await access(path, constants.R_OK).catch(() => { throw new Error(`${label} 不可读: ${path}`) })
  const metadata = await lstat(path)
  if (!metadata.isDirectory()) throw new Error(`${label} 不是目录: ${path}`)
}

// copyPackage 把 workspace 包解引用为真实文件，并排除会引入第二套 Cordis 实例的嵌套 node_modules。
async function copyPackage(source, destination) {
  const nestedNodeModules = join(source, 'node_modules')
  await rm(destination, { recursive: true, force: true })
  await mkdir(dirname(destination), { recursive: true })
  await cp(source, destination, {
    recursive: true,
    dereference: true,
    filter: path => path !== nestedNodeModules && !path.startsWith(nestedNodeModules + sep),
  })
}

// findSymlink 深度优先返回目录中第一个符号链接，供循环逐个解引用。
async function findSymlink(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    const metadata = await lstat(path)
    if (metadata.isSymbolicLink()) return path
    if (metadata.isDirectory()) {
      const nested = await findSymlink(path)
      if (nested !== undefined) return nested
    }
  }
  return undefined
}

// restoreMissingDependencies 恢复 legacy deploy 错误留在源 node_modules 中的顶层直接依赖。
async function restoreMissingDependencies(root, sourceNodeModules, dependencies) {
  const restored = []
  for (const dependency of dependencies) {
    const destination = join(root, 'node_modules', dependency)
    try {
      await access(destination, constants.R_OK)
      continue
    } catch {
      // 目标不存在时才从 deploy 源恢复，保留 pnpm 已生成的其他包。
    }
    const source = join(sourceNodeModules, dependency)
    await access(source, constants.R_OK).catch(() => {
      throw new Error(`部署依赖 ${dependency} 在目标与源目录中均不存在`)
    })
    await copyPackage(source, destination)
    restored.push(dependency)
  }
  return restored
}

// materializeLinks 删除命令链接目录并将所有其他 workspace 链接复制为独立文件。
async function materializeLinks(nodeModules) {
  let operations = 0
  let remaining = await findSymlink(nodeModules)
  while (remaining !== undefined) {
    const segments = relative(nodeModules, remaining).split(sep)
    const binIndex = segments.lastIndexOf('.bin')
    if (binIndex >= 0) {
      await rm(join(nodeModules, ...segments.slice(0, binIndex + 1)), { recursive: true, force: true })
      operations += 1
      remaining = await findSymlink(nodeModules)
      continue
    }
    const source = await realpath(remaining)
    await copyPackage(source, remaining)
    operations += 1
    remaining = await findSymlink(nodeModules)
  }
  return operations
}

// normalizeClosure 使 Intel macOS 的纯 Node 运行时与 Harness 上游原生构建产生的闭包保持同一不变量。
async function normalizeClosure(root, sourceNodeModules) {
  if (root === resolve('/') || root.length < 8 || !isAbsolute(root)) {
    throw new Error(`拒绝处理危险闭包路径: ${root}`)
  }
  await assertDirectory(root, '部署闭包')
  await assertDirectory(sourceNodeModules, '源 node_modules')
  const manifestPath = join(root, 'package.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const dependencies = Object.keys(manifest.dependencies ?? {}).sort()
  if (dependencies.length === 0) throw new Error(`部署闭包没有直接依赖: ${manifestPath}`)

  const restored = await restoreMissingDependencies(root, sourceNodeModules, dependencies)
  const nodeModules = join(root, 'node_modules')
  const linkOperations = await materializeLinks(nodeModules)
  await Promise.all(deployOnlyDocs.map(name => rm(join(root, name), { force: true })))

  const missing = []
  for (const dependency of dependencies) {
    try {
      await access(join(nodeModules, dependency), constants.R_OK)
    } catch {
      missing.push(dependency)
    }
  }
  if (missing.length > 0) throw new Error(`归一化后仍缺少依赖: ${missing.join(', ')}`)
  await access(join(root, requiredDshEntry), constants.R_OK).catch(() => {
    throw new Error(`归一化后缺少 DSH 入口: ${requiredDshEntry}`)
  })
  const remainingLink = await findSymlink(nodeModules)
  if (remainingLink !== undefined) throw new Error(`归一化后仍存在符号链接: ${remainingLink}`)
  return { dependencies: dependencies.length, restored, linkOperations }
}

const options = parseArgs(process.argv.slice(2))
const root = resolve(options.root)
const sourceNodeModules = resolve(options.source_node_modules)
const result = await normalizeClosure(root, sourceNodeModules)
console.log(`harness-runtime-closure: 通过（依赖 ${result.dependencies}，恢复 ${result.restored.length}，解除链接 ${result.linkOperations}）`)

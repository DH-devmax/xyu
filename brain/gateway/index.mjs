/**
 * DH 闲不下来 Brain gateway。
 *
 * 该进程是 Go 业务服务与 DeepSeek Harness 之间唯一的本地边界：
 * - 只监听 127.0.0.1 随机端口，并要求一次性 bearer token；
 * - 同一 session 串行，全局并发和排队时间有界；
 * - Harness 只能提交草案，消息发送、改价和持久化仍由 Go 完成。
 */

import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { once } from 'node:events'
import { delimiter, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const gatewayDirectory = dirname(fileURLToPath(import.meta.url))
const productRoot = resolve(gatewayDirectory, '../..')
const configuredHarnessRoot = String(process.env.DH_BRAIN_HARNESS_ROOT ?? '').trim()
const harnessRoot = configuredHarnessRoot === ''
  ? join(productRoot, 'brain/vendor/deepseek-harness')
  : resolve(configuredHarnessRoot)
const configuredRuntimeRoot = String(process.env.DH_BRAIN_RUNTIME_ROOT ?? '').trim()
const runtimeRoot = configuredRuntimeRoot === ''
  ? join(productRoot, 'brain/runtime')
  : resolve(configuredRuntimeRoot)
const brainRoot = dirname(runtimeRoot)

// readRuntimeManifest 读取安装包载荷锁定信息；开发树没有 manifest 时保留源码回落。
function readRuntimeManifest() {
  const manifestPath = join(runtimeRoot, 'runtime.json')
  if (!existsSync(manifestPath)) return {}
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (error) {
    throw new Error(`Brain runtime manifest 解析失败: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (manifest?.schema_version !== 1 || manifest.contract_version !== 'brain.internal.v1') {
    throw new Error('Brain runtime manifest 契约版本错误')
  }
  if (manifest.harness?.tag !== 'dsh-v0.1.2-alpha.1'
    || manifest.harness?.commit !== 'cd5ef8148158c3a752a658978873241fdf8e2bbc'
    || manifest.harness?.version !== '0.1.2-alpha.1') {
    throw new Error('Brain runtime manifest Harness 锁定信息错误')
  }
  return manifest
}

const runtimeManifest = readRuntimeManifest()

// runtimeManifestPath 将 manifest 中的相对路径限制在 brain 载荷根，防止路径越界。
function runtimeManifestPath(name, fallback) {
  const candidate = runtimeManifest.paths?.[name] ?? fallback
  if (typeof candidate !== 'string' || candidate === '' || candidate.startsWith('/') || candidate.includes('\\')) {
    throw new Error(`Brain runtime manifest 路径无效: ${name}`)
  }
  const resolvedPath = resolve(brainRoot, candidate)
  const relativePath = relative(brainRoot, resolvedPath)
  if (relativePath === '' || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(`Brain runtime manifest 路径越界: ${name}`)
  }
  return resolvedPath
}

const runtimeNodeRoot = join(runtimeRoot, 'node')
const runtimeModuleAnchor = existsSync(join(runtimeNodeRoot, 'package.json'))
  ? join(runtimeNodeRoot, 'package.json')
  : join(harnessRoot, 'packages/mcp/mcp-client/package.json')
const requireFromRuntime = createRequire(runtimeModuleAnchor)
const { McpServer } = requireFromRuntime('@modelcontextprotocol/sdk/server/mcp.js')
const { StreamableHTTPServerTransport } = requireFromRuntime('@modelcontextprotocol/sdk/server/streamableHttp.js')
const { z } = requireFromRuntime('zod')
const configuredSDKClientEntry = String(process.env.DH_BRAIN_SDK_CLIENT_ENTRY ?? '').trim()
const sdkClientEntry = configuredSDKClientEntry === ''
  ? runtimeManifestPath('sdk_client', 'runtime/node/node_modules/@deepseek-ai/dsh-sdk-client/lib/index.js')
  : resolve(configuredSDKClientEntry)
const sdkModule = existsSync(sdkClientEntry)
  ? await import(pathToFileURL(sdkClientEntry).href)
  : await import(pathToFileURL(join(harnessRoot, 'packages/sdk/client/src/index.ts')).href)
const { DeepSeekHarness, createProcessDeepSeekHarness } = sdkModule
const resultToolEntry = runtimeManifestPath('result_tool', 'runtime/result-tool.mjs')
const { validateDraft } = await import(pathToFileURL(resultToolEntry).href)

const contractVersion = process.env.DH_BRAIN_CONTRACT_VERSION ?? 'brain.internal.v1'
const bearerToken = String(process.env.DH_BRAIN_TOKEN ?? '').trim()
const profilePath = process.env.DH_BRAIN_PROFILE_PATH ?? join(productRoot, 'brain/profile/customer-service.patch.yml')
const dataRoot = process.env.DH_BRAIN_DATA_ROOT ?? join(productRoot, 'data/brain')
const dshRuntimePath = String(process.env.DH_BRAIN_DSH_RUNTIME ?? '').trim()
  || (runtimeManifest.paths?.dsh_runtime === undefined ? '' : runtimeManifestPath('dsh_runtime', ''))
const dshEntryPath = String(process.env.DH_BRAIN_DSH_ENTRY ?? '').trim()
  || (runtimeManifest.paths?.dsh_entry === undefined ? '' : runtimeManifestPath('dsh_entry', ''))
const nodeBinaryPath = String(process.env.DH_BRAIN_NODE_BINARY ?? '').trim()
  || (runtimeManifest.paths?.node_carrier === undefined ? '' : runtimeManifestPath('node_carrier', ''))
const mcpBackendURL = String(process.env.DH_BRAIN_MCP_BACKEND_URL ?? '').trim()
const mcpBackendToken = String(process.env.DH_BRAIN_MCP_BACKEND_TOKEN ?? '').trim()
// mcpClientURL/mcpClientToken 是 gateway 暴露给 Harness profile 的一次性地址和凭证。
// 随机监听端口在模块加载后才确定，因此使用可更新变量保存最终值。
let mcpClientURL = String(process.env.DH_BRAIN_MCP_URL ?? '').trim()
let mcpClientToken = String(process.env.DH_BRAIN_MCP_TOKEN ?? '').trim()
const maxConcurrency = boundedInteger(process.env.DH_BRAIN_MAX_CONCURRENCY, 4, 1, 16)
const queueTimeoutMS = boundedInteger(process.env.DH_BRAIN_QUEUE_TIMEOUT_MS, 5_000, 100, 30_000)
const requestTimeoutMS = boundedInteger(process.env.DH_BRAIN_TIMEOUT_MS, 30_000, 1_000, 90_000)
const host = '127.0.0.1'

if (bearerToken.length < 24) throw new Error('DH_BRAIN_TOKEN must contain at least 24 characters')

/** boundedInteger 解析并限制环境变量中的资源预算。 */
function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(maximum, Math.max(minimum, parsed))
}

/** json 写入统一的内部响应头和序列化格式。 */
function writeJSON(response, status, body) {
  const payload = JSON.stringify(body)
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(payload)
}

/** errorJSON 将内部错误转换为不泄露凭证的固定错误信封。 */
function errorJSON(response, status, code, message) {
  writeJSON(response, status, { contract_version: contractVersion, error: { code, message } })
}

/** authorized 检查本地请求的 bearer，不接受 query 或 cookie 形式的令牌。 */
function authorized(request) {
  const value = request.headers.authorization ?? ''
  return value === `Bearer ${bearerToken}`
}

/** readBody 读取有限大小的 JSON 请求体，避免内部错误放大内存。 */
async function readBody(request) {
  const chunks = []
  let bytes = 0
  for await (const chunk of request) {
    bytes += Buffer.byteLength(chunk)
    if (bytes > 256 * 1024) throw new Error('request body too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

/** sleep 在等待并发槽位时让出事件循环。 */
function sleep(milliseconds) {
  return new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds))
}

/** withTimeout 给任意异步操作附加明确的本地截止时间。 */
async function withTimeout(operation, milliseconds, label) {
  let timer
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timeout`)), milliseconds)
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

/** acquireSemaphore 在队列预算内取得一个全局执行槽位。 */
async function acquireSemaphore(state) {
  const deadline = Date.now() + queueTimeoutMS
  state.queueDepth += 1
  try {
    while (state.activeCount >= maxConcurrency) {
      if (state.draining) throw new Error('gateway draining')
      const remaining = deadline - Date.now()
      if (remaining <= 0) throw new Error('queue timeout')
      await sleep(Math.min(25, remaining))
    }
    if (state.draining) throw new Error('gateway draining')
    state.activeCount += 1
    return () => { state.activeCount = Math.max(0, state.activeCount - 1) }
  } finally {
    state.queueDepth = Math.max(0, state.queueDepth - 1)
  }
}

/** requestDraft 从 Harness root events 中提取唯一 submit_reply_draft 结果。 */
function requestDraft(events, requestID) {
  const drafts = []
  for (const event of events) {
    if (event?.type !== 'tool/result') continue
    const message = event?.data?.message
    const content = Array.isArray(message?.content) ? message.content : []
    for (const block of content) {
      const text = block?.content?.find?.(item => item?.type === 'text')?.text
      if (typeof text !== 'string' || text.trim() === '') continue
      let parsed
      try {
        parsed = JSON.parse(text)
      } catch {
        continue
      }
      const candidate = parsed?.draft ?? parsed
      if (candidate?.request_id === requestID) drafts.push(candidate)
    }
  }
  if (drafts.length !== 1) throw new Error(`expected one matching reply draft, got ${drafts.length}`)
  return validateDraft(drafts[0])
}

/** compactTrace 裁剪 session events，避免数据库账本被模型输出无限放大。 */
function compactTrace(events) {
  const serialized = JSON.stringify(events.slice(-120))
  return serialized.length <= 128 * 1024 ? serialized : serialized.slice(0, 128 * 1024)
}

/** promptForRequest 构造不携带凭证的客服 prompt。 */
function promptForRequest(request) {
  return JSON.stringify({
    request_id: request.request_id,
    account_id: request.account_id,
    chat_id: request.chat_id,
    buyer_id: request.buyer_id,
    item_id: request.item_id,
    message: request.message,
    deadline_at: request.deadline_at,
  })
}

/** createHarness 创建一个使用固定客服 profile 的 Harness 实例。 */
function createHarness() {
  const provider = process.env.DH_BRAIN_PROVIDER ?? 'deepseek-official'
  const model = process.env.DH_BRAIN_MODEL ?? 'deepseek-v4-flash'
  const reasoningEffort = process.env.DH_BRAIN_REASONING_EFFORT ?? 'high'
  const childEnvironment = { ...process.env, DH_BRAIN_MCP_URL: mcpClientURL, DH_BRAIN_MCP_TOKEN: mcpClientToken }
  const runtimeEnvironment = () => {
    const runtimePath = dshRuntimePath === '' ? '' : dirname(dshRuntimePath)
    const pathPrefix = runtimePath === '' ? [] : [runtimePath]
    const currentPath = childEnvironment.PATH ?? ''
    return {
      ...childEnvironment,
      DSH_HOME: dataRoot,
      PATH: [...pathPrefix, currentPath].filter(Boolean).join(delimiter),
    }
  }
  if (dshRuntimePath !== '' || dshEntryPath !== '') {
    const command = dshRuntimePath !== '' ? dshRuntimePath : (nodeBinaryPath === '' ? process.execPath : nodeBinaryPath)
    const args = dshRuntimePath !== ''
      ? ['--profile', 'sdk', '--patch', profilePath]
      : [dshEntryPath, '--profile', 'sdk', '--patch', profilePath]
    return createProcessDeepSeekHarness({
      command,
      args,
      cwd: productRoot,
      environment: runtimeEnvironment,
      description: 'DH 闲不下来客服 Harness runtime',
      initializeTimeoutMs: 10_000,
      requestTimeoutMs,
      shutdownTimeoutMs: 90_000,
    }, {
      provider,
      model,
      reasoningEffort,
    })
  }
  return new DeepSeekHarness({
    profile: 'sdk',
    patches: [profilePath],
    processCwd: productRoot,
    dshHome: dataRoot,
    provider,
    model,
    reasoningEffort,
    requestTimeoutMs: requestTimeoutMS,
    env: childEnvironment,
  })
}

/** makeState 创建 gateway 状态和并发控制器。 */
function makeState() {
  return {
    state: 'starting',
    healthy: false,
    runtimeVersion: 'dsh-v0.1.2-alpha.1',
    activeCount: 0,
    queueDepth: 0,
    restartCount: 0,
    lastError: '',
    updatedAt: Date.now(),
    draining: false,
    harness: undefined,
    sessions: new Map(),
  }
}

const state = makeState()
// harnessStartPromise 合并并发 session 的首次启动，避免多个请求同时拉起 SDK 子进程。
let harnessStartPromise

/** setState 更新状态快照并保持时间单调可观察。 */
function setState(nextState, errorMessage = '') {
  state.state = nextState
  state.healthy = nextState === 'running'
  state.lastError = errorMessage.slice(0, 500)
  state.updatedAt = Date.now()
}

/** ensureHarness 延迟启动 Harness，并在首次握手失败时清理实例。 */
async function ensureHarness() {
  if (harnessStartPromise !== undefined) return harnessStartPromise
  harnessStartPromise = (async () => {
    if (state.harness === undefined) state.harness = createHarness()
    try {
      await state.harness.start()
      setState('running')
      return state.harness
    } catch (error) {
      setState('degraded', String(error))
      // 当前 promise 不能通过 closeHarness 再次等待自己；在此处直接回收失败实例。
      const failedHarness = state.harness
      state.harness = undefined
      if (failedHarness !== undefined) await Promise.allSettled([failedHarness.close()])
      throw error
    } finally {
      harnessStartPromise = undefined
    }
  })()
  return harnessStartPromise
}

/** closeHarness 回收当前 SDK 实例及其 dsh 子进程。 */
async function closeHarness() {
  if (harnessStartPromise !== undefined) await Promise.allSettled([harnessStartPromise])
  const harness = state.harness
  state.harness = undefined
  if (harness !== undefined) await Promise.allSettled([harness.close()])
}

/** runReply 在 session、全局并发和截止时间边界内执行一轮 Harness。 */
async function runReply(request) {
  const requestID = typeof request.request_id === 'string' ? request.request_id.trim() : ''
  const sessionID = typeof request.session_id === 'string' ? request.session_id.trim() : ''
  const message = typeof request.message === 'string' ? request.message.trim() : ''
  if (!/^msg:[^\s]{1,256}$/.test(requestID) || sessionID === '' || message === '') throw new Error('invalid reply request')
  if (request.contract_version !== contractVersion) throw new Error('contract version mismatch')
  const deadlineAt = Number(request.deadline_at)
  if (!Number.isFinite(deadlineAt) || deadlineAt <= Date.now()) throw new Error('reply deadline expired')
  if (state.draining) throw new Error('gateway draining')

  const previous = state.sessions.get(sessionID) ?? Promise.resolve()
  let current
  current = previous.catch(() => {}).then(async () => {
    const release = await acquireSemaphore(state)
    try {
      const remaining = Math.max(1, Math.min(requestTimeoutMS, deadlineAt - Date.now()))
      const harness = await ensureHarness()
      const result = await withTimeout(harness.run(promptForRequest(request), { sessionId: sessionID }), remaining, 'harness turn')
      const draft = requestDraft(result.events, requestID)
      return { ...draft, trace_json: compactTrace(result.events), contract_version: contractVersion }
    } finally {
      release()
    }
  })
  state.sessions.set(sessionID, current)
  try {
    return await current
  } finally {
    if (state.sessions.get(sessionID) === current) state.sessions.delete(sessionID)
  }
}

/** healthPayload 返回客户端可见的运行状态，不包含路径、环境或令牌。 */
function healthPayload() {
  return {
    contract_version: contractVersion,
    state: state.state,
    healthy: state.healthy,
    runtime_version: state.runtimeVersion,
    active_sessions: state.activeCount,
    queue_depth: state.queueDepth,
    restart_count: state.restartCount,
    last_error: state.lastError,
    updated_at: state.updatedAt,
  }
}

/** mcpBackend 请求 Go 业务数据端口并保持工具只读。 */
async function mcpBackend(name, args) {
  if (mcpBackendURL === '') return { name, ...args, source: 'gateway-fixture' }
  const headers = { 'content-type': 'application/json' }
  if (mcpBackendToken !== '') headers.authorization = `Bearer ${mcpBackendToken}`
  const response = await fetch(mcpBackendURL, { method: 'POST', headers, body: JSON.stringify({ contract_version: contractVersion, name, arguments: args }) })
  if (!response.ok) throw new Error(`mcp backend status ${response.status}`)
  return await response.json()
}

/** mcpServerForRequest 创建一次性只读 MCP server，避免工具注册跨请求污染。 */
function mcpServerForRequest() {
  const server = new McpServer({ name: 'dh-xianyu-business-context', version: '2.0.0-alpha.0' }, { capabilities: { tools: {} } })
  const tools = [
    ['get_conversation_context', '读取当前聊天上下文'],
    ['get_item_snapshot', '读取商品快照'],
    ['get_order_snapshot', '读取订单快照'],
    ['get_bargain_policy', '读取议价策略'],
    ['search_knowledge', '只读搜索业务知识'],
  ]
  const inputSchema = {
    query: z.string().max(512).optional(),
    account_id: z.string().max(256).optional(),
    chat_id: z.string().max(256).optional(),
    buyer_id: z.string().max(256).optional(),
    item_id: z.string().max(256).optional(),
    order_id: z.string().max(256).optional(),
  }
  for (const [name, description] of tools) {
    server.registerTool(name, { description, inputSchema }, async args => ({ content: [{ type: 'text', text: JSON.stringify(await mcpBackend(name, args)) }] }))
  }
  return server
}

/** handleMCP 处理 Harness MCP client 的 streamable HTTP 请求。 */
async function handleMCP(request, response) {
  const server = mcpServerForRequest()
  const transport = new StreamableHTTPServerTransport({})
  response.on('close', () => { void transport.close(); void server.close() })
  await server.connect(transport)
  await transport.handleRequest(request, response)
}

/** handleRequest 路由内部健康、草案、排空和 MCP 契约。 */
async function handleRequest(request, response) {
  if (!authorized(request)) {
    errorJSON(response, 401, 'unauthorized', 'bearer token required')
    return
  }
  const path = new URL(request.url ?? '/', `http://${host}`).pathname
  if (path === '/internal/v1/health' && request.method === 'GET') {
    writeJSON(response, 200, healthPayload())
    return
  }
  if (path === '/internal/v1/mcp') {
    await handleMCP(request, response)
    return
  }
  if (path === '/internal/v1/replies' && request.method === 'POST') {
    try {
      const body = await readBody(request)
      writeJSON(response, 200, await runReply(body))
    } catch (error) {
      const message = String(error).slice(0, 500)
      setState(message.includes('timeout') ? 'degraded' : state.state, message)
      errorJSON(response, message.includes('timeout') ? 504 : 422, message.includes('timeout') ? 'timeout' : 'draft_invalid', message)
    }
    return
  }
  if (path === '/internal/v1/drain' && request.method === 'POST') {
    state.draining = true
    setState('draining')
    const deadline = Date.now() + 90_000
    while (state.activeCount > 0 && Date.now() < deadline) await sleep(25)
    await closeHarness()
    setState('stopped')
    writeJSON(response, 200, { contract_version: contractVersion, drained: state.activeCount === 0 })
    server.close(() => process.exit(0))
    return
  }
  errorJSON(response, 404, 'not_found', 'internal route not found')
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch(error => {
    errorJSON(response, 500, 'gateway_error', String(error).slice(0, 500))
  })
})

server.listen(0, host, () => {
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('gateway did not bind TCP')
  mcpClientURL = `http://${host}:${address.port}/internal/v1/mcp`
  mcpClientToken = bearerToken
  process.env.DH_BRAIN_MCP_URL = mcpClientURL
  process.env.DH_BRAIN_MCP_TOKEN = mcpClientToken
  setState('starting')
  process.stdout.write(`${JSON.stringify({ ready: true, host, port: address.port, contract_version: contractVersion })}\n`)
})

await once(process, 'SIGTERM').catch(() => {})
state.draining = true
await closeHarness()
server.close()

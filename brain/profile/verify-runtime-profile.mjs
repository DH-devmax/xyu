import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// profileDir 是当前验证脚本与客服 overlay 所在目录。
const profileDir = dirname(fileURLToPath(import.meta.url));
// productRoot 是包含 Go 主服务和 Harness subtree 的产品根目录。
const productRoot = resolve(profileDir, '../..');
// harnessRoot 是已固定上游版本的 subtree 运行目录。
const harnessRoot = join(productRoot, 'brain/vendor/deepseek-harness');
// patchPath 是待动态装配的产品客服 profile。
const patchPath = join(profileDir, 'customer-service.patch.yml');
// requireFromMcpClient 从 Harness 工作区解析测试 MCP server 的官方 SDK 依赖。
const requireFromMcpClient = createRequire(join(harnessRoot, 'packages/mcp/mcp-client/package.json'));
// McpServer 是动态验证中只暴露 ping 的本地业务工具服务。
const { McpServer } = requireFromMcpClient('@modelcontextprotocol/sdk/server/mcp.js');
// StreamableHTTPServerTransport 使 fixture 使用与生产相同的 MCP transport。
const { StreamableHTTPServerTransport } = requireFromMcpClient('@modelcontextprotocol/sdk/server/streamableHttp.js');
// z 用于声明 ping fixture 的最小输入 schema。
const { z } = requireFromMcpClient('zod');

/** listen 在 loopback 随机端口启动本地 fixture，错误保持原始 cause。 */
function listen(server) {
  return new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolvePromise);
  });
}

/** close 等待 fixture listener 完整释放，防止测试遗留端口。 */
function close(server) {
  return new Promise((resolvePromise, reject) => {
    server.close(error => error === undefined ? resolvePromise() : reject(error));
  });
}

/** addressOf 返回已绑定 TCP server 的类型化地址，拒绝 Unix socket 形状。 */
function addressOf(server) {
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('fixture did not bind a TCP port');
  return address;
}

/** assert 在 profile 不变量失效时立即终止验证。 */
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// home 是本次 Harness session 的隔离 DSH_HOME，测试结束无条件删除。
const home = await mkdtemp(join(tmpdir(), 'dh-brain-profile-'));
// modelRequests 记录 mock provider 收到的请求，用于断言真实模型工具目录。
const modelRequests = [];

// mcpHttp 为每次请求创建隔离的 MCP server/transport，连接关闭时同步释放。
const mcpHttp = createServer((request, response) => {
  const handle = async () => {
    const server = new McpServer({ name: 'fixture-dh-xianyu', version: '1.0.0' }, { capabilities: { tools: {} } });
    server.registerTool(
      'ping',
      { description: 'Profile verification fixture.', inputSchema: { value: z.string().optional() } },
      async () => ({ content: [{ type: 'text', text: 'pong' }] }),
    );
    const transport = new StreamableHTTPServerTransport({});
    response.on('close', () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(request, response);
  };
  handle().catch(error => response.writeHead(500).end(String(error)));
});

// modelHttp 返回确定性 SSE 文本，只用于促使 Agent 发起一次包含工具目录的模型请求。
const modelHttp = createServer((request, response) => {
  let body = '';
  request.setEncoding('utf8');
  request.on('data', chunk => { body += chunk; });
  request.on('end', () => {
    try {
      modelRequests.push(JSON.parse(body));
    } catch (error) {
      response.writeHead(400).end(String(error));
      return;
    }
    response.writeHead(200, { 'content-type': 'text/event-stream' });
    response.write('data: {"choices":[{"delta":{"role":"assistant","content":"fixture reply"}}]}\n\n');
    response.write('data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":3,"completion_tokens":2}}\n\n');
    response.end('data: [DONE]\n\n');
  });
});

// child 保存待验证 DSH 进程，finally 负责强制回收未正常退出的子进程。
let child;
// childExit 是子进程的唯一退出回执，用于验证 shutdown 后退出码。
let childExit;
try {
  await Promise.all([listen(mcpHttp), listen(modelHttp)]);
  const mcpAddress = addressOf(mcpHttp);
  const modelAddress = addressOf(modelHttp);
  child = spawn(process.execPath, [
    '--import', 'tsx/esm', join(harnessRoot, 'apps/cli/src/bin.ts'),
    '--profile', 'sdk-minimal', '--patch', patchPath,
  ], {
    cwd: harnessRoot,
    env: {
      ...process.env,
      DSH_HOME: join(home, '.dsh'),
      DEEPSEEK_API_KEY: 'fixture-key',
      DEEPSEEK_BASE_URL: `http://127.0.0.1:${modelAddress.port}`,
      DH_BRAIN_MCP_URL: `http://127.0.0.1:${mcpAddress.port}/mcp`,
      DH_BRAIN_MCP_TOKEN: 'fixture-token',
      DH_BRAIN_PI_PROVIDERS: '{}',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  childExit = new Promise(resolvePromise => {
    child.once('exit', (code, signal) => resolvePromise({ code, signal }));
  });

  let stdoutBuffer = '';
  let stderr = '';
  const lines = [];
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    stdoutBuffer += chunk;
    const parts = stdoutBuffer.split('\n');
    stdoutBuffer = parts.pop() ?? '';
    lines.push(...parts);
  });
  child.stderr.on('data', chunk => { stderr += chunk; });

  const waitFor = (predicate, timeoutMs = 20_000) => new Promise((resolvePromise, reject) => {
    const deadline = Date.now() + timeoutMs;
    const poll = () => {
      while (lines.length > 0) {
        const line = lines.shift();
        if (!line.trim()) continue;
        let value;
        try {
          value = JSON.parse(line);
        } catch {
          reject(new Error(`non-JSON stdout: ${line}\nstderr=${stderr}`));
          return;
        }
        if (predicate(value)) {
          resolvePromise(value);
          return;
        }
      }
      if (Date.now() >= deadline) {
        reject(new Error(`timed out waiting for JSON-RPC frame\nstderr=${stderr}`));
        return;
      }
      setTimeout(poll, 10);
    };
    poll();
  });

  child.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { cwd: home, provider: 'deepseek-official', model: 'deepseek-v4-pro' },
  })}\n`);
  const initialized = await waitFor(value => value.id === 1);
  child.stdin.write(`${JSON.stringify({
    jsonrpc: '2.0', id: 2, method: 'session/prompt',
    params: { sessionId: 'profile-verification', contentBlocks: [{ type: 'text', text: 'Verify the tool catalog.' }] },
  })}\n`);
  const prompt = await waitFor(value => value.id === 2);
  const turnEnd = await waitFor(value => value.method === 'session.event'
    && value.params?.sessionId === 'profile-verification'
    && value.params?.event?.type === 'turn/end');

  const toolNames = (modelRequests[0]?.tools ?? [])
    .map(tool => tool?.function?.name)
    .filter(toolName => typeof toolName === 'string')
    .sort();
  const expectedTools = ['mcp__dh-xianyu__ping', 'submit_reply_draft'];
  const codingPattern = /bash|pwsh|editor|filesystem|code|terminal|subprocess|pty|sandbox/i;
  assert(initialized.result?.serverInfo?.name === 'deepseek-harness-sdk-runtime', 'SDK initialize failed');
  assert(typeof prompt.result?.messageId === 'string', 'session/prompt returned no messageId');
  assert(turnEnd.params?.event?.data?.reason?.kind === 'completed', 'fixture turn did not complete');
  assert(JSON.stringify(toolNames) === JSON.stringify(expectedTools), `unexpected model tools: ${JSON.stringify(toolNames)}`);
  assert(!toolNames.some(toolName => codingPattern.test(toolName)), `coding tool exposed: ${JSON.stringify(toolNames)}`);

  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'shutdown' })}\n`);
  const shutdown = await waitFor(value => value.id === 3);
  const exit = await childExit;
  assert(exit.code === 0 && exit.signal === null, `runtime exit failed: ${JSON.stringify(exit)}`);
  console.log(JSON.stringify({
    serverInfo: initialized.result.serverInfo,
    promptReceipt: true,
    toolNames,
    codingToolsPresent: false,
    shutdown: shutdown.result,
    exit,
  }, null, 2));
} finally {
  if (child !== undefined && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  if (childExit !== undefined) await childExit;
  await Promise.allSettled([close(mcpHttp), close(modelHttp)]);
  await rm(home, { recursive: true, force: true });
}

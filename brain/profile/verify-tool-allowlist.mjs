import { readFile } from 'node:fs/promises';

// profilePath 指向发布时唯一允许加载的客服 profile overlay。
const profilePath = new URL('./customer-service.patch.yml', import.meta.url);
// source 是用于供应链门禁的原始 YAML，动态启动验证在另一脚本执行。
const source = await readFile(profilePath, 'utf8');

// disabledIds 列出必须在 overlay 显式关闭的全部 coding 执行面。
const disabledIds = [
  'persistent-bash', 'persistent-pwsh', 'str-replace-editor', 'sandbox', 'sandbox-policy',
  'subprocess', 'pty', 'terminal-bash', 'terminal-pwsh', 'fs-local',
];
// missingDisabled 收集没有同时声明 id 和 disabled 的禁用项。
const missingDisabled = disabledIds.filter((id) => {
  const escaped = id.replaceAll('-', '\\-');
  return !new RegExp(`- id: ${escaped}\\s+disabled: true`, 'm').test(source);
});
if (missingDisabled.length > 0) throw new Error(`coding 工具未禁用: ${missingDisabled.join(', ')}`);

if (!source.includes('name: ../runtime/result-tool.mjs')) {
  throw new Error('客服 profile 未加载专用结果插件');
}
if (!source.includes("name: '@deepseek-ai/dsh-mcp-client'")) {
  throw new Error('客服 profile 未加载受控 MCP 客户端');
}

console.log('brain-tool-allowlist: 通过');

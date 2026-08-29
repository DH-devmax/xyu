import { readFile } from 'node:fs/promises';

// manifestPath 是产品版本与上游锁定信息的唯一机器可读入口。
const manifestPath = new URL('../product/manifest.json', import.meta.url);
// manifest 保存经 JSON 解析的发布元数据，本脚本只验证不受平台影响的必要不变量。
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

// requiredValues 列出品牌、仓库和上游锁定的预期值，防止打包时产生混合身份。
const requiredValues = new Map([
  ['schema_version', manifest.schema_version === 1],
  ['display_name', manifest.product?.display_name === 'DH闲不下来'],
  ['slug', manifest.product?.slug === 'dh-xianyu-agentpanel'],
  ['repository', manifest.product?.repository === 'https://github.com/DH-devmax/xyu'],
  ['harness_tag', manifest.components?.deepseek_harness?.tag === 'dsh-v0.1.2-alpha.1'],
  ['harness_commit', manifest.components?.deepseek_harness?.commit === 'cd5ef8148158c3a752a658978873241fdf8e2bbc'],
]);

// invalidKeys 收集所有未满足的必要字段，一次输出可避免修复后反复运行。
const invalidKeys = [...requiredValues].filter(([, valid]) => !valid).map(([key]) => key);
if (invalidKeys.length > 0) {
  throw new Error(`产品 manifest 校验失败: ${invalidKeys.join(', ')}`);
}

console.log('product-manifest: 通过');

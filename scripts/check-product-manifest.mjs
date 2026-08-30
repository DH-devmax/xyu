import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

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
  ['branding_source', manifest.branding?.source === 'branding/logo.jpg'],
  ['branding_source_sha256', manifest.branding?.source_sha256 === '726ee78d1a0d4f8979358ca2cae128fcf74aa73b5a24fe3d211e0c05b13da1ea'],
  ['branding_crop', manifest.branding?.crop === '520x520+250+245'],
  ['harness_tag', manifest.components?.deepseek_harness?.tag === 'dsh-v0.1.2-alpha.1'],
  ['harness_commit', manifest.components?.deepseek_harness?.commit === 'cd5ef8148158c3a752a658978873241fdf8e2bbc'],
  ['supply_chain_format', manifest.supply_chain?.format === 'CycloneDX 1.6'],
  ['supply_chain_sbom', manifest.supply_chain?.sbom === 'product/sbom.cdx.json'],
  ['supply_chain_licenses', manifest.supply_chain?.licenses === 'product/dependency-licenses.json'],
  ['brain_runtime_root', manifest.runtime?.brain_layout?.root === 'brain/runtime'],
  ['brain_runtime_manifest', manifest.runtime?.brain_layout?.manifest === 'runtime.json'],
  ['brain_sdk_entry', manifest.runtime?.brain_layout?.sdk_client_entry === 'node/node_modules/@deepseek-ai/dsh-sdk-client/lib/index.js'],
  ['brain_linux_amd64_mode', manifest.runtime?.brain_runtime_modes?.['linux-amd64'] === 'native'],
  ['brain_linux_arm64_mode', manifest.runtime?.brain_runtime_modes?.['linux-arm64'] === 'native'],
  ['brain_darwin_arm64_mode', manifest.runtime?.brain_runtime_modes?.['darwin-arm64'] === 'native'],
  ['brain_darwin_amd64_mode', manifest.runtime?.brain_runtime_modes?.['darwin-amd64'] === 'node'],
  ['brain_windows_amd64_mode', manifest.runtime?.brain_runtime_modes?.['windows-amd64'] === 'native'],
]);

// invalidKeys 收集所有未满足的必要字段，一次输出可避免修复后反复运行。
const invalidKeys = [...requiredValues].filter(([, valid]) => !valid).map(([key]) => key);
if (invalidKeys.length > 0) {
  throw new Error(`产品 manifest 校验失败: ${invalidKeys.join(', ')}`);
}

// vendorPackagePath 指向 subtree 中与锁定 tag 对应的上游根 manifest。
const vendorPackagePath = new URL('../brain/vendor/deepseek-harness/package.json', import.meta.url);
// vendorPackage 用于证明工作树中的 Harness 版本与产品锁定相符。
const vendorPackage = JSON.parse(await readFile(vendorPackagePath, 'utf8'));
if (vendorPackage.version !== '0.1.2-alpha.1') throw new Error('Harness subtree 版本与锁定不符');
if (vendorPackage.packageManager !== 'pnpm@11.7.0') throw new Error('Harness pnpm 版本与发布门禁不符');

// subtreeCommit 是从完整 Git 历史中检索的上游 split 证据，CI 必须使用 fetch-depth 0。
const subtreeCommit = execFileSync('git', [
  'log', '--all', '--format=%B', '--grep',
  `git-subtree-split: ${manifest.components.deepseek_harness.commit}`,
], { encoding: 'utf8' });
if (!subtreeCommit.includes(manifest.components.deepseek_harness.commit)) {
  throw new Error('Git 历史中缺少 Harness subtree split 证据');
}

console.log('product-manifest: 通过');

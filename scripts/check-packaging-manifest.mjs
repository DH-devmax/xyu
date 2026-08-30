import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// rootDir 是仓库根目录；所有路径都从这里解析，保证本地和 CI 检查结果一致。
const rootDir = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(await readFile(join(rootDir, 'product/manifest.json'), 'utf8'));

// readText 读取打包输入文件，后续断言可以直接对应安装器实际消费的内容。
const readText = (relativePath) => readFile(join(rootDir, relativePath), 'utf8');
// assertWindowsPowerShellEncoding 确认会被 Windows PowerShell 5.1 直接解析的脚本包含 UTF-8 BOM，防止中文字符被按 ANSI 误解。
const assertWindowsPowerShellEncoding = async (relativePath) => {
  const content = await readFile(join(rootDir, relativePath));
  if (content.length < 3 || content[0] !== 0xef || content[1] !== 0xbb || content[2] !== 0xbf) {
    throw new Error(`打包 manifest 校验失败: ${relativePath} 必须使用 UTF-8 BOM 供 Windows PowerShell 5.1 解析`);
  }
};
// assertText 确认指定文件包含稳定身份字段，防止只改显示文案而遗漏服务或安装目录。
const assertText = async (relativePath, patterns) => {
  const content = await readText(relativePath);
  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      throw new Error(`打包 manifest 校验失败: ${relativePath} 缺少 ${pattern}`);
    }
  }
};

const product = manifest.product ?? {};
const identifiers = manifest.identifiers ?? {};
const expected = {
  displayName: product.display_name,
  slug: product.slug,
  linuxService: identifiers.linux_service,
  windowsService: identifiers.windows_service,
  macBundleID: identifiers.macos_bundle_id,
};

if (expected.displayName !== 'DH闲不下来' || expected.slug !== 'dh-xianyu-agentpanel') {
  throw new Error('打包 manifest 校验失败: 产品身份与 manifest 不一致');
}

const requiredFiles = [
  `packaging/linux/${expected.linuxService}`,
  'packaging/linux/install.sh',
  'packaging/linux/uninstall.sh',
  'scripts/migrate-product-data.sh',
  'scripts/migrate-product-data.test.sh',
  'scripts/build-brain-runtime.mjs',
  'scripts/check-brain-runtime-package.mjs',
  'scripts/brain-runtime-package.test.mjs',
  'scripts/normalize-harness-runtime-closure.mjs',
  'scripts/normalize-harness-runtime-closure.test.mjs',
  'brain/gateway/index.mjs',
  'brain/profile/customer-service.patch.yml',
  'packaging/windows/installer.iss',
  'packaging/windows/service-control.ps1',
  'packaging/windows/migrate-data.ps1',
  'packaging/windows/migrate-data.test.ps1',
  'packaging/windows/migrate-data.fixture.cjs',
  'packaging/macos/Info.plist',
  'packaging/macos/component.plist',
  'packaging/macos/com.dhdevmax.xianyu-agentpanel.server.plist.template',
  'packaging/macos/com.dhdevmax.xianyu-agentpanel.tray.plist.template',
  'icon/linux/icon.png',
  'icon/windows/icon.ico',
  'icon/windows/icon.png',
  'icon/macos/icon.icns',
];
for (const relativePath of requiredFiles) {
  await access(join(rootDir, relativePath), constants.R_OK);
}
// Windows 加密 fixture 在 PowerShell 运行前先由当前 Node 完成纯语法校验。
execFileSync(process.execPath, ['--check', join(rootDir, 'packaging/windows/migrate-data.fixture.cjs')], {
  stdio: 'pipe',
});
try {
  await access(join(rootDir, 'icon/macos/Assets.car'), constants.R_OK);
  throw new Error('打包 manifest 校验失败: icon/macos/Assets.car 不应再作为输入');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

await assertText(`packaging/linux/${expected.linuxService}`, [
  `Description=${expected.displayName}后台服务`,
  `User=${expected.slug}`,
  `WorkingDirectory=/var/lib/${expected.slug}`,
  `EnvironmentFile=-/etc/${expected.slug}/config.env`,
  '-product-root /opt/dh-xianyu-agentpanel',
  '-brain-runtime-root /opt/dh-xianyu-agentpanel/brain/runtime',
  '-brain-data-root /var/lib/dh-xianyu-agentpanel/data/brain',
]);
await assertText('packaging/linux/install.sh', [
  `APP_NAME="${expected.slug}"`,
  `SERVICE_NAME="$APP_NAME.service"`,
  'migrate-product-data.sh',
  '--validator "$SERVER_SOURCE"',
  '--environment-file',
  'BRAIN_SOURCE=',
  'BRAIN_SOURCE/runtime/runtime.json',
  'BRAIN_SOURCE/runtime/node-carrier',
  'BRAIN_SOURCE/runtime/result-tool.mjs',
]);
await assertText('scripts/migrate-product-data.sh', [
  '--validator FILE',
  '-verify-data',
  'database_integrity=$DATABASE_CHECK',
  'database_decryption=$DATABASE_DECRYPTION',
]);
await assertText('packaging/linux/uninstall.sh', [
  `APP_NAME="${expected.slug}"`,
  `LEGACY_APP_NAME="ydisks-xianyu-helper"`,
]);

await assertText('packaging/windows/installer.iss', [
  'OutputBaseFilename=DH-Xianyu-AgentPanel-Setup',
  `AppDataDir "{commonappdata}\\DhXianyuAgentPanel"`,
  `Source: "migrate-data.ps1"`,
  `DestName: "data-validator.exe"`,
  `-Validator "`,
  `Source: "{#WindowsBrainDir}\\*"`,
  '-BrainRuntimeRoot',
  expected.windowsService,
]);
await assertText('packaging/windows/service-control.ps1', [
  `[string]$ServiceName = '${expected.windowsService}'`,
  "[string]$LegacyServiceName = 'YdisksXianyuHelper'",
  '[string]$BrainRuntimeRoot =',
  '-brain-runtime-root',
  expected.displayName,
]);
await assertText('packaging/windows/migrate-data.ps1', [
  '-verify-data',
  "('database_integrity=' + $databaseVerification)",
  "('database_decryption=' + $databaseVerification)",
]);
for (const windowsPowerShellScript of [
  'packaging/windows/service-control.ps1',
  'packaging/windows/migrate-data.ps1',
  'packaging/windows/migrate-data.test.ps1',
]) {
  await assertWindowsPowerShellEncoding(windowsPowerShellScript);
}

await assertText('packaging/macos/Info.plist', [
  `<string>${expected.macBundleID}</string>`,
  `<string>${expected.displayName}</string>`,
]);
await assertText('packaging/macos/component.plist', [
  `Applications/${expected.displayName}/${expected.displayName}.app`,
]);
await assertText('packaging/macos/com.dhdevmax.xianyu-agentpanel.server.plist.template', [
  expected.macBundleID,
  '__SERVER__',
  '__PRODUCT_ROOT__',
  '__BRAIN_RUNTIME_ROOT__',
]);
await assertText('packaging/macos/build-pkg.sh', [
  'brain_source=',
  'runtime/node-carrier',
  'runtime/result-tool.mjs',
]);
await assertText('packaging/macos/scripts/postinstall', [
  'migrate-product-data.sh',
  '--validator "$SERVER"',
]);
await assertText('packaging/macos/com.dhdevmax.xianyu-agentpanel.tray.plist.template', [
  expected.macBundleID,
  '__TRAY__',
]);

// workflowArtifacts 是发布工作流必须提供的五个桌面产物；这里检查 canonical 名称，避免 CI 仍引用旧包名。
await assertText('.github/workflows/desktop-cd.yml', [
  `${expected.slug}-linux-`,
  'DH-Xianyu-AgentPanel-Setup.exe',
  'DH-Xianyu-AgentPanel-',
  `packaging/linux/${expected.linuxService}`,
  'build-brain-runtime.mjs',
  'check-brain-runtime-package.mjs',
  'normalize-harness-runtime-closure.mjs',
  'brain/vendor/deepseek-harness',
  '验证 Windows 品牌数据迁移与回滚',
  'migrate-data.test.ps1',
  '验证 macOS 品牌数据迁移与回滚',
  '验证 Linux 品牌数据迁移与回滚',
  "Extension -in '.exe', '.dll', '.node'",
]);
await assertText('Dockerfile.debian13', [
  'COPY .docker/brain-runtime /app/brain',
  '-brain-runtime-root',
  '/app/brain/runtime',
  'dsh-runtime-rg',
]);
await assertText('.github/workflows/docker-publish.yml', [
  'build-brain-runtime.mjs',
  '.docker/brain-runtime',
  '释放 Harness 构建空间',
  'harness-workspace-cleanup: released',
  "cache-from: ${{ inputs.app_version != '' && format(",
  "cache-to: ${{ inputs.app_version != '' && format(",
  "provenance: ${{ inputs.app_version != '' && 'mode=max'",
  "sbom: ${{ inputs.app_version != '' }}",
]);
await assertText('.github/workflows/sync-wiki.yml', [
  '检查 Wiki 能力',
  "gh api \"repos/${GITHUB_REPOSITORY}\" --jq '.has_wiki'",
  'docs/wiki/',
  "if: steps.wiki-capability.outputs.enabled == 'true'",
]);
await assertText('.github/workflows/release.yml', [
  `${expected.slug}-linux-amd64-`,
  'DH-Xianyu-AgentPanel-Setup.exe',
  'DH-Xianyu-AgentPanel-',
]);
await assertText('cmd/server/main.go', [
  '"verify-data"',
  'data-verification: ok',
]);
await assertText('frontend/shared/browser/sidebarState.ts', [
  'dh-xianyu-agentpanel.sidebar.v2',
  'ydisks.sidebar.v1',
]);
await assertText('frontend/app/features/chat/accountSelectionStorage.ts', [
  'dh-xianyu-agentpanel.chat.account.v2',
  'ydisks.chat.account.v1',
]);
await assertText('frontend/app/features/chat/components/AudioMessage.tsx', [
  'dh-xianyu-agentpanel:chat-audio-play',
]);
await assertText('frontend/app/features/items/amapLocation.ts', [
  'dh-xianyu-agentpanel-amap-js-api',
  '__dhXianyuAgentPanelAmapLoaded',
]);

try {
  await access(join(rootDir, 'docs/CNAME'), constants.R_OK);
  throw new Error('打包 manifest 校验失败: docs/CNAME 不应继续声明上游域名');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

console.log('packaging-manifest: 通过');

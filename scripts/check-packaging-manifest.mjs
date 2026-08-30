import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// rootDir 是仓库根目录；所有路径都从这里解析，保证本地和 CI 检查结果一致。
const rootDir = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(await readFile(join(rootDir, 'product/manifest.json'), 'utf8'));

// readText 读取打包输入文件，后续断言可以直接对应安装器实际消费的内容。
const readText = (relativePath) => readFile(join(rootDir, relativePath), 'utf8');
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
  'packaging/windows/installer.iss',
  'packaging/windows/service-control.ps1',
  'packaging/windows/migrate-data.ps1',
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
]);
await assertText('packaging/linux/install.sh', [
  `APP_NAME="${expected.slug}"`,
  `SERVICE_NAME="$APP_NAME.service"`,
  'migrate-product-data.sh',
]);
await assertText('packaging/linux/uninstall.sh', [
  `APP_NAME="${expected.slug}"`,
  `LEGACY_APP_NAME="ydisks-xianyu-helper"`,
]);

await assertText('packaging/windows/installer.iss', [
  'OutputBaseFilename=DH-Xianyu-AgentPanel-Setup',
  `AppDataDir "{commonappdata}\\DhXianyuAgentPanel"`,
  `Source: "migrate-data.ps1"`,
  expected.windowsService,
]);
await assertText('packaging/windows/service-control.ps1', [
  `[string]$ServiceName = '${expected.windowsService}'`,
  "[string]$LegacyServiceName = 'YdisksXianyuHelper'",
  expected.displayName,
]);

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
]);
await assertText('.github/workflows/release.yml', [
  `${expected.slug}-linux-amd64-`,
  'DH-Xianyu-AgentPanel-Setup.exe',
  'DH-Xianyu-AgentPanel-',
]);

console.log('packaging-manifest: 通过');

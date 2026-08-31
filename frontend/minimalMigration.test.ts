import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

// readSource 读取前端源码中的稳定文件，测试不启动浏览器或 Go 服务。
const readSource = (relativePath: string): string => readFileSync(resolve(__dirname, relativePath), 'utf8');

// productionFiles 收集正式 src 目录中的文本源码，排除构建缓存和覆盖率产物。
const productionFiles = (directory: string): string[] => {
  // files 是当前目录递归发现的源码文件路径。
  const files: string[] = [];
  for (const entry /* entry 是当前目录中的一个文件系统条目。 */ of readdirSync(directory)) {
    // absolutePath 是当前条目的绝对路径。
    const absolutePath = resolve(directory, entry);
    // fileInfo 是当前条目的文件类型信息。
    const fileInfo = statSync(absolutePath);
    if (fileInfo.isDirectory()) {
      if (!['node_modules', 'coverage', 'dist'].includes(entry)) files.push(...productionFiles(absolutePath));
      continue;
    }
    if (/\.(css|ts|tsx)$/.test(entry)) files.push(absolutePath);
  }
  return files;
};

describe('Minimal 7.7.0 前端迁移边界', /* migrationSuite 固定完整迁移后的目录与样式边界。 */ () => {
  test('使用唯一 src 入口和正式页面 section 目录', /* sourceLayoutTest 校验模板骨架和业务视图分层。 */ () => {
    // requiredPaths 是 Minimal 应用组合根和全部 C 端页面的最小集合。
    const requiredPaths = [
      'src/main.tsx',
      'src/app/App.tsx',
      'src/routes/router.tsx',
      'src/layouts/dashboard/layout.tsx',
      'src/layouts/auth-centered/layout.tsx',
      'src/components/minimal/index.ts',
      'src/theme/core/index.ts',
      'src/sections/dashboard/OverviewSection.tsx',
      'src/sections/accounts/AccountsSection.tsx',
      'src/sections/items/ItemsSection.tsx',
      'src/sections/orders/OrdersSection.tsx',
      'src/sections/cards/CardsSection.tsx',
      'src/sections/rules/RulesSection.tsx',
      'src/sections/notifications/NotificationsSection.tsx',
      'src/sections/settings/SettingsSection.tsx',
      'src/sections/chat/ChatSection.tsx',
      'src/sections/brain/BrainSection.tsx',
    ];
    expect(requiredPaths.filter(/* missingPathFilter 检查必需文件是否缺失。 */ path => !existsSync(resolve(__dirname, path)))).toEqual([]);
    expect(existsSync(resolve(__dirname, 'app'))).toBe(false);
    expect(existsSync(resolve(__dirname, 'shared'))).toBe(false);
    expect(existsSync(resolve(__dirname, 'App.tsx'))).toBe(false);
    expect(existsSync(resolve(__dirname, 'index.tsx'))).toBe(false);
  });

  test('所有正式页面通过 Minimal 原语并禁止旧样式旁路', /* styleBoundaryTest 校验 CSS 基础层和生产源码没有旧实现标记。 */ () => {
    // sourceText 是正式源码拼接结果，用于一次性检查旧 Portal、令牌和框架配置痕迹。
    const sourceText = productionFiles(resolve(__dirname, 'src'))
      .map(/* sourceFileReader 读取单个正式源码文件。 */ file => readFileSync(file, 'utf8'))
      .join('\n');
    // forbiddenFragments 是迁移完成后不允许重新出现的旧实现标记。
    const forbiddenFragments = [
      'createPortal',
      '--tw-',
      '--color-',
      '--shadow-',
      'ios-',
      'modal-overlay',
      'modal-container',
      'modal-header',
      'modal-body',
      'modal-footer',
      'className=',
      'minimal-foundation',
    ];
    expect(forbiddenFragments.filter(/* forbiddenFragmentFilter 查找源码中的旧实现标记。 */ fragment => sourceText.includes(fragment))).toEqual([]);
    expect(readSource('src/main.tsx')).toContain("./theme/core/variables.css");
    expect(readSource('src/theme/core/variables.css')).toContain('不包含 utility class');
  });

  test('保留 Minimal 主题、数据路由和 feature adapter 边界', /* architectureBoundaryTest 校验视觉层和业务层没有互相穿透。 */ () => {
    // appSource 是组合根源码，必须同时装配设置 Provider、会话 Provider 和数据路由。
    const appSource = readSource('src/app/App.tsx');
    expect(appSource).toContain('MinimalSettingsProvider');
    expect(appSource).toContain('SessionProvider');
    expect(readSource('src/routes/router.tsx')).toContain('createBrowserRouter');
    expect(readSource('src/sections/accounts/AccountsSection.tsx')).toContain("features/accounts/pages/AccountList");
    expect(readSource('src/sections/chat/ChatSection.tsx')).toContain("features/chat/pages/Chat");
    expect(readSource('src/sections/brain/BrainSection.tsx')).toContain("features/brain/pages/BrainCenter");
  });
});

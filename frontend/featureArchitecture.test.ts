import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

// sourceRoot 是新的 src 架构根目录。
const sourceRoot = resolve(__dirname, 'src');

// collectSources 递归收集生产 TypeScript 文件并跳过测试和第三方目录。
function collectSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(/* sourceEntryMapper 处理一个目录条目。 */ entry => {
    // filePath 是当前条目的绝对路径。
    const filePath = resolve(directory, entry.name);
    if (entry.isDirectory()) return ['node_modules', 'vendor'].includes(entry.name) ? [] : collectSources(filePath);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) ? [filePath] : [];
  });
}

// productionSources 返回源码文本及其相对 src 路径。
function productionSources(): Array<{ /** path 是源码相对路径。 */ path: string; /** source 是源码文本。 */ source: string }> {
  return collectSources(sourceRoot).map(/* sourceMapper 读取一个生产源码文件。 */ filePath => ({
    path: /* relativePathValue 是跨平台稳定的相对路径。 */ relative(sourceRoot, filePath).split('/').join('/'),
    source: /* sourceTextValue 是当前文件的源码文本。 */ readFileSync(filePath, 'utf8'),
  }));
}

describe('Minimal source architecture', /* architectureSuite 汇总前端目录门禁。 */ () => {
  test('uses canonical feature, section and shared directories', /* canonicalDirectoryTest 校验目录边界。 */ () => {
    expect(existsSync(resolve(sourceRoot, 'features'))).toBe(true);
    expect(existsSync(resolve(sourceRoot, 'shared'))).toBe(true);
    expect(existsSync(resolve(sourceRoot, 'layouts/dashboard/layout.tsx'))).toBe(true);
    expect(existsSync(resolve(sourceRoot, 'components/minimal/index.ts'))).toBe(true);
    expect(existsSync(resolve(__dirname, 'app'))).toBe(false);
  });

  test('keeps network access in shared clients or feature adapters', /* networkBoundaryTest 校验请求边界。 */ () => {
    // violations 是越过共享客户端或 feature adapter 的源码路径。
    const violations = productionSources()
      .filter(/* networkSourceFilter 查找直接网络调用。 */ file => /\bfetch\s*\(|\baxios\b/.test(file.source))
      .filter(/* networkBoundaryFilter 保留不属于请求边界的文件。 */ file => !file.path.startsWith('shared/http/') && !file.path.startsWith('shared/api-contract/') && !/(^|\/)api\.ts$/.test(file.path))
      .map(/* networkPathMapper 输出违规路径。 */ file => file.path);
    expect(violations).toEqual([]);
  });

  test('limits dynamic imports to the route registry', /* dynamicImportTest 校验懒加载位置。 */ () => {
    // viewSplitAllowlist 是需要在页面内部延迟加载的低频视图分片白名单。
    const viewSplitAllowlist = new Set(['features/dashboard/pages/Dashboard.tsx']);
    // violations 是非 routes 目录中未声明为视图分片的动态导入文件。
    const violations = productionSources()
      .filter(/* dynamicSourceFilter 查找动态导入。 */ file => /\bimport\s*\(/.test(file.source) && !file.path.startsWith('routes/') && !viewSplitAllowlist.has(file.path))
      .map(/* dynamicPathMapper 输出违规路径。 */ file => file.path);
    expect(violations).toEqual([]);
  });

  test('keeps every formal page in its owning feature pages directory', /* pageOwnershipTest 校验页面归属。 */ () => {
    // pages 是所有 feature 页面入口的稳定路径。
    const pages = productionSources().filter(/* pageSourceFilter 查找 feature 页面。 */ file => /^features\/[^/]+\/pages\/[^/]+\.tsx$/.test(file.path)).map(/* pagePathMapper 添加 src 前缀。 */ file => `src/${file.path}`).sort();
    expect(pages).toEqual([
      'src/features/accounts/pages/AccountList.tsx',
      'src/features/brain/pages/BrainCenter.tsx',
      'src/features/cards/pages/CardList.tsx',
      'src/features/chat/pages/Chat.tsx',
      'src/features/concierge/pages/Concierge.tsx',
      'src/features/dashboard/pages/Dashboard.tsx',
      'src/features/items/pages/ItemList.tsx',
      'src/features/notifications/pages/Notifications.tsx',
      'src/features/orders/pages/OrderList.tsx',
      'src/features/rules/pages/Rules.tsx',
      'src/features/session/pages/SessionGate.tsx',
      'src/features/settings/pages/Settings.tsx',
    ]);
  });

  test('application root only composes global boundaries and providers', /* appRootTest 校验组合根职责。 */ () => {
    // app 是应用组合根源码。
    const app = readFileSync(resolve(sourceRoot, 'app/App.tsx'), 'utf8');
    expect(app).toContain('AppErrorBoundary');
    expect(app).toContain('SessionProvider');
    expect(app).toContain('RouterProvider');
    expect(app).not.toMatch(/features\/|fetch\(|axios/);
  });
});

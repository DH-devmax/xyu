import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

// source 读取新的 Minimal 路由与布局源码，测试不依赖浏览器运行时。
function source(path: string): string {
  return readFileSync(resolve(__dirname, path), 'utf8');
}

describe('Minimal application routing', /* routingSuite 汇总应用路由门禁。 */ () => {
  test('registers every C-side URL in one path map', /* pathMapTest 校验正式页面地址。 */ () => {
    // paths 是集中维护的页面路径源码。
    const paths = source('src/routes/paths.ts');
    // keys 是产品导航需要保留的页面标识。
    const keys = ['dashboard', 'accounts', 'chat', 'orders', 'cards', 'items', 'rules', 'notifications', 'settings', 'brain'];
    for (const key /* key 是当前待校验的正式页面标识。 */ of keys) {
      expect(paths).toContain(`${key}: '/app/${key}'`);
    }
  });

  test('uses data router, outlet shell and route-level lazy pages', /* routeCompositionTest 校验 Minimal 数据路由组合。 */ () => {
    // router 是数据路由组合根源码。
    const router = source('src/routes/router.tsx');
    // routes 是正式页面的懒加载注册表。
    const routes = source('src/routes/sections/app-routes.tsx');
    // content 是承载 Outlet 的 Minimal 主区源码。
    const content = source('src/layouts/dashboard/content.tsx');
    expect(router).toContain('createBrowserRouter');
    expect(content).toContain('<Outlet />');
    expect(routes).toContain('lazyPage');
    expect(routes).toContain("import('@/sections/dashboard/OverviewSection')");
  });

  test('keeps admin pages behind the role guard', /* adminGuardTest 校验管理员页面隔离。 */ () => {
    // router 是含 AdminGuard 子树的路由源码。
    const router = source('src/routes/router.tsx');
    // guard 是角色回退实现源码。
    const guard = source('src/auth/guard/AuthGuard.tsx');
    expect(router).toContain('<AdminGuard />');
    expect(guard).toContain("<Navigate to=\"/app/dashboard\" replace />");
    expect(source('src/layouts/dashboard/nav-config.tsx')).toContain('adminOnly: true');
  });

  test('preserves logout and one-time item-to-rule context', /* contextTest 校验注销和商品规则联动。 */ () => {
    // layout 是认证应用壳源码。
    const layout = source('src/layouts/dashboard/layout.tsx');
    // routes 是商品和规则 section 适配源码。
    const routes = source('src/routes/sections/app-routes.tsx');
    // session 是现有会话 Provider 源码。
    const session = source('src/app/providers/SessionProvider.tsx');
    expect(layout).toContain('useChatTitleNotification');
    expect(layout).toContain('await signOut()');
    expect(session).toContain('await logout();');
    expect(routes).toContain('setTarget({ cookieId: item.cookie_id');
    expect(routes).toContain('onDeliveryTargetHandled={clearTarget}');
  });

  test('does not retain Tailwind runtime dependencies', /* stylingDependencyTest 校验旧样式运行时已移除。 */ () => {
    // packageSource 是前端锁定依赖清单。
    const packageSource = source('package.json');
    expect(packageSource).not.toContain('tailwindcss');
    expect(packageSource).not.toContain('postcss');
  });
});

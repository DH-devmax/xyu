import React, { lazy } from 'react';
import { Navigate, type RouteObject, useNavigate } from 'react-router-dom';
import { appPaths } from '@/routes/paths';
import { useDeliveryRuleTarget } from '@/routes/delivery-rule-context';
import { DashboardLoading } from '@/layouts/dashboard/layout';

// lazyPage 统一为 Minimal 路由页面提供按需加载和固定占位。
const lazyPage = (loader: () => Promise<{ /** default 是路由模块的无属性页面组件。 */ default: React.ComponentType }>): React.ReactNode => {
  // Page 是由 React.lazy 包装的正式 section 页面。
  const Page = lazy(loader);
  return <React.Suspense fallback={<DashboardLoading />}><Page /></React.Suspense>;
};

// ItemsSection 是按商品路由加载的 Minimal 商品 section。
const ItemsSection = lazy(/* itemsSectionLoader 加载商品 section。 */ () => import('@/sections/items/ItemsSection'));
// RulesSection 是按规则路由加载的 Minimal 规则 section。
const RulesSection = lazy(/* rulesSectionLoader 加载规则 section。 */ () => import('@/sections/rules/RulesSection'));

// ItemSectionRoute 把商品页的规则联动动作接入应用级上下文。
const ItemSectionRoute: React.FC = () => {
  // navigate 负责在写入商品目标后打开规则页面。
  const navigate = useNavigate();
  // setTarget 保存规则页需要消费的一次性商品目标。
  const { setTarget } = useDeliveryRuleTarget();
  return <React.Suspense fallback={<DashboardLoading />}><ItemsSection onConfigureDelivery={/* deliveryNavigation 保存目标并跳转规则页。 */ item => { setTarget({ cookieId: item.cookie_id, itemId: item.item_id, requestId: Date.now() }); navigate(appPaths.rules); }} /></React.Suspense>;
};

// RulesSectionRoute 将一次性商品目标传给规则页并在消费后清除。
const RulesSectionRoute: React.FC = () => {
  // deliveryContext 提供规则页要消费的商品目标及清理动作。
  const { target, clearTarget } = useDeliveryRuleTarget();
  return <React.Suspense fallback={<DashboardLoading />}><RulesSection initialDeliveryTarget={target} onDeliveryTargetHandled={clearTarget} /></React.Suspense>;
};

// appRoutes 是唯一正式 C 端页面路由表，不引入 Minimal 模板 demo 页面。
export const appRoutes: RouteObject[] = [
  { index: true, element: <Navigate to={appPaths.dashboard} replace /> },
  { path: 'dashboard', element: lazyPage(/* dashboardLoader 加载仪表盘 section。 */ () => import('@/sections/dashboard/OverviewSection')) },
  { path: 'accounts', element: lazyPage(/* accountsLoader 加载账号 section。 */ () => import('@/sections/accounts/AccountsSection')) },
  { path: 'chat', element: lazyPage(/* chatLoader 加载聊天 section。 */ () => import('@/sections/chat/ChatSection')) },
  { path: 'orders', element: lazyPage(/* ordersLoader 加载订单 section。 */ () => import('@/sections/orders/OrdersSection')) },
  { path: 'cards', element: lazyPage(/* cardsLoader 加载卡密 section。 */ () => import('@/sections/cards/CardsSection')) },
  { path: 'items', element: <ItemSectionRoute /> },
  { path: 'rules', element: <RulesSectionRoute /> },
  { path: 'notifications', element: lazyPage(/* notificationsLoader 加载通知 section。 */ () => import('@/sections/notifications/NotificationsSection')) },
  { path: 'settings', element: lazyPage(/* settingsLoader 加载设置 section。 */ () => import('@/sections/settings/SettingsSection')) },
  { path: 'brain', element: lazyPage(/* brainLoader 加载 Brain section。 */ () => import('@/sections/brain/BrainSection')) },
  { path: '*', element: <Navigate to={appPaths.dashboard} replace /> },
];

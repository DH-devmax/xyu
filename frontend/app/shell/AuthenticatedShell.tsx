import React, { lazy, Suspense, useEffect, useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar from '@mui/material/AppBar';
import type { Item } from '../features/items/api';
import Sidebar from '../../shared/ui/Sidebar';
import { MinimalMainSection } from '../../shared/ui/minimal';
import { useChatTitleNotification } from '../features/chat/titleNotification';
import { getHealth } from '../features/system/api';
import type { BuildInfo } from '../features/system/types';

// DeliveryRuleTarget 描述商品页跳转到自动化规则页时需要携带的目标信息。
export interface DeliveryRuleTarget {
  // cookieId 表示目标闲鱼账号标识。
  cookieId: string;
  // itemId 表示目标商品标识。
  itemId: string;
  // requestId 用于区分连续发起的跳转请求。
  requestId: number;
}

// AuthenticatedShellProps 描述认证后应用壳需要的导航、权限和联动回调。
export interface AuthenticatedShellProps {
  // activeTab 表示当前正在展示的业务页面标识。
  activeTab: string;
  // isAdmin 表示当前会话是否拥有管理员权限。
  isAdmin: boolean;
  // collapsed 表示侧边栏是否处于折叠状态。
  collapsed: boolean;
  // deliveryRuleTarget 表示待传递给规则页的商品发货目标。
  deliveryRuleTarget?: DeliveryRuleTarget;
  // onToggleCollapsed 负责切换侧边栏折叠状态。
  onToggleCollapsed: () => void;
  // onNavigate 负责切换业务页面并同步外部路由。
  onNavigate: (tab: string) => void;
  // onLogout 负责注销当前会话并清理认证状态。
  onLogout: () => void;
  // onConfigureDelivery 负责接收商品页发起的规则配置目标。
  onConfigureDelivery: (target: DeliveryRuleTarget) => void;
  // onDeliveryTargetHandled 负责确认规则页已经消费跳转目标。
  onDeliveryTargetHandled: () => void;
}

// Dashboard 是按需加载的仪表盘页面，避免首屏同步载入图表依赖。
const Dashboard = lazy(/* Dashboard 页面按路由激活时加载。 */ () => import('../features/dashboard/pages/Dashboard'));
// AccountList 是按需加载的账号管理页面，避免未访问时载入账号弹窗和二维码代码。
const AccountList = lazy(/* AccountList 页面按路由激活时加载。 */ () => import('../features/accounts/pages/AccountList'));
// OrderList 是按需加载的订单页面，避免首屏载入订单导入与刷新代码。
const OrderList = lazy(/* OrderList 页面按路由激活时加载。 */ () => import('../features/orders/pages/OrderList'));
// CardList 是按需加载的卡密页面，避免首屏载入卡密批量处理代码。
const CardList = lazy(/* CardList 页面按路由激活时加载。 */ () => import('../features/cards/pages/CardList'));
// ItemList 是按需加载的商品页面，避免首屏载入商品发布编辑器代码。
const ItemList = lazy(/* ItemList 页面按路由激活时加载。 */ () => import('../features/items/pages/ItemList'));
// Settings 是按需加载的系统设置页面，仅在管理员访问时加载。
const Settings = lazy(/* Settings 页面按路由激活时加载。 */ () => import('../features/settings/pages/Settings'));
// Rules 是按需加载的自动化规则页面，避免首屏载入规则编辑器代码。
const Rules = lazy(/* Rules 页面按路由激活时加载。 */ () => import('../features/rules/pages/Rules'));
// Notifications 是按需加载的通知页面，避免首屏载入通知配置代码。
const Notifications = lazy(/* Notifications 页面按路由激活时加载。 */ () => import('../features/notifications/pages/Notifications'));
// Chat 是按需加载的聊天页面，避免未访问时载入聊天历史和 WebSocket 视图。
const Chat = lazy(/* Chat 页面按路由激活时加载。 */ () => import('../features/chat/pages/Chat'));
// BrainCenter 是按需加载的 Harness 运行台，仅在管理员打开时载入管理代码。
const BrainCenter = lazy(/* BrainCenter 页面按路由激活时加载。 */ () => import('../features/brain/pages/BrainCenter'));

// PageLoading 展示路由页面代码加载期间的统一占位状态。
const PageLoading: React.FC = () => (
  <Box sx={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="status" aria-label="正在加载页面">
    <CircularProgress size={28} thickness={4} />
  </Box>
);

// AppContentProps 描述页面组合器接收的路由和跨页面联动状态。
export interface AppContentProps {
  // activeTab 表示当前需要渲染的业务页面标识。
  activeTab: string;
  // isAdmin 表示当前会话是否允许访问管理员页面。
  isAdmin: boolean;
  // deliveryRuleTarget 表示商品页传递给规则页的目标信息。
  deliveryRuleTarget?: DeliveryRuleTarget;
  // onConfigureDelivery 负责接收商品页面发起的规则配置目标。
  onConfigureDelivery: (target: DeliveryRuleTarget) => void;
  // onDeliveryTargetHandled 负责确认规则页面已经消费跳转目标。
  onDeliveryTargetHandled: () => void;
}

// AppContent 按当前导航标识选择业务页面，并隔离页面代码的动态加载边界。
export const AppContent: React.FC<AppContentProps> = ({
  activeTab,
  isAdmin,
  deliveryRuleTarget,
  onConfigureDelivery,
  onDeliveryTargetHandled,
}) => {
  // handleConfigureDelivery 将商品页面对象转换成路由壳使用的最小联动载荷。
  const handleConfigureDelivery = (item /* item 表示用户选择的商品。 */: Item) => {
    onConfigureDelivery({
      cookieId: item.cookie_id,
      itemId: item.item_id,
      requestId: Date.now(),
    });
  };

  // renderPage 根据当前页面标识选择唯一的业务页面组件。
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'accounts': return <AccountList />;
      case 'chat': return <Chat />;
      case 'orders': return <OrderList />;
      case 'cards': return <CardList />;
      case 'items': return <ItemList onConfigureDelivery={handleConfigureDelivery} />;
      case 'rules': return <Rules
        initialDeliveryTarget={deliveryRuleTarget}
        onDeliveryTargetHandled={onDeliveryTargetHandled}
      />;
      case 'notifications': return <Notifications isAdmin={isAdmin} />;
      case 'brain': return isAdmin ? <BrainCenter /> : <Dashboard />;
      case 'settings': return isAdmin ? <Settings /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <Suspense fallback={<PageLoading />}>
      {renderPage()}
    </Suspense>
  );
};

// AuthenticatedShell 组合认证后的响应式导航、顶栏、主内容区域和页面动态加载边界。
const AuthenticatedShell: React.FC<AuthenticatedShellProps> = ({
  activeTab,
  isAdmin,
  collapsed,
  deliveryRuleTarget,
  onToggleCollapsed,
  onNavigate,
  onLogout,
  onConfigureDelivery,
  onDeliveryTargetHandled,
}) => {
  // buildInfo 保存壳层加载的公开构建版本，侧边栏保持为无请求的共享展示组件。
  const [buildInfo, setBuildInfo] = useState<BuildInfo>({ version: 'dev', commit: 'unknown' });
  // mobileOpen 保存窄屏临时导航状态，桌面端不渲染该 Drawer。
  const [mobileOpen, setMobileOpen] = useState(false);
  // isMobile 控制顶栏菜单按钮，仅用于响应式布局，不改变业务路由。
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  // hasUnreadChatMessage 保存侧边栏在线聊天入口的服务端/实时聚合未读状态，不因导航动作改变。
  const { hasUnreadChatMessage } = useChatTitleNotification();

  useEffect(/* effect 在壳层挂载时读取版本信息，并在卸载时中止尚未完成的请求。 */ () => {
    // controller 取消壳层卸载后不再需要的健康检查请求。
    const controller = new AbortController();
    getHealth({ signal: controller.signal })
      .then(/* response 是健康接口返回的公开构建标识。 */ response => setBuildInfo({
        version: String(response.version || 'dev'),
        commit: String(response.commit || 'unknown'),
      }))
      .catch(/* error 是健康检查失败原因，取消请求不需要改变默认展示版本。 */ error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      });
    return /* cleanup 在壳层卸载时释放健康检查请求。 */ () => controller.abort();
  }, []);

  useEffect(/* mobileRouteEffect 在切换到桌面尺寸时收起临时导航。 */ () => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  // pageTitle 将当前路由映射为顶栏可扫描的页面名称。
  const pageTitle: Record<string, string> = {
    dashboard: '仪表盘',
    accounts: '账号管理',
    chat: '在线聊天',
    orders: '订单管理',
    cards: '卡密库存',
    items: '商品列表',
    rules: '自动化规则',
    notifications: '通知设置',
    brain: 'Brain Center',
    settings: '系统与 AI',
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Sidebar
        activeTab={activeTab}
        isAdmin={isAdmin}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={/* mobileCloseAction 关闭窄屏导航并保留当前业务路由。 */ () => setMobileOpen(false)}
        onToggleCollapsed={onToggleCollapsed}
        onNavigate={onNavigate}
        onLogout={onLogout}
        buildInfo={buildInfo}
        hasUnreadChatMessage={hasUnreadChatMessage}
      />

      <MinimalMainSection className="h-screen min-w-0 flex-1 overflow-x-hidden overflow-y-auto" sx={{ flex: 1, minWidth: 0, height: '100vh', overflowX: 'hidden', overflowY: 'auto', ml: { xs: 0, md: collapsed ? '72px' : '248px' }, transition: 'margin-left 180ms ease' }}>
        <AppBar position="sticky" sx={{ display: { xs: 'block', md: 'none' }, bgcolor: 'background.paper' }}>
          <Toolbar sx={{ minHeight: 58, px: 1.5, gap: 1 }}>
            <IconButton aria-label="打开主导航" onClick={/* mobileOpenAction 打开窄屏临时导航。 */ () => setMobileOpen(true)} size="small" edge="start">
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }} noWrap>
              {pageTitle[activeTab] || '仪表盘'}
            </Typography>
            <IconButton aria-label="通知" size="small">
              <NotificationsNoneOutlinedIcon fontSize="small" />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box sx={{ px: { xs: 1.5, sm: 3, lg: 4 }, py: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1600, mx: 'auto' }}>
          <Stack direction="row" sx={{ mb: { xs: 2, sm: 3 }, alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.35rem', sm: '1.6rem' } }}>
                {pageTitle[activeTab] || '仪表盘'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                DH闲不下来 · 运营工作台
              </Typography>
            </Box>
          </Stack>
          <AppContent
            activeTab={activeTab}
            isAdmin={isAdmin}
            deliveryRuleTarget={deliveryRuleTarget}
            onConfigureDelivery={onConfigureDelivery}
            onDeliveryTargetHandled={onDeliveryTargetHandled}
          />
        </Box>
      </MinimalMainSection>
    </Box>
  );
};

export default AuthenticatedShell;

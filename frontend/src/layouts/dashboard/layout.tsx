import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Navigate, useLocation } from 'react-router-dom';
import { SessionGate } from '@/features/session/pages/SessionGate';
import { useSession } from '@/app/providers/SessionProvider';
import { getHealth } from '@/features/system/api';
import type { BuildInfo } from '@/features/system/types';
import { DeliveryRuleProvider } from '@/routes/delivery-rule-context';
import { useMinimalSettings } from '@/theme';
import { NavMobile } from './nav-mobile';
import { NavVertical } from './nav-vertical';
import { NavHorizontal } from './nav-horizontal';
import { DashboardContent } from './content';
import { useChatTitleNotification } from '@/features/chat/titleNotification';
import { LoadingScreen } from '@/components/minimal';

// DashboardLayout 负责认证后的 Minimal 多栏应用壳和业务 Outlet 生命周期。
export const DashboardLayout: React.FC = () => {
  // sessionState 保存认证守卫已经确认的会话状态。
  const { checkingAuth, isLoggedIn, isAdmin, signOut } = useSession();
  if (checkingAuth || !isLoggedIn) return <SessionGate />;
  return <AuthenticatedDashboard isAdmin={isAdmin} signOut={signOut} />;
};

// AuthenticatedDashboardProps 描述已认证壳接收的权限和注销动作。
interface AuthenticatedDashboardProps {
  // isAdmin 表示当前会话是否拥有管理员权限。
  isAdmin: boolean;
  // signOut 执行服务端会话注销。
  signOut: () => Promise<void>;
}

// AuthenticatedDashboard 仅在会话有效时挂载全局 WebSocket 与导航资源。
const AuthenticatedDashboard: React.FC<AuthenticatedDashboardProps> = ({ isAdmin, signOut }) => {
  // settingsState 保存 Minimal 导航布局及其持久化更新函数。
  const { state, setField } = useMinimalSettings();
  // unreadState 保存应用壳单例聊天连接计算出的未读标记。
  const { hasUnreadChatMessage } = useChatTitleNotification();
  // mobileOpen 控制窄屏导航 Drawer 的显示状态。
  const [mobileOpen, setMobileOpen] = useState(false);
  // buildInfo 保存健康检查返回的公开版本信息。
  const [buildInfo, setBuildInfo] = useState<BuildInfo>({ version: 'dev', commit: 'unknown' });
  // location 用于管理员路由回退判断。
  const location = useLocation();
  useEffect(/* healthEffect 读取公开健康信息并在卸载时取消请求。 */ () => {
    // controller 取消组件卸载后仍在执行的健康检查。
    const controller = new AbortController();
    getHealth({ signal: controller.signal }).then(/* healthResponse 保存服务公开构建信息。 */ response => setBuildInfo({ version: String(response.version || 'dev'), commit: String(response.commit || 'unknown') })).catch(/* healthError 忽略健康接口暂态失败并保留 dev 标识。 */ () => undefined);
    return /* healthCleanup 释放健康检查请求。 */ () => controller.abort();
  }, []);
  // restrictedPath 表示当前地址是否属于管理员专属页面。
  const restrictedPath = location.pathname === '/app/settings' || location.pathname === '/app/brain' || location.pathname === '/app/concierge';
  // handleLogout 调用 Provider 注销并把失败记录为通用错误。
  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error /* error 是注销请求的失败原因，不输出会话内容。 */) {
      console.error('退出登录失败', error);
    }
  };
  if (!isAdmin && restrictedPath) return <Navigate to="/app/dashboard" replace />;
  return (
    <DeliveryRuleProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'transparent' }}>
        {state.navLayout === 'horizontal' ? <NavHorizontal isAdmin={isAdmin} mini={false} hasUnreadChatMessage={hasUnreadChatMessage} version={buildInfo.version} navColor={state.navColor} onToggle={/* horizontalNavToggle 恢复纵向导航布局。 */ () => setField('navLayout', 'vertical')} onLogout={handleLogout} /> : <NavVertical isAdmin={isAdmin} mini={state.navLayout === 'mini'} hasUnreadChatMessage={hasUnreadChatMessage} version={buildInfo.version} navColor={state.navColor} onToggle={/* desktopNavToggle 切换 Minimal 纵向和迷你布局。 */ () => setField('navLayout', state.navLayout === 'mini' ? 'vertical' : 'mini')} onLogout={handleLogout} />}
        <NavMobile open={mobileOpen} onClose={/* mobileClose 关闭窄屏导航。 */ () => setMobileOpen(false)} isAdmin={isAdmin} hasUnreadChatMessage={hasUnreadChatMessage} version={buildInfo.version} navColor={state.navColor} onToggle={/* mobileNavToggle 切换导航布局偏好。 */ () => setField('navLayout', state.navLayout === 'mini' ? 'vertical' : 'mini')} onLogout={handleLogout} />
        <DashboardContent onOpenMobile={/* mobileOpenAction 打开窄屏导航。 */ () => setMobileOpen(true)} version={buildInfo.version} onLogout={handleLogout} hasUnreadChatMessage={hasUnreadChatMessage} />
      </Box>
    </DeliveryRuleProvider>
  );
};

// DashboardLoading 是路由恢复期间的静态占位，避免空白视图改变布局。
export const DashboardLoading: React.FC = () => <LoadingScreen minHeight={320} label="正在加载" />;

export default DashboardLayout;

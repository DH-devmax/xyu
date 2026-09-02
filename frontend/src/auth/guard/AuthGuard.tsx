import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { SessionGate } from '@/features/session/pages/SessionGate';
import { useSession } from '@/app/providers/SessionProvider';
import { LoadingScreen } from '@/components/minimal';

// AuthGuardState 仅在路由层读取会话状态，页面组件不复制认证请求。
export const AuthGuard: React.FC = () => {
  // sessionState 保存路由层需要的认证状态快照。
  const sessionState = useSession();
  // checkingAuth 表示首次会话校验仍在进行。
  const { checkingAuth, isLoggedIn } = sessionState;
  if (checkingAuth) return <LoadingScreen minHeight="100vh" label="正在校验会话" />;
  if (!isLoggedIn) return <SessionGate />;
  return <Outlet />;
};

// AdminGuard 保护系统设置和智能中枢的管理员路由。
export const AdminGuard: React.FC = () => {
  // adminState 保存当前用户的管理员权限。
  const { isAdmin } = useSession();
  return isAdmin ? <Outlet /> : <Navigate to="/app/dashboard" replace />;
};

export default AuthGuard;

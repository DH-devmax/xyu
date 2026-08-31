import React from 'react';
import Notifications from '@/features/notifications/pages/Notifications';
import { useSession } from '@/app/providers/SessionProvider';

// NotificationsSection 从会话上下文读取管理员标识并渲染通知设置。
const NotificationsSection: React.FC = () => {
  // isAdmin 控制通知页是否展示管理员 SMTP 区块。
  const { isAdmin } = useSession();
  return <Notifications isAdmin={isAdmin} />;
};

export default NotificationsSection;

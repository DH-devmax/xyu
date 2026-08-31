import React from 'react';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutlineOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import type { AppPathKey } from '@/routes/paths';
import { appPaths } from '@/routes/paths';

// DashboardNavItem 描述 Minimal 垂直导航中的一个正式业务入口。
export interface DashboardNavItem {
  // key 是页面稳定标识。
  key: AppPathKey;
  // title 是导航展示名称。
  title: string;
  // path 是 React Router 使用的正式 URL。
  path: string;
  // icon 是 MUI 图标节点。
  icon: React.ReactNode;
  // adminOnly 表示该入口只向管理员展示。
  adminOnly?: boolean;
}

// dashboardNavItems 定义 C 端正式页面顺序，不包含模板 demo 路由。
export const dashboardNavItems: readonly DashboardNavItem[] = [
  { key: 'dashboard', title: '仪表盘', path: appPaths.dashboard, icon: <DashboardOutlinedIcon fontSize="small" /> },
  { key: 'accounts', title: '账号管理', path: appPaths.accounts, icon: <PeopleOutlineIcon fontSize="small" /> },
  { key: 'chat', title: '在线聊天', path: appPaths.chat, icon: <ChatBubbleOutlineIcon fontSize="small" /> },
  { key: 'orders', title: '订单管理', path: appPaths.orders, icon: <ShoppingBagOutlinedIcon fontSize="small" /> },
  { key: 'cards', title: '卡密库存', path: appPaths.cards, icon: <CreditCardOutlinedIcon fontSize="small" /> },
  { key: 'items', title: '商品列表', path: appPaths.items, icon: <Inventory2OutlinedIcon fontSize="small" /> },
  { key: 'rules', title: '自动化规则', path: appPaths.rules, icon: <AutoAwesomeOutlinedIcon fontSize="small" /> },
  { key: 'notifications', title: '通知设置', path: appPaths.notifications, icon: <NotificationsNoneOutlinedIcon fontSize="small" /> },
  { key: 'settings', title: '系统与 AI', path: appPaths.settings, icon: <SettingsOutlinedIcon fontSize="small" />, adminOnly: true },
  { key: 'brain', title: 'Brain Center', path: appPaths.brain, icon: <MemoryOutlinedIcon fontSize="small" />, adminOnly: true },
];

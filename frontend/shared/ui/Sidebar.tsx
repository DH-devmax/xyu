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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CommitIcon from '@mui/icons-material/Commit';
import LogoutIcon from '@mui/icons-material/Logout';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DHBrandIcon } from './DHBrandLogo';

// SidebarBuildInfo 描述应用壳传递给侧边栏的公开构建版本信息。
export interface SidebarBuildInfo {
  // version 是当前服务构建版本，只用于界面展示。
  version: string;
  // commit 是当前服务对应的提交标识，只用于界面展示。
  commit: string;
}

// SidebarProps 描述侧边栏所需的导航和会话回调。
interface SidebarProps {
  /** activeTab 表示当前Tab。 */ activeTab: string;
  /** isAdmin 表示当前用户是否为管理员。 */ isAdmin?: boolean;
  /** collapsed 表示桌面侧边栏是否折叠。 */ collapsed: boolean;
  /** mobileOpen 表示移动端临时导航是否打开。 */ mobileOpen?: boolean;
  /** onMobileClose 表示移动端导航关闭回调。 */ onMobileClose?: () => void;
  /** onToggleCollapsed 表示切换侧边栏折叠状态的回调。 */ onToggleCollapsed: () => void;
  /** onNavigate 表示切换主导航页面的回调。 */ onNavigate: (tab: string) => void;
  /** onLogout 表示注销当前会话的回调。 */ onLogout: () => void;
  /** buildInfo 是由应用壳加载并传入的公开构建版本信息。 */ buildInfo: SidebarBuildInfo;
  /** hasUnreadChatMessage 表示在线聊天入口是否仍有未读消息，需要展示红点。 */ hasUnreadChatMessage?: boolean;
}

// navItemIconSx 统一导航图标尺寸，避免折叠状态改变按钮高度。
const navItemIconSx = { minWidth: 0, width: 28, color: 'inherit', display: 'flex', justifyContent: 'center' };

// SidebarContent 渲染桌面和移动 Drawer 共用的导航内容。
const SidebarContent: React.FC<{
  // activeTab 是当前 URL 对应的导航标识。
  activeTab: string;
  // isAdmin 表示当前用户是否允许访问管理入口。
  isAdmin: boolean;
  // collapsed 表示桌面导航是否使用图标模式。
  collapsed: boolean;
  // buildInfo 是侧栏展示的公开版本信息。
  buildInfo: SidebarBuildInfo;
  // hasUnreadChatMessage 表示聊天入口是否有未读消息。
  hasUnreadChatMessage: boolean;
  // onToggleCollapsed 触发桌面导航宽度切换。
  onToggleCollapsed: () => void;
  // onNavigate 触发应用路由切换。
  onNavigate: (tab: string) => void;
  // onLogout 触发当前会话注销。
  onLogout: () => void;
  // onMobileClose 关闭窄屏临时导航。
  onMobileClose?: () => void;
}> = ({
  activeTab,
  isAdmin,
  collapsed,
  buildInfo,
  hasUnreadChatMessage,
  onToggleCollapsed,
  onNavigate,
  onLogout,
  onMobileClose,
}) => {
  // menuItems 是当前角色可以访问的稳定主导航顺序。
  const menuItems = [
    { id: 'dashboard', icon: DashboardOutlinedIcon, label: '仪表盘' },
    { id: 'accounts', icon: PeopleOutlineIcon, label: '账号管理' },
    { id: 'chat', icon: ChatBubbleOutlineIcon, label: '在线聊天' },
    { id: 'cards', icon: CreditCardOutlinedIcon, label: '卡密库存' },
    { id: 'items', icon: Inventory2OutlinedIcon, label: '商品列表' },
    { id: 'orders', icon: ShoppingBagOutlinedIcon, label: '订单管理' },
    { id: 'rules', icon: AutoAwesomeOutlinedIcon, label: '自动化规则' },
    { id: 'notifications', icon: NotificationsNoneOutlinedIcon, label: '通知设置' },
    ...(isAdmin ? [{ id: 'settings', icon: SettingsOutlinedIcon, label: '系统与 AI' }, { id: 'brain', icon: MemoryOutlinedIcon, label: 'Brain Center' }] : []),
  ];
  // displayVersion 将规范版本补充 v 前缀，开发构建保留原始标识。
  const displayVersion = /^\d+\.\d+\.\d+$/.test(buildInfo.version)
    ? `v${buildInfo.version}`
    : buildInfo.version;

  // handleNavigate 统一处理导航和移动端 Drawer 的关闭动作。
  const handleNavigate = (tab: string): void => {
    onNavigate(tab);
    onMobileClose?.();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box
        sx={{
          minHeight: 76,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1.25,
          px: collapsed ? 1.25 : 2.25,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ width: 38, height: 38, flexShrink: 0 }} aria-label="DH闲不下来品牌">
          <DHBrandIcon sizeClass="w-full h-full" />
        </Box>
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 15, fontWeight: 750, color: 'text.primary', lineHeight: 1.2 }}>
              DH闲不下来
            </Typography>
            <Typography noWrap sx={{ mt: 0.35, fontSize: 10, letterSpacing: '0.14em', color: 'primary.main', textTransform: 'uppercase' }}>
              agent panel
            </Typography>
          </Box>
        )}
      </Box>

      <List component="nav" aria-label="主导航" sx={{ flex: 1, overflowY: 'auto', px: collapsed ? 1 : 1.5, py: 2 }}>
        {menuItems.map(/* menuItemRenderer 渲染单个主导航项。 */ (item) => {
          // Icon 是当前导航项使用的 MUI 图标组件。
          const Icon = item.icon;
          // active 表示导航项是否对应当前 URL。
          const active = activeTab === item.id;
          return (
            <ListItemButton
              key={item.id}
              selected={active}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={/* navigationAction 响应用户点击并同步关闭移动导航。 */ () => handleNavigate(item.id)}
              className={active ? 'bg-brand text-white shadow-brand-active' : undefined}
              sx={{
                minHeight: 42,
                mb: 0.5,
                px: collapsed ? 1 : 1.25,
                gap: 1.25,
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 1,
                color: active ? 'common.white' : 'text.secondary',
                '&.Mui-selected': { bgcolor: 'primary.main', color: 'common.white' },
                '&.Mui-selected:hover': { bgcolor: 'primary.dark' },
                '&:hover': { bgcolor: active ? 'primary.dark' : 'action.hover', color: active ? 'common.white' : 'text.primary' },
              }}
            >
              <ListItemIcon sx={navItemIconSx}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <Icon fontSize="small" />
                  {item.id === 'chat' && hasUnreadChatMessage && (
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" role="status" aria-label="在线聊天有未读消息" />
                  )}
                </Box>
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } } }} />}
              {active && !collapsed && <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'common.white', flexShrink: 0 }} />}
            </ListItemButton>
          );
        })}
      </List>

      <Box>
        <Divider />
        <Box sx={{ px: collapsed ? 1 : 2.25, py: 1.25, bgcolor: 'grey.50' }} title={collapsed ? `版本 ${buildInfo.version} · ${buildInfo.commit}` : undefined}>
          {collapsed ? (
            <Tooltip title={`版本 ${buildInfo.version}`} placement="right">
              <CommitIcon fontSize="small" sx={{ display: 'block', mx: 'auto', color: 'text.disabled' }} aria-label={`版本 ${buildInfo.version}`} />
            </Tooltip>
          ) : (
            <Stack direction="row" spacing={0.75} sx={{ minWidth: 0, alignItems: 'center' }}>
              <CommitIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
              <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayVersion} · {buildInfo.commit}
              </Typography>
            </Stack>
          )}
        </Box>
        <Stack spacing={0.5} sx={{ p: collapsed ? 1 : 1.5 }}>
          <Tooltip title={collapsed ? '展开侧边栏' : ''} placement="right">
            <IconButton
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
              size="small"
              sx={{ width: '100%', minHeight: 38, justifyContent: collapsed ? 'center' : 'flex-start', gap: 1, color: 'text.secondary', borderRadius: 1 }}
            >
              {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
              {!collapsed && <Typography variant="body2" sx={{ fontWeight: 600 }}>收起侧边栏</Typography>}
            </IconButton>
          </Tooltip>
          <Tooltip title={collapsed ? '退出登录' : ''} placement="right">
            <IconButton
              type="button"
              onClick={onLogout}
              aria-label="退出登录"
              size="small"
              sx={{ width: '100%', minHeight: 38, justifyContent: collapsed ? 'center' : 'flex-start', gap: 1, color: 'text.secondary', borderRadius: 1, '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}
            >
              <LogoutIcon fontSize="small" />
              {!collapsed && <Typography variant="body2" sx={{ fontWeight: 600 }}>退出登录</Typography>}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
};

// Sidebar 提供桌面固定导航和移动端临时导航两种布局，业务回调保持原有接口。
const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  isAdmin = false,
  collapsed,
  mobileOpen = false,
  onMobileClose,
  onToggleCollapsed,
  onNavigate,
  onLogout,
  buildInfo,
  hasUnreadChatMessage = false,
}) => {
  // drawerWidth 以折叠状态计算桌面导航宽度，移动端始终使用完整导航宽度。
  const drawerWidth = collapsed ? 72 : 248;
  // contentProps 让两个 Drawer 共享同一份权限和导航行为。
  const contentProps = {
    activeTab,
    isAdmin,
    collapsed,
    buildInfo,
    hasUnreadChatMessage,
    onToggleCollapsed,
    onNavigate,
    onLogout,
    onMobileClose,
  };

  return (
    <>
      <Drawer
        variant="permanent"
        open
        data-layout-contract={collapsed ? 'w-16' : 'w-64'}
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: 1, borderColor: 'divider' },
        }}
      >
        <SidebarContent {...contentProps} />
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 248, boxSizing: 'border-box' } }}
      >
        {mobileOpen ? <SidebarContent {...contentProps} collapsed={false} /> : null}
      </Drawer>
    </>
  );
};

export default Sidebar;

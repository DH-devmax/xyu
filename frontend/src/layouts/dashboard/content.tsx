import React, { useEffect, useRef, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Iconify } from '@/components/iconify';
import { LoadingScreen, SvgColor } from '@/components/minimal';
import { DHBrandIcon } from '@/components/minimal/DHBrandLogo';
import { appPaths } from '@/routes/paths';
import { useMinimalSettings } from '@/theme';
import { dashboardNavGroups } from './nav-config';
import type { DashboardNavItem } from './nav-config';

/** DashboardSearchRoute 为每个导航入口补充可搜索的所属分组。 */
interface DashboardSearchRoute extends DashboardNavItem {
  /** group 是搜索结果中展示的导航层级。 */
  group: string;
}

// dashboardSearchRoutes 直接展平侧边栏配置，保证页面名称、路径和权限始终一致。
const dashboardSearchRoutes: readonly DashboardSearchRoute[] = dashboardNavGroups.flatMap(/* 展平每个导航分组。 */ group => [
  ...(group.items ?? []).map(/* 为直接入口标记顶层分组。 */ route => ({ ...route, group: group.title })),
  ...(group.children ?? []).flatMap(/* 展平可折叠的子分组。 */ child => child.items.map(/* 保留完整导航层级。 */ route => ({ ...route, group: `${group.title} / ${child.title}` }))),
]);

// workspaceOptions 是不触碰后端契约的工作区演示入口。
const workspaceOptions = [
  { name: '工作区 1', plan: '免费版', current: true },
  { name: '工作区 2', plan: '专业版', current: false },
  { name: '工作区 3', plan: '专业版', current: false },
] as const;

/** DashboardContentProps 描述 Minimal 主区接收的移动导航、会话和版本信息回调。 */
export interface DashboardContentProps {
  /** onOpenMobile 打开窄屏导航抽屉。 */
  onOpenMobile: () => void;
  /** version 是服务端公开构建版本。 */
  version: string;
  /** onLogout 执行服务端会话注销。 */
  onLogout: () => Promise<void>;
  /** hasUnreadChatMessage 控制顶栏通知徽标。 */
  hasUnreadChatMessage: boolean;
  /** isAdmin 控制搜索面板中管理员专属路由的可见性。 */
  isAdmin: boolean;
}

/** DashboardContent 渲染 Minimal 工作区顶栏、搜索、通知和个人资料入口。 */
export const DashboardContent: React.FC<DashboardContentProps> = ({ onOpenMobile, version, onLogout, hasUnreadChatMessage, isAdmin }) => {
  // location 用于让聊天与智能管家进入贴合视口的沉浸式工作区。
  const location = useLocation();
  // immersiveWorkspace 仅针对需要桌面应用级画布的两个对话页面关闭通用 gutter。
  const immersiveWorkspace = location.pathname === appPaths.chat || location.pathname === appPaths.concierge;
  // navigate 负责顶栏交互的应用内跳转。
  const navigate = useNavigate();
  // openSettings 打开 Minimal 本地界面设置抽屉。
  const { openSettings } = useMinimalSettings();
  // search 保存快捷搜索输入，不进入业务请求。
  const [search, setSearch] = useState('');
  // searchOpen 控制 Minimal 命令搜索面板。
  const [searchOpen, setSearchOpen] = useState(false);
  // profileAnchor 保存个人资料菜单的锚点元素。
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  // workspaceAnchor 保存工作区菜单的锚点元素。
  const [workspaceAnchor, setWorkspaceAnchor] = useState<HTMLElement | null>(null);
  // notificationAnchor 保存通知菜单的锚点元素。
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  // searchRef 让快捷键打开后立即聚焦输入框。
  const searchRef = useRef<HTMLInputElement>(null);
  // normalizedSearch 是供标题、路径和分组共用的小写搜索词。
  const normalizedSearch = search.trim().toLowerCase();
  // filteredSearchRoutes 仅包含当前用户可访问且符合搜索词的页面。
  const filteredSearchRoutes = dashboardSearchRoutes.filter(/* 过滤权限和搜索词。 */ route => {
    if (route.adminOnly && !isAdmin) return false;
    if (!normalizedSearch) return true;
    return [route.title, route.path, route.group].some(/* 匹配页面名、路径或导航分组。 */ value => value.toLowerCase().includes(normalizedSearch));
  });

  useEffect(/* keyboardShortcutEffect 注册 Minimal 风格的全局搜索快捷键。 */ () => {
    // handleShortcut 处理 macOS Command-K 和 Windows/Linux Control-K。
    const handleShortcut = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return /* keyboardShortcutCleanup 移除快捷搜索监听。 */ () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(/* searchFocusEffect 在命令面板打开后聚焦搜索输入。 */ () => {
    if (!searchOpen) return;
    // frame 是等待 Dialog 输入节点挂载的单帧任务。
    const frame = window.requestAnimationFrame(/* 聚焦命令搜索输入。 */ () => searchRef.current?.focus());
    return /* searchFocusCleanup 取消未执行的聚焦任务。 */ () => window.cancelAnimationFrame(frame);
  }, [searchOpen]);

  // openSearch 打开命令搜索面板。
  const openSearch = (): void => setSearchOpen(true);
  // closeSearch 关闭命令搜索面板并清空临时输入。
  const closeSearch = (): void => {
    setSearchOpen(false);
    setSearch('');
  };
  // navigateSearchRoute 关闭面板并进入选中的正式页面路径。
  const navigateSearchRoute = (path: string): void => {
    navigate(path);
    closeSearch();
  };
  // handleSearch 在回车时进入当前第一个可见结果。
  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter') return;
    // match 是权限过滤后的首个可见搜索结果。
    const match = filteredSearchRoutes[0];
    if (match) navigateSearchRoute(match.path);
  };
  // closeProfileMenu 关闭个人资料菜单。
  const closeProfileMenu = (): void => setProfileAnchor(null);
  // handleProfileNavigate 将个人资料入口映射到现有账号页面。
  const handleProfileNavigate = (): void => {
    closeProfileMenu();
    navigate(appPaths.accounts);
  };
  // handleSettingsNavigate 打开 Minimal 设置抽屉而不修改服务端设置。
  const handleSettingsNavigate = (): void => {
    closeProfileMenu();
    openSettings();
  };
  // handleLogoutClick 关闭菜单后执行现有 SessionProvider 注销动作。
  const handleLogoutClick = (): void => {
    closeProfileMenu();
    void onLogout();
  };
  // openNotifications 打开产品通知面板。
  const openNotifications = (event: React.MouseEvent<HTMLElement>): void => setNotificationAnchor(event.currentTarget);
  // closeNotifications 关闭产品通知面板。
  const closeNotifications = (): void => setNotificationAnchor(null);
  // navigateNotifications 跳转通知设置并关闭面板。
  const navigateNotifications = (): void => {
    closeNotifications();
    navigate(appPaths.notifications);
  };

  return (
    <Box component="main" data-dashboard-main sx={{ display: 'flex', minWidth: 0, minHeight: immersiveWorkspace ? '100dvh' : '100vh', height: immersiveWorkspace ? '100dvh' : undefined, overflow: immersiveWorkspace ? 'hidden' : 'visible', flex: 1, flexDirection: 'column', bgcolor: 'transparent' }}>
      <Box component="header" sx={{ position: 'sticky', top: 0, zIndex: 'appBar', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', backdropFilter: 'blur(18px)' }}>
        <Box sx={{ width: '100%', minHeight: { xs: 64, lg: 80 }, px: 'var(--dh-content-gutter)', display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <Tooltip title="打开主导航"><IconButton aria-label="打开主导航" onClick={onOpenMobile} sx={{ display: { xs: 'inline-flex', lg: 'none' } }}><Iconify icon="menu" /></IconButton></Tooltip>
          <ButtonBase aria-label="切换工作区" onClick={/* workspaceMenuToggle 打开工作区菜单。 */ event => setWorkspaceAnchor(event.currentTarget)} sx={{ minWidth: 0, borderRadius: 1, px: { xs: 0.5, sm: 1 }, py: 0.75, gap: { xs: 0.75, sm: 1.25 }, justifyContent: 'flex-start', '&:hover': { bgcolor: 'action.hover' } }}>
            <DHBrandIcon size={38} decorative />
            <Stack spacing={0.1} sx={{ minWidth: 0, display: { xs: 'none', sm: 'flex' }, alignItems: 'flex-start' }}><Typography noWrap sx={{ fontSize: 15, fontWeight: 750, lineHeight: 1.2 }}>工作区 1</Typography><Typography noWrap variant="caption" color="text.secondary">免费版</Typography></Stack>
            <Chip label="免费版" size="small" color="info" sx={{ display: { xs: 'none', md: 'inline-flex' }, height: 26, borderRadius: 1, fontWeight: 700 }} />
            <Iconify icon="chevronSort" width={18} sx={{ color: 'text.disabled' }} />
          </ButtonBase>
          <Box sx={{ flex: 1 }} />
          <ButtonBase aria-label="搜索页面" onClick={openSearch} sx={{ display: { xs: 'none', sm: 'flex' }, height: 44, px: 1.25, gap: 1, borderRadius: 1, color: 'text.secondary', bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}><Iconify icon="search" width={23} /><Typography variant="caption" sx={{ px: 0.75, py: 0.25, border: 1, borderColor: 'divider', borderRadius: 1, color: 'text.primary', bgcolor: 'background.paper', fontWeight: 700 }}>⌘K</Typography></ButtonBase>
          <Tooltip title="搜索"><IconButton aria-label="搜索页面" onClick={openSearch} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}><Iconify icon="search" /></IconButton></Tooltip>
          <Tooltip title="通知"><IconButton aria-label="通知" onClick={openNotifications}><Badge color="error" variant="dot" invisible={!hasUnreadChatMessage}><Iconify icon="bell" /></Badge></IconButton></Tooltip>
          <Tooltip title="界面设置"><IconButton aria-label="界面设置" onClick={openSettings} sx={{ '&:hover svg': { transform: 'rotate(45deg)' }, '& svg': { transition: 'transform 200ms ease' } }}><Iconify icon="settings" /></IconButton></Tooltip>
          <Tooltip title="个人资料"><IconButton aria-label="个人资料" onClick={/* profileMenuToggle 打开个人资料菜单。 */ event => setProfileAnchor(event.currentTarget)} sx={{ p: 0.25, borderRadius: '50%' }}><Avatar src="/static/favicon.png" alt="个人资料" sx={{ width: 38, height: 38, border: 1, borderColor: 'primary.main', bgcolor: 'background.paper' }} /></IconButton></Tooltip>
        </Box>
      </Box>

      <Menu anchorEl={workspaceAnchor} open={Boolean(workspaceAnchor)} onClose={/* workspaceMenuClose 关闭工作区菜单。 */ () => setWorkspaceAnchor(null)} slotProps={{ paper: { sx: { mt: 1, minWidth: 300, p: 1 } } }}>
        {workspaceOptions.map(/* 渲染可见的演示工作区。 */ workspace => <MenuItem key={workspace.name} selected={workspace.current} onClick={/* workspaceSelectionClose 选择演示工作区并关闭菜单。 */ () => setWorkspaceAnchor(null)} sx={{ minHeight: 64, borderRadius: 1 }}><ListItemIcon><DHBrandIcon size={30} decorative /></ListItemIcon><ListItemText primary={workspace.name} secondary={workspace.current ? `版本 ${version === 'dev' ? '开发构建' : version}` : '演示工作区'} /><Chip label={workspace.plan} size="small" color={workspace.current ? 'info' : 'default'} sx={{ borderRadius: 1 }} /></MenuItem>)}
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={/* workspaceCreateDemoClose 关闭新建演示入口。 */ () => setWorkspaceAnchor(null)} sx={{ minHeight: 48, borderRadius: 1 }}><ListItemIcon><Iconify icon="add" /></ListItemIcon><ListItemText primary="创建工作区" secondary="演示入口" /></MenuItem>
      </Menu>

      <Menu anchorEl={notificationAnchor} open={Boolean(notificationAnchor)} onClose={closeNotifications} slotProps={{ paper: { sx: { mt: 1, width: 320, p: 1 } } }}>
        <Box sx={{ px: 1.5, py: 1 }}><Typography variant="h3">通知</Typography><Typography variant="body2" color="text.secondary">{hasUnreadChatMessage ? '您有未读聊天消息' : '暂无新通知'}</Typography></Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ p: 1 }}><Button fullWidth variant="contained" onClick={navigateNotifications}>查看通知设置</Button></Box>
      </Menu>

      <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={closeProfileMenu} slotProps={{ paper: { sx: { mt: 1, minWidth: 240, p: 1 } } }}>
        <Box sx={{ px: 1.5, py: 1 }}><Typography sx={{ fontWeight: 700 }}>管理员</Typography><Typography variant="body2" color="text.secondary">DH闲不下来</Typography></Box>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleProfileNavigate} sx={{ borderRadius: 1 }}><ListItemIcon><Iconify icon="user" width={20} /></ListItemIcon><ListItemText primary="个人资料" /></MenuItem>
        <MenuItem onClick={handleSettingsNavigate} sx={{ borderRadius: 1 }}><ListItemIcon><Iconify icon="settings" width={20} /></ListItemIcon><ListItemText primary="界面设置" /></MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleLogoutClick} sx={{ borderRadius: 1, color: 'error.main' }}><ListItemIcon sx={{ color: 'inherit' }}><Iconify icon="logout" width={20} /></ListItemIcon><ListItemText primary="退出登录" /></MenuItem>
      </Menu>

      <Dialog open={searchOpen} onClose={closeSearch} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 0.75 }}>搜索页面</DialogTitle>
        <DialogContent sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover' }}><Iconify icon="search" /><InputBase inputRef={searchRef} fullWidth autoFocus value={search} onChange={/* searchChange 更新快捷搜索输入。 */ event => setSearch(event.target.value)} onKeyDown={handleSearch} placeholder="按页面名称、路由或分组搜索" inputProps={{ 'aria-label': '搜索页面' }} /><Typography variant="caption" color="text.disabled" noWrap>回车</Typography></Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1, pt: 1.5, pb: 0.5 }}>{normalizedSearch ? `找到 ${filteredSearchRoutes.length} 个页面` : '全部可访问页面'}</Typography>
          {filteredSearchRoutes.length > 0 ? (
            <List disablePadding sx={{ maxHeight: { xs: '55vh', sm: 420 }, overflowY: 'auto' }}>
              {filteredSearchRoutes.map(/* 渲染可点击的 Minimal 路由引导项。 */ route => (
                <ListItemButton key={route.key} selected={location.pathname === route.path} onClick={/* searchRouteClick 进入所选页面。 */ () => navigateSearchRoute(route.path)} sx={{ minHeight: 68, mb: 0.5, px: 1.25, border: 1, borderColor: 'transparent', borderRadius: 1, '&:hover': { borderColor: 'divider', bgcolor: 'action.hover' }, '&.Mui-selected': { borderColor: 'primary.main', bgcolor: 'action.selected' } }}>
                  <ListItemIcon sx={{ minWidth: 42, color: 'text.secondary' }}><SvgColor src={`/static/assets/icons/navbar/${route.icon}`} size={23} /></ListItemIcon>
                  <ListItemText primary={route.title} secondary={route.path} slotProps={{ primary: { sx: { fontWeight: 700 } }, secondary: { sx: { mt: 0.25, fontFamily: 'monospace' } } }} />
                  <Typography variant="caption" color="text.disabled" sx={{ maxWidth: { xs: 100, sm: 180 }, ml: 1, textAlign: 'right' }}>{route.group}</Typography>
                  <Iconify icon="chevron" width={18} sx={{ ml: 1, color: 'text.disabled', transform: 'rotate(-90deg)' }} />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Box sx={{ py: 5, textAlign: 'center' }}><Typography sx={{ fontWeight: 700 }}>没有匹配的页面</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>请尝试页面名称或 /app 路由</Typography></Box>
          )}
        </DialogContent>
      </Dialog>

      <Box sx={{ width: '100%', maxWidth: immersiveWorkspace ? 'none' : 1600, mx: immersiveWorkspace ? 0 : 'auto', flex: 1, minHeight: 0, overflow: immersiveWorkspace ? 'hidden' : 'visible', display: immersiveWorkspace ? 'flex' : 'block', flexDirection: immersiveWorkspace ? 'column' : undefined, px: immersiveWorkspace ? 0 : 'var(--dh-content-gutter)', py: immersiveWorkspace ? 0 : { xs: 2.5, sm: 3.5, lg: 4 } }}>
        <React.Suspense fallback={<LoadingScreen minHeight={320} label="正在加载页面" />}><Outlet /></React.Suspense>
      </Box>
    </Box>
  );
};

export default DashboardContent;

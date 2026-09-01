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
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Outlet, useNavigate } from 'react-router-dom';
import { Iconify } from '@/components/iconify';
import { LoadingScreen } from '@/components/minimal';
import { DHBrandIcon } from '@/components/minimal/DHBrandLogo';
import { appPaths } from '@/routes/paths';
import { useMinimalSettings } from '@/theme';

// pageTitles 保存快捷搜索标题与正式页面 URL 的稳定映射。
const pageTitles: Readonly<Record<string, string>> = {
  [appPaths.dashboard]: '仪表盘',
  [appPaths.accounts]: '账号管理',
  [appPaths.chat]: '在线聊天',
  [appPaths.orders]: '订单管理',
  [appPaths.cards]: '卡密库存',
  [appPaths.items]: '商品列表',
  [appPaths.rules]: '自动化规则',
  [appPaths.notifications]: '通知设置',
  [appPaths.settings]: '系统与 AI',
  [appPaths.brain]: '智能中枢',
  [appPaths.concierge]: '智能管家',
};

// workspaceOptions 是不触碰后端契约的工作区演示入口。
const workspaceOptions = [
  { name: '工作区 1', plan: '免费版', current: true },
  { name: '工作区 2', plan: '专业版', current: false },
  { name: '工作区 3', plan: '专业版', current: false },
] as const;

// pageSearchMatcher 匹配路径或中文标题，供顶栏快捷搜索复用。
const pageSearchMatcher = (query: string) => ([path, label]: [string, string]): boolean => path.toLowerCase().includes(query) || label.toLowerCase().includes(query);

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
}

/** DashboardContent 渲染 Minimal 工作区顶栏、搜索、通知和个人资料入口。 */
export const DashboardContent: React.FC<DashboardContentProps> = ({ onOpenMobile, version, onLogout, hasUnreadChatMessage }) => {
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
  // handleSearch 在回车时将页面名称映射到正式 URL。
  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter') return;
    // query 是去除空白后的大小写不敏感搜索词。
    const query = search.trim().toLowerCase();
    if (!query) return;
    // match 是搜索命中的路径和中文标题。
    const match = Object.entries(pageTitles).find(pageSearchMatcher(query));
    if (match) {
      navigate(match[0]);
      closeSearch();
    }
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
    <Box component="main" data-dashboard-main sx={{ display: 'flex', minWidth: 0, minHeight: '100vh', flex: 1, flexDirection: 'column', bgcolor: 'transparent' }}>
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
        <DialogTitle sx={{ pb: 1 }}>搜索页面</DialogTitle>
        <DialogContent><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover' }}><Iconify icon="search" /><InputBase inputRef={searchRef} fullWidth autoFocus value={search} onChange={/* searchChange 更新快捷搜索输入。 */ event => setSearch(event.target.value)} onKeyDown={handleSearch} placeholder="搜索仪表盘、账号、订单…" inputProps={{ 'aria-label': '搜索页面' }} /><Typography variant="caption" color="text.disabled">回车</Typography></Stack></DialogContent>
      </Dialog>

      <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', flex: 1, px: 'var(--dh-content-gutter)', py: { xs: 2.5, sm: 3.5, lg: 4 } }}>
        <React.Suspense fallback={<LoadingScreen minHeight={320} label="正在加载页面" />}><Outlet /></React.Suspense>
      </Box>
    </Box>
  );
};

export default DashboardContent;

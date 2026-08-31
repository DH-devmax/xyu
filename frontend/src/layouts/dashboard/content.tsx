import React, { useEffect, useRef, useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { appPaths } from '@/routes/paths';
import { DHBrandIcon } from '@/components/minimal/DHBrandLogo';
import { LoadingScreen } from '@/components/minimal';
import { useMinimalSettings } from '@/theme';

// pageTitles 保存顶栏标题与正式页面 URL 的稳定映射。
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
};

// pageSearchMatcher 匹配路径或中文标题，供顶栏快捷搜索复用。
const pageSearchMatcher = (query: string) => ([path, label]: [string, string]): boolean => path.toLowerCase().includes(query) || label.toLowerCase().includes(query);

// DashboardContentProps 描述 Minimal 主区接收的移动导航、会话和版本信息回调。
export interface DashboardContentProps {
  // onOpenMobile 打开窄屏导航抽屉。
  onOpenMobile: () => void;
  // version 是服务端公开构建版本。
  version: string;
  // onLogout 执行服务端会话注销。
  onLogout: () => Promise<void>;
  // hasUnreadChatMessage 控制顶栏通知徽标。
  hasUnreadChatMessage: boolean;
}

// DashboardContent 渲染 Minimal 工作区顶栏、快捷搜索、个人资料菜单和 Outlet 内容区。
export const DashboardContent: React.FC<DashboardContentProps> = ({ onOpenMobile, version, onLogout, hasUnreadChatMessage }) => {
  // location 保存当前正式页面地址，用于标题和导航搜索。
  const location = useLocation();
  // navigate 负责搜索命中后的应用内跳转。
  const navigate = useNavigate();
  // openSettings 打开 Minimal 本地界面设置抽屉。
  const { openSettings } = useMinimalSettings();
  // search 保存顶栏快捷搜索输入，不进入业务请求。
  const [search, setSearch] = useState('');
  // profileAnchor 保存个人资料菜单的锚点元素。
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  // workspaceAnchor 保存工作区菜单的锚点元素。
  const [workspaceAnchor, setWorkspaceAnchor] = useState<HTMLElement | null>(null);
  // searchRef 让 Minimal 的 Command-K 快捷键聚焦顶栏搜索。
  const searchRef = useRef<HTMLInputElement>(null);
  // title 是当前路由对应的移动端顶栏标题。
  const title = pageTitles[location.pathname] ?? '仪表盘';
  // keyboardEffect 注册 Minimal 风格的全局搜索快捷键。
  useEffect(/* keyboardShortcutEffect 注册快捷搜索监听。 */ () => {
    // handleShortcut 处理 macOS Command-K 和 Windows/Linux Control-K。
    const handleShortcut = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return /* keyboardShortcutCleanup 移除快捷搜索监听。 */ () => window.removeEventListener('keydown', handleShortcut);
  }, []);
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
      setSearch('');
    }
  };
  // closeProfileMenu 关闭个人资料菜单，避免菜单状态跨页面残留。
  const closeProfileMenu = (): void => setProfileAnchor(null);
  // handleProfileNavigate 将个人资料入口映射到现有账号页面，保持后端契约不变。
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
  return (
    <Box component="main" sx={{ display: 'flex', minWidth: 0, minHeight: '100vh', flex: 1, flexDirection: 'column', bgcolor: 'transparent' }}>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ bgcolor: 'transparent', backgroundImage: 'none', borderBottom: 1, borderColor: 'divider', backdropFilter: 'blur(14px)' }}>
        <Toolbar sx={{ minHeight: { xs: 64, lg: 80 }, gap: { xs: 0.75, sm: 1.5 }, px: { xs: 1.5, sm: 3, lg: 4 } }}>
          <IconButton aria-label="打开主导航" onClick={onOpenMobile} sx={{ display: { xs: 'inline-flex', lg: 'none' } }}><MenuIcon /></IconButton>
          <ButtonBase aria-label="切换工作区" onClick={/* workspaceMenuToggle 打开工作区菜单。 */ event => setWorkspaceAnchor(event.currentTarget)} sx={{ minWidth: 0, borderRadius: 1.5, px: { xs: 0.5, sm: 1 }, py: 0.75, gap: { xs: 0.75, sm: 1.25 }, justifyContent: 'flex-start', '&:hover': { bgcolor: 'action.hover' } }}>
            <DHBrandIcon size={38} decorative />
            <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
              <Typography noWrap sx={{ fontSize: 15, fontWeight: 750, lineHeight: 1.2 }}>工作区 1</Typography>
              <Typography noWrap variant="caption" color="primary.main">免费版</Typography>
            </Box>
            <ExpandMoreIcon fontSize="small" color="action" />
          </ButtonBase>
          <Box sx={{ flex: 1 }} />
          <TextField inputRef={searchRef} value={search} onChange={/* searchChange 更新快捷搜索输入。 */ event => setSearch(event.target.value)} onKeyDown={handleSearch} placeholder="搜索页面" aria-label="搜索页面" size="small" sx={{ display: { xs: 'none', md: 'block' }, width: { md: 220, lg: 280 }, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'action.hover' } }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" /></InputAdornment>, endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.disabled" sx={{ border: 1, borderColor: 'divider', borderRadius: 0.75, px: 0.6, py: 0.15 }}>⌘K</Typography></InputAdornment> } }} />
          <Tooltip title="通知"><IconButton aria-label="通知" onClick={/* notificationNavigation 打开通知设置页面。 */ () => navigate(appPaths.notifications)}><Badge color="error" variant="dot" invisible={!hasUnreadChatMessage}><NotificationsNoneOutlinedIcon /></Badge></IconButton></Tooltip>
          <Tooltip title="界面设置"><IconButton aria-label="界面设置" onClick={openSettings}><SettingsOutlinedIcon /></IconButton></Tooltip>
          <Tooltip title="个人资料">
            <IconButton aria-label="个人资料" onClick={/* profileMenuToggle 打开个人资料菜单。 */ event => setProfileAnchor(event.currentTarget)} sx={{ p: 0.25, borderRadius: '50%' }}>
              <Avatar src="/static/favicon.png" alt="个人资料" sx={{ width: 38, height: 38, border: 1, borderColor: 'primary.main', bgcolor: 'background.paper' }} />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Menu anchorEl={workspaceAnchor} open={Boolean(workspaceAnchor)} onClose={/* workspaceMenuClose 关闭工作区菜单。 */ () => setWorkspaceAnchor(null)}>
        <MenuItem selected onClick={/* workspaceSelectionClose 选择当前工作区并关闭菜单。 */ () => setWorkspaceAnchor(null)}><ListItemIcon><DHBrandIcon size={26} decorative /></ListItemIcon><ListItemText primary="工作区 1" secondary="免费版" /></MenuItem>
        <Divider />
        <MenuItem disabled><ListItemText primary={`版本 ${version === 'dev' ? '开发构建' : version}`} /></MenuItem>
      </Menu>
      <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={closeProfileMenu}>
        <MenuItem onClick={handleProfileNavigate}><ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon><ListItemText primary="个人资料" /></MenuItem>
        <MenuItem onClick={handleSettingsNavigate}><ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon><ListItemText primary="界面设置" /></MenuItem>
        <Divider />
        <MenuItem onClick={handleLogoutClick} sx={{ color: 'error.main' }}><ListItemIcon sx={{ color: 'inherit' }}><LogoutIcon fontSize="small" /></ListItemIcon><ListItemText primary="退出登录" /></MenuItem>
      </Menu>
      <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', flex: 1, px: { xs: 1.5, sm: 3, lg: 4 }, py: { xs: 2.5, sm: 3.5, lg: 4 } }}>
        <Typography variant="h3" sx={{ display: { xs: 'block', lg: 'none' }, mb: 2 }} noWrap>{title}</Typography>
        <React.Suspense fallback={<LoadingScreen minHeight={320} label="正在加载页面" />}><Outlet /></React.Suspense>
      </Box>
    </Box>
  );
};

export default DashboardContent;

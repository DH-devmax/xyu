import React, { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { appPaths } from '@/routes/paths';
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
  [appPaths.brain]: 'Brain Center',
};

// DashboardContentProps 描述 Minimal 主区接收的移动导航和版本信息回调。
export interface DashboardContentProps {
  // onOpenMobile 打开窄屏导航抽屉。
  onOpenMobile: () => void;
  // version 是服务端公开构建版本。
  version: string;
}

// DashboardContent 渲染 Minimal Header、快捷搜索和 Outlet 内容区。
export const DashboardContent: React.FC<DashboardContentProps> = ({ onOpenMobile, version }) => {
  // location 保存当前正式页面地址，用于标题和导航搜索。
  const location = useLocation();
  // navigate 负责搜索命中后的应用内跳转。
  const navigate = useNavigate();
  // openSettings 打开 Minimal 本地界面设置抽屉。
  const { openSettings } = useMinimalSettings();
  // search 保存顶栏快捷搜索输入，不进入业务请求。
  const [search, setSearch] = useState('');
  // title 是当前路由对应的移动端顶栏标题。
  const title = pageTitles[location.pathname] ?? '仪表盘';
  // handleSearch 在回车时将页面名称映射到正式 URL。
  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter') return;
    // query 是去除空白后的大小写不敏感搜索词。
    const query = search.trim().toLowerCase();
    if (!query) return;
    // match 是搜索命中的路径和中文标题。
    const match = Object.entries(pageTitles).find(/* pageSearchMatcher 匹配路径或中文标题。 */ ([path, label]) => path.toLowerCase().includes(query) || label.toLowerCase().includes(query));
    if (match) {
      navigate(match[0]);
      setSearch('');
    }
  };
  return (
    <Box component="main" sx={{ display: 'flex', minWidth: 0, minHeight: '100vh', flex: 1, flexDirection: 'column' }}>
      <AppBar position="sticky" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ minHeight: { xs: 60, lg: 72 }, gap: 1.25, px: { xs: 1.5, sm: 3, lg: 4 } }}>
          <IconButton aria-label="打开主导航" onClick={onOpenMobile} sx={{ display: { xs: 'inline-flex', lg: 'none' } }}><MenuIcon /></IconButton>
          <Typography variant="h3" sx={{ display: { xs: 'block', lg: 'none' }, flex: 1 }} noWrap>{title}</Typography>
          <TextField value={search} onChange={/* searchChange 更新快捷搜索输入。 */ event => setSearch(event.target.value)} onKeyDown={handleSearch} placeholder="搜索页面" aria-label="搜索页面" size="small" sx={{ display: { xs: 'none', md: 'block' }, width: 260, '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' } }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" /></InputAdornment> } }} />
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{version === 'dev' ? '开发构建' : version}</Typography>
          <IconButton aria-label="界面设置" title="界面设置" onClick={openSettings} size="small"><SettingsOutlinedIcon fontSize="small" /></IconButton>
          <IconButton aria-label="通知" title="通知" onClick={/* notificationNavigation 打开通知设置页面。 */ () => navigate(appPaths.notifications)} size="small"><NotificationsNoneOutlinedIcon fontSize="small" /></IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', px: { xs: 1.5, sm: 3, lg: 4 }, py: { xs: 2.5, sm: 3.5, lg: 4 } }}>
        <React.Suspense fallback={<Box role="status" aria-label="正在加载页面" sx={{ minHeight: 320 }} />}><Outlet /></React.Suspense>
      </Box>
    </Box>
  );
};

export default DashboardContent;

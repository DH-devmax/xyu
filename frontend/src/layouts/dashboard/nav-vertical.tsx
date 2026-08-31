import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import { NavLink, useLocation } from 'react-router-dom';
import { DHBrandIcon } from '@/components/minimal/DHBrandLogo';
import { dashboardNavItems } from './nav-config';

// DashboardNavigationProps 描述桌面和移动导航共享的会话及版本数据。
export interface DashboardNavigationProps {
  // isAdmin 表示当前会话是否可以访问管理入口。
  isAdmin: boolean;
  // mini 表示桌面导航是否为图标模式。
  mini: boolean;
  // hasUnreadChatMessage 表示聊天入口是否显示未读标记。
  hasUnreadChatMessage: boolean;
  // version 是服务端公开构建版本。
  version: string;
  // onToggle 切换桌面导航宽度。
  onToggle: () => void;
  // onLogout 注销当前服务端会话。
  onLogout: () => void;
  // onNavigate 在移动端导航完成后关闭抽屉。
  onNavigate?: () => void;
}

// DashboardNavigationContent 渲染 Minimal 导航的品牌、业务入口和会话操作。
export const DashboardNavigationContent: React.FC<DashboardNavigationProps> = ({ isAdmin, mini, hasUnreadChatMessage, version, onToggle, onLogout, onNavigate }) => {
  // location 保存当前路由，用于给活动导航项设置 Minimal selected 状态。
  const location = useLocation();
  // items 是按当前角色过滤后的正式导航入口。
  const items = dashboardNavItems.filter(/* roleFilter 只保留当前用户可以访问的入口。 */ item => !item.adminOnly || isAdmin);
  return (
    <Stack sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={1.25} sx={{ minHeight: 76, alignItems: 'center', px: mini ? 1.75 : 2.5, justifyContent: mini ? 'center' : 'flex-start' }}>
        <DHBrandIcon size={38} />
        {!mini && <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontSize: 15, fontWeight: 750 }}>DH闲不下来</Typography><Typography noWrap variant="caption" color="primary.main">AGENT PANEL</Typography></Box>}
      </Stack>
      <Divider />
      <List component="nav" aria-label="主导航" sx={{ flex: 1, overflowY: 'auto', px: mini ? 1 : 1.5, py: 2 }}>
        {items.map(/* navigationItemRenderer 渲染一个 Minimal 导航项。 */ item => {
          // selected 表示当前导航项是否对应浏览器地址。
          const selected = location.pathname === item.path;
          return (
            <Tooltip key={item.key} title={mini ? item.title : ''} placement="right">
              <ListItemButton component={NavLink} to={item.path} onClick={onNavigate} selected={selected} aria-current={selected ? 'page' : undefined} sx={{ minHeight: 44, mb: 0.5, px: mini ? 1 : 1.25, gap: 1.25, justifyContent: mini ? 'center' : 'flex-start', borderRadius: 1, color: selected ? 'primary.main' : 'text.secondary', '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText' }, '&.Mui-selected:hover': { bgcolor: 'primary.dark' } }}>
                <ListItemIcon sx={{ minWidth: 0, width: 28, justifyContent: 'center', color: 'inherit', position: 'relative' }}>
                  {item.icon}
                  {item.key === 'chat' && hasUnreadChatMessage ? <Box role="status" aria-label="在线聊天有未读消息" sx={{ position: 'absolute', top: -2, right: 1, width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main', border: 1, borderColor: 'background.paper' }} /> : null}
                </ListItemIcon>
                {!mini && <ListItemText primary={item.title} slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 650 } } }} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
      <Divider />
      <Stack spacing={0.75} sx={{ p: mini ? 1 : 1.5 }}>
        {!mini && <Chip size="small" label={version === 'dev' ? '开发构建' : version} variant="outlined" sx={{ alignSelf: 'flex-start' }} />}
        <Tooltip title={mini ? '展开导航' : ''} placement="right"><IconButton aria-label={mini ? '展开导航' : '收起导航'} onClick={onToggle} sx={{ minHeight: 40, width: '100%', justifyContent: mini ? 'center' : 'flex-start', gap: 1 }}>{mini ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}{!mini && <Typography variant="body2">收起导航</Typography>}</IconButton></Tooltip>
        <Tooltip title={mini ? '退出登录' : ''} placement="right"><IconButton aria-label="退出登录" onClick={onLogout} sx={{ minHeight: 40, width: '100%', justifyContent: mini ? 'center' : 'flex-start', gap: 1, '&:hover': { color: 'error.main' } }}><LogoutIcon fontSize="small" />{!mini && <Typography variant="body2">退出登录</Typography>}</IconButton></Tooltip>
      </Stack>
    </Stack>
  );
};

// NavVertical 渲染桌面固定的 Minimal Vertical 或 Mini 导航。
export const NavVertical: React.FC<DashboardNavigationProps> = /* navVerticalRenderer 渲染桌面固定导航。 */ props => {
  // width 固定桌面导航轨道宽度，避免切换时内容跳动。
  const width = props.mini ? 72 : 256;
  return <Drawer variant="permanent" open sx={{ display: { xs: 'none', lg: 'block' }, width, flexShrink: 0, '& .MuiDrawer-paper': { width, borderRight: 1, borderColor: 'divider', transition: /* drawerTransition 使用 Minimal 主题的时长令牌。 */ theme => theme.transitions.create('width', { duration: theme.transitions.duration.shorter }) } }}><DashboardNavigationContent {...props} /></Drawer>;
};

export default NavVertical;

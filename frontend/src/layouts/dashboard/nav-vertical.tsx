import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
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
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import { NavLink, useLocation } from 'react-router-dom';
import { SvgColor } from '@/components/minimal';
import { DHBrandIcon, DHBrandLogo } from '@/components/minimal/DHBrandLogo';
import { dashboardNavGroups, type DashboardNavGroup, type DashboardNavItem } from './nav-config';

/** DashboardNavigationProps 描述桌面和移动导航共享的会话及版本数据。 */
export interface DashboardNavigationProps {
  /** isAdmin 表示当前会话是否可以访问管理入口。 */
  isAdmin: boolean;
  /** mini 表示桌面导航是否为图标模式。 */
  mini: boolean;
  /** hasUnreadChatMessage 表示聊天入口是否显示未读标记。 */
  hasUnreadChatMessage: boolean;
  /** version 是服务端公开构建版本。 */
  version: string;
  /** onToggle 切换桌面导航宽度。 */
  onToggle: () => void;
  /** onLogout 注销当前服务端会话。 */
  onLogout: () => void;
  /** onNavigate 在移动端导航完成后关闭抽屉。 */
  onNavigate?: () => void;
  /** navColor 控制导航表面是否独立于页面背景。 */
  navColor?: 'integrate' | 'apparent';
}

// iconPath 统一拼接 Minimal 本地图标资源路径。
const iconPath = (icon: string): string => `/static/assets/icons/navbar/${icon}`;

// filterItem 按会话权限过滤单个导航入口。
const filterItem = (item: DashboardNavItem, isAdmin: boolean): boolean => !item.adminOnly || isAdmin;

// filterGroup 清理分组中的不可见入口和空父级。
const filterGroup = (group: DashboardNavGroup, isAdmin: boolean): DashboardNavGroup => ({
  ...group,
  items: group.items?.filter(/* 过滤直接业务入口。 */ item => filterItem(item, isAdmin)),
  children: group.children?.map(/* 过滤父级下的业务入口。 */ child => ({ ...child, items: child.items.filter(/* 过滤子级入口。 */ item => filterItem(item, isAdmin)) })).filter(/* 移除无可见子级的父入口。 */ child => child.items.length > 0),
});

/** DashboardNavigationContent 渲染 Minimal 分组、Solar 图标和会话操作。 */
export const DashboardNavigationContent: React.FC<DashboardNavigationProps> = ({ isAdmin, mini, hasUnreadChatMessage, version, onToggle, onLogout, onNavigate, navColor = 'integrate' }) => {
  // location 提供当前路径，用于计算选中导航项。
  const location = useLocation();
  // groups 保存经过权限筛选的 Minimal 分组。
  const groups = useMemo(/* 计算当前会话可见的导航分组。 */ () => dashboardNavGroups.map(/* 应用管理员权限过滤。 */ group => filterGroup(group, isAdmin)).filter(/* 移除空分组。 */ group => (group.items?.length ?? 0) > 0 || (group.children?.length ?? 0) > 0), [isAdmin]);
  // expanded 保存可折叠业务分组的展开状态。
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 业务运营: true, 系统管理: true });
  // isSelected 判断导航入口是否匹配当前路径。
  const isSelected = (item: DashboardNavItem): boolean => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  // renderItem 生成直接业务入口并适配迷你模式提示。
  const renderItem = (item: DashboardNavItem, nested = false): React.ReactNode => {
    // selected 表示当前入口处于活动路径。
    const selected = isSelected(item);
    // button 是带 Minimal 样式的链接按钮。
    const button = (
      <ListItemButton
        key={item.key}
        component={NavLink}
        to={item.path}
        onClick={onNavigate}
        selected={selected}
        aria-current={selected ? 'page' : undefined}
        sx={{
          minHeight: 44,
          mb: 0.5,
          px: mini ? 1.5 : nested ? 2.25 : 1.5,
          gap: 1.5,
          justifyContent: mini ? 'center' : 'flex-start',
          borderRadius: 1,
          color: selected ? 'primary.main' : 'text.secondary',
          '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText' },
          '&.Mui-selected:hover': { bgcolor: 'primary.dark' },
          '&:hover': { bgcolor: selected ? 'primary.dark' : 'action.hover' },
        }}
      >
        <ListItemIcon sx={{ minWidth: 0, width: 24, justifyContent: 'center', color: 'inherit', position: 'relative' }}>
          <SvgColor src={iconPath(item.icon)} size={22} />
          {item.key === 'chat' && hasUnreadChatMessage ? <Box role="status" aria-label="在线聊天有未读消息" sx={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', border: 1, borderColor: 'background.paper' }} /> : null}
        </ListItemIcon>
        {!mini && <ListItemText primary={item.title} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: selected ? 700 : 550 } } }} />}
      </ListItemButton>
    );
    return mini ? <Tooltip key={item.key} title={item.title} placement="right">{button}</Tooltip> : button;
  };
  // renderGroup 生成分组标题、父级按钮和子级折叠内容。
  const renderGroup = (group: DashboardNavGroup): React.ReactNode => (
    <Box key={group.title} sx={{ mb: 2 }}>
      {!mini && <Typography variant="overline" sx={{ display: 'block', px: 1.5, mb: 0.75, color: 'text.disabled', fontWeight: 700, letterSpacing: 0.5 }}>{group.title}</Typography>}
      {group.items?.map(/* 渲染分组内的直接入口。 */ item => renderItem(item))}
      {group.children?.map(/* 渲染可折叠的业务父级。 */ child => {
        // active 表示父级下是否存在当前路径。
        const active = child.items.some(isSelected);
        // open 表示当前父级是否展开。
        const open = expanded[child.title] ?? active;
        return (
          <Box key={child.title}>
            <ListItemButton onClick={/* 切换业务父级展开状态。 */ () => setExpanded(/* 基于上一状态更新当前父级。 */ previous => ({ ...previous, [child.title]: !open }))} sx={{ minHeight: 44, mb: 0.5, px: mini ? 1.5 : 1.5, gap: 1.5, justifyContent: mini ? 'center' : 'flex-start', borderRadius: 1, color: active ? 'primary.main' : 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
              <ListItemIcon sx={{ minWidth: 0, width: 24, justifyContent: 'center', color: 'inherit' }}><SvgColor src={iconPath(child.icon)} size={22} /></ListItemIcon>
              {!mini && <ListItemText primary={child.title} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 700 : 550 } } }} />}
              {!mini && (open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
            </ListItemButton>
            {!mini && <Collapse in={open} timeout="auto" unmountOnExit><List disablePadding>{child.items.map(/* 渲染父级下的嵌套入口。 */ item => renderItem(item, true))}</List></Collapse>}
          </Box>
        );
      })}
    </Box>
  );
  return (
    <Stack sx={{ height: '100%', bgcolor: navColor === 'apparent' ? 'background.paper' : 'background.default' }}>
      <Stack direction="row" spacing={1.25} sx={{ minHeight: 88, alignItems: 'center', px: mini ? 2 : 3, justifyContent: mini ? 'center' : 'flex-start' }}>
        {mini ? <DHBrandIcon size={40} decorative /> : <DHBrandLogo size={42} showLabel />}
      </Stack>
      <Divider />
      <List component="nav" aria-label="主导航" sx={{ flex: 1, overflowY: 'auto', px: mini ? 1.25 : 2, py: 2.5 }}>{groups.map(renderGroup)}</List>
      <Divider />
      <Stack spacing={0.75} sx={{ p: mini ? 1.25 : 2 }}>
        {!mini && <Chip size="small" label={version === 'dev' ? '开发构建' : version} variant="outlined" sx={{ alignSelf: 'flex-start', borderRadius: 1 }} />}
        <Tooltip title={mini ? '展开导航' : ''} placement="right"><IconButton aria-label={mini ? '展开导航' : '收起导航'} onClick={onToggle} sx={{ minHeight: 40, width: '100%', justifyContent: mini ? 'center' : 'flex-start', gap: 1 }}>{mini ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}{!mini && <Typography variant="body2">收起导航</Typography>}</IconButton></Tooltip>
        <Tooltip title={mini ? '退出登录' : ''} placement="right"><IconButton aria-label="退出登录" onClick={onLogout} sx={{ minHeight: 40, width: '100%', justifyContent: mini ? 'center' : 'flex-start', gap: 1, '&:hover': { color: 'error.main' } }}><LogoutIcon fontSize="small" />{!mini && <Typography variant="body2">退出登录</Typography>}</IconButton></Tooltip>
      </Stack>
    </Stack>
  );
};

/** NavVertical 渲染桌面固定的 Minimal Vertical 或 Mini 导航。 */
export const NavVertical: React.FC<DashboardNavigationProps> = props => {
  // width 与 Minimal Vertical/Mini 布局的固定槽位保持一致。
  const width = props.mini ? 88 : 280;
  return <Drawer variant="permanent" open sx={{ display: { xs: 'none', lg: 'block' }, width, flexShrink: 0, '& .MuiDrawer-paper': { width, borderRight: 1, borderColor: 'divider', transition: /* 生成导航宽度过渡。 */ theme => theme.transitions.create('width', { duration: theme.transitions.duration.shorter }) } }}><DashboardNavigationContent {...props} /></Drawer>;
};

export default NavVertical;

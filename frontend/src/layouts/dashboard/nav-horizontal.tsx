import React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { NavLink, useLocation } from 'react-router-dom';
import { SvgColor } from '@/components/minimal';
import { DHBrandLogo } from '@/components/minimal/DHBrandLogo';
import { dashboardNavItems } from './nav-config';
import type { DashboardNavigationProps } from './nav-vertical';

/** NavHorizontal 渲染 Minimal 横向导航布局并复用相同业务入口。 */
export const NavHorizontal: React.FC<DashboardNavigationProps> = ({ isAdmin, hasUnreadChatMessage, onNavigate, navColor = 'integrate' }) => {
  // location 提供当前路径，用于高亮横向导航入口。
  const location = useLocation();
  // items 保留当前用户有权限访问的业务入口。
  const items = dashboardNavItems.filter(/* 过滤管理员专属入口。 */ item => !item.adminOnly || isAdmin);
  return <Box component="nav" aria-label="主导航" sx={{ display: { xs: 'none', lg: 'flex' }, minHeight: 72, px: 3, alignItems: 'center', gap: 3, borderBottom: 1, borderColor: 'divider', bgcolor: navColor === 'apparent' ? 'background.paper' : 'background.default', backgroundImage: 'linear-gradient(to right, var(--dh-grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--dh-grid-line) 1px, transparent 1px)', backgroundSize: 'var(--dh-grid-size) var(--dh-grid-size)' }}>
    <DHBrandLogo size={40} decorative />
    <Stack direction="row" spacing={0.5} sx={{ minWidth: 0, overflowX: 'auto' }}>{items.map(/* 渲染横向业务入口。 */ item => {
      // selected 表示当前路由是否属于该入口。
      const selected = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
      return <ButtonBase key={item.key} component={NavLink} to={item.path} onClick={onNavigate} sx={{ minHeight: 44, px: 1.5, borderRadius: 1, gap: 0.75, color: selected ? 'primary.main' : 'text.secondary', bgcolor: selected ? 'action.selected' : 'transparent', '&:hover': { bgcolor: 'action.hover' } }}><SvgColor src={`/static/assets/icons/navbar/${item.icon}`} size={20} /><Typography variant="body2" sx={{ fontWeight: selected ? 700 : 550, whiteSpace: 'nowrap' }}>{item.title}</Typography>{item.key === 'chat' && hasUnreadChatMessage ? <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} /> : null}</ButtonBase>;
    })}</Stack>
  </Box>;
};

export default NavHorizontal;

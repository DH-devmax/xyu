import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useLocation } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { Iconify } from '@/components/iconify';
import { DHBrandIcon, DHBrandLogo } from '@/components/minimal/DHBrandLogo';
import { dashboardNavGroups, type DashboardNavGroup, type DashboardNavItem } from './nav-config';
import { MinimalNavSectionVertical } from './nav-section-vertical';

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

// filterItem 按会话权限过滤单个导航入口。
const filterItem = (item: DashboardNavItem, isAdmin: boolean): boolean => !item.adminOnly || isAdmin;

// filterGroup 清理分组中的不可见入口和空父级。
const filterGroup = (group: DashboardNavGroup, isAdmin: boolean): DashboardNavGroup => ({
  ...group,
  items: group.items?.filter(/* 过滤直接业务入口。 */ item => filterItem(item, isAdmin)),
  children: group.children?.map(/* 过滤父级下的业务入口。 */ child => ({ ...child, items: child.items.filter(/* 过滤子级入口。 */ item => filterItem(item, isAdmin)) })).filter(/* 移除无可见子级的父入口。 */ child => child.items.length > 0),
});

/** DashboardNavigationContent 渲染 Minimal 分组、Solar 图标和会话操作。 */
export const DashboardNavigationContent: React.FC<DashboardNavigationProps> = ({ isAdmin, mini, hasUnreadChatMessage, version, onToggle, onNavigate, navColor = 'integrate' }) => {
  // location 提供当前路径，用于计算选中导航项。
  const location = useLocation();
  // groups 保存经过权限筛选的 Minimal 分组。
  const groups = useMemo(/* 计算当前会话可见的导航分组。 */ () => dashboardNavGroups.map(/* 应用管理员权限过滤。 */ group => filterGroup(group, isAdmin)).filter(/* 移除空分组。 */ group => (group.items?.length ?? 0) > 0 || (group.children?.length ?? 0) > 0), [isAdmin]);
  return (
    <Stack sx={{ height: '100%', minHeight: 0, bgcolor: navColor === 'apparent' ? 'background.paper' : 'background.default', backgroundColor: navColor === 'apparent' ? 'background.paper' : 'background.default', backgroundImage: /* navGradient 根据主题模式和导航表面应用 Minimal 侧栏渐变。 */ theme => {
      // gradient 在白底上保留 Minimal 侧栏顶部的淡绿色层次。
      return theme.palette.mode === 'dark' ? 'linear-gradient(180deg, rgba(33, 166, 117, 0.14) 0%, rgba(29, 37, 45, 0.92) 38%, rgba(20, 26, 32, 0) 100%)' : 'linear-gradient(180deg, rgba(33, 166, 117, 0.10) 0%, rgba(255, 255, 255, 0.84) 38%, rgba(255, 255, 255, 0) 100%)';
    } }}>
      <Stack direction="row" spacing={1.25} sx={{ minHeight: 88, alignItems: 'center', px: mini ? 2 : 3, justifyContent: mini ? 'center' : 'flex-start' }}>
        {mini ? <DHBrandIcon size={40} decorative /> : <DHBrandLogo size={42} showLabel />}
      </Stack>
      <Divider />
      <Box sx={{ flex: 1, minHeight: 0, '& .simplebar-scrollbar::before': { bgcolor: 'text.disabled' } }}>
        <SimpleBar style={{ height: '100%' }}>
          <MinimalNavSectionVertical groups={groups} pathname={location.pathname} mini={mini} hasUnreadChatMessage={hasUnreadChatMessage} onNavigate={onNavigate} />
        </SimpleBar>
      </Box>
      <Divider />
      <Stack spacing={0.75} sx={{ p: mini ? 1.25 : 2 }}>
        {!mini && <Chip size="small" label={version === 'dev' ? '开发构建' : version} variant="outlined" sx={{ alignSelf: 'flex-start', borderRadius: 1 }} />}
        <Tooltip title={mini ? '展开导航' : ''} placement="right"><IconButton aria-label={mini ? '展开导航' : '收起导航'} onClick={onToggle} sx={{ minHeight: 40, width: '100%', justifyContent: mini ? 'center' : 'flex-start', gap: 1 }}><Iconify icon="chevron" width={18} sx={{ transform: mini ? 'rotate(-90deg)' : 'rotate(90deg)' }} />{!mini && <Typography variant="body2">收起导航</Typography>}</IconButton></Tooltip>
      </Stack>
    </Stack>
  );
};

/** NavVertical 渲染桌面固定的 Minimal Vertical 或 Mini 导航。 */
export const NavVertical: React.FC<DashboardNavigationProps> = props => {
  // width 与 Minimal Vertical/Mini 布局的固定槽位保持一致。
  const width = props.mini ? 'var(--dh-layout-nav-mini-width)' : 'var(--dh-layout-nav-width)';
  return <Drawer variant="permanent" open sx={{ display: { xs: 'none', lg: 'block' }, width, flexShrink: 0, '& .MuiDrawer-paper': { width, borderRight: 1, borderColor: 'divider', transition: /* 生成导航宽度过渡。 */ theme => theme.transitions.create('width', { duration: theme.transitions.duration.shorter }) } }}><DashboardNavigationContent {...props} /></Drawer>;
};

export default NavVertical;

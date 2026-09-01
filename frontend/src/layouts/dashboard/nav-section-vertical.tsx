import React, { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { NavLink } from 'react-router-dom';
import { Iconify } from '@/components/iconify';
import { SvgColor } from '@/components/minimal';
import type { DashboardNavGroup, DashboardNavItem } from './nav-config';

/** MinimalNavSectionVerticalProps 描述业务数据驱动的 Minimal Vertical/Mini 导航。 */
export interface MinimalNavSectionVerticalProps {
  /** groups 是已按权限筛选过的业务导航分组。 */
  groups: readonly DashboardNavGroup[];
  /** pathname 是当前路由，用于标记活动入口。 */
  pathname: string;
  /** mini 控制导航是否只展示图标。 */
  mini: boolean;
  /** hasUnreadChatMessage 控制聊天入口的未读标记。 */
  hasUnreadChatMessage: boolean;
  /** onNavigate 允许移动端在完成跳转后关闭抽屉。 */
  onNavigate?: () => void;
}

// iconPath 统一指向随产品构建发布的 Minimal 本地导航图标。
const iconPath = (icon: string): string => `/static/assets/icons/navbar/${icon}`;

// matchesItem 判断当前 pathname 是否属于一个正式业务入口。
const matchesItem = (pathname: string, item: DashboardNavItem): boolean => pathname === item.path || pathname.startsWith(`${item.path}/`);

/** MinimalNavSectionVertical 以模板 NavSection 的分组和子项层级渲染现有业务导航。 */
export const MinimalNavSectionVertical: React.FC<MinimalNavSectionVerticalProps> = ({ groups, pathname, mini, hasUnreadChatMessage, onNavigate }) => {
  // expanded 保存可折叠业务父组当前是否展开。
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 业务运营: true, 系统管理: true });
  // renderItem 输出统一的 Minimal ButtonBase 路由入口。
  const renderItem = (item: DashboardNavItem, nested = false): React.ReactNode => {
    // selected 表示该项为当前正式路由。
    const selected = matchesItem(pathname, item);
    // content 是可同时用于完整和迷你导航的本地 SVG 菜单项。
    const content = (
      <ButtonBase
        component={NavLink}
        to={item.path}
        onClick={onNavigate}
        aria-current={selected ? 'page' : undefined}
        sx={{
          width: '100%',
          minHeight: 44,
          px: mini ? 1.25 : nested ? 2.25 : 1.5,
          mb: 0.5,
          gap: 1.5,
          justifyContent: mini ? 'center' : 'flex-start',
          borderRadius: 1,
          color: selected ? 'primary.main' : 'text.secondary',
          bgcolor: selected ? 'var(--dh-palette-primary-mainChannel, rgba(33, 166, 117, 0.12))' : 'transparent',
          '&[aria-current="page"]': { bgcolor: 'primary.main', color: 'primary.contrastText' },
          '&[aria-current="page"]:hover': { bgcolor: 'primary.dark' },
          '&:hover': { bgcolor: selected ? 'primary.dark' : 'action.hover' },
        }}
      >
        <Box sx={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <SvgColor src={iconPath(item.icon)} size={22} />
          {item.key === 'chat' && hasUnreadChatMessage ? <Box role="status" aria-label="在线聊天有未读消息" sx={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', border: 1, borderColor: 'background.paper' }} /> : null}
        </Box>
        {!mini ? <Typography component="span" variant="body2" sx={{ fontWeight: selected ? 700 : 550, textAlign: 'left' }}>{item.title}</Typography> : null}
      </ButtonBase>
    );
    return mini ? <Tooltip key={item.key} title={item.title} placement="right">{content}</Tooltip> : <React.Fragment key={item.key}>{content}</React.Fragment>;
  };

  return (
    <Box component="nav" aria-label="主导航" sx={{ px: mini ? 1.25 : 2, py: 2.5 }}>
      {groups.map(/* 渲染概览、管理等模板分组。 */ group => (
        <Box key={group.title} sx={{ mb: 2 }}>
          {!mini ? <Typography variant="overline" sx={{ display: 'block', px: 1.5, mb: 0.75, color: 'text.disabled', fontWeight: 700, letterSpacing: 0.5 }}>{group.title}</Typography> : null}
          {group.items?.map(/* 渲染分组中的直接业务入口。 */ item => renderItem(item))}
          {group.children?.map(/* 渲染模板风格的可折叠业务父组。 */ child => {
            // active 表示当前地址落在父组内的任一入口。
            const active = child.items.some(/* 匹配父组下的业务地址。 */ item => matchesItem(pathname, item));
            // open 默认展开，确保用户进入业务页面时立即看到子项。
            const open = expanded[child.title] ?? true;
            return (
              <Box key={child.title}>
                <ButtonBase
                  onClick={/* 切换父组展开状态。 */ () => setExpanded(/* 基于上一状态只切换当前父组。 */ previous => ({ ...previous, [child.title]: !open }))}
                  sx={{ width: '100%', minHeight: 44, px: mini ? 1.25 : 1.5, mb: 0.5, gap: 1.5, justifyContent: mini ? 'center' : 'flex-start', borderRadius: 1, color: active ? 'primary.main' : 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <SvgColor src={iconPath(child.icon)} size={22} />
                  {!mini ? <Typography component="span" variant="body2" sx={{ flex: 1, fontWeight: active ? 700 : 550, textAlign: 'left' }}>{child.title}</Typography> : null}
                  {!mini ? <Iconify icon="chevron" width={18} sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }} /> : null}
                </ButtonBase>
                {!mini ? <Collapse in={open} timeout="auto" unmountOnExit><Stack spacing={0}>{child.items.map(/* 渲染可展开父组的业务入口。 */ item => renderItem(item, true))}</Stack></Collapse> : null}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

export default MinimalNavSectionVertical;

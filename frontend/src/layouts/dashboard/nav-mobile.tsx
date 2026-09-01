import React from 'react';
import Drawer from '@mui/material/Drawer';
import type { DashboardNavigationProps } from './nav-vertical';
import { DashboardNavigationContent } from './nav-vertical';

// NavMobileProps 描述移动端临时导航的开关状态。
export interface NavMobileProps extends Omit<DashboardNavigationProps, 'mini'> {
  // open 表示移动端抽屉是否打开。
  open: boolean;
  // onClose 关闭移动端抽屉。
  onClose: () => void;
}

// NavMobile 在窄屏使用临时 Drawer，并复用同一份业务导航数据。
export const NavMobile: React.FC<NavMobileProps> = ({ open, onClose, ...other }) => (
  <Drawer anchor="left" open={open} onClose={onClose} sx={{ display: { xs: 'block', lg: 'none' } }} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 360 }, maxWidth: '100%', borderRight: 0 } } }}>
    <DashboardNavigationContent {...other} mini={false} onNavigate={onClose} />
  </Drawer>
);

export default NavMobile;

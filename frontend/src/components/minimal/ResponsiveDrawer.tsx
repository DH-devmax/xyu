import React from 'react';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/** MinimalResponsiveDrawerProps 描述桌面右侧抽屉和移动端全宽抽屉。 */
export interface MinimalResponsiveDrawerProps {
  /** open 表示抽屉是否打开。 */
  open: boolean;
  /** title 是抽屉标题。 */
  title: React.ReactNode;
  /** children 是抽屉主体。 */
  children: React.ReactNode;
  /** onClose 关闭抽屉。 */
  onClose: () => void;
  /** width 是桌面端抽屉宽度。 */
  width?: number;
}

/** MinimalResponsiveDrawer 为订单详情、聊天详情和编辑流程提供统一抽屉壳。 */
export const MinimalResponsiveDrawer: React.FC<MinimalResponsiveDrawerProps> = ({ open, title, children, onClose, width = 480 }) => (
  <Drawer
    data-layout-contract="minimal-responsive-drawer"
    anchor="right"
    open={open}
    onClose={onClose}
    slotProps={{ paper: { sx: { width: { xs: '100vw', sm: width }, maxWidth: '100vw', bgcolor: 'background.default' } } }}
  >
    <Stack sx={{ height: '100%' }}>
      <Stack direction="row" sx={{ minHeight: 64, px: { xs: 2, sm: 3 }, alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h3" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Typography>
        <IconButton aria-label="关闭" onClick={onClose} size="small"><CloseOutlinedIcon /></IconButton>
      </Stack>
      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 3 } }}>{children}</Box>
    </Stack>
  </Drawer>
);

export default MinimalResponsiveDrawer;

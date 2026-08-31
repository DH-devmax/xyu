import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';

/** MinimalFilterToolbarProps 描述业务筛选和批量操作工具栏。 */
export interface MinimalFilterToolbarProps {
  /** children 是筛选器和操作按钮。 */
  children: React.ReactNode;
  /** sx 是工具栏样式覆盖。 */
  sx?: SxProps<Theme>;
}

/** MinimalFilterToolbar 复用 Minimal 列表页的轻量工具栏容器。 */
export const MinimalFilterToolbar: React.FC<MinimalFilterToolbarProps> = ({ children, sx }) => (
  <Box
    data-layout-contract="minimal-filter-toolbar"
    sx={[
      {
        p: { xs: 1.5, sm: 2 },
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
      {children}
    </Stack>
  </Box>
);

export default MinimalFilterToolbar;

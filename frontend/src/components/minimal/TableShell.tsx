import React from 'react';
import Paper from '@mui/material/Paper';
import type { PaperProps } from '@mui/material/Paper';

/** MinimalTableShellProps 描述列表页表格和工具栏的统一外框。 */
export interface MinimalTableShellProps extends PaperProps {
  /** children 是筛选栏、表头、表格和分页等业务节点。 */
  children: React.ReactNode;
}

/** MinimalTableShell 为订单、卡密等密集列表提供 Minimal outlined table 外框。 */
export const MinimalTableShell: React.FC<MinimalTableShellProps> = ({ children, sx, ...other }) => (
  <Paper
    data-layout-contract="minimal-table-shell"
    variant="outlined"
    sx={[{ overflow: 'hidden', bgcolor: 'background.paper' }, ...(Array.isArray(sx) ? sx : [sx])]}
    {...other}
  >
    {children}
  </Paper>
);

export default MinimalTableShell;

import React from 'react';
import Dialog from '@mui/material/Dialog';
import type { DialogProps } from '@mui/material/Dialog';

/** MinimalDialogSurfaceProps 描述业务弹窗共享的 Minimal/MUI 外框属性。 */
export interface MinimalDialogSurfaceProps extends Omit<DialogProps, 'children' | 'slotProps'> {
  /** children 是弹窗标题、内容和操作区。 */
  children: React.ReactNode;
}

/** MinimalDialogSurface 统一焦点管理、遮罩和响应式宽度，业务内容不再直接操作 document.body。 */
export const MinimalDialogSurface: React.FC<MinimalDialogSurfaceProps> = ({ children, ...props }) => (
  <Dialog
    data-layout-contract="minimal-dialog-surface"
    fullWidth
    scroll="paper"
    {...props}
    slotProps={{ paper: { sx: { width: '100%', maxHeight: 'min(90vh, 900px)', borderRadius: 1, backgroundImage: 'none' } } }}
  >
    {children}
  </Dialog>
);

export default MinimalDialogSurface;

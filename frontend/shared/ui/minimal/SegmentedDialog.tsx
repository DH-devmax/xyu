import React from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import type { DialogProps } from '@mui/material/Dialog';

/** MinimalSegmentOption 描述分段 Dialog 的一个选项。 */
export interface MinimalSegmentOption {
  /** value 是选项的稳定值。 */
  value: string;
  /** label 是选项的本地化标题。 */
  label: React.ReactNode;
  /** icon 是可选的前置图标。 */
  icon?: React.ReactElement;
}

/** MinimalSegmentedDialogProps 描述带分段导航的业务编辑 Dialog。 */
export interface MinimalSegmentedDialogProps extends Omit<DialogProps, 'title' | 'onClose'> {
  /** title 是 Dialog 标题。 */
  title: React.ReactNode;
  /** description 是标题下方的上下文说明。 */
  description?: React.ReactNode;
  /** segments 是分段导航选项。 */
  segments: readonly MinimalSegmentOption[];
  /** value 是当前选中的分段值。 */
  value: string;
  /** onSegmentChange 处理分段切换。 */
  onSegmentChange: (value: string) => void;
  /** onClose 关闭 Dialog。 */
  onClose: () => void;
  /** children 是当前分段的业务表单内容。 */
  children: React.ReactNode;
  /** actions 是 Dialog 底部操作。 */
  actions?: React.ReactNode;
}

/** MinimalSegmentedDialog 统一规则、卡密等多步骤编辑流程的 Minimal Dialog 结构。 */
export const MinimalSegmentedDialog: React.FC<MinimalSegmentedDialogProps> = ({
  title,
  description,
  segments,
  value,
  onSegmentChange,
  onClose,
  children,
  actions,
  ...dialogProps
}) => (
  <Box data-layout-contract="minimal-segmented-dialog">
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      {...dialogProps}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Typography variant="h3">{title}</Typography>
        {description ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography> : null}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Tabs
            value={value}
            onChange={/* segmentChange 处理 Dialog 内分段导航切换。 */ (_event, nextValue: string) => onSegmentChange(nextValue)}
            variant="scrollable"
            allowScrollButtonsMobile
            aria-label="编辑分段"
          >
            {segments.map(/* segmentRenderer 渲染单个分段导航项。 */ segment => (
              <Tab key={segment.value} value={segment.value} label={segment.label} icon={segment.icon} iconPosition={segment.icon ? 'start' : undefined} />
            ))}
          </Tabs>
          {children}
        </Stack>
      </DialogContent>
      {actions ? <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>{actions}</DialogActions> : null}
    </Dialog>
  </Box>
);

export default MinimalSegmentedDialog;

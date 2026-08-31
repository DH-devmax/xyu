import React from 'react';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/** MinimalEmptyStateProps 描述列表为空或筛选无结果时的提示内容。 */
export interface MinimalEmptyStateProps {
  /** title 是空状态标题。 */
  title: React.ReactNode;
  /** description 是可选的空状态说明。 */
  description?: React.ReactNode;
  /** icon 是可选的语义图标。 */
  icon?: React.ReactNode;
}

/** MinimalEmptyState 统一 Minimal 列表页的空数据视觉。 */
export const MinimalEmptyState: React.FC<MinimalEmptyStateProps> = ({ title, description, icon }) => (
  <Stack data-layout-contract="minimal-empty-state" spacing={1} sx={{ minHeight: 220, alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 3, color: 'text.secondary' }}>
    <Box sx={{ display: 'grid', placeItems: 'center', width: 48, height: 48, borderRadius: 1, bgcolor: 'action.hover', color: 'text.disabled' }}>
      {icon || <InboxOutlinedIcon />}
    </Box>
    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>{title}</Typography>
    {description ? <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>{description}</Typography> : null}
  </Stack>
);

export default MinimalEmptyState;

import React from 'react';
import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';

/** MinimalStatusChipProps 描述统一状态标签的公开属性。 */
export interface MinimalStatusChipProps extends Omit<ChipProps, 'label'> {
  /** label 是状态的本地化展示文案。 */
  label: React.ReactNode;
}

/** MinimalStatusChip 复用 Minimal 的小尺寸语义状态标签。 */
export const MinimalStatusChip: React.FC<MinimalStatusChipProps> = ({ sx, ...props }) => (
  <Chip
    data-layout-contract="minimal-status-chip"
    size="small"
    variant="outlined"
    sx={[{ fontWeight: 700, maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }, ...(Array.isArray(sx) ? sx : [sx])]}
    {...props}
  />
);

export default MinimalStatusChip;

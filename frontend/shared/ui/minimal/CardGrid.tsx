import React from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

/** MinimalCardGridProps 描述 Minimal 响应式卡片网格的列数和间距。 */
export interface MinimalCardGridProps {
  /** children 是待排列的卡片节点。 */
  children: React.ReactNode;
  /** minItemWidth 是卡片在宽屏下的最小宽度。 */
  minItemWidth?: number;
  /** sx 是网格根节点的样式覆盖。 */
  sx?: SxProps<Theme>;
}

/** MinimalCardGrid 以 CSS grid 提供稳定的商品、账号和规则卡片布局。 */
export const MinimalCardGrid: React.FC<MinimalCardGridProps> = ({ children, minItemWidth = 248, sx }) => (
  <Box
    data-layout-contract="minimal-card-grid"
    sx={[
      {
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minItemWidth}px, 100%), 1fr))`,
        gap: { xs: 1.5, sm: 2, md: 2.5 },
        alignItems: 'stretch',
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {children}
  </Box>
);

export default MinimalCardGrid;

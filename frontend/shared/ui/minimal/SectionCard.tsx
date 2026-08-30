import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { CardProps } from '@mui/material/Card';

/** MinimalSectionCardProps 描述 Minimal 业务区块卡片的标题、动作和内容。 */
export interface MinimalSectionCardProps extends Omit<CardProps, 'title'> {
  /** title 是区块标题；缺省时只渲染内容。 */
  title?: React.ReactNode;
  /** action 是标题行右侧的操作节点。 */
  action?: React.ReactNode;
  /** children 是区块主体内容。 */
  children: React.ReactNode;
  /** contentSx 是卡片内容容器的样式覆盖。 */
  contentSx?: CardProps['sx'];
}

/**
 * MinimalSectionCard 复用 Minimal 页面常用的 outlined card 结构。
 * 卡片不持有数据状态，业务页面可以逐块替换原有容器而不改变请求逻辑。
 */
export const MinimalSectionCard: React.FC<MinimalSectionCardProps> = ({
  title,
  action,
  children,
  contentSx,
  sx,
  ...other
}) => (
  <Card data-layout-contract="minimal-section-card" sx={sx} {...other}>
    {title ? (
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Typography variant="h3">{title}</Typography>
        {action ? <Stack direction="row" sx={{ alignItems: 'center' }}>{action}</Stack> : null}
      </Stack>
    ) : null}
    <CardContent sx={[{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }, ...(Array.isArray(contentSx) ? contentSx : [contentSx])]}>
      {children}
    </CardContent>
  </Card>
);

export default MinimalSectionCard;

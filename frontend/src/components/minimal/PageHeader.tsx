import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';

/** MinimalPageHeaderProps 描述业务页面共享标题区的内容和动作插槽。 */
export interface MinimalPageHeaderProps {
  /** eyebrow 是标题上方的产品或业务上下文文本。 */
  eyebrow?: React.ReactNode;
  /** title 是页面主标题。 */
  title: React.ReactNode;
  /** description 是标题下方的简短上下文说明。 */
  description?: React.ReactNode;
  /** actions 是标题区右侧的页面级操作节点。 */
  actions?: React.ReactNode;
  /** sx 是调用方对标题区根节点追加的 MUI 样式。 */
  sx?: SxProps<Theme>;
}

/**
 * MinimalPageHeader 复用 Minimal 仪表盘页面的标题与动作布局。
 * 组件只负责排版，不读取路由、权限或业务数据。
 */
export const MinimalPageHeader: React.FC<MinimalPageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  sx,
}) => (
  <Stack
    data-layout-contract="minimal-page-header"
    direction={{ xs: 'column', sm: 'row' }}
    spacing={2}
    sx={[
      { alignItems: { xs: 'stretch', sm: 'flex-end' }, justifyContent: 'space-between' },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <Box sx={{ minWidth: 0 }}>
      {eyebrow ? (
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
          {eyebrow}
        </Typography>
      ) : null}
      <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, lineHeight: 1.25 }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
    {actions ? <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{actions}</Box> : null}
  </Stack>
);

export default MinimalPageHeader;

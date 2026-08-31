import React from 'react';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/** MinimalFormHeadProps 描述 Minimal 认证表单标题的图标、标题和辅助说明。 */
export interface MinimalFormHeadProps extends Omit<BoxProps, 'title'> {
  /** icon 是标题上方可选的品牌或状态图标。 */
  icon?: React.ReactNode;
  /** title 是当前认证流程的主标题。 */
  title: React.ReactNode;
  /** description 是标题下方的上下文说明或可交互节点。 */
  description?: React.ReactNode;
}

/**
 * MinimalFormHead 复用 Minimal FormHead 的垂直间距和居中排版，标题内容由调用方决定。
 * 组件只渲染展示节点，不读取会话、表单或网络状态。
 */
export const MinimalFormHead: React.FC<MinimalFormHeadProps> = ({
  sx,
  icon,
  title,
  description,
  ...other
}) => (
  <>
    {icon ? (
      <Box component="span" sx={{ mb: 2, mx: 'auto', display: 'inline-flex' }}>
        {icon}
      </Box>
    ) : null}
    <Box
      sx={[
        {
          mb: 4,
          gap: 1,
          display: 'flex',
          textAlign: 'center',
          whiteSpace: 'pre-line',
          flexDirection: 'column',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Typography variant="h5">{title}</Typography>
      {description ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  </>
);

export default MinimalFormHead;

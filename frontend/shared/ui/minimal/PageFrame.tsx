import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';
import { MinimalPageHeader } from './PageHeader';

/** MinimalPageFrameProps 描述 Minimal 业务页面的标题、操作和内容区域。 */
export interface MinimalPageFrameProps {
  /** eyebrow 是页面所属产品或业务上下文。 */
  eyebrow?: React.ReactNode;
  /** title 是页面主标题。 */
  title: React.ReactNode;
  /** description 是页面标题下方的简短说明。 */
  description?: React.ReactNode;
  /** actions 是页面级操作入口。 */
  actions?: React.ReactNode;
  /** children 是业务页面主体内容。 */
  children: React.ReactNode;
  /** sx 是页面根节点的样式覆盖。 */
  sx?: SxProps<Theme>;
  /** className 是兼容既有页面布局类名的可选入口。 */
  className?: string;
}

/**
 * MinimalPageFrame 统一业务页的标题和舒适间距，避免每个 feature 重复搭建页面骨架。
 * 组件只负责排版，数据和交互仍由 feature 页面拥有。
 */
export const MinimalPageFrame: React.FC<MinimalPageFrameProps> = ({
  eyebrow = 'DH闲不下来',
  title,
  description,
  actions,
  children,
  sx,
  className,
}) => (
  <Stack
    data-layout-contract="minimal-page-frame"
    className={className}
    spacing={{ xs: 2.5, md: 3 }}
    sx={[{ minWidth: 0, animation: 'minimal-page-enter 180ms ease-out' }, ...(Array.isArray(sx) ? sx : [sx])]}
  >
    <MinimalPageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Stack>
);

export default MinimalPageFrame;

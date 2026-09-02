import React from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

/** SvgColorProps 描述 Minimal 本地 SVG mask 图标的资源和尺寸。 */
export interface SvgColorProps {
  /** src 是 public 目录下的 SVG 资源路径。 */
  src: string;
  /** size 是图标边长。 */
  size?: number;
  /** sx 是图标节点的样式覆盖。 */
  sx?: SxProps<Theme>;
  /** title 提供非装饰图标的可访问名称。 */
  title?: string;
}

/** SvgColor 使用 Minimal 原版的 CSS mask，允许图标继承导航颜色。 */
export const SvgColor: React.FC<SvgColorProps> = ({ src, size = 24, sx, title }) => (
  <Box
    component="span"
    role={title ? 'img' : undefined}
    aria-label={title}
    sx={[
      {
        width: size,
        height: size,
        flexShrink: 0,
        display: 'inline-flex',
        backgroundColor: 'currentColor',
        mask: `url(${src}) no-repeat center / contain`,
        WebkitMask: `url(${src}) no-repeat center / contain`,
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  />
);

export default SvgColor;

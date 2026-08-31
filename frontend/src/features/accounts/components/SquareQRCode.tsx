import React from 'react';
import Box from '@mui/material/Box';
import type { SxProps,Theme } from '@mui/material/styles';

interface SquareQRCodeProps {
  /** src 表示二维码图片地址。 */ src: string;
  /** alt 表示二维码的替代文本。 */ alt: string;
  /** sx 表示调用方追加的 MUI 样式。 */ sx?: SxProps<Theme>;
}

// SquareQRCode 渲染方形二维码图片。
export const SquareQRCode: React.FC<SquareQRCodeProps> = ({ src, alt, sx }) => (
  <Box
    component="img"
    src={src}
    alt={alt}
    sx={[{ display: 'block', aspectRatio: '1 / 1', width: '100%', height: 'auto', objectFit: 'contain' }, ...(Array.isArray(sx) ? sx : [sx])]}
  />
);

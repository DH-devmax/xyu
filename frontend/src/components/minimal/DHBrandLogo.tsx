import React from 'react';
import Box from '@mui/material/Box';

// DHBrandLogoProps 描述品牌图像的尺寸和可访问性设置。
export interface DHBrandLogoProps {
  // size 是品牌容器的边长，单位为像素。
  size?: number;
  // decorative 表示外层是否已经提供可访问名称。
  decorative?: boolean;
}

// DHBrandLogo 使用构建后的品牌 favicon 作为统一产品标识。
export const DHBrandLogo: React.FC<DHBrandLogoProps> = ({ size = 40, decorative = false }) => (
  <Box sx={{ width: size, height: size, flexShrink: 0, overflow: 'hidden', borderRadius: 1.5, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
    <Box component="img" src="/static/favicon.png" alt={decorative ? '' : 'DH闲不下来'} aria-hidden={decorative || undefined} sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
  </Box>
);

// DHBrandIcon 是导航和认证页使用的品牌图标别名。
export const DHBrandIcon = DHBrandLogo;

export default DHBrandLogo;

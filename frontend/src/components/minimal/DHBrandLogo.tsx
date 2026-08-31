import React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// DHBrandLogoProps 描述品牌图像的尺寸和可访问性设置。
export interface DHBrandLogoProps {
  // size 是品牌容器的边长，单位为像素。
  size?: number;
  // decorative 表示外层是否已经提供可访问名称。
  decorative?: boolean;
  /** showLabel 在完整导航槽位显示产品名和副标题。 */
  showLabel?: boolean;
}

// DHBrandLogo 使用构建后的品牌 favicon 作为统一产品标识，路径与 Go 嵌入静态目录保持稳定。
export const DHBrandLogo: React.FC<DHBrandLogoProps> = ({ size = 40, decorative = false, showLabel = false }) => (
  <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, alignItems: 'center' }}>
    <Box sx={{ width: size, height: size, flexShrink: 0, overflow: 'hidden', borderRadius: 1.5, bgcolor: 'background.paper' }}>
      <Box component="img" src="/static/favicon.png" alt={decorative ? '' : 'DH闲不下来'} aria-hidden={decorative || undefined} sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} />
    </Box>
    {showLabel && <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontSize: 15, fontWeight: 750 }}>DH闲不下来</Typography><Typography noWrap variant="caption" color="primary.main">AGENT PANEL</Typography></Box>}
  </Stack>
);

// DHBrandIcon 是导航和认证页使用的品牌图标别名。
export const DHBrandIcon = DHBrandLogo;

export default DHBrandLogo;

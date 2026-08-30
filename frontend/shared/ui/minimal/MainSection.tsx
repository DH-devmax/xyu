import React from 'react';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';

/** MinimalMainSectionProps 描述登录后页面主内容区域接受的 MUI Box 属性。 */
export type MinimalMainSectionProps = BoxProps;

/**
 * MinimalMainSection 复用 Minimal MainSection 的 flex 主区语义，让业务页逐步脱离 Tailwind 容器类。
 * 组件不改变页面路由或数据请求，只为主内容提供稳定的可滚动布局边界。
 */
export const MinimalMainSection: React.FC<MinimalMainSectionProps> = ({ children, sx, ...other }) => (
  <Box
    component="main"
    data-layout-contract="minimal-main-section"
    sx={[
      {
        display: 'flex',
        flex: '1 1 auto',
        minWidth: 0,
        minHeight: '100vh',
        flexDirection: 'column',
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...other}
  >
    {children}
  </Box>
);

export default MinimalMainSection;

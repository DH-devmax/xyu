import React from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';

/** MinimalAuthCenteredLayoutProps 描述 Minimal 认证布局需要的品牌、插槽和样式覆盖。 */
export interface MinimalAuthCenteredLayoutProps {
  /** children 是认证表单内容，布局只负责定位和视觉容器。 */
  children: React.ReactNode;
  /** brand 是页面顶部展示的产品标识和名称。 */
  brand?: React.ReactNode;
  /** header 是右上角帮助、设置等非业务导航插槽。 */
  header?: React.ReactNode;
  /** sx 是外层布局的 MUI 样式覆盖，不改变认证状态。 */
  sx?: SxProps<Theme>;
  /** contentSx 是居中表单容器的 MUI 样式覆盖。 */
  contentSx?: SxProps<Theme>;
}

// AUTH_CONTENT_WIDTH 延续 Minimal centered 布局的 420px 表单宽度，保证桌面和移动端阅读密度一致。
const AUTH_CONTENT_WIDTH = 420;

// AUTH_BACKGROUND_IMAGE 使用 Minimal 7.7.0 提供的柔焦背景资源，构建后由 Vite base 路径提供。
const AUTH_BACKGROUND_IMAGE = 'url("/static/assets/background/background-3-blur.webp")';

/**
 * MinimalAuthCenteredLayout 复用 Minimal 的 centered auth 结构，同时把认证状态交给现有 SessionProvider。
 * 组件不发起请求、不保存凭据，只提供 header、背景和固定宽度 content 三个视觉边界。
 */
export const MinimalAuthCenteredLayout: React.FC<MinimalAuthCenteredLayoutProps> = ({
  children,
  brand,
  header,
  sx,
  contentSx,
}) => (
  <>
    <GlobalStyles
      styles={{
        body: {
          minWidth: 320,
        },
      }}
    />
    <Box
      component="main"
      data-layout-contract="minimal-auth-centered"
      sx={[
        {
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.default',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: AUTH_BACKGROUND_IMAGE,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            opacity: 0.2,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        component="header"
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: { xs: 2, sm: 4 },
          py: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center' }}>{brand}</Box>
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{header}</Box>
      </Box>
      <Box
        component="section"
        data-layout-contract="minimal-auth-centered-content"
        sx={[
          {
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: AUTH_CONTENT_WIDTH,
            mx: 'auto',
            my: 'auto',
            px: { xs: 3, sm: 5 },
            py: { xs: 4, sm: 5 },
            borderRadius: 1,
            bgcolor: 'background.paper',
            boxShadow: 8,
          },
          ...(Array.isArray(contentSx) ? contentSx : [contentSx]),
        ]}
      >
        {children}
      </Box>
    </Box>
  </>
);

export default MinimalAuthCenteredLayout;

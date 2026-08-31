import React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

/** LoadingScreenProps 描述 Minimal 页面级加载条的布局和可访问名称。 */
export interface LoadingScreenProps {
  /** minHeight 保持加载阶段的页面高度稳定。 */
  minHeight?: number | string;
  /** label 是屏幕阅读器读取的加载状态名称。 */
  label?: string;
}

/** LoadingScreen 使用 Minimal 的居中细线进度条替代旋转加载图标。 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ minHeight = 320, label = '正在加载' }) => (
  <Box role="status" aria-label={label} sx={{ display: 'flex', width: '100%', minHeight, alignItems: 'center', justifyContent: 'center', p: 3 }}>
    <LinearProgress color="inherit" sx={{ width: 1, maxWidth: 360 }} />
  </Box>
);

export default LoadingScreen;

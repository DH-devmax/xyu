import React from 'react';
import Box from '@mui/material/Box';
import { m } from 'framer-motion';

/** LoadingScreenProps 描述 Minimal 页面级加载条的布局和可访问名称。 */
export interface LoadingScreenProps {
  /** minHeight 保持加载阶段的页面高度稳定。 */
  minHeight?: number | string;
  /** label 是屏幕阅读器读取的加载状态名称。 */
  label?: string;
}

/** LoadingScreen 使用 Minimal 的三点脉冲动效替代线性加载条。 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ minHeight = 320, label = '正在加载' }) => (
  <Box role="status" aria-label={label} sx={{ display: 'flex', width: '100%', minHeight, alignItems: 'center', justifyContent: 'center', p: 3 }}>
    <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'primary.main' }}>
      {[0, 1, 2].map(/* 按顺序错开三个 Minimal 加载圆点。 */ delay => (
        <Box
          key={delay}
          component={m.span}
          animate={{ opacity: [0.35, 1, 0.35], scale: [0.72, 1, 0.72], y: [2, -2, 2] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: delay * 0.12, ease: 'easeInOut' }}
          sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: 'currentColor' }}
        />
      ))}
    </Box>
  </Box>
);

export default LoadingScreen;

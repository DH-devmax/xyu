import React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { minimalTheme } from '@/theme/core';

// appTheme 保留旧测试和外部集成的导出名称，实际主题来源统一为 Minimal core。
export const appTheme = minimalTheme;

// AppTheme 是兼容入口，新应用由 MinimalSettingsProvider 按用户偏好提供主题。
export const AppTheme: React.FC<React.PropsWithChildren> = ({ children }) => <ThemeProvider theme={appTheme}><CssBaseline enableColorScheme />{children}</ThemeProvider>;

export default AppTheme;

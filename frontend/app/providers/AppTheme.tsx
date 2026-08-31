import React from 'react';
import '@fontsource-variable/public-sans';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// appThemeOptions 定义 DH 闲不下来统一的浅色工作台视觉令牌。
const appThemeOptions: ThemeOptions = {
  // cssVariables 延续 Minimal 的 CSS 变量主题机制，便于后续页面按同一套令牌迁移。
  cssVariables: { cssVarPrefix: 'dh', colorSchemeSelector: 'data-color-scheme' },
  palette: {
    mode: 'light',
    primary: { main: '#1268a8', contrastText: '#ffffff' },
    secondary: { main: '#536273' },
    success: { main: '#1f7a55' },
    warning: { main: '#a66700' },
    error: { main: '#bb3d3d' },
    info: { main: '#3c6fa8' },
    background: { default: '#f3f5f7', paper: '#ffffff' },
    text: { primary: '#1d242c', secondary: '#627080' },
    divider: '#e1e6eb',
  },
  // shape 使用 Minimal 的 8px 上限，同时满足工作台组件的紧凑圆角规范。
  shape: { borderRadius: 8 },
  typography: {
    // fontFamily 先使用 Minimal 的 Public Sans，再回退到中文系统字体以保证本地化字形完整。
    fontFamily: '"Public Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: 0 },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: 0 },
    h3: { fontSize: '1.125rem', fontWeight: 700, letterSpacing: 0 },
    h4: { fontSize: '1rem', fontWeight: 700, letterSpacing: 0 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6, letterSpacing: 0 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.55, letterSpacing: 0 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    // h5 是 Minimal FormHead 默认标题层级，认证和设置类页面共用该尺寸。
    h5: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.5, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { margin: 0, minWidth: 320, backgroundColor: '#f3f5f7', fontFamily: '"Public Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif' },
        '*': { boxSizing: 'border-box' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderColor: '#e1e6eb', borderRadius: 8 } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 5, minHeight: 38 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 5 } },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 5 } },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: { root: { backgroundImage: 'none', borderBottom: '1px solid #e1e6eb' } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { backgroundImage: 'none' } },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: '#e8edf1' } },
    },
  },
};

// appTheme 是应用内稳定共享的主题实例，避免每次渲染重建样式树。
export const appTheme = createTheme(appThemeOptions);

// AppTheme 为认证页和登录后页面提供同一套 MUI 基础样式。
export const AppTheme: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ThemeProvider theme={appTheme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
);

export default AppTheme;

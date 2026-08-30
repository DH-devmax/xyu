import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// appThemeOptions 定义 DH 闲不下来统一的浅色工作台视觉令牌。
const appThemeOptions: ThemeOptions = {
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
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: 0 },
    h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: 0 },
    h3: { fontSize: '1.125rem', fontWeight: 700, letterSpacing: 0 },
    h4: { fontSize: '1rem', fontWeight: 700, letterSpacing: 0 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6, letterSpacing: 0 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.55, letterSpacing: 0 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { margin: 0, minWidth: 320, backgroundColor: '#f3f5f7' },
        '*': { boxSizing: 'border-box' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderColor: '#e1e6eb', borderRadius: 6 } },
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

import '@fontsource-variable/public-sans';
import { createTheme, type PaletteMode, type Theme } from '@mui/material/styles';

// createMinimalTheme 按 Minimal 7.7.0 的排版、间距和克制色阶创建应用主题。
export const createMinimalTheme = (mode: PaletteMode = 'light'): Theme => createTheme({
  cssVariables: { cssVarPrefix: 'dh', colorSchemeSelector: 'data-color-scheme' },
  palette: mode === 'dark' ? {
    mode,
    primary: { main: '#75b9ed', contrastText: '#102235' },
    secondary: { main: '#a9b8c8' },
    success: { main: '#64c79a' },
    warning: { main: '#e3ad54' },
    error: { main: '#ef7777' },
    info: { main: '#83b9eb' },
    background: { default: '#141a20', paper: '#1d252d' },
    text: { primary: '#f2f5f7', secondary: '#a9b5c0' },
    divider: '#35414c',
  } : {
    mode,
    primary: { main: '#1268a8', dark: '#0b4e7f', light: '#5a9fce', contrastText: '#ffffff' },
    secondary: { main: '#536273' },
    success: { main: '#1f7a55' },
    warning: { main: '#a66700' },
    error: { main: '#bb3d3d' },
    info: { main: '#3c6fa8' },
    background: { default: '#f5f7f9', paper: '#ffffff' },
    text: { primary: '#1d242c', secondary: '#627080' },
    divider: '#e1e6eb',
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Public Sans Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 750, lineHeight: 1.2, letterSpacing: 0 },
    h2: { fontSize: '1.5rem', fontWeight: 750, lineHeight: 1.25, letterSpacing: 0 },
    h3: { fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.35, letterSpacing: 0 },
    h4: { fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.4, letterSpacing: 0 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6, letterSpacing: 0 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.55, letterSpacing: 0 },
    button: { fontWeight: 650, textTransform: 'none', letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { minWidth: 320, backgroundColor: mode === 'dark' ? '#141a20' : '#f5f7f9' },
        body: { margin: 0, minWidth: 320, backgroundColor: mode === 'dark' ? '#141a20' : '#f5f7f9' },
        '*, *::before, *::after': { boxSizing: 'border-box' },
      },
    },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderRadius: 8, borderColor: mode === 'dark' ? '#35414c' : '#e1e6eb' } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 38, borderRadius: 6 } } },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 6 } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 6 } } },
    MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' }, styleOverrides: { root: { backgroundImage: 'none', borderBottom: 1, borderColor: 'divider' } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
    MuiTableCell: { styleOverrides: { root: { borderColor: 'divider' } } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});

// minimalTheme 是默认浅色主题，供静态导入和测试使用。
export const minimalTheme = createMinimalTheme('light');

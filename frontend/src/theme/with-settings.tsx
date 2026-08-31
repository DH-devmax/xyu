import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { createMinimalTheme } from './core';
import { CssBaseline, ThemeProvider } from '@mui/material';
import type { PaletteMode, Theme } from '@mui/material/styles';

// MinimalNavLayout 定义 Minimal 垂直导航支持的桌面布局模式。
export type MinimalNavLayout = 'vertical' | 'mini';

// MinimalSettingsState 保存只写入浏览器本地的视觉偏好，不承载业务数据。
export interface MinimalSettingsState {
  // colorMode 是浅色或深色主题模式。
  colorMode: PaletteMode;
  // navLayout 是完整垂直导航或图标迷你导航。
  navLayout: MinimalNavLayout;
  // comfortable 控制业务表格和卡片的默认密度。
  comfortable: boolean;
}

// MinimalSettingsContextValue 描述设置 Provider 对布局组件公开的状态和操作。
export interface MinimalSettingsContextValue {
  // state 是当前本地视觉偏好快照。
  state: MinimalSettingsState;
  // setField 更新一个偏好并持久化到浏览器。
  setField: <K extends keyof MinimalSettingsState>(field: K, value: MinimalSettingsState[K]) => void;
  // reset 恢复产品默认视觉偏好。
  reset: () => void;
  // openSettings 打开设置抽屉。
  openSettings: () => void;
}

// storageKey 是 Minimal 设置的版本化浏览器存储键。
const storageKey = 'dh-xianyu-agentpanel.minimal.settings.v1';
// defaultSettings 是舒适密度和纵向导航的产品默认值。
const defaultSettings: MinimalSettingsState = { colorMode: 'light', navLayout: 'vertical', comfortable: true };

// readSettings 从本地存储读取合法偏好，损坏值会回退到默认配置。
const readSettings = (): MinimalSettingsState => {
  try {
    // raw 是浏览器存储中的未解析设置文本。
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultSettings;
    // parsed 是经过 JSON 解析的候选设置对象。
    const parsed = JSON.parse(raw) as Partial<MinimalSettingsState>;
    return {
      colorMode: parsed.colorMode === 'dark' ? 'dark' : 'light',
      navLayout: parsed.navLayout === 'mini' ? 'mini' : 'vertical',
      comfortable: parsed.comfortable !== false,
    };
  } catch {
    return defaultSettings;
  }
};

// writeSettings 持久化视觉偏好；浏览器禁用存储时保留内存状态。
const writeSettings = (settings: MinimalSettingsState): void => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // 隐私模式下无法写入时不影响当前会话的视觉状态。
  }
};

// SettingsContext 是应用内共享的本地视觉设置上下文。
const SettingsContext = createContext<MinimalSettingsContextValue | undefined>(undefined);

// MinimalSettingsProvider 管理 Minimal 导航、色彩和密度偏好。
export const MinimalSettingsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // state 保存当前视觉偏好。
  const [state, setState] = useState<MinimalSettingsState>(readSettings);
  // settingsOpen 保存设置抽屉开关。
  const [settingsOpen, setSettingsOpen] = useState(false);
  // setField 更新单个偏好并同步本地存储。
  const setField = <K extends keyof MinimalSettingsState>(field: K, value: MinimalSettingsState[K]): void => {
    setState(/* settingsUpdater 基于旧偏好生成下一份可持久化快照。 */ previous => {
      // next 是包含本次字段变更的完整偏好。
      const next = { ...previous, [field]: value };
      writeSettings(next);
      return next;
    });
  };
  // reset 恢复产品默认视觉偏好。
  const reset = (): void => {
    setState(defaultSettings);
    writeSettings(defaultSettings);
  };
  // value 是传给上下文消费者的稳定设置接口。
  const value = useMemo<MinimalSettingsContextValue>(/* settingsValueMemo 只在偏好变化时重建上下文值。 */ () => ({ state, setField, reset, openSettings: /* openSettingsAction 打开设置抽屉。 */ () => setSettingsOpen(true) }), [state]);
  return (
    <SettingsContext.Provider value={value}>
      <MinimalThemeBridge mode={state.colorMode}>
        {children}
        <SettingsDrawer open={settingsOpen} onClose={/* settingsCloseAction 关闭本地设置抽屉。 */ () => setSettingsOpen(false)} />
      </MinimalThemeBridge>
    </SettingsContext.Provider>
  );
};

// MinimalThemeBridgeProps 描述主题桥接器使用的颜色模式。
interface MinimalThemeBridgeProps extends React.PropsWithChildren {
  // mode 是当前浅色或深色主题模式。
  mode: PaletteMode;
}

// MinimalThemeBridge 把本地颜色偏好转换为稳定的 MUI 主题实例。
const MinimalThemeBridge: React.FC<MinimalThemeBridgeProps> = ({ mode, children }) => {
  // theme 是与当前颜色模式对应的 Minimal MUI 主题。
  const theme = useMemo<Theme>(/* themeMemo 根据颜色模式复用 MUI 主题。 */ () => createMinimalTheme(mode), [mode]);
  useEffect(/* colorSchemeEffect 同步文档色彩属性，使主题变量和浏览器控件保持一致。 */ () => {
    document.documentElement.dataset.colorScheme = mode;
  }, [mode]);
  return <ThemeProvider theme={theme}><CssBaseline enableColorScheme />{children}</ThemeProvider>;
};

// useMinimalSettings 读取 Minimal 设置上下文，缺少 Provider 时立即暴露装配错误。
export const useMinimalSettings = (): MinimalSettingsContextValue => {
  // context 是当前设置 Provider 提供的共享状态。
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useMinimalSettings 必须在 MinimalSettingsProvider 内使用');
  return context;
};

// SettingsDrawerProps 描述界面设置抽屉的受控开关。
interface SettingsDrawerProps {
  // open 表示抽屉是否显示。
  open: boolean;
  // onClose 关闭设置抽屉。
  onClose: () => void;
}

// SettingsDrawer 提供 Minimal 风格的本地布局设置，不触碰服务端配置。
export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
  // settingsState 保存抽屉中的当前偏好和更新动作。
  const { state, setField, reset } = useMinimalSettings();
  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 360 }, p: 2.5 } } }}>
      <Stack spacing={2.25} sx={{ height: '100%' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <SettingsOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="h3">界面设置</Typography>
          </Stack>
          <IconButton aria-label="关闭界面设置" onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
        </Stack>
        <Divider />
        <Stack spacing={1.5}>
          <Typography variant="caption" color="text.secondary">导航布局</Typography>
          <Stack direction="row" spacing={1}>
            <Button fullWidth size="small" variant={state.navLayout === 'vertical' ? 'contained' : 'outlined'} onClick={/* verticalLayoutAction 切换到完整纵向导航。 */ () => setField('navLayout', 'vertical')}>纵向</Button>
            <Button fullWidth size="small" variant={state.navLayout === 'mini' ? 'contained' : 'outlined'} onClick={/* miniLayoutAction 切换到迷你导航。 */ () => setField('navLayout', 'mini')}>迷你</Button>
          </Stack>
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box><Typography variant="body2" sx={{ fontWeight: 650 }}>深色模式</Typography><Typography variant="caption" color="text.secondary">仅保存在当前浏览器</Typography></Box>
          <Switch checked={state.colorMode === 'dark'} onChange={/* colorModeChange 更新本地颜色模式。 */ event => setField('colorMode', event.target.checked ? 'dark' : 'light')} slotProps={{ input: { 'aria-label': '深色模式' } }} />
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box><Typography variant="body2" sx={{ fontWeight: 650 }}>舒适密度</Typography><Typography variant="caption" color="text.secondary">表格与卡片留出更多呼吸空间</Typography></Box>
          <Switch checked={state.comfortable} onChange={/* densityChange 更新表格和卡片密度偏好。 */ event => setField('comfortable', event.target.checked)} slotProps={{ input: { 'aria-label': '舒适密度' } }} />
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Button variant="text" onClick={reset}>恢复默认设置</Button>
      </Stack>
    </Drawer>
  );
};

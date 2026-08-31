import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { AlignRight, Columns3, Contrast, Expand, Maximize2, Moon, PanelLeft, PanelTop, RotateCcw, Rows3, Settings2, Type, X } from 'lucide-react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { createMinimalTheme, type MinimalThemeOptions } from './core';

/** MinimalSettingsState 保存 Minimal 7.7.0 的完整本地视觉偏好。 */
export interface MinimalSettingsState {
  /** mode 是浅色或深色主题模式。 */
  mode: 'light' | 'dark';
  /** contrast 是默认或高对比度。 */
  contrast: 'default' | 'high';
  /** direction 是文档阅读方向。 */
  direction: 'ltr' | 'rtl';
  /** compactLayout 控制业务区域是否使用紧凑间距。 */
  compactLayout: boolean;
  /** navLayout 是纵向、横向或迷你导航。 */
  navLayout: 'vertical' | 'horizontal' | 'mini';
  /** navColor 是导航融入页面或使用独立表面。 */
  navColor: 'integrate' | 'apparent';
  /** primaryColor 是 Minimal 颜色预设。 */
  primaryColor: MinimalThemeOptions['primaryColor'];
  /** fontFamily 是 Minimal 设置抽屉中的字体选项。 */
  fontFamily: 'Public Sans Variable' | 'Inter Variable' | 'DM Sans Variable' | 'Nunito Sans Variable';
  /** fontSize 是页面基础字号。 */
  fontSize: number;
}

/** MinimalSettingsContextValue 描述设置 Provider 对布局组件公开的状态和操作。 */
export interface MinimalSettingsContextValue {
  /** state 是当前本地视觉偏好快照。 */
  state: MinimalSettingsState;
  /** setField 更新一个偏好并持久化到浏览器。 */
  setField: <K extends keyof MinimalSettingsState>(field: K, value: MinimalSettingsState[K]) => void;
  /** reset 恢复产品默认视觉偏好。 */
  reset: () => void;
  /** openSettings 打开设置抽屉。 */
  openSettings: () => void;
}

const storageKey = 'dh-xianyu-agentpanel.minimal.settings.v2';

/** defaultSettings 是与 Minimal 截图一致的浅色、垂直、融合导航默认值。 */
export const defaultSettings: MinimalSettingsState = {
  mode: 'light',
  contrast: 'default',
  direction: 'ltr',
  compactLayout: false,
  navLayout: 'vertical',
  navColor: 'integrate',
  primaryColor: 'default',
  fontFamily: 'Public Sans Variable',
  fontSize: 16,
};

// isFontFamily 校验设置抽屉写入的字体族是否受支持。
const isFontFamily = (value: unknown): value is MinimalSettingsState['fontFamily'] => ['Public Sans Variable', 'Inter Variable', 'DM Sans Variable', 'Nunito Sans Variable'].includes(String(value));
// isPrimaryColor 校验颜色预设名称，非法值回退到默认绿色。
const isPrimaryColor = (value: unknown): value is NonNullable<MinimalSettingsState['primaryColor']> => ['default', 'cyan', 'purple', 'blue', 'orange', 'red'].includes(String(value));

/** readSettings 从本地存储读取合法偏好并兼容上一版本字段。 */
const readSettings = (): MinimalSettingsState => {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    // raw 是浏览器存储的原始 JSON 文本。
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultSettings;
    // parsed 是兼容旧字段后的设置对象。
    const parsed = JSON.parse(raw) as Partial<MinimalSettingsState> & { /** 旧主题模式字段。 */ colorMode?: string; /** 旧舒适密度字段。 */ comfortable?: boolean };
    return {
      mode: parsed.mode === 'dark' || parsed.colorMode === 'dark' ? 'dark' : 'light',
      contrast: parsed.contrast === 'high' ? 'high' : 'default',
      direction: parsed.direction === 'rtl' ? 'rtl' : 'ltr',
      compactLayout: parsed.compactLayout === true || parsed.comfortable === false,
      navLayout: parsed.navLayout === 'mini' || parsed.navLayout === 'horizontal' ? parsed.navLayout : 'vertical',
      navColor: parsed.navColor === 'apparent' ? 'apparent' : 'integrate',
      primaryColor: isPrimaryColor(parsed.primaryColor) ? parsed.primaryColor : 'default',
      fontFamily: isFontFamily(parsed.fontFamily) ? parsed.fontFamily : 'Public Sans Variable',
      fontSize: typeof parsed.fontSize === 'number' && parsed.fontSize >= 12 && parsed.fontSize <= 20 ? parsed.fontSize : 16,
    };
  } catch {
    return defaultSettings;
  }
};

/** writeSettings 持久化视觉偏好；浏览器禁用存储时保留内存状态。 */
const writeSettings = (settings: MinimalSettingsState): void => {
  try { window.localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* 隐私模式下不影响当前会话。 */ }
};

// SettingsContext 保存设置抽屉和主题桥接之间的最小通信面。
const SettingsContext = createContext<MinimalSettingsContextValue | undefined>(undefined);

// hexToRgb 将主题色转换为 CSS rgb 三元组，供业务图表和状态标记复用。
const hexToRgb = (hex: string): string => {
  // normalized 是去除井号后的十六进制文本。
  const normalized = hex.replace('#', '');
  // expanded 将三位简写颜色展开为完整六位颜色。
  const expanded = normalized.length === 3 ? normalized.split('').map(/* 展开三位十六进制色值。 */ part => `${part}${part}`).join('') : normalized;
  // numeric 是便于按通道提取的整数颜色值。
  const numeric = Number.parseInt(expanded, 16);
  return `${(numeric >> 16) & 255} ${(numeric >> 8) & 255} ${numeric & 255}`;
};

/** MinimalSettingsProvider 管理 Minimal 导航、色彩、方向、字体和密度偏好。 */
export const MinimalSettingsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // state 是当前浏览器会话的视觉偏好。
  const [state, setState] = useState<MinimalSettingsState>(readSettings);
  // settingsOpen 控制右侧 Minimal 设置抽屉的可见性。
  const [settingsOpen, setSettingsOpen] = useState(false);
  // setField 更新单个偏好，并写入本地存储。
  const setField = <K extends keyof MinimalSettingsState>(field: K, value: MinimalSettingsState[K]): void => {
    setState(/* 合并用户选择的视觉字段。 */ previous => {
      // next 是待持久化的完整偏好快照。
      const next = { ...previous, [field]: value };
      writeSettings(next);
      return next;
    });
  };
  // reset 清除本地覆盖并恢复 Minimal 默认值。
  const reset = (): void => { setState(defaultSettings); writeSettings(defaultSettings); };
  // value 是提供给导航和设置抽屉的稳定上下文值。
  const value = useMemo<MinimalSettingsContextValue>(/* 只在偏好变化时刷新上下文。 */ () => ({ state, setField, reset, openSettings: /* 打开设置抽屉。 */ () => setSettingsOpen(true) }), [state]);
  return <SettingsContext.Provider value={value}><MinimalThemeBridge settings={state}>{children}<SettingsDrawer open={settingsOpen} onClose={/* 关闭设置抽屉。 */ () => setSettingsOpen(false)} /></MinimalThemeBridge></SettingsContext.Provider>;
};

interface MinimalThemeBridgeProps extends React.PropsWithChildren { /** settings 是需要转换为 MUI 主题的本地偏好。 */ settings: MinimalSettingsState; }

/** MinimalThemeBridge 把本地设置转换为 MUI 主题和文档方向。 */
const MinimalThemeBridge: React.FC<MinimalThemeBridgeProps> = ({ settings, children }) => {
  // theme 是当前偏好对应的 MUI 主题。
  const theme = useMemo<Theme>(/* 根据完整偏好生成主题。 */ () => createMinimalTheme(settings.mode, settings), [settings]);
  useEffect(/* 同步根节点方向和字号。 */ () => {
    document.documentElement.dataset.colorScheme = settings.mode;
    document.documentElement.dir = settings.direction;
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    document.documentElement.style.setProperty('--minimal-color-brand', hexToRgb(theme.palette.primary.main));
    document.documentElement.style.setProperty('--minimal-color-brand-500', hexToRgb(theme.palette.primary.main));
    document.documentElement.style.setProperty('--minimal-color-brand-600', hexToRgb(theme.palette.primary.main));
    document.documentElement.style.setProperty('--minimal-color-brand-highlight', hexToRgb(theme.palette.primary.dark));
    document.documentElement.style.setProperty('--minimal-color-brand-700', hexToRgb(theme.palette.primary.dark));
    document.documentElement.style.setProperty('--minimal-color-brand-400', hexToRgb(theme.palette.primary.light));
  }, [settings.direction, settings.fontSize, settings.mode, theme]);
  return <ThemeProvider theme={theme}><CssBaseline enableColorScheme />{children}</ThemeProvider>;
};

/** useMinimalSettings 读取 Minimal 设置上下文。 */
export const useMinimalSettings = (): MinimalSettingsContextValue => {
  // context 是当前 Provider 暴露的主题设置操作。
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useMinimalSettings 必须在 MinimalSettingsProvider 内使用');
  return context;
};

interface SettingsDrawerProps { /** open 表示设置抽屉是否打开。 */ open: boolean; /** onClose 关闭设置抽屉。 */ onClose: () => void; }

interface OptionCardProps { /** label 是选项标题。 */ label: string; /** selected 表示选项状态。 */ selected: boolean; /** icon 是 Minimal 图标。 */ icon: React.ReactNode; /** onClick 应用选项。 */ onClick: () => void; /** tooltip 是辅助提示。 */ tooltip?: string; }

/** OptionCard 渲染截图中的四格开关卡片。 */
const OptionCard: React.FC<OptionCardProps> = ({ label, selected, icon, onClick, tooltip }) => {
  // card 是包含图标、开关和标题的 Minimal 选项表面。
  const card = <ButtonBase onClick={onClick} sx={{ minHeight: 126, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'space-between', textAlign: 'left', border: 1, borderColor: selected ? 'primary.main' : 'divider', bgcolor: selected ? 'action.selected' : 'background.paper', borderRadius: 1, color: selected ? 'primary.main' : 'text.primary', '&:hover': { bgcolor: 'action.hover' } }}><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><Box sx={{ display: 'flex', color: selected ? 'primary.main' : 'text.secondary' }}>{icon}</Box><Switch checked={selected} tabIndex={-1} slotProps={{ input: { 'aria-label': label } }} /></Stack><Typography sx={{ fontWeight: 700 }}>{label}</Typography></ButtonBase>;
  return tooltip ? <Tooltip title={tooltip}>{card}</Tooltip> : card;
};

/** SelectCard 渲染 Minimal 设置中的图标/文本选择项。 */
interface SelectCardProps { /** label 是选择项标题。 */ label: string; /** selected 表示选择项状态。 */ selected: boolean; /** color 是预设色点颜色。 */ color?: string; /** icon 是布局图标。 */ icon?: React.ReactNode; /** onClick 应用选择项。 */ onClick: () => void; }
// SelectCard 渲染 Minimal 设置中的图标/文本选择项。
const SelectCard: React.FC<SelectCardProps> = ({ label, selected, color, icon, onClick }) => <ButtonBase onClick={onClick} sx={{ minHeight: 58, px: 1.5, py: 1, display: 'flex', gap: 1, justifyContent: 'center', border: 1, borderColor: selected ? 'primary.main' : 'divider', borderRadius: 1, bgcolor: selected ? 'action.selected' : 'transparent', color: selected ? 'primary.main' : 'text.secondary' }}><Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: color ?? 'currentColor', display: icon ? 'flex' : undefined, alignItems: 'center', justifyContent: 'center' }}>{icon}</Box><Typography variant="body2" sx={{ fontWeight: selected ? 700 : 550 }}>{label}</Typography></ButtonBase>;

/** SettingsDrawer 提供截图一致的完整 Minimal 主题设置，不触碰服务端配置。 */
export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
  // settingsActions 是当前抽屉可用的本地偏好操作。
  const { state, setField, reset } = useMinimalSettings();
  // fullscreen 保存抽屉是否扩展到宽屏尺寸。
  const [fullscreen, setFullscreen] = useState(false);
  // toggle 统一处理设置卡片对单字段的修改。
  const toggle = <K extends keyof MinimalSettingsState>(field: K, value: MinimalSettingsState[K]): void => setField(field, value);
  return <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ backdrop: { invisible: true }, paper: { sx: { width: { xs: '100%', sm: fullscreen ? 520 : 380 }, bgcolor: 'background.default' } } }}>
    <Stack sx={{ height: '100%' }}>
      <Stack direction="row" sx={{ px: 2.5, py: 2, alignItems: 'center', gap: 0.5 }}><Typography variant="h2" sx={{ flex: 1 }}>设置</Typography><Tooltip title="全屏"><IconButton aria-label="全屏设置" onClick={/* 切换设置抽屉宽度。 */ () => setFullscreen(/* 取反当前宽屏状态。 */ previous => !previous)}><Maximize2 size={19} /></IconButton></Tooltip><Tooltip title="重置"><IconButton aria-label="重置设置" onClick={reset}><RotateCcw size={19} /></IconButton></Tooltip><Tooltip title="关闭"><IconButton aria-label="关闭设置" onClick={onClose}><X size={20} /></IconButton></Tooltip></Stack>
      <Divider />
      <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
            <OptionCard label="模式" selected={state.mode === 'dark'} icon={<Moon size={25} />} onClick={/* 切换深浅模式。 */ () => toggle('mode', state.mode === 'dark' ? 'light' : 'dark')} />
            <OptionCard label="对比度" selected={state.contrast === 'high'} icon={<Contrast size={25} />} onClick={/* 切换对比度预设。 */ () => toggle('contrast', state.contrast === 'high' ? 'default' : 'high')} />
            <OptionCard label="从右到左" selected={state.direction === 'rtl'} icon={<AlignRight size={25} />} onClick={/* 切换阅读方向。 */ () => toggle('direction', state.direction === 'rtl' ? 'ltr' : 'rtl')} />
            <OptionCard label="紧凑" selected={state.compactLayout} icon={<Rows3 size={25} />} onClick={/* 切换紧凑布局。 */ () => toggle('compactLayout', !state.compactLayout)} />
          </Box>
          <SettingBlock title="导航" icon={<PanelLeft size={18} />}>
            <Typography variant="caption" color="text.secondary">布局</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}><SelectCard label="纵向" selected={state.navLayout === 'vertical'} icon={<PanelLeft size={17} />} onClick={/* 选择纵向导航。 */ () => toggle('navLayout', 'vertical')} /><SelectCard label="横向" selected={state.navLayout === 'horizontal'} icon={<PanelTop size={17} />} onClick={/* 选择横向导航。 */ () => toggle('navLayout', 'horizontal')} /><SelectCard label="迷你" selected={state.navLayout === 'mini'} icon={<Columns3 size={17} />} onClick={/* 选择迷你导航。 */ () => toggle('navLayout', 'mini')} /></Box>
            <Typography variant="caption" color="text.secondary">颜色</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}><SelectCard label="融合" selected={state.navColor === 'integrate'} icon={<PanelLeft size={15} />} onClick={/* 选择融合导航表面。 */ () => toggle('navColor', 'integrate')} /><SelectCard label="独立" selected={state.navColor === 'apparent'} icon={<PanelLeft size={15} />} onClick={/* 选择独立导航表面。 */ () => toggle('navColor', 'apparent')} /></Box>
          </SettingBlock>
          <SettingBlock title="预设" icon={<Settings2 size={18} />}><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}><SelectCard label="默认" color="#21a675" selected={state.primaryColor === 'default'} onClick={/* 选择默认绿色预设。 */ () => toggle('primaryColor', 'default')} /><SelectCard label="青色" color="#078dee" selected={state.primaryColor === 'cyan'} onClick={/* 选择青色预设。 */ () => toggle('primaryColor', 'cyan')} /><SelectCard label="紫色" color="#8e33ff" selected={state.primaryColor === 'purple'} onClick={/* 选择紫色预设。 */ () => toggle('primaryColor', 'purple')} /><SelectCard label="蓝色" color="#1d78e8" selected={state.primaryColor === 'blue'} onClick={/* 选择蓝色预设。 */ () => toggle('primaryColor', 'blue')} /><SelectCard label="橙色" color="#fda92d" selected={state.primaryColor === 'orange'} onClick={/* 选择橙色预设。 */ () => toggle('primaryColor', 'orange')} /><SelectCard label="红色" color="#ff3030" selected={state.primaryColor === 'red'} onClick={/* 选择红色预设。 */ () => toggle('primaryColor', 'red')} /></Box></SettingBlock>
          <SettingBlock title="字体" icon={<Type size={18} />}><Typography variant="caption" color="text.secondary">字体系列</Typography><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>{(['Public Sans Variable', 'Inter Variable', 'DM Sans Variable', 'Nunito Sans Variable'] as const).map(/* 渲染字体族选择项。 */ font => <SelectCard key={font} label={font.replace(' Variable', '')} selected={state.fontFamily === font} onClick={/* 应用字体族偏好。 */ () => toggle('fontFamily', font)} />)}</Box><Typography variant="caption" color="text.secondary">字体大小</Typography><Slider aria-label="字体大小" value={state.fontSize} min={12} max={20} step={1} valueLabelDisplay="auto" onChange={/* 应用基础字号。 */ (_event, value) => toggle('fontSize', Array.isArray(value) ? value[0] : value)} /></SettingBlock>
        </Stack>
      </Box>
      <Box sx={{ p: 2.5, borderTop: 1, borderColor: 'divider' }}><Button fullWidth variant="outlined" startIcon={<Expand size={17} />} onClick={/* 请求浏览器进入全屏。 */ () => document.documentElement.requestFullscreen?.()}>进入全屏</Button></Box>
    </Stack>
  </Drawer>;
};

interface SettingBlockProps {
  /** title 是设置分组标题。 */
  title: string;
  /** icon 是设置分组图标。 */
  icon: React.ReactNode;
}

/** SettingBlock 提供 Minimal 设置分组的卡片边界和标题样式。 */
const SettingBlock: React.FC<React.PropsWithChildren<SettingBlockProps>> = ({ title, icon, children }) => <Stack spacing={1.5} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box><Typography variant="h3">{title}</Typography></Stack>{children}</Stack>;

export default MinimalSettingsProvider;

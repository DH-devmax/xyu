import MuiBox from '@mui/material/Box';
import {
Check,
ChevronDown,
Database,
Eye,EyeOff,
LockKeyhole,
RefreshCw,
Save,
ShieldCheck,
Sparkles,
UserRound
} from 'lucide-react';
import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { DEFAULT_AI_API_URL,LOG_LEVELS } from '../constants';
import { useSettings } from '../hooks';
import { MinimalPageFrame, MinimalSectionCard } from '@/components/minimal';

// Settings 展示系统配置、AI 模型和登录凭据编辑页面。
const Settings: React.FC = () => {
  // featureState 是 Settings Hook 提供的状态与动作集合。
  const {
    settings, loading, loadError, saving, saveError, aiModels, modelsLoading, modelError, modelDropdownOpen,
    showApiKey, showCaptchaSecret, showCurrentPassword, showNewPassword, credentialsSaving, credentialsMessage,
    credentials, modelPickerRef, loadSettings, loadAIModels, handleSave, handleCredentialsSave,
    setSettings, setModelDropdownOpen, setShowApiKey, setShowCaptchaSecret, setShowCurrentPassword,
    setShowNewPassword, setCredentials,
  } = useSettings();
  // activeSection 保存设置页面当前的 Minimal 分区导航状态。
  const [activeSection, setActiveSection] = React.useState<'system' | 'ai' | 'security'>('system');

  // handleSectionChange 切换 Tabs 并将焦点内容滚动到对应设置区块。
  const handleSectionChange = (_event: React.SyntheticEvent, nextValue: string) => {
    // section 是 Tabs 传入的稳定设置分区标识。
    const section = nextValue as 'system' | 'ai' | 'security';
    setActiveSection(section);
    document.getElementById(`settings-section-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!settings) {
    return (
      <Stack spacing={2} sx={{ minHeight: 320, color: 'text.secondary', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? <CircularProgress size={28} /> : <Typography color="text.secondary">{loadError || '暂无配置'}</Typography>}
        {!loading && loadError && (
          <Button type="button" variant="contained" onClick={loadSettings}>重新加载</Button>
        )}
      </Stack>
    );
  }

  // currentModel 是当前配置中的模型名称。
  const currentModel = settings.ai_model || '';
  // visibleAIModels 是模型下拉框当前展示的候选列表。
  const visibleAIModels = aiModels;

  return (
    <MinimalPageFrame
      title="系统设置"
      description="配置全局自动化规则与系统参数"
      actions={<Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={loadSettings}>刷新</Button>}
      sx={{ pb: 12 }}
    >

      <Tabs
        data-layout-contract="minimal-settings-tabs"
        value={activeSection}
        onChange={handleSectionChange}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="系统设置分区"
        sx={{ mb: { xs: 2, md: 3 }, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="system" label="基础系统" />
        <Tab value="ai" label="AI 兼容" />
        <Tab value="security" label="安全与凭据" />
      </Tabs>

      {saveError && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void handleSave}>重试保存</Button>}>
          {saveError}
        </Alert>
      )}

      <Box data-layout-contract="minimal-settings-sections" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: { xs: 3, md: 4 } }}>
        {/* Left Column */}
        <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(2rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(2rem*var(--minimal-space-y-reverse))',
  },
}}>
          {/* Basic Settings */}
          <MuiBox component='section' id="settings-section-system" sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
            <MuiBox component='h3' sx={{
  'fontSize': '1.125rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
}}>
                <MuiBox component='div' sx={{
  'padding': '.375rem',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}}>
                    <MuiBox component={Database} sx={{ 'width': '1rem', 'height': '1rem' }} />
                </MuiBox>
                基础设置
            </MuiBox>

            <MinimalSectionCard data-layout-contract="minimal-settings-basic" contentSx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
              <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:640px)': { 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))' },
  'gap': '1rem',
}}>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>日志输出等级</MuiBox>
                  <MuiBox component='select'
                    value={settings.log_level || 'info'}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setSettings({ ...settings, log_level: event.target.value })}
                    sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}}
                  >
                    {LOG_LEVELS.map(/* 当前回调处理集合中的单个元素。 */ level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </MuiBox>
                  <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>等级越低输出越详细，Debug 适合排查问题</MuiBox>
                </MuiBox>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>日志输出格式</MuiBox>
                  <MuiBox component='select'
                    value={settings.log_format || 'text'}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setSettings({ ...settings, log_format: event.target.value })}
                    sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}}
                  >
                    <option value="text">Text</option>
                    <option value="json">JSON</option>
                  </MuiBox>
                  <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>JSON 适合接入集中式日志系统，保存后需重启服务生效</MuiBox>
                </MuiBox>
              </MuiBox>

              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>续期日志保留天数</MuiBox>
                <MuiBox component='input'
                  type="number"
                  value={settings.renewal_log_retention_days ?? 10}
                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setSettings({ ...settings, renewal_log_retention_days: parseInt(e.target.value) || 0 })}
                  sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}}
                  min="0"
                  max="365"
                />
                <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>0 表示不自动清理续期日志</MuiBox>
              </MuiBox>

              <MuiBox component='label' sx={{
  'display': 'flex',
  'alignItems': 'flex-start',
  'gap': '.75rem',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-warning-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-warning-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'cursor': 'pointer',
}}>
                <MuiBox component='input' type="checkbox" sx={{ 'marginTop': '.25rem' }} checked={settings.outbound_http_public_only || false} onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setSettings({ ...settings, outbound_http_public_only: event.target.checked })} />
                <span>
                  <MuiBox component='span' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-900)/var(--minimal-text-opacity,1))',
}}>限制用户配置的 HTTP 出站请求只能访问公网</MuiBox>
                  <MuiBox component='span' sx={{
  'marginTop': '.25rem',
  'display': 'block',
  'fontSize': '.75rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-800)/var(--minimal-text-opacity,1))',
}}>开启后会同时约束 API 发货、AI、HTTP 通知、远程图片和远程滑块服务；保存后立即生效，可能使内网服务不可用。</MuiBox>
                </span>
              </MuiBox>
            </MinimalSectionCard>
          </MuiBox>

          {/* Legacy AI Configuration */}
          <MuiBox component='section' id="settings-section-ai" sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
            <MuiBox component='h3' sx={{
  'fontSize': '1.125rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
}}>
                <MuiBox component='div' sx={{
  'padding': '.375rem',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
}}>
                    <MuiBox component={Sparkles} sx={{ 'width': '1rem', 'height': '1rem' }} />
                </MuiBox>
                旧版 AI 设置（迁移兼容）
            </MuiBox>

            <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>v2 的客服请求统一由智能中枢中的 Harness runtime 处理；这里仅保留旧字段，供升级迁移和回滚核对。</MuiBox>

            <MinimalSectionCard data-layout-contract="minimal-settings-ai-legacy" contentSx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>旧版 API 地址</MuiBox>
                <MuiBox component='input'
                  type="text"
                  value={settings.ai_api_url || DEFAULT_AI_API_URL}
                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setSettings({...settings, ai_api_url: e.target.value})}
                  sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                  placeholder="https://provider.example/v1"
                />
                <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>无需补全 /chat/completions</MuiBox>
              </MuiBox>

              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>旧版 API Key</MuiBox>
                <MuiBox component='div' sx={{ 'position': 'relative' }}>
                  <MuiBox component='input'
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.ai_api_key || ''}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setSettings({...settings, ai_api_key: e.target.value})}
                    sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '3rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                    placeholder={settings.ai_api_key_configured ? '已配置，如需替换请输入新密钥' : 'sk-...'}
                  />
                  <MuiBox component='button'
                    type="button"
                    onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowApiKey(!showApiKey)}
                    sx={{
  'position': 'absolute',
  'right': '.75rem',
  'top': '50%',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                  >
                    {showApiKey ? <MuiBox component={EyeOff} sx={{ 'width': '1rem', 'height': '1rem' }} /> : <MuiBox component={Eye} sx={{ 'width': '1rem', 'height': '1rem' }} />}
                  </MuiBox>
                </MuiBox>
              </MuiBox>

              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>旧版模型</MuiBox>
                <MuiBox component='div' ref={modelPickerRef} sx={{
  'position': 'relative',
  'display': 'flex',
  'flexDirection': 'column',
  '@media (min-width:640px)': { 'flexDirection': 'row' },
  'gap': '.5rem',
}}>
                  <MuiBox component='div' sx={{ 'position': 'relative', 'flex': '1 1 0%' }}>
                    <MuiBox component='input'
                      value={currentModel}
                      onFocus={/* 当前回调处理用户交互或异步状态变化。 */ () => aiModels.length > 0 && setModelDropdownOpen(true)}
                      onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => {
                        setSettings({...settings, ai_model: e.target.value});
                        if (aiModels.length > 0) setModelDropdownOpen(true);
                      }}
                      onKeyDown={/* 当前回调处理用户交互或异步状态变化。 */ e => {
                        if (e.key === 'Escape') setModelDropdownOpen(false);
                        if (e.key === 'ArrowDown' && aiModels.length > 0) setModelDropdownOpen(true);
                      }}
                      sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '2.5rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}}
                      placeholder="从接口读取或手动输入模型名"
                    />
                    <MuiBox component='button'
                      type="button"
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => aiModels.length > 0 && setModelDropdownOpen(/* 当前回调处理用户交互或异步状态变化。 */ open => !open)}
                      disabled={aiModels.length === 0}
                      sx={{
  'position': 'absolute',
  'right': '.5rem',
  'top': '50%',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  },
  '&:disabled': { 'opacity': '.3' },
}}
                      aria-label="展开模型列表"
                    >
                      <MuiBox component={ChevronDown} sx={[{
  'width': '1rem',
  'height': '1rem',
  'transitionProperty': 'transform',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, modelDropdownOpen ? {
  '--minimal-rotate': '180deg',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
} : {}]} />
                    </MuiBox>
                    {modelDropdownOpen && (
                      <MuiBox component='div' sx={{
  'position': 'absolute',
  'left': '0',
  'right': '0',
  'top': 'calc(100% + 6px)',
  'zIndex': '40',
  'maxHeight': '16rem',
  'overflowY': 'auto',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '--minimal-shadow': 'var(--minimal-shadow-colored)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-xl)',
  '--minimal-shadow-color': 'rgb(var(--minimal-color-neutral-200)/0.7)',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
}}>
                        {visibleAIModels.length > 0 ? (
                          visibleAIModels.map(/* 当前回调处理集合中的单个元素。 */ model => (
                            <MuiBox component='button'
                              key={model}
                              type="button"
                              onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => {
                                setSettings({...settings, ai_model: model});
                                setModelDropdownOpen(false);
                              }}
                              sx={{
  'width': '100%',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'textAlign': 'left',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-brand)/var(--minimal-text-opacity,1))',
  },
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'gap': '.75rem',
}}
                            >
                              <MuiBox component='span' sx={{ 'overflow': 'hidden', 'textOverflow': 'ellipsis', 'whiteSpace': 'nowrap' }}>{model}</MuiBox>
                              {model === currentModel && <MuiBox component={Check} sx={{
  'width': '1rem',
  'height': '1rem',
  'flexShrink': '0',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand))',
}} />}
                            </MuiBox>
                          ))
                        ) : (
                          <MuiBox component='div' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>没有匹配的模型</MuiBox>
                        )}
                      </MuiBox>
                    )}
                  </MuiBox>
                  <MuiBox component='button'
                    type="button"
                    onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => loadAIModels(undefined, true)}
                    disabled={modelsLoading}
                    sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  '&:disabled': { 'opacity': '.6' },
  'fontWeight': '700',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
  'whiteSpace': 'nowrap',
}}
                  >
                    <MuiBox component={RefreshCw} sx={[{ 'width': '1rem', 'height': '1rem' }, modelsLoading ? { 'animation': 'spin 1s linear infinite' } : {}]} />
                    读取旧模型
                  </MuiBox>
                </MuiBox>
                {modelError ? (
                  <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-500)/var(--minimal-text-opacity,1))',
}}>{modelError}</MuiBox>
                ) : (
                  <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>
                    {aiModels.length > 0 ? `已从旧版地址读取到 ${aiModels.length} 个模型` : '旧版模型字段仅用于兼容迁移；新的模型配置请在智能中枢完成'}
                  </MuiBox>
                )}
              </MuiBox>

              <MuiBox component='div' sx={{
  'padding': '.75rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  'borderRadius': '8px',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
}}>
                <strong>v2 配置入口:</strong>
                <MuiBox component='ul' sx={{
  'listStyleType': 'disc',
  'listStylePosition': 'inside',
  'marginTop': '.25rem',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.125rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.125rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <li>打开管理员侧栏中的智能中枢</li>
                  <li>选择 Harness provider 并保存脱敏设置</li>
                </MuiBox>
              </MuiBox>
            </MinimalSectionCard>
          </MuiBox>
        </MuiBox>

        {/* Right Column */}
        <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(2rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(2rem*var(--minimal-space-y-reverse))',
  },
}}>
          <MuiBox component='section' id="settings-section-security" sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
            <MuiBox component='h3' sx={{
  'fontSize': '1.125rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
}}>
              <MuiBox component='div' sx={{
  'padding': '.375rem',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-warning-500)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
}}>
                <MuiBox component={ShieldCheck} sx={{ 'width': '1rem', 'height': '1rem' }} />
              </MuiBox>
              远程过滑块配置
            </MuiBox>

            <MinimalSectionCard data-layout-contract="minimal-settings-captcha" contentSx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>服务地址</MuiBox>
                <MuiBox component='input'
                  type="url"
                  value={settings['captcha.remote_service_url'] || ''}
                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setSettings({...settings, 'captcha.remote_service_url': event.target.value})}
                  sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                  placeholder="https://example.com/internal/captcha/solve"
                />
              </MuiBox>

              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>服务秘钥</MuiBox>
                <MuiBox component='div' sx={{ 'position': 'relative' }}>
                  <MuiBox component='input'
                    type={showCaptchaSecret ? 'text' : 'password'}
                    value={settings['captcha.remote_secret_key'] || ''}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setSettings({...settings, 'captcha.remote_secret_key': event.target.value})}
                    sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '3rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                    autoComplete="off"
                    placeholder={settings['captcha.remote_secret_key_configured'] ? '已配置，如需替换请输入新密钥' : '请输入服务秘钥'}
                  />
                  <MuiBox component='button'
                    type="button"
                    onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowCaptchaSecret(!showCaptchaSecret)}
                    sx={{
  'position': 'absolute',
  'right': '.75rem',
  'top': '50%',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  },
}}
                    title={showCaptchaSecret ? '隐藏秘钥' : '显示秘钥'}
                  >
                    {showCaptchaSecret ? <MuiBox component={EyeOff} sx={{ 'width': '1rem', 'height': '1rem' }} /> : <MuiBox component={Eye} sx={{ 'width': '1rem', 'height': '1rem' }} />}
                  </MuiBox>
                </MuiBox>
              </MuiBox>

              <MuiBox component='label' sx={{
  'display': 'flex',
  'alignItems': 'flex-start',
  'gap': '.75rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-warning-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'cursor': 'pointer',
}}>
                <MuiBox component='input'
                  type="checkbox"
                  checked={String(settings['captcha.remote_pass_cookies'] || '').toLowerCase() === 'true'}
                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setSettings({...settings, 'captcha.remote_pass_cookies': event.target.checked})}
                  sx={{
  'marginTop': '.125rem',
  'width': '1rem',
  'height': '1rem',
  'borderRadius': '6px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-border-opacity,1))',
}}
                />
                <span>
                  <MuiBox component='span' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-900)/var(--minimal-text-opacity,1))',
}}>允许向远程服务传递账号 Cookie</MuiBox>
                  <MuiBox component='span' sx={{
  'display': 'block',
  'marginTop': '.25rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-700)/var(--minimal-text-opacity,1))',
}}>默认关闭。仅在信任远程服务且需要由其自动重取过期验证链接时开启。</MuiBox>
                </span>
              </MuiBox>

              <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>
                配置地址和秘钥后优先调用远程服务；只有网络不可用或超时才回退本机引擎，远程明确返回失败时不会重复触发本机验证。
              </MuiBox>
            </MinimalSectionCard>
          </MuiBox>

          <MuiBox component='section' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
            <MuiBox component='h3' sx={{
  'fontSize': '1.125rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
}}>
              <MuiBox component='div' sx={{
  'padding': '.375rem',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
}}>
                <MuiBox component={LockKeyhole} sx={{ 'width': '1rem', 'height': '1rem' }} />
              </MuiBox>
              登录凭据
            </MuiBox>

            <MinimalSectionCard data-layout-contract="minimal-settings-credentials" contentSx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
            <MuiBox component='form' onSubmit={handleCredentialsSave} sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
}}>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>登录用户名</MuiBox>
                <MuiBox component='div' sx={{ 'position': 'relative' }}>
                  <MuiBox component={UserRound} sx={{
  'position': 'absolute',
  'left': '1rem',
  'top': '50%',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  'width': '1rem',
  'height': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}} />
                  <MuiBox component='input'
                    type="text"
                    value={credentials.new_username}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setCredentials({...credentials, new_username: event.target.value})}
                    sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '2.75rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                    autoComplete="username"
                  />
                </MuiBox>
              </MuiBox>

              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>当前密码</MuiBox>
                <MuiBox component='div' sx={{ 'position': 'relative' }}>
                  <MuiBox component='input'
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={credentials.current_password}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setCredentials({...credentials, current_password: event.target.value})}
                    sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '3rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                    placeholder="用于确认当前身份"
                    autoComplete="current-password"
                  />
                  <MuiBox component='button' type="button" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowCurrentPassword(!showCurrentPassword)} sx={{
  'position': 'absolute',
  'right': '.75rem',
  'top': '50%',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  },
}} title={showCurrentPassword ? '隐藏密码' : '显示密码'}>
                    {showCurrentPassword ? <MuiBox component={EyeOff} sx={{ 'width': '1rem', 'height': '1rem' }} /> : <MuiBox component={Eye} sx={{ 'width': '1rem', 'height': '1rem' }} />}
                  </MuiBox>
                </MuiBox>
              </MuiBox>

              <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:640px)': { 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))' },
  'gap': '1rem',
}}>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>新密码</MuiBox>
                  <MuiBox component='div' sx={{ 'position': 'relative' }}>
                    <MuiBox component='input'
                      type={showNewPassword ? 'text' : 'password'}
                      value={credentials.new_password}
                      onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setCredentials({...credentials, new_password: event.target.value})}
                      sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '2.75rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                      placeholder="不修改则留空"
                      autoComplete="new-password"
                    />
                    <MuiBox component='button' type="button" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowNewPassword(!showNewPassword)} sx={{
  'position': 'absolute',
  'right': '.5rem',
  'top': '50%',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  },
}} title={showNewPassword ? '隐藏密码' : '显示密码'}>
                      {showNewPassword ? <MuiBox component={EyeOff} sx={{ 'width': '1rem', 'height': '1rem' }} /> : <MuiBox component={Eye} sx={{ 'width': '1rem', 'height': '1rem' }} />}
                    </MuiBox>
                  </MuiBox>
                </MuiBox>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>确认新密码</MuiBox>
                  <MuiBox component='input'
                    type={showNewPassword ? 'text' : 'password'}
                    value={credentials.confirm_password}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setCredentials({...credentials, confirm_password: event.target.value})}
                    sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                    placeholder="再次输入新密码"
                    autoComplete="new-password"
                  />
                </MuiBox>
              </MuiBox>

              {credentialsMessage && (
                <MuiBox component='div' sx={[{
  'display': 'flex',
  'alignItems': 'flex-start',
  'gap': '.5rem',
  'borderRadius': '8px',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '500',
}, credentialsMessage.type === 'success' ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
}]}>
                  <MuiBox component={ShieldCheck} sx={{ 'width': '1rem', 'height': '1rem', 'marginTop': '.125rem', 'flexShrink': '0' }} />
                  <span>{credentialsMessage.text}</span>
                </MuiBox>
              )}

              <MuiBox component='button'
                type="submit"
                disabled={credentialsSaving || !credentials.new_username || !credentials.current_password}
                sx={{
  'width': '100%',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-black)/var(--minimal-bg-opacity,1))',
  },
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontWeight': '700',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:disabled': { 'opacity': '.4' },
}}
              >
                <MuiBox component={LockKeyhole} sx={{ 'width': '1rem', 'height': '1rem' }} />
                {credentialsSaving ? '正在更新...' : '更新登录凭据'}
              </MuiBox>
            </MuiBox>
            </MinimalSectionCard>
          </MuiBox>

          {/* SMTP 配置已移至「通知设置」页面 */}
        </MuiBox>
      </Box>

      {/* Save Button */}
      <Box sx={{ position: 'fixed', right: { xs: 16, sm: 40 }, bottom: { xs: 16, sm: 40 }, zIndex: 30 }}>
        <Button variant="contained" size="large" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={20} />}>
          {saving ? '保存中...' : '保存所有配置'}
        </Button>
      </Box>
    </MinimalPageFrame>
  );
};

export default Settings;

import { Bell,Check,Eye,EyeOff,Loader2 } from 'lucide-react';
import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { enableCustomSMTP } from '@/features/notifications/notificationEmailConfig';
import { MinimalDialogSurface } from '@/components/minimal';
import type { NotificationChannel,NotificationChannelType,NotificationEventType,SystemSettings } from '../api';
import { notificationChannelTypes } from '../state';
import type { NotificationForm } from '../types';
import { NotificationEventSelector } from './NotificationEventSelector';

// NotificationChannelModalProps 描述渠道编辑弹窗所需的状态和回调。
export interface NotificationChannelModalProps {
  // showModal 表示弹窗是否打开。
  showModal: boolean;
  // editing 表示当前编辑的渠道，新增时为空。
  editing: NotificationChannel | null;
  // form 是当前渠道表单值。
  form: NotificationForm;
  // setForm 更新渠道表单值。
  setForm: React.Dispatch<React.SetStateAction<NotificationForm>>;
  // smtp 是系统 SMTP 配置，用于填充独立 SMTP 初始值。
  smtp: SystemSettings;
  // showChannelSmtpPassword 表示是否显示独立 SMTP 密码。
  showChannelSmtpPassword: boolean;
  // setShowChannelSmtpPassword 切换独立 SMTP 密码显示状态。
  setShowChannelSmtpPassword: React.Dispatch<React.SetStateAction<boolean>>;
  // saving 表示渠道保存请求是否正在执行。
  saving: boolean;
  // onClose 关闭弹窗。
  onClose: () => void;
  // onSave 提交渠道表单。
  onSave: () => void | Promise<void>;
}

// NotificationChannelModal 渲染渠道字段、SMTP 覆盖项和事件绑定表单。
export const NotificationChannelModal: React.FC<NotificationChannelModalProps> = ({ showModal, editing, form, setForm, smtp, showChannelSmtpPassword, setShowChannelSmtpPassword, saving, onClose, onSave }) => {
  // meta 是当前渠道类型对应的字段和指南。
  const meta = notificationChannelTypes[form.type];
  // handleNameChange 更新渠道名称。
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => setForm(
    // nextFormUpdater 使用函数式更新名称字段。
    current => ({ ...current, name: event.target.value }),
  );
  // handleTypeChange 切换渠道类型并清空旧类型配置。
  const handleTypeChange = (event: React.MouseEvent<HTMLButtonElement>) => {
    // type 是按钮数据属性中的目标渠道类型。
    const type = event.currentTarget.dataset.type as NotificationChannelType | undefined;
    if (!type) return;
    setForm(
      // nextFormUpdater 使用函数式更新渠道类型。
      current => ({ ...current, type, config: {} }),
    );
  };
  // handleConfigFieldChange 更新普通或独立 SMTP 配置字段。
  const handleConfigFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // key 是输入框数据属性中的配置字段名。
    const key = event.currentTarget.dataset.field;
    if (!key) return;
    setForm(
      // nextFormUpdater 使用函数式更新配置字段。
      current => ({ ...current, config: { ...current.config, [key]: event.target.value } }),
    );
  };
  // handleToggleCustomSMTP 切换邮件渠道是否使用独立 SMTP。
  const handleToggleCustomSMTP = () => setForm(
    // nextFormUpdater 使用函数式更新 SMTP 来源模式。
    current => ({ ...current, config: current.config.use_custom_smtp === true ? { ...current.config, use_custom_smtp: false } : enableCustomSMTP(current.config, smtp) }),
  );
  // handleChannelTlsChange 切换独立 SMTP 的 STARTTLS 并保持模式互斥。
  const handleChannelTlsChange = (event: React.ChangeEvent<HTMLInputElement>) => setForm(
    // nextFormUpdater 使用函数式更新独立 SMTP 的 TLS/SSL 互斥字段。
    current => ({ ...current, config: { ...current.config, smtp_use_tls: event.target.checked, smtp_use_ssl: event.target.checked ? false : current.config.smtp_use_ssl } }),
  );
  // handleChannelSslChange 切换独立 SMTP 的 SSL 并保持模式互斥。
  const handleChannelSslChange = (event: React.ChangeEvent<HTMLInputElement>) => setForm(
    // nextFormUpdater 使用函数式更新独立 SMTP 的 SSL/TLS 互斥字段。
    current => ({ ...current, config: { ...current.config, smtp_use_ssl: event.target.checked, smtp_use_tls: event.target.checked ? false : current.config.smtp_use_tls } }),
  );
  // handleToggleEvent 使用函数式更新切换事件绑定。
  const handleToggleEvent = (event: NotificationEventType) => setForm(
    // nextFormUpdater 使用函数式更新事件绑定集合。
    current => ({ ...current, event_types: current.event_types.includes(event) ? current.event_types.filter(
      // item 是待保留的已有事件值。
      item => item !== event,
    ) : [...current.event_types, event] }),
  );
  // handleToggleEnabled 使用函数式更新切换渠道启用状态。
  const handleToggleEnabled = () => setForm(
    // nextFormUpdater 使用函数式更新启用状态。
    current => ({ ...current, enabled: !current.enabled }),
  );
  // handleToggleChannelPassword 切换独立 SMTP 密码明文显示。
  const handleToggleChannelPassword = () => setShowChannelSmtpPassword(
    // nextPasswordState 使用函数式更新密码显示状态。
    value => !value,
  );
  // renderGuideStep 渲染当前渠道指南中的单个步骤。
  const renderGuideStep = (step: string, index: number) => <li key={index}>{step}</li>;

  if (!showModal) return null;

  return (
    <MinimalDialogSurface open onClose={onClose} maxWidth="sm" aria-labelledby="notification-channel-title">
      <DialogTitle id="notification-channel-title" sx={{ pr: 7 }}>{editing ? '编辑通知渠道' : '新建通知渠道'}<IconButton onClick={onClose} aria-label="关闭" sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton></DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField label="渠道名称" value={form.name} onChange={handleNameChange} placeholder="例如：我的 Bark" />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>渠道类型</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
              {(Object.keys(notificationChannelTypes) as NotificationChannelType[]).map(
                // type 是当前渠道类型选择项。
                type => {
                  // channelMeta 是当前类型的展示元数据。
                  const channelMeta = notificationChannelTypes[type];
                  // TypeIcon 是当前类型的图标组件。
                  const TypeIcon = channelMeta.icon;
                  // selected 表示当前类型是否已选中。
                  const selected = form.type === type;
                  return <ButtonBase key={type} data-type={type} onClick={handleTypeChange} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1.5, border: 2, borderColor: selected ? 'primary.main' : 'divider', borderRadius: 1, color: selected ? 'primary.main' : 'text.secondary', bgcolor: selected ? 'action.selected' : 'background.paper', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}><TypeIcon size={20} /><Typography variant="caption" sx={{ fontWeight: 700 }}>{channelMeta.label}</Typography></ButtonBase>;
                },
              )}
            </Box>
          </Box>
          <Alert severity="warning" icon={<Bell size={18} />}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}> 如何获取 {meta.label} 配置？</Typography><Box component="ol" sx={{ m: 0, mt: 1, pl: 2.5, fontSize: 12 }}>{meta.guide.steps.map(renderGuideStep)}</Box>{meta.guide.urlFormat && <Typography variant="caption" sx={{ display: 'block', mt: 1, overflowWrap: 'anywhere', fontFamily: 'monospace' }}>格式示例：{meta.guide.urlFormat}</Typography>}{meta.guide.note && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{meta.guide.note}</Typography>}</Alert>
          <Stack spacing={1.5}>
            {meta.fields.map(
              // field 是当前渠道配置字段。
              field => <TextField key={field.key} label={field.label} required={field.required} type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'} value={String(form.config[field.key] || '')} onChange={handleConfigFieldChange} placeholder={field.placeholder} helperText={field.help} slotProps={{ htmlInput: { 'data-field': field.key } }} />,
            )}
          </Stack>
          {form.type === 'email' && (
            <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}><Box><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>SMTP 来源</Typography><Typography variant="caption" color="text.secondary">{form.config.use_custom_smtp === true ? '当前渠道使用一套完整、独立的发件配置。' : '当前渠道完整继承系统 SMTP，只单独设置收件邮箱。'}</Typography></Box><Switch checked={form.config.use_custom_smtp === true} onChange={handleToggleCustomSMTP} slotProps={{ input: { 'aria-label': '使用独立 SMTP' } }} /></Stack>
              {form.config.use_custom_smtp === true && (
                <Stack spacing={2} sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}><TextField label="SMTP 服务器" required data-field="smtp_server" value={String(form.config.smtp_server || '')} onChange={handleConfigFieldChange} placeholder="smtp.qq.com" slotProps={{ htmlInput: { 'data-field': 'smtp_server' } }} /><TextField label="SMTP 端口" required type="number" value={String(form.config.smtp_port || 587)} onChange={handleConfigFieldChange} placeholder="587" slotProps={{ htmlInput: { 'data-field': 'smtp_port' } }} /></Box>
                  <TextField label="登录邮箱" required type="email" value={String(form.config.smtp_user || '')} onChange={handleConfigFieldChange} placeholder="your-email@qq.com" slotProps={{ htmlInput: { 'data-field': 'smtp_user' } }} />
                  <TextField label="密码 / 授权码" required type={showChannelSmtpPassword ? 'text' : 'password'} value={String(form.config.smtp_password || '')} onChange={handleConfigFieldChange} placeholder="输入密码或授权码" slotProps={{ htmlInput: { 'data-field': 'smtp_password' }, input: { endAdornment: <InputAdornment position="end"><IconButton onClick={handleToggleChannelPassword} edge="end" aria-label={showChannelSmtpPassword ? '隐藏渠道 SMTP 密码' : '显示渠道 SMTP 密码'}>{showChannelSmtpPassword ? <EyeOff size={16} /> : <Eye size={16} />}</IconButton></InputAdornment> } }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}><TextField label="发件人显示名（可选）" value={String(form.config.smtp_from_name || '')} onChange={handleConfigFieldChange} placeholder="闲鱼自动回复系统" slotProps={{ htmlInput: { 'data-field': 'smtp_from_name' } }} /><TextField label="发件邮箱地址" required type="email" value={String(form.config.smtp_from_address || '')} onChange={handleConfigFieldChange} placeholder="your-email@qq.com" slotProps={{ htmlInput: { 'data-field': 'smtp_from_address' } }} /></Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }}><FormControlLabel control={<Checkbox checked={form.config.smtp_use_tls !== false} onChange={handleChannelTlsChange} />} label="STARTTLS（常用于 587）" /><FormControlLabel control={<Checkbox checked={form.config.smtp_use_ssl === true} onChange={handleChannelSslChange} />} label="SSL/TLS 直连（常用于 465）" /></Stack>
                </Stack>
              )}
            </Paper>
          )}
          <NotificationEventSelector selectedEvents={form.event_types} onToggleEvent={handleToggleEvent} />
          <FormControlLabel control={<Switch checked={form.enabled} onChange={handleToggleEnabled} />} label="启用此渠道" />
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>取消</Button><Button variant="contained" onClick={onSave} disabled={saving} startIcon={saving ? <Loader2 size={16} /> : <Check size={16} />}>{saving ? '保存中...' : '保存'}</Button></DialogActions>
    </MinimalDialogSurface>
  );
};

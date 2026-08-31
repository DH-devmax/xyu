import { Eye,EyeOff,Loader2,Mail,Save } from 'lucide-react';
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { SystemSettings } from '../api';
import { MinimalSectionCard } from '@/components/minimal';

// NotificationSmtpSettingsProps 描述系统 SMTP 配置面板所需的状态和事件。
export interface NotificationSmtpSettingsProps {
  // smtp 是当前系统 SMTP 配置。
  smtp: SystemSettings;
  // setSmtp 更新 SMTP 配置字段。
  setSmtp: React.Dispatch<React.SetStateAction<SystemSettings>>;
  // smtpSaving 表示 SMTP 保存请求是否正在执行。
  smtpSaving: boolean;
  // showPassword 表示是否显示 SMTP 密码明文。
  showPassword: boolean;
  // setShowPassword 切换 SMTP 密码明文显示。
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  // onSave 保存 SMTP 配置。
  onSave: () => void | Promise<void>;
  // visible 表示当前是否由通知 Tabs 展示该面板。
  visible?: boolean;
}

// NotificationSmtpSettings 渲染管理员可见的系统级 SMTP 设置。
export const NotificationSmtpSettings: React.FC<NotificationSmtpSettingsProps> = ({ smtp, setSmtp, smtpSaving, showPassword, setShowPassword, onSave, visible = true }) => {
  // handleTextChange 更新 SMTP 文本字段。
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // key 是文本输入框数据属性中的 SMTP 字段名。
    const key = event.currentTarget.dataset.field as 'smtp_server' | 'smtp_user' | 'smtp_from_name' | 'smtp_from_address' | undefined;
    if (!key) return;
    setSmtp(
      // nextSettingsUpdater 使用函数式更新避免覆盖并发输入。
      current => ({ ...current, [key]: event.target.value }),
    );
  };
  // handlePortChange 更新 SMTP 端口并在非法输入时回退默认端口。
  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSmtp(
      // nextSettingsUpdater 使用函数式更新端口字段。
      current => ({ ...current, smtp_port: parseInt(event.target.value, 10) || 587 }),
    );
  };
  // handleTlsChange 切换 STARTTLS 并保持 TLS 与 SSL 互斥。
  const handleTlsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSmtp(
      // nextSettingsUpdater 使用函数式更新 TLS/SSL 互斥字段。
      current => ({ ...current, smtp_use_tls: event.target.checked, smtp_use_ssl: event.target.checked ? false : current.smtp_use_ssl }),
    );
  };
  // handleSslChange 切换直连 SSL 并保持 TLS 与 SSL 互斥。
  const handleSslChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSmtp(
      // nextSettingsUpdater 使用函数式更新 SSL/TLS 互斥字段。
      current => ({ ...current, smtp_use_ssl: event.target.checked, smtp_use_tls: event.target.checked ? false : current.smtp_use_tls }),
    );
  };
  // handlePasswordChange 更新系统 SMTP 密码。
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSmtp(
      // nextSettingsUpdater 使用函数式更新密码字段。
      current => ({ ...current, smtp_password: event.target.value }),
    );
  };
  // handleTogglePassword 切换系统 SMTP 密码明文展示。
  const handleTogglePassword = () => setShowPassword(
    // nextPasswordState 使用函数式更新密码显示状态。
    value => !value,
  );

  return (
    <MinimalSectionCard
      data-layout-contract="minimal-notification-smtp"
      sx={{ display: visible ? undefined : 'none' }}
      title="SMTP 邮件配置"
      action={<Mail size={20} color="currentColor" />}
      contentSx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
    >
      <Typography variant="body2" color="text.secondary">系统级邮件发送服务，供邮件通知渠道复用</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        <TextField label="SMTP 服务器" data-field="smtp_server" value={typeof smtp.smtp_server === 'string' ? smtp.smtp_server : ''} onChange={handleTextChange} placeholder="smtp.qq.com" />
        <TextField label="SMTP 端口" type="number" value={typeof smtp.smtp_port === 'number' ? smtp.smtp_port : 587} onChange={handlePortChange} placeholder="587" />
      </Box>
      <TextField label="发件邮箱" type="email" data-field="smtp_user" value={typeof smtp.smtp_user === 'string' ? smtp.smtp_user : ''} onChange={handleTextChange} placeholder="your-email@qq.com" />
      <TextField label="邮箱密码 / 授权码" type={showPassword ? 'text' : 'password'} value={typeof smtp.smtp_password === 'string' ? smtp.smtp_password : ''} onChange={handlePasswordChange} placeholder={smtp.smtp_password_configured ? '已配置，如需替换请输入新密码' : '输入密码或授权码'} helperText="QQ 邮箱需使用授权码（QQ 邮箱设置 → 账号 → 开启 SMTP → 生成授权码）" slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={handleTogglePassword} edge="end" aria-label={showPassword ? '隐藏 SMTP 密码' : '显示 SMTP 密码'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</IconButton></InputAdornment> } }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        <TextField label="发件人显示名（可选）" data-field="smtp_from_name" value={typeof smtp.smtp_from_name === 'string' ? smtp.smtp_from_name : ''} onChange={handleTextChange} placeholder="闲鱼自动回复系统" />
        <TextField label="发件邮箱地址" type="email" data-field="smtp_from_address" value={typeof smtp.smtp_from_address === 'string' ? smtp.smtp_from_address : (typeof smtp.smtp_user === 'string' ? smtp.smtp_user : '')} onChange={handleTextChange} placeholder="your-email@qq.com" />
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <FormControlLabel control={<Checkbox checked={smtp.smtp_use_tls !== false} onChange={handleTlsChange} />} label="STARTTLS（常用于 587 端口）" />
        <FormControlLabel control={<Checkbox checked={smtp.smtp_use_ssl === true} onChange={handleSslChange} />} label="SSL/TLS 直连（常用于 465 端口）" />
      </Stack>
      <Button variant="contained" onClick={onSave} disabled={smtpSaving} startIcon={smtpSaving ? <Loader2 size={16} /> : <Save size={16} />}>{smtpSaving ? '保存中...' : '保存 SMTP 配置'}</Button>
    </MinimalSectionCard>
  );
};

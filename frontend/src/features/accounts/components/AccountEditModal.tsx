import { Bell,Check,Clock,Eye,EyeOff,Key,X } from 'lucide-react';
import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MinimalDialogSurface } from '@/components/minimal';
import type { NotificationChannel } from '../api';
import type { AccountEditForm,AccountEditModalProps } from '../types';
import { SquareQRCode } from './SquareQRCode';

// AccountEditModal 负责账号备注、暂停、登录信息和通知绑定的编辑界面。
export const AccountEditModal: React.FC<AccountEditModalProps> = ({
  account,
  editForm,
  setEditForm,
  saving,
  onClose,
  onSave,
  onRestartPause,
  longLogin,
  onToggleLongLogin,
  passwordLoginView,
  onPasswordLogin,
  onCancelPasswordLogin,
  notifChannels,
  selectedChannelIds,
  bindingsLoaded,
  bindingsLoading,
  bindingsLoadError,
  onRetryBindings,
  onToggleChannel,
  onSettingsDirty,
}) => {
  // updateField 用函数式更新避免连续输入事件读取旧表单快照。
  const updateField = <K extends keyof AccountEditForm>(field: K, value: AccountEditForm[K]) => {
    setEditForm(
      // current 是事件发生前的最新编辑表单。
      current => ({ ...current, [field]: value }),
    );
  };

  // handleClose 关闭编辑弹窗并取消未完成的异步操作。
  const handleClose = () => void onClose();
  // handleSave 提交编辑表单并让父级刷新账号数据。
  const handleSave = () => void onSave();
  // handleRemarkChange 更新账号备注字段。
  const handleRemarkChange = (event: React.ChangeEvent<HTMLInputElement>) => updateField('remark', event.target.value);
  // handleCookieChange 更新账号 Cookie 字段。
  const handleCookieChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => updateField('cookie', event.target.value);
  // handleAutoConfirmToggle 切换自动确认发货设置。
  const handleAutoConfirmToggle = () => updateField('auto_confirm', !editForm.auto_confirm);
  // handlePauseDurationChange 更新账号暂停时长。
  const handlePauseDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => updateField('pause_duration', parseInt(event.target.value, 10) || 0);
  // handleRestartPause 按当前时长立即重新暂停账号。
  const handleRestartPause = () => void onRestartPause();
  // handleLongLoginToggle 切换闲鱼官方长登录设置。
  const handleLongLoginToggle = () => void onToggleLongLogin();
  // handleUsernameChange 更新密码登录用户名。
  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => updateField('username', event.target.value);
  // handlePasswordChange 更新密码并清除待清空标记。
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => setEditForm(
    // current 是密码输入前的最新编辑表单。
    current => ({ ...current, login_password: event.target.value, clear_password: false }),
  );
  // handlePasswordVisibilityToggle 切换密码明文显示状态。
  const handlePasswordVisibilityToggle = () => updateField('showLoginPassword', !editForm.showLoginPassword);
  // handleClearPasswordChange 更新密码清空选项。
  const handleClearPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => setEditForm(
    // current 是勾选清空密码前的最新编辑表单。
    current => ({ ...current, clear_password: event.target.checked, login_password: event.target.checked ? '' : current.login_password }),
  );
  // handleShowBrowserToggle 切换密码登录时是否展示浏览器。
  const handleShowBrowserToggle = () => updateField('show_browser', !editForm.show_browser);
  // handleCancelPasswordLogin 取消正在执行的密码登录。
  const handleCancelPasswordLogin = () => void onCancelPasswordLogin();
  // handlePasswordLogin 启动密码登录刷新授权。
  const handlePasswordLogin = () => void onPasswordLogin();
  // handleRetryBindings 重新加载当前账号的通知绑定。
  const handleRetryBindings = () => void onRetryBindings();
  // handleChannelClick 切换通知渠道并标记绑定表单已修改。
  const handleChannelClick = (channelId: number) => {
    if (!bindingsLoaded) return;
    onToggleChannel(channelId);
    onSettingsDirty();
  };
  // renderNotificationChannel 渲染单个通知渠道选项。
  const renderNotificationChannel = (channel: NotificationChannel) => {
    // checked 表示当前通知渠道是否已被选中。
    const checked = selectedChannelIds.includes(Number(channel.id));
    return (
      <FormControlLabel
        key={channel.id}
        control={<Checkbox checked={checked} onChange={/* channelCheckboxChange 处理通知渠道复选框切换。 */ () => handleChannelClick(Number(channel.id))} disabled={!bindingsLoaded} />}
        label={<Box sx={{ minWidth: 0 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{channel.name}</Typography><Typography variant="caption" color="text.secondary">{channel.type}{channel.enabled ? '' : ' · 已停用'}</Typography></Box>}
        sx={{ m: 0, px: 1.5, py: 1, border: 1, borderColor: 'divider', borderRadius: 1, alignItems: 'center', '&:hover': { bgcolor: 'action.hover' } }}
      />
    );
  };

  return (
    <MinimalDialogSurface open onClose={handleClose} maxWidth="sm" aria-labelledby="account-edit-title">
      <DialogTitle id="account-edit-title" sx={{ pr: 7 }}><Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}><Box><Typography variant="h3">编辑账号</Typography><Typography variant="caption" color="text.secondary">{account.nickname || account.remark || account.id}</Typography></Box><IconButton onClick={handleClose} aria-label="关闭"><X size={20} /></IconButton></Stack></DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <TextField label="账号 ID" value={account.id} disabled />
          <TextField label="备注" value={editForm.remark} onChange={handleRemarkChange} placeholder="为账号添加备注" />
          <TextField label="Cookie" value={editForm.cookie} onChange={handleCookieChange} placeholder="更新账号 Cookie" multiline minRows={4} helperText={`当前 Cookie 长度: ${editForm.cookie.length} 字符`} slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: 12 } } }} />
          <FormControlLabel control={<Switch checked={editForm.auto_confirm} onChange={handleAutoConfirmToggle} />} label={<Box><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>自动确认发货</Typography><Typography variant="caption" color="text.secondary">自动将闲鱼订单标记为已发货</Typography></Box>} sx={{ m: 0, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, justifyContent: 'space-between', flexDirection: 'row-reverse' }} />

          <Box>
            <TextField fullWidth label="暂停处理时长（分钟）" type="number" value={editForm.pause_duration} onChange={handlePauseDurationChange} placeholder="0" slotProps={{ htmlInput: { min: 0, max: 1440 }, input: { startAdornment: <InputAdornment position="start"><Clock size={16} /></InputAdornment> } }} helperText="设置后会暂停处理该账号的订单，到时间后自动恢复" />
            {editForm.pause_duration > 0 && !account.paused && editForm.pause_duration === (account.pause_duration || 0) && (
              <Button sx={{ mt: 1.5 }} color="warning" variant="outlined" size="small" disabled={saving} onClick={handleRestartPause}>立即按当前时长重新暂停</Button>
            )}
          </Box>

          <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><Key size={20} />登录信息</Typography>
            <Stack spacing={2}>
              <FormControlLabel control={<Switch checked={longLogin.enabled} onChange={handleLongLoginToggle} disabled={longLogin.loading || longLogin.saving || !longLogin.canOpen} slotProps={{ input: { 'aria-label': '保存登录信息' } }} />} label={<Box><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>保存登录信息</Typography><Typography variant="caption" color="text.secondary">状态直接读取并修改闲鱼官方长登录设置</Typography>{longLogin.error && <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>{longLogin.error}</Typography>}</Box>} sx={{ m: 0, p: 1.5, justifyContent: 'space-between', border: 1, borderColor: 'divider', borderRadius: 1, flexDirection: 'row-reverse' }} />
              <TextField label="用户名" value={editForm.username} onChange={handleUsernameChange} placeholder="闲鱼账号/手机号" />
              <TextField label="登录密码" type={editForm.showLoginPassword ? 'text' : 'password'} value={editForm.login_password} onChange={handlePasswordChange} placeholder="用于自动登录" slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton onClick={handlePasswordVisibilityToggle} edge="end" aria-label={editForm.showLoginPassword ? '隐藏登录密码' : '显示登录密码'}>{editForm.showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}</IconButton></InputAdornment> } }} />
              <FormControlLabel control={<Checkbox checked={editForm.clear_password} onChange={handleClearPasswordChange} />} label="清空已保存密码" />
              <FormControlLabel control={<Switch checked={editForm.show_browser} onChange={handleShowBrowserToggle} />} label={<Box><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>登录时显示浏览器</Typography><Typography variant="caption" color="text.secondary">调试时可开启查看登录过程</Typography></Box>} sx={{ m: 0, justifyContent: 'space-between', flexDirection: 'row-reverse' }} />
              <Alert severity="info" action={(passwordLoginView.status === 'processing' || passwordLoginView.status === 'verification_required') ? <Button color="error" size="small" onClick={handleCancelPasswordLogin}>取消登录</Button> : <Button color="primary" size="small" onClick={handlePasswordLogin}>密码登录刷新授权</Button>}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>立即执行账号密码登录</Typography><Typography variant="caption" sx={{ display: 'block' }}>需要在上方重新输入本次登录密码；成功后后端会更新 Cookie 和保存的登录信息。</Typography>{passwordLoginView.message && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{passwordLoginView.message}</Typography>}{passwordLoginView.status === 'verification_required' && <Stack spacing={1} sx={{ mt: 1 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>账号已触发平台风控，需要完成人脸识别</Typography><Typography variant="caption">请在闲鱼 App 或已打开的登录浏览器中按提示完成验证。</Typography>{passwordLoginView.qrCodeUrl && <Box sx={{ width: 192, aspectRatio: '1 / 1', overflow: 'hidden', border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}><SquareQRCode src={passwordLoginView.qrCodeUrl} alt="密码登录风控二维码" sx={{ p: 1 }} /></Box>}</Stack>}</Alert>
            </Stack>
          </Box>

          {(notifChannels.length > 0 || bindingsLoading || bindingsLoadError) && (
            <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h3" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}><Bell size={20} />通知渠道绑定</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>勾选后，该账号的 token 失效、自动恢复失败、风控验证等事件会推送到这些渠道</Typography>
              {bindingsLoading && <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={18} /><Typography variant="body2" color="text.secondary">正在加载通知绑定</Typography></Stack>}
              {bindingsLoadError && !bindingsLoading && (
                <Alert severity="warning" action={<Button color="inherit" size="small" onClick={handleRetryBindings}>重试</Button>} sx={{ mb: 1.5 }}>{bindingsLoadError}</Alert>
              )}
              <Stack spacing={1}>
                {notifChannels.map(renderNotificationChannel)}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={handleClose} disabled={saving}>取消</Button><Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Check size={16} />}>{saving ? '保存中...' : '保存'}</Button></DialogActions>
    </MinimalDialogSurface>
  );
};

import { CalendarClock,MessageSquareQuote,Play,Save,Sparkles } from 'lucide-react';
import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MinimalDialogSurface } from '@/components/minimal';
import { AccountDetail,AccountTaskSettings } from '../api';
import { useAccountAutomation } from '../accountAutomationHooks';

interface Props {
  /** account 表示账号。 */ account: AccountDetail;
  /** onClose 表示关闭弹窗的回调。 */ onClose: () => void;
  /** onSaved 表示保存完成后的回调。 */ onSaved: (settings: AccountTaskSettings) => void;
}

// Toggle 渲染可复用的开关控件。
const Toggle: React.FC<{/** checked 表示开关当前是否选中。 */ checked: boolean; /** onChange 表示开关状态变化的回调。 */ onChange: () => void; /** label 表示控件的无障碍名称。 */ label: string}> = ({ checked, onChange, label }) => (
  <Switch checked={checked} onChange={onChange} slotProps={{ input: { 'aria-label': label } }} />
);

// AccountAutomationModal 渲染账号自动化设置弹窗。
const AccountAutomationModal: React.FC<Props> = ({ account, onClose, onSaved }) => {
  // automationState 是账号任务 feature Hook 提供的表单和动作状态。
  const { form, loading, saving, running, error, summary, retryAvailable, setForm, save, run, retry } = useAccountAutomation({ account, onSaved });

  return (
    <MinimalDialogSurface open onClose={onClose} maxWidth="md" aria-labelledby="account-task-title">
      <DialogTitle id="account-task-title"><Typography variant="h3">账号自动任务</Typography><Typography variant="caption" color="text.secondary">{account.nickname || account.remark || account.id}</Typography></DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {loading && <Alert severity="info">正在读取任务设置...</Alert>}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ color: 'success.main', pt: 0.5 }}><MessageSquareQuote size={22} /></Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}><Box><Typography variant="h3">自动评价</Typography><Typography variant="caption" color="text.secondary">持续扫描待评价订单，按订单执行；不是每日任务。</Typography></Box><Toggle checked={form.auto_rate_enabled} onChange={/* 当前回调处理用户交互或异步状态变化。 */ () => setForm(/* 当前回调处琇用户交互或异步状态变化。 */ current => ({ ...current, auto_rate_enabled: !current.auto_rate_enabled }))} label="自动评价" /></Stack>
                <TextField fullWidth multiline minRows={3} label="统一好评文案" value={form.rate_content} slotProps={{ htmlInput: { maxLength: 500 } }} onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setForm(/* 当前回调处琇用户交互或异步状态变化。 */ current => ({ ...current, rate_content: event.target.value }))} sx={{ mt: 2 }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mt: 1.5 }}><Typography variant="caption" color="text.disabled">最近扫描：{form.last_rate_scan_at ? new Date(form.last_rate_scan_at * 1000).toLocaleString('zh-CN') : '尚未执行'}</Typography><Button size="small" color="success" variant="outlined" disabled={running !== '' || !account.enabled} onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void run('auto_rate')} startIcon={running === 'auto_rate' ? <CircularProgress size={14} /> : <Play size={14} />}>立即评价</Button></Stack>
              </Box>
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><Box sx={{ color: 'warning.main', pt: 0.5 }}><Sparkles size={22} /></Box><Box sx={{ minWidth: 0, flex: 1 }}><Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}><Box><Typography variant="h3">每日自动擦亮</Typography><Typography variant="caption" color="text.secondary">每个账号每天最多执行一次，按北京时间判断。</Typography></Box><Toggle checked={form.auto_polish_enabled} onChange={/* 当前回调处理用户交互或异步状态变化。 */ () => setForm(/* 当前回调夆个账号每天最多执行一次，按北京时间判断。 */ current => ({ ...current, auto_polish_enabled: !current.auto_polish_enabled }))} label="每日自动擦亮" /></Stack><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mt: 2 }}><TextField label="每日执行时间" type="time" value={form.polish_time} onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setForm(/* 当前回调处理用户交互或异步状态变化。 */ current => ({ ...current, polish_time: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ maxWidth: 180 }} /><Button size="small" color="warning" variant="outlined" disabled={running !== '' || !account.enabled} onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void run('auto_polish')} startIcon={running === 'auto_polish' ? <CircularProgress size={14} /> : <CalendarClock size={14} />}>立即擦亮</Button></Stack><Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>上次完成：{form.last_polish_at ? new Date(form.last_polish_at * 1000).toLocaleString('zh-CN') : '尚未执行'}</Typography></Box></Stack>
          </Paper>
          {summary && <Alert severity="success">本次发现 {summary.found} 项，成功 {summary.success}，失败 {summary.failed}，跳过 {summary.skipped}。{summary.message || ''}</Alert>}
          {error && <Alert severity="error" action={retryAvailable ? <Button color="inherit" size="small" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void retry()}>重试</Button> : undefined}>{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose} disabled={saving || running !== ''}>关闭</Button><Button variant="contained" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void save()} disabled={saving || running !== '' || (form.auto_rate_enabled && !form.rate_content.trim())} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}>保存</Button></DialogActions>
    </MinimalDialogSurface>
  );
};

export default AccountAutomationModal;

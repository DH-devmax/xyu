import { Bot,Save,Settings } from 'lucide-react';
import React from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MinimalDialogSurface } from '@/components/minimal';
import type { AccountDetail,AIReplySettings } from '../api';

// AccountAISettingsModalProps 描述账号 AI 设置弹窗需要的状态和回调。
export interface AccountAISettingsModalProps {
  // account 是当前正在编辑 AI 设置的账号。
  account: AccountDetail;
  // settings 是账号 AI 设置编辑草稿。
  settings: AIReplySettings;
  // saving 表示 AI 设置保存请求是否正在执行。
  saving: boolean;
  // onChange 更新 AI 设置草稿。
  onChange: (settings: AIReplySettings) => void;
  // onClose 关闭 AI 设置弹窗。
  onClose: () => void;
  // onSave 保存 AI 设置并刷新账号列表。
  onSave: () => void | Promise<void>;
}

// AccountAISettingsModal 渲染账号 AI 自动回复策略编辑界面。
export const AccountAISettingsModal: React.FC<AccountAISettingsModalProps> = ({ account, settings, saving, onChange, onClose, onSave }) => {
  // updateSettings 使用最新草稿合并单个 AI 字段变化。
  const updateSettings = (patch: Partial<AIReplySettings>) => onChange({ ...settings, ...patch });
  // handleEnabledChange 切换 AI 自动回复开关。
  const handleEnabledChange = () => updateSettings(settings.ai_enabled ? { ai_enabled: false, auto_adjust_price_enabled: false } : { ai_enabled: true });
  // handleAutoAdjustChange 切换真实订单自动改价开关，AI 议价关闭时不允许单独开启。
  const handleAutoAdjustChange = () => {
    if (!settings.ai_enabled) return;
    updateSettings({ auto_adjust_price_enabled: !settings.auto_adjust_price_enabled });
  };
  // handleDiscountPercentChange 更新最大折扣比例。
  const handleDiscountPercentChange = (event: React.ChangeEvent<HTMLInputElement>) => updateSettings({ max_discount_percent: parseInt(event.target.value, 10) || 0 });
  // handleDiscountAmountChange 更新最大折扣金额。
  const handleDiscountAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => updateSettings({ max_discount_amount: parseInt(event.target.value, 10) || 0 });
  // handleBargainRoundsChange 更新最大砍价轮次。
  const handleBargainRoundsChange = (event: React.ChangeEvent<HTMLInputElement>) => updateSettings({ max_bargain_rounds: parseInt(event.target.value, 10) || 1 });
  // handlePromptChange 更新自定义 AI 提示词。
  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => updateSettings({ custom_prompts: event.target.value });

  return (
    <MinimalDialogSurface open onClose={onClose} maxWidth="sm" aria-labelledby="account-ai-title">
      <DialogTitle id="account-ai-title">
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Bot size={22} /><Box><Typography variant="h3">AI助手设置</Typography><Typography variant="caption" color="text.secondary">{account.nickname || account.remark || account.id}</Typography></Box></Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <FormControlLabel control={<Switch checked={settings.ai_enabled} onChange={handleEnabledChange} slotProps={{ input: { 'aria-label': '切换 AI 自动回复' } }} />} label={<Box><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>启用 AI 自动回复</Typography><Typography variant="caption" color="text.secondary">AI 将自动处理买家的砍价消息</Typography></Box>} sx={{ m: 0, p: 2, justifyContent: 'space-between', border: 1, borderColor: 'divider', borderRadius: 1, flexDirection: 'row-reverse' }} />
          <FormControlLabel disabled={!settings.ai_enabled} control={<Switch checked={settings.auto_adjust_price_enabled} onChange={handleAutoAdjustChange} color="warning" slotProps={{ input: { 'aria-label': '切换 AI 自动改价' } }} />} label={<Box sx={{ pr: 2 }}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>自动执行 AI 报价改价</Typography><Typography variant="caption" color="text.secondary">AI 明确报价后，买家在 30 分钟内拍下对应商品时自动修改待付款订单价格。固定规则改价不与 AI 议价同时启用。</Typography></Box>} sx={{ m: 0, p: 2, justifyContent: 'space-between', border: 1, borderColor: 'warning.light', borderRadius: 1, flexDirection: 'row-reverse' }} />
          <Box>
            <Typography variant="h3" sx={{ mb: 1.5 }}>砍价策略</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
              <TextField label="最大折扣比例 (%)" type="number" value={settings.max_discount_percent} onChange={handleDiscountPercentChange} helperText="0 表示不允许降价" slotProps={{ htmlInput: { min: 0, max: 100 } }} />
              <TextField label="最大折扣金额 (元)" type="number" value={settings.max_discount_amount} onChange={handleDiscountAmountChange} helperText="0 表示不允许降价" slotProps={{ htmlInput: { min: 0 } }} />
              <TextField label="最大砍价轮次" type="number" value={settings.max_bargain_rounds} onChange={handleBargainRoundsChange} helperText="买家最多可以砍价的次数" slotProps={{ htmlInput: { min: 1, max: 10 } }} />
            </Box>
          </Box>
          <TextField label="自定义提示词（可选）" value={settings.custom_prompts} onChange={handlePromptChange} multiline minRows={5} placeholder="输入自定义的 AI 回复规则或风格指引" />
          <Alert severity="info" icon={<Settings size={18} />}><AlertTitle>AI 如何工作</AlertTitle>自动识别砍价请求，按策略生成回复；只有开启自动改价后，已发送给买家的有效报价才用于真实订单。</Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>取消</Button>
        <Button variant="contained" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void onSave()} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}>{saving ? '保存中...' : '保存'}</Button>
      </DialogActions>
    </MinimalDialogSurface>
  );
};

import { Trash2 } from 'lucide-react';
import React from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { MinimalDialogSurface } from '@/components/minimal';
import type { AccountDetail } from '../api';

// AccountDeleteDialogProps 描述账号删除确认框需要的状态和回调。
export interface AccountDeleteDialogProps {
  // account 是待删除的账号摘要。
  account: AccountDetail;
  // deleting 表示删除请求是否正在执行。
  deleting: boolean;
  // error 是删除失败后的用户可见提示。
  error: string;
  // onClose 关闭删除确认框。
  onClose: () => void;
  // onConfirm 确认删除账号。
  onConfirm: () => void | Promise<void>;
}

// AccountDeleteDialog 渲染账号删除确认框并交给 Minimal Dialog 管理焦点。
export const AccountDeleteDialog: React.FC<AccountDeleteDialogProps> = ({ account, deleting, error, onClose, onConfirm }) => (
  <MinimalDialogSurface open onClose={onClose} maxWidth="xs" aria-labelledby="delete-account-title" aria-describedby="delete-account-description">
    <DialogTitle id="delete-account-title">删除这个账号？</DialogTitle>
    <DialogContent>
      <Stack spacing={2}>
        <DialogContentText id="delete-account-description">删除后，该账号的关联配置也会一并清理，此操作无法撤销。</DialogContentText>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>{account.nickname || account.remark || '未命名账号'}</Typography>
          {account.remark && account.nickname && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>备注：{account.remark}</Typography>}
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.75, overflowWrap: 'anywhere', fontFamily: 'monospace' }}>ID: {account.id}</Typography>
        </Paper>
        {deleting && (
          <Alert severity="info" icon={<CircularProgress size={20} />} role="progressbar" aria-label="正在删除账号"><AlertTitle>正在删除账号</AlertTitle>正在清理关联数据，请保持页面打开…</Alert>
        )}
        {error && (
          <Alert severity="error"><AlertTitle>删除失败</AlertTitle>{error}</Alert>
        )}
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={deleting}>取消</Button>
      <Button color="error" variant="contained" startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Trash2 size={16} />} onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void onConfirm()} disabled={deleting}>{deleting ? '处理中' : '确认删除'}</Button>
    </DialogActions>
  </MinimalDialogSurface>
);

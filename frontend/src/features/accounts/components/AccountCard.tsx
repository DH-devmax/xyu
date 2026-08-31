import { AlertCircle, Bot, CalendarClock, Check, Edit2, MessageCircle, Power, QrCode, RefreshCw, Sparkles, Trash2, User } from 'lucide-react';
import React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { AccountDetail } from '../api';
import { accountRuntimePresentation } from '../runtime';

// AccountCardProps 描述账号卡片展示所需的数据和动作。
export interface AccountCardProps {
  // account 是当前账号的非敏感展示数据。
  account: AccountDetail;
  // refreshing 表示当前账号是否正在刷新资料。
  refreshing: boolean;
  // deleting 表示当前账号是否正在删除。
  deleting: boolean;
  // onRefreshProfile 刷新账号昵称和头像。
  onRefreshProfile: (account: AccountDetail) => void | Promise<void>;
  // onReauthorize 启动当前账号二维码重新授权。
  onReauthorize: (account: AccountDetail) => void | Promise<void>;
  // onEdit 打开账号编辑弹窗。
  onEdit: (account: AccountDetail) => void | Promise<void>;
  // onAI 打开账号 AI 设置弹窗。
  onAI: (account: AccountDetail) => void | Promise<void>;
  // onTasks 打开账号自动化任务弹窗。
  onTasks: (account: AccountDetail) => void;
  // onToggle 切换账号启用状态。
  onToggle: (id: string, currentStatus: boolean) => void | Promise<void>;
  // onDelete 打开账号删除确认框。
  onDelete: (account: AccountDetail) => void;
}

// runtimeChipColor 将账号运行状态适配到 Minimal 的有限语义色集合。
const runtimeChipColor = (account: AccountDetail): 'default' | 'success' | 'info' | 'warning' | 'error' => {
  if (!account.enabled || account.runtime_state === 'disabled') return 'default';
  if (account.runtime_state === 'online') return 'success';
  if (account.runtime_state === 'starting' || account.runtime_state === 'connecting') return 'info';
  if (account.runtime_state === 'reconnecting' || account.runtime_state === 'verification_required') return 'warning';
  if (account.runtime_state === 'auth_expired' || account.runtime_state === 'runtime_conflict' || account.runtime_state === 'error' || account.runtime_state === 'stopped') return 'error';
  return 'default';
};

// AccountCard 渲染 Minimal User Card 风格的账号状态摘要与操作入口。
export const AccountCard = React.memo(/* AccountCard 负责渲染单个账号卡片及其操作。 */ function AccountCard({
  account,
  refreshing,
  deleting,
  onRefreshProfile,
  onReauthorize,
  onEdit,
  onAI,
  onTasks,
  onToggle,
  onDelete,
}: AccountCardProps) {
  // runtime 保存账号运行状态的展示信息。
  const runtime = accountRuntimePresentation(account);
  // requiresLogin 表示当前账号是否需要重新授权。
  const requiresLogin = account.runtime_state === 'auth_expired' || account.runtime_state === 'verification_required';
  // displayName 是账号卡片中优先展示的稳定名称。
  const displayName = account.nickname || account.remark || `账号 ${account.id.substring(0, 6)}...`;
  // chipColor 保存计算后的状态语义色，确保头像状态点和 Chip 使用同一状态。
  const chipColor = runtimeChipColor(account);
  // statusDotColor 将 MUI 语义色映射为状态点背景色。
  const statusDotColor = chipColor === 'success' ? 'success.main' : chipColor === 'info' ? 'info.main' : chipColor === 'warning' ? 'warning.main' : chipColor === 'error' ? 'error.main' : 'grey.400';

  return (
    <Card
      data-layout-contract="minimal-user-card"
      sx={{ height: '100%', p: { xs: 2, sm: 2.5 }, transition: 'border-color 160ms ease, box-shadow 160ms ease', '&:hover': { borderColor: 'primary.main', boxShadow: 3 } }}
    >
      <Stack spacing={2} sx={{ height: '100%' }}>
        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar src={account.avatar_url || undefined} alt={displayName} sx={{ width: 64, height: 64, bgcolor: 'grey.100', color: 'text.disabled', border: 3, borderColor: 'background.paper', boxShadow: 2 }}>
              {!account.avatar_url && <User size={26} />}
            </Avatar>
            <Box sx={{ position: 'absolute', right: 0, bottom: 0, width: 18, height: 18, display: 'grid', placeItems: 'center', border: 2, borderColor: 'background.paper', borderRadius: '50%', bgcolor: statusDotColor }}>
              {account.runtime_state === 'online' ? <Check size={11} color="white" /> : null}
            </Box>
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
              <Typography variant="h3" sx={{ fontSize: '1rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</Typography>
              <Chip label={runtime.label} color={chipColor} size="small" variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{account.remark || '暂无备注'}</Typography>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>ID: {account.id}</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
          {account.ai_enabled && <Chip icon={<Bot size={13} />} label="AI" size="small" color="secondary" variant="outlined" />}
          {account.auto_rate_enabled && <Chip icon={<MessageCircle size={13} />} label="自动评价" size="small" color="success" variant="outlined" />}
          {account.auto_polish_enabled && <Chip icon={<Sparkles size={13} />} label="每日擦亮" size="small" color="warning" variant="outlined" />}
          {account.auto_confirm && <Chip icon={<Check size={13} />} label="自动确认发货" size="small" color="info" variant="outlined" />}
          {account.profile_error && <Chip icon={<AlertCircle size={13} />} label="资料未同步" size="small" color="warning" variant="outlined" title={account.profile_error} />}
        </Stack>

        {account.runtime_message && account.runtime_state !== 'online' && account.runtime_state !== 'disabled' ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, p: 1.25, borderRadius: 1, bgcolor: requiresLogin ? 'error.50' : 'warning.50', color: requiresLogin ? 'error.main' : 'warning.dark' }}>
            <Stack direction="row" spacing={0.75} sx={{ minWidth: 0, alignItems: 'flex-start', flex: 1 }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <Typography variant="body2" sx={{ minWidth: 0, wordBreak: 'break-word' }}>{account.runtime_message}</Typography>
            </Stack>
            {requiresLogin && <Button size="small" color="error" variant="outlined" startIcon={<QrCode size={14} />} onClick={/* reauthorizeAction 从状态提示启动重新授权。 */ () => onReauthorize(account)}>重新授权</Button>}
          </Stack>
        ) : null}

        {account.paused && <Chip icon={<CalendarClock size={14} />} label="暂停处理中" size="small" color="info" variant="outlined" sx={{ alignSelf: 'flex-start' }} />}

        <Stack direction="row" spacing={0.25} sx={{ mt: 'auto', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Tooltip title="刷新昵称和头像"><span><IconButton aria-label="刷新昵称和头像" title="刷新昵称和头像" size="small" onClick={/* refreshAction 刷新账号资料。 */ () => onRefreshProfile(account)} disabled={refreshing}>{refreshing ? <CircularProgress size={18} /> : <RefreshCw size={18} />}</IconButton></span></Tooltip>
          <Tooltip title="重新扫码授权当前账号"><IconButton aria-label="重新扫码授权当前账号" title="重新扫码授权当前账号" size="small" color={requiresLogin ? 'error' : 'primary'} onClick={/* qrAction 启动账号二维码授权。 */ () => onReauthorize(account)}><QrCode size={18} /></IconButton></Tooltip>
          <Tooltip title="编辑账号"><IconButton aria-label="编辑账号" title="编辑账号" size="small" onClick={/* editAction 打开账号编辑弹窗。 */ () => onEdit(account)}><Edit2 size={18} /></IconButton></Tooltip>
          <Tooltip title="AI设置"><IconButton aria-label="AI设置" title="AI设置" size="small" color="secondary" onClick={/* aiAction 打开账号 AI 设置。 */ () => onAI(account)}><Bot size={18} /></IconButton></Tooltip>
          <Tooltip title="自动评价与每日擦亮"><IconButton aria-label="自动评价与每日擦亮" title="自动评价与每日擦亮" size="small" color="warning" onClick={/* tasksAction 打开账号自动化任务。 */ () => onTasks(account)}><CalendarClock size={18} /></IconButton></Tooltip>
          <Tooltip title={account.enabled ? '停用账号' : '启用账号'}><IconButton aria-label={account.enabled ? '停用账号' : '启用账号'} title={account.enabled ? '停用账号' : '启用账号'} size="small" color={account.enabled ? 'success' : 'default'} onClick={/* toggleAction 切换账号启用状态。 */ () => onToggle(account.id, account.enabled)}><Power size={18} /></IconButton></Tooltip>
          <Tooltip title={deleting ? '删除中…' : `删除账号 ${displayName}`}><span><IconButton aria-label={deleting ? '删除中…' : `删除账号 ${displayName}`} title={deleting ? '删除中…' : `删除账号 ${displayName}`} size="small" color="error" onClick={/* deleteAction 打开账号删除确认。 */ () => onDelete(account)} disabled={deleting}>{deleting ? <CircularProgress size={18} color="inherit" /> : <Trash2 size={18} />}</IconButton></span></Tooltip>
        </Stack>
      </Stack>
    </Card>
  );
});

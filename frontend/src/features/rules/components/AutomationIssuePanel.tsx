import { AlertCircle } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { AutomationRunIssue,DeferredAutomationIssue } from '../api';
import { automationIssueKindLabel,canResolveAutomationIssue,type AutomationResolution } from '../issueState';

// AutomationIssuePanelProps 描述人工处理异常面板的输入和动作回调。
export interface AutomationIssuePanelProps {
  // runs 是需要处理的自动化运行异常。
  runs: AutomationRunIssue[];
  // pendingTasks 是需要重试或忽略的延迟任务异常。
  pendingTasks: DeferredAutomationIssue[];
  // onResolveRun 处理自动化运行的继续、重试或终止动作。
  onResolveRun: (id: number, resolution: AutomationResolution) => void;
  // onResolveDeferredTask 处理延迟任务的重试或忽略动作。
  onResolveDeferredTask: (id: number, resolution: 'retry' | 'dismiss') => void;
}

// AutomationIssuePanel 展示规则执行失败后需要用户确认的外部动作状态。
export const AutomationIssuePanel = ({
  runs,
  pendingTasks,
  onResolveRun,
  onResolveDeferredTask,
}: AutomationIssuePanelProps) => (
  <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ alignItems: 'flex-start', '& .MuiAlert-message': { width: '100%' } }}>
    <Typography variant="h3">需要人工处理的自动化任务</Typography>
    <Typography variant="body2" sx={{ mt: 0.5 }}>请先在闲鱼聊天、订单或商品列表中核对真实结果，再选择继续或重试。</Typography>
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      {runs.map(
        // 运行异常渲染器展示外部动作状态和允许的处理按钮。
        issue => (
        <Paper key={`run-${issue.id}`} variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: { lg: 'center' }, justifyContent: 'space-between', gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>账号 {issue.cookie_id} · 订单 {issue.order_id || '-'} · 已记录发送 {issue.sent_count} 条</Typography>
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5, fontWeight: 700 }}>{automationIssueKindLabel(issue.issue_kind)}</Typography>
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5, overflowWrap: 'anywhere' }}>{issue.error_message}</Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', flexShrink: 0 }}>
            {canResolveAutomationIssue(issue, 'continue') && <Button size="small" color="success" variant="outlined" onClick={
              // 继续动作由父级统一执行并刷新规则状态。
              () => onResolveRun(issue.id, 'continue')
            }>已执行，继续下一步</Button>}
            {canResolveAutomationIssue(issue, 'retry') && <Button size="small" color="warning" variant="outlined" onClick={
              // 重试动作由父级统一执行并刷新规则状态。
              () => onResolveRun(issue.id, 'retry')
            }>未执行，安全重试</Button>}
            {canResolveAutomationIssue(issue, 'cancel') && <Button size="small" color="inherit" variant="outlined" onClick={
              // 终止动作由父级统一执行并刷新规则状态。
              () => onResolveRun(issue.id, 'cancel')
            }>终止</Button>}
          </Stack>
        </Paper>
      ))}
      {pendingTasks.map(
        // 延迟任务渲染器展示重试和忽略按钮。
        issue => (
        <Paper key={`task-${issue.id}`} variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, alignItems: { lg: 'center' }, justifyContent: 'space-between', gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>账号 {issue.cookie_id} · 延迟任务重试已达 {issue.attempt_count} 次</Typography>
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5, overflowWrap: 'anywhere' }}>{issue.error_message}</Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button size="small" color="warning" variant="outlined" onClick={
              // 重试延迟任务由父级统一执行。
              () => onResolveDeferredTask(issue.id, 'retry')
            }>重新入队</Button>
            <Button size="small" color="inherit" variant="outlined" onClick={
              // 忽略延迟任务由父级统一执行。
              () => onResolveDeferredTask(issue.id, 'dismiss')
            }>忽略</Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  </Alert>
);

import React, { useCallback, useEffect, useState } from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  getBrainSession,
  getBrainSessions,
  getBrainSettings,
  getBrainStatus,
  getBrainTools,
  restartBrain,
  runBrainTestTurn,
  updateBrainSettings,
  type BrainReplyDraft,
  type BrainSession,
  type BrainSessionDetail,
  type BrainSettings,
  type BrainSettingsUpdate,
  type BrainStatus,
  type BrainTool,
} from '../api';
import { MinimalPageFrame } from '@/components/minimal';

// defaultSettings 为服务尚未完成迁移时的可编辑初始值。
const defaultSettings: BrainSettingsUpdate = {
  enabled: true,
  provider: 'deepseek-official',
  model: 'deepseek-chat',
  base_url: 'https://api.deepseek.com',
  reasoning_effort: 'high',
  timeout_ms: 30000,
  queue_timeout_ms: 5000,
  max_concurrency: 4,
  api_key_action: 'retain',
};

// statusLabel 将 supervisor 状态转换为简短中文标签。
const statusLabel = (state: BrainStatus['state']): string => ({
  stopped: '已停止',
  starting: '启动中',
  running: '运行中',
  degraded: '降级',
  draining: '排空中',
}[state] || state);

// statusColor 为不同运行状态选择 MUI 语义色。
const statusColor = (state: BrainStatus['state']): 'default' | 'success' | 'warning' | 'error' => {
  if (state === 'running') return 'success';
  if (state === 'degraded' || state === 'starting' || state === 'draining') return 'warning';
  if (state === 'stopped') return 'error';
  return 'default';
};

// formatTime 将毫秒时间戳转为本地可扫描时间，空值保持短横线。
const formatTime = (value?: number): string => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—';

// errorText 从请求错误提取不带敏感载荷的用户提示。
const errorText = (error: unknown, fallback: string): string => error instanceof Error && error.message ? error.message : fallback;

// sessionLabel 生成会话列表中的稳定展示标题。
const sessionLabel = (session: BrainSession): string => session.chat_id || session.id;

// BrainCenter 提供 Harness runtime 状态、设置、工具白名单和隔离测试台。
const BrainCenter: React.FC = () => {
  // status 保存 supervisor 当前状态。
  const [status, setStatus] = useState<BrainStatus | null>(null);
  // settings 保存服务端脱敏 provider 配置。
  const [settings, setSettings] = useState<BrainSettings | null>(null);
  // form 保存尚未提交的管理员设置草稿。
  const [form, setForm] = useState<BrainSettingsUpdate>(defaultSettings);
  // tools 保存客服 profile 的最小工具目录。
  const [tools, setTools] = useState<BrainTool[]>([]);
  // sessions 保存当前管理员可见的最近会话。
  const [sessions, setSessions] = useState<BrainSession[]>([]);
  // selectedSession 保存当前打开详情的会话标识。
  const [selectedSession, setSelectedSession] = useState<BrainSessionDetail | null>(null);
  // testMessage 保存测试台输入，不写入浏览器持久化存储。
  const [testMessage, setTestMessage] = useState('买两件可以优惠吗？');
  // testResult 保存最近一次隔离轮次结果。
  const [testResult, setTestResult] = useState<BrainReplyDraft | null>(null);
  // loading 表示首次读取 Brain 数据。
  const [loading, setLoading] = useState(true);
  // refreshing 表示后台刷新是否进行中。
  const [refreshing, setRefreshing] = useState(false);
  // saving 表示设置更新是否进行中。
  const [saving, setSaving] = useState(false);
  // testing 表示隔离测试轮次是否进行中。
  const [testing, setTesting] = useState(false);
  // restarting 表示 runtime 重启请求是否进行中。
  const [restarting, setRestarting] = useState(false);
  // loadError 保存聚合读取失败提示。
  const [loadError, setLoadError] = useState('');
  // actionMessage 保存最近一次管理操作的反馈。
  const [actionMessage, setActionMessage] = useState('');

  // loadBrainData 聚合读取状态、设置、工具和会话，单次刷新复用同一取消信号。
  const loadBrainData = useCallback(/* loadBrainDataCallback 统一处理 Brain 初始加载和手动刷新。 */ async (signal?: AbortSignal): Promise<void> => {
    setRefreshing(true);
    setLoadError('');
    try {
      // brainResponses 是一次刷新得到的状态、设置、工具和会话快照。
      const [statusResponse, settingsResponse, toolsResponse, sessionsResponse] = await Promise.all([
        getBrainStatus({ signal }),
        getBrainSettings({ signal }),
        getBrainTools({ signal }),
        getBrainSessions(50, { signal }),
      ]);
      if (signal?.aborted) return;
      setStatus(statusResponse);
      setSettings(settingsResponse);
      setForm({
        enabled: settingsResponse.enabled,
        provider: settingsResponse.provider,
        model: settingsResponse.model,
        base_url: settingsResponse.base_url,
        reasoning_effort: settingsResponse.reasoning_effort,
        timeout_ms: settingsResponse.timeout_ms,
        queue_timeout_ms: settingsResponse.queue_timeout_ms,
        max_concurrency: settingsResponse.max_concurrency,
        api_key_action: 'retain',
      });
      setTools(toolsResponse.tools);
      setSessions(sessionsResponse.sessions);
    } catch (error /* error 是 Brain 聚合读取失败原因，不向页面暴露响应载荷。 */) {
      if (!signal?.aborted) setLoadError(errorText(error, '读取 Brain 状态失败'));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(/* initialBrainLoadEffect 在页面挂载时读取并在卸载时取消请求。 */ () => {
    // controller 取消页面卸载后仍在运行的 Brain 读取请求。
    const controller = new AbortController();
    void loadBrainData(controller.signal);
    return /* cleanup 在页面卸载时释放 Brain 读取请求。 */ () => controller.abort();
  }, [loadBrainData]);

  // updateFormField 更新单个设置字段并保留其余草稿值。
  const updateFormField = <K extends keyof BrainSettingsUpdate>(field: K, value: BrainSettingsUpdate[K]): void => {
    setForm(/* formUpdater 保留未修改的 Brain 设置字段。 */ previous => ({ ...previous, [field]: value }));
  };

  // handleRefresh 触发用户主动刷新并清除旧操作提示。
  const handleRefresh = (): void => {
    setActionMessage('');
    void loadBrainData();
  };

  // handleSaveSettings 保存管理员配置，不把 API key 明文写入本地状态以外的地方。
  const handleSaveSettings = async (): Promise<void> => {
    setSaving(true);
    setActionMessage('');
    try {
      // nextSettings 是服务端保存后返回的脱敏配置。
      const nextSettings = await updateBrainSettings({
        ...form,
        timeout_ms: Math.max(1000, Math.min(90000, Number(form.timeout_ms) || 30000)),
        queue_timeout_ms: Math.max(100, Math.min(30000, Number(form.queue_timeout_ms) || 5000)),
        max_concurrency: Math.max(1, Math.min(16, Number(form.max_concurrency) || 4)),
      });
      setSettings(nextSettings);
      setForm(/* savedFormUpdater 清除一次性 key 输入并同步服务端设置。 */ previous => ({ ...previous, ...nextSettings, api_key_action: 'retain', api_key_value: undefined }));
      setActionMessage('Brain 设置已保存');
    } catch (error /* error 是 Brain 设置更新失败原因。 */) {
      setActionMessage(errorText(error, '保存 Brain 设置失败'));
    } finally {
      setSaving(false);
    }
  };

  // handleRestart 请求 supervisor 优雅重启并刷新状态。
  const handleRestart = async (): Promise<void> => {
    setRestarting(true);
    setActionMessage('');
    try {
      // response 是 supervisor 重启接口返回的公开提示。
      const response = await restartBrain();
      setActionMessage(response.message || 'Brain 重启请求已提交');
      await loadBrainData();
    } catch (error /* error 是 Brain runtime 重启失败原因。 */) {
      setActionMessage(errorText(error, 'Brain 重启失败'));
    } finally {
      setRestarting(false);
    }
  };

  // handleTestTurn 在独立 session 中提交一条消息，只展示草案不触发平台发送。
  const handleTestTurn = async (): Promise<void> => {
    // message 是去除首尾空白后的隔离测试文本。
    const message = testMessage.trim();
    if (!message) return;
    setTesting(true);
    setTestResult(null);
    setActionMessage('');
    // nonce 为本次测试轮次生成唯一 request_id 和 session_id。
    const nonce = Date.now();
    try {
      // result 是 Harness 返回的草案结果，不会触发平台发送。
      const result = await runBrainTestTurn({
        request_id: `msg:brain-test-${nonce}`,
        session_id: `brain-test-${nonce}`,
        chat_id: 'brain-test-chat',
        buyer_id: 'brain-test-buyer',
        message,
      });
      setTestResult(result);
    } catch (error /* error 是隔离测试轮次失败原因。 */) {
      setActionMessage(errorText(error, '测试轮次失败'));
    } finally {
      setTesting(false);
    }
  };

  // handleSessionOpen 读取选中会话的轮次详情并显示账本状态。
  const handleSessionOpen = async (session: BrainSession): Promise<void> => {
    try {
      setSelectedSession(await getBrainSession(session.id, 50));
    } catch (error /* error 是 Brain 会话详情读取失败原因。 */) {
      setActionMessage(errorText(error, '读取会话详情失败'));
    }
  };

  // copyRequestId 将测试结果 request_id 复制到系统剪贴板供排障使用。
  const copyRequestId = (): void => {
    if (testResult?.request_id) void navigator.clipboard?.writeText(testResult.request_id);
  };

  if (loading) {
    return <Box sx={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={28} /></Box>;
  }

  return (
    <MinimalPageFrame
      title="Brain Center"
      description="Harness runtime 控制台：查看运行状态、Provider、工具白名单和隔离测试。"
    >
      <Stack spacing={{ xs: 2, md: 3 }}>
      {loadError && <Alert severity="error" onClose={/* clearLoadError 清除当前错误提示。 */ () => setLoadError('')}>{loadError}</Alert>}
      {actionMessage && <Alert severity={actionMessage.includes('失败') ? 'error' : 'success'} onClose={/* clearActionMessage 清除当前操作提示。 */ () => setActionMessage('')}>{actionMessage}</Alert>}

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: 'primary.50', borderRadius: 1 }}>
              <MemoryOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h3">Harness runtime</Typography>
              <Typography variant="body2" color="text.secondary">客服 profile · 只生成草案，由 Go 业务层负责发送与幂等</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {status && <Chip label={statusLabel(status.state)} color={statusColor(status.state)} size="small" variant="outlined" />}
            <Tooltip title="刷新状态">
              <span><IconButton aria-label="刷新 Brain 状态" onClick={handleRefresh} disabled={refreshing} size="small">{refreshing ? <CircularProgress size={18} /> : <RefreshOutlinedIcon fontSize="small" />}</IconButton></span>
            </Tooltip>
            <Button variant="outlined" size="small" startIcon={restarting ? <CircularProgress size={16} /> : <RestartAltOutlinedIcon />} onClick={/* restartAction 提交 runtime 重启请求。 */ () => void handleRestart()} disabled={restarting}>
              重启 runtime
            </Button>
          </Stack>
        </Stack>
        {status && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1.5, mt: 2.5 }}>
            <Metric label="健康" value={status.healthy ? '正常' : '异常'} tone={status.healthy ? 'success' : 'error'} />
            <Metric label="活跃会话" value={String(status.active_sessions)} />
            <Metric label="队列" value={String(status.queue_depth)} />
            <Metric label="重启次数" value={String(status.restart_count)} />
            <Metric label="runtime" value={status.runtime_version || '—'} />
          </Box>
        )}
        {status?.last_error && <Alert severity="warning" sx={{ mt: 2 }}>{status.last_error}</Alert>}
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)' }, gap: { xs: 2, md: 3 } }}>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
          <SectionHeading icon={<SaveOutlinedIcon fontSize="small" />} title="Provider 设置" detail={settings?.api_key_configured ? 'API key 已配置' : 'API key 未配置'} />
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="brain-provider-label">Provider</InputLabel>
                <Select labelId="brain-provider-label" label="Provider" value={form.provider} onChange={/* providerChange 更新 provider 草稿。 */ event => updateFormField('provider', event.target.value)}>
                  <MenuItem value="deepseek-official">deepseek-official</MenuItem>
                  <MenuItem value="openai-compatible">openai-compatible</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth label="模型" value={form.model} onChange={/* modelChange 更新模型草稿。 */ event => updateFormField('model', event.target.value)} />
            </Stack>
            <TextField label="Base URL" value={form.base_url} onChange={/* baseUrlChange 更新 provider 地址草稿。 */ event => updateFormField('base_url', event.target.value)} fullWidth />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="brain-reasoning-label">Reasoning effort</InputLabel>
                <Select labelId="brain-reasoning-label" label="Reasoning effort" value={form.reasoning_effort} onChange={/* reasoningChange 更新推理强度草稿。 */ event => updateFormField('reasoning_effort', event.target.value as BrainSettingsUpdate['reasoning_effort'])}>
                  <MenuItem value="off">off</MenuItem><MenuItem value="low">low</MenuItem><MenuItem value="high">high</MenuItem><MenuItem value="max">max</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth type="number" label="超时 (ms)" value={form.timeout_ms} slotProps={{ htmlInput: { min: 1000, max: 90000, step: 1000 } }} onChange={/* timeoutChange 更新 runtime 超时草稿。 */ event => updateFormField('timeout_ms', Number(event.target.value))} />
              <TextField fullWidth type="number" label="并发" value={form.max_concurrency} slotProps={{ htmlInput: { min: 1, max: 16 } }} onChange={/* concurrencyChange 更新并发上限草稿。 */ event => updateFormField('max_concurrency', Number(event.target.value))} />
            </Stack>
            <TextField fullWidth type="number" label="排队预算 (ms)" value={form.queue_timeout_ms} slotProps={{ htmlInput: { min: 100, max: 30000, step: 100 } }} onChange={/* queueTimeoutChange 更新排队预算草稿。 */ event => updateFormField('queue_timeout_ms', Number(event.target.value))} />
            <TextField
              fullWidth
              type="password"
              label="替换 API key"
              value={form.api_key_value || ''}
              autoComplete="new-password"
              helperText="只返回配置状态；留空则保留当前 key。"
              onChange={/* apiKeyChange 更新一次性 key 输入。 */ event => updateFormField('api_key_value', event.target.value || undefined)}
            />
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Switch checked={form.enabled} onChange={/* enabledChange 切换 Brain runtime 启用状态。 */ event => updateFormField('enabled', event.target.checked)} slotProps={{ input: { 'aria-label': '启用 Brain runtime' } }} />
                <Typography variant="body2">启用 Brain runtime</Typography>
              </Stack>
              <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />} onClick={/* saveSettingsAction 提交 provider 设置。 */ () => void handleSaveSettings()} disabled={saving}>
                保存设置
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
          <SectionHeading icon={<TerminalOutlinedIcon fontSize="small" />} title="客服工具白名单" detail={`${tools.length} 个工具`} />
          <Stack divider={<Divider flexItem />} sx={{ mt: 1.5 }}>
            {tools.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>暂无工具目录</Typography>}
            {tools.map(/* toolRenderer 渲染单个 profile 工具。 */ tool => (
              <Stack key={tool.name} direction="row" spacing={1.25} sx={{ py: 1.25, alignItems: 'flex-start' }}>
                <CheckCircleOutlineIcon fontSize="small" color="success" sx={{ mt: 0.2 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{tool.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{tool.kind === 'result' ? '结果插件' : '只读 MCP'} · {tool.description}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
        <SectionHeading icon={<PlayArrowOutlinedIcon fontSize="small" />} title="隔离测试台" detail="只生成草案，不发送消息" />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          <TextField fullWidth label="测试消息" value={testMessage} onChange={/* testMessageChange 更新隔离测试输入。 */ event => setTestMessage(event.target.value)} onKeyDown={/* testMessageKeyDown 支持快捷提交测试轮次。 */ event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void handleTestTurn(); }} />
          <Button variant="contained" sx={{ minWidth: 132 }} startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <PlayArrowOutlinedIcon />} onClick={/* testTurnAction 提交隔离测试轮次。 */ () => void handleTestTurn()} disabled={testing || !testMessage.trim()}>
            运行测试轮次
          </Button>
        </Stack>
        {testResult && (
          <Box sx={{ mt: 2, p: 1.75, bgcolor: 'grey.50', border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Chip size="small" label={testResult.status} color={testResult.status === 'reply' ? 'success' : testResult.status === 'handoff' ? 'warning' : 'default'} />
                <Typography variant="body2" color="text.secondary">意图：{testResult.intent}</Typography>
              </Stack>
              <Tooltip title="复制 request_id"><IconButton aria-label="复制 request_id" size="small" onClick={copyRequestId}><ContentCopyOutlinedIcon fontSize="small" /></IconButton></Tooltip>
            </Stack>
            <Typography sx={{ mt: 1.25, whiteSpace: 'pre-wrap' }}>{testResult.reply_text || testResult.handoff_reason || '本轮未生成可发送草案'}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>{testResult.request_id}</Typography>
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
        <SectionHeading icon={<MemoryOutlinedIcon fontSize="small" />} title="最近会话" detail={`${sessions.length} 个会话`} />
        <TableContainer sx={{ mt: 1.5 }}>
          <Table size="small" aria-label="Brain 最近会话">
            <TableHead><TableRow><TableCell>会话</TableCell><TableCell>账号 / 商品</TableCell><TableCell>状态</TableCell><TableCell>最近更新</TableCell><TableCell align="right">操作</TableCell></TableRow></TableHead>
            <TableBody>
              {sessions.map(/* sessionRenderer 渲染单个 Brain 会话摘要。 */ session => (
                <TableRow hover key={session.id}>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 650 }}>{sessionLabel(session)}</Typography><Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{session.id}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{session.account_id || '—'}</Typography><Typography variant="caption" color="text.secondary">{session.item_id || '未绑定商品'}</Typography></TableCell>
                  <TableCell><Chip size="small" label={session.status || 'unknown'} variant="outlined" /></TableCell>
                  <TableCell><Typography variant="body2">{formatTime(session.updated_at)}</Typography></TableCell>
                  <TableCell align="right"><Button size="small" onClick={/* sessionDetailAction 打开当前会话轮次。 */ () => void handleSessionOpen(session)}>查看轮次</Button></TableCell>
                </TableRow>
              ))}
              {sessions.length === 0 && <TableRow><TableCell colSpan={5}><Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>暂无会话记录</Typography></TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {selectedSession && (
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Box><Typography variant="h3">会话轮次</Typography><Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedSession.session.id}</Typography></Box>
            <Button size="small" onClick={/* closeSessionDetail 关闭当前会话详情。 */ () => setSelectedSession(null)}>关闭详情</Button>
          </Stack>
          <Stack spacing={1} sx={{ mt: 2 }}>
            {selectedSession.turns.map(/* turnRenderer 渲染单个账本轮次。 */ turn => <TurnRow key={turn.id} turn={turn} />)}
            {selectedSession.turns.length === 0 && <Typography variant="body2" color="text.secondary">暂无轮次</Typography>}
          </Stack>
        </Paper>
      )}
      </Stack>
    </MinimalPageFrame>
  );
};

// Metric 显示运行台顶部的单项状态指标。
const Metric: React.FC<{ /** label 是指标名称。 */ label: string; /** value 是指标展示值。 */ value: string; /** tone 是指标的语义状态色。 */ tone?: 'success' | 'error' }> = ({ label, value, tone }) => (
  <Box sx={{ minWidth: 0, p: 1.25, bgcolor: 'grey.50', border: 1, borderColor: 'divider', borderRadius: 1 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h3" sx={{ mt: 0.35, fontSize: '1rem', color: tone === 'success' ? 'success.main' : tone === 'error' ? 'error.main' : 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography>
  </Box>
);

// SectionHeading 统一 Brain 管理区块的标题和辅助状态排版。
const SectionHeading: React.FC<{ /** icon 是标题左侧语义图标。 */ icon: React.ReactNode; /** title 是区块标题。 */ title: string; /** detail 是标题右侧辅助信息。 */ detail?: string }> = ({ icon, title, detail }) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Box sx={{ display: 'flex', color: 'primary.main' }}>{icon}</Box><Typography variant="h3">{title}</Typography></Stack>
    {detail && <Typography variant="caption" color="text.secondary">{detail}</Typography>}
  </Stack>
);

// TurnRow 显示单轮账本的状态和可审计错误摘要。
const TurnRow: React.FC<{ /** turn 是待展示的账本轮次。 */ turn: BrainSessionDetail['turns'][number] }> = ({ turn }) => (
  <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'grey.50' }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{turn.request_id}</Typography>
      <Stack direction="row" spacing={0.75}><Chip size="small" label={turn.status} /><Chip size="small" variant="outlined" label={`发送：${turn.send_status || '—'}`} /></Stack>
    </Stack>
    {turn.error_message && <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>{turn.error_message}</Typography>}
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>截止：{formatTime(turn.deadline_at)} · 创建：{formatTime(turn.created_at)}</Typography>
  </Box>
);

export default BrainCenter;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Iconify } from '@/components/iconify';
import { DHBrandIcon, DHBrandLogo } from '@/components/minimal/DHBrandLogo';
import { MinimalPageFrame } from '@/components/minimal';
import { getBrainSession, getBrainSessions, runBrainTestTurn, type BrainReplyDraft, type BrainSession } from '@/features/brain/api';

type MessageRole = 'assistant' | 'user' | 'system';

interface ConciergeMessage {
  /** 消息的稳定标识。 */
  id: string;
  /** 消息发送方角色。 */
  role: MessageRole;
  /** 消息正文。 */
  text: string;
  /** 消息创建时间戳。 */
  createdAt: number;
  /** 接口返回的处理状态。 */
  status?: BrainReplyDraft['status'];
}

// welcomeMessage 是新会话首次打开时展示的引导语。
const welcomeMessage = '你好，我是智能管家。可以帮你梳理店铺经营、订单和客户沟通建议。';

// statusText 将 Brain 状态转换为会话气泡标签。
const statusText = (status: BrainReplyDraft['status']): string => ({ reply: '建议草案', no_reply: '无需回复', handoff: '建议转人工' }[status]);

// sessionTitle 从业务字段中生成左侧会话标题。
const sessionTitle = (session: BrainSession): string => session.summary || session.chat_id || session.account_id || session.id;

// formatTime 将接口时间格式化为紧凑的本地时分。
const formatTime = (value: number): string => new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

// parseTurn 解析历史轮次中的 Brain 草案 JSON。
const parseTurn = (resultJson: string): BrainReplyDraft | null => {
  try {
    // parsed 是接口返回的未知 JSON 值。
    const parsed: unknown = JSON.parse(resultJson);
    if (!parsed || typeof parsed !== 'object' || !('status' in parsed)) return null;
    return parsed as BrainReplyDraft;
  } catch {
    return null;
  }
};

// Concierge 提供智能管家的双栏会话工作区。
const Concierge: React.FC = () => {
  // sessions 保存左侧会话列表。
  const [sessions, setSessions] = useState<BrainSession[]>([]);
  // selectedSessionId 表示当前查看的会话。
  const [selectedSessionId, setSelectedSessionId] = useState('');
  // messages 保存当前会话的消息流。
  const [messages, setMessages] = useState<ConciergeMessage[]>([{ id: 'welcome', role: 'assistant', text: welcomeMessage, createdAt: Date.now() }]);
  // draft 保存输入框草稿。
  const [draft, setDraft] = useState('');
  // search 保存会话筛选关键词。
  const [search, setSearch] = useState('');
  // loadingSessions 表示会话列表加载状态。
  const [loadingSessions, setLoadingSessions] = useState(true);
  // loadingSession 表示历史消息加载状态。
  const [loadingSession, setLoadingSession] = useState(false);
  // sending 表示当前是否正在生成回复草案。
  const [sending, setSending] = useState(false);
  // error 保存最近一次请求错误。
  const [error, setError] = useState('');

  // loadSessions 从 Brain 接口刷新会话列表。
  const loadSessions = useCallback(/* 刷新会话列表的异步回调。 */ async (signal?: AbortSignal): Promise<void> => {
    setLoadingSessions(true);
    try {
      // response 是后端返回的会话集合。
      const response = await getBrainSessions(30, { signal });
      if (!signal?.aborted) setSessions(response.sessions);
    } catch (/* 会话列表请求的错误对象。 */ requestError) { /* 请求失败时保留页面并显示提示。 */
      if (!signal?.aborted) setError(requestError instanceof Error ? requestError.message : '读取会话失败');
    } finally {
      if (!signal?.aborted) setLoadingSessions(false);
    }
  }, []);

  useEffect(() => { /* 页面进入时加载会话并在卸载时取消请求。 */
    // controller 用于避免切页后的异步状态更新。
    const controller = new AbortController();
    void loadSessions(controller.signal);
    // cleanup 在页面离开时取消未完成请求。
    const cleanup = () => controller.abort();
    return cleanup;
  }, [loadSessions]);

  // filteredSessions 根据搜索词筛选会话列表。
  const filteredSessions = useMemo(/* 根据关键词筛选会话的计算回调。 */ () => {
    // query 是归一化后的搜索词。
    const query = search.trim().toLowerCase();
    return query ? sessions.filter(session => /* 匹配标题、账号和聊天标识。 */ `${sessionTitle(session)} ${session.account_id} ${session.chat_id}`.toLowerCase().includes(query)) : sessions;
  }, [search, sessions]);

  // handleSelectSession 加载用户选中的历史会话。
  const handleSelectSession = async (session: BrainSession): Promise<void> => {
    setSelectedSessionId(session.id);
    setLoadingSession(true);
    setError('');
    try {
      // detail 是选中会话及其历史轮次。
      const detail = await getBrainSession(session.id, 50);
      // history 将可解析的轮次映射为消息气泡。
      const history: ConciergeMessage[] = detail.turns.flatMap((turn, index) => { /* 仅展示可解析的建议轮次。 */
        // result 是当前轮次中的结构化草案。
        const result = parseTurn(turn.result_json);
        if (!result) return [];
        // text 是气泡中展示的建议文本。
        const text = result.reply_text || result.handoff_reason || (result.status === 'no_reply' ? '本轮判断无需回复。' : '已生成处理建议。');
        return [{ id: `${turn.id}-${index}`, role: 'assistant', text, createdAt: turn.created_at, status: result.status }];
      });
      setMessages(history.length ? history : [{ id: 'welcome', role: 'assistant', text: welcomeMessage, createdAt: Date.now() }]);
    } catch (/* 会话详情请求的错误对象。 */ requestError) {
      setError(requestError instanceof Error ? requestError.message : '读取会话详情失败');
    } finally {
      setLoadingSession(false);
    }
  };

  // handleSend 提交输入并追加助手建议。
  const handleSend = async (): Promise<void> => {
    // message 是去除首尾空白后的用户输入。
    const message = draft.trim();
    if (!message || sending) return;
    // nonce 为本次消息生成稳定的临时标识。
    const nonce = Date.now();
    // sessionId 复用当前会话或创建新的前端会话标识。
    const sessionId = selectedSessionId || `concierge-${nonce}`;
    setMessages(previous => /* 先把用户消息写入当前消息流。 */ [...previous, { id: `user-${nonce}`, role: 'user', text: message, createdAt: nonce }]);
    setDraft('');
    setSending(true);
    setError('');
    try {
      // result 是 Brain 接口生成的建议草案。
      const result = await runBrainTestTurn({ request_id: `msg:concierge-${nonce}`, session_id: sessionId, chat_id: 'concierge-chat', buyer_id: 'concierge-user', message });
      // responseText 统一处理回复、转人工和无需回复状态。
      const responseText = result.reply_text || result.handoff_reason || (result.status === 'no_reply' ? '本轮判断无需回复。' : '已生成处理建议。');
      setMessages(previous => /* 把助手草案追加到消息流。 */ [...previous, { id: `assistant-${nonce}`, role: 'assistant', text: responseText, createdAt: Date.now(), status: result.status }]);
      setSelectedSessionId(sessionId);
      void loadSessions();
    } catch (/* 发送请求的错误对象。 */ requestError) { /* 请求失败时保留用户输入上下文。 */
      setError(requestError instanceof Error ? requestError.message : '发送消息失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <MinimalPageFrame title="智能管家">
      <Paper variant="outlined" sx={{ height: { xs: 'calc(100vh - 10rem)', md: 'calc(100vh - 12rem)' }, minHeight: 600, overflow: 'hidden', borderRadius: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={1.5} sx={{ px: { xs: 2, md: 3 }, py: 2, alignItems: 'center', borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.lighter' }}>
          <DHBrandLogo size={42} decorative />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 750 }}>智能管家</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>DeepSeek Harness 对话助手 · 只生成建议草案</Typography>
          </Box>
          <Chip label="在线" color="success" size="small" sx={{ borderRadius: 1, fontWeight: 700 }} />
        </Stack>
        {error && <Alert severity="warning" onClose={() => setError('')} /* 关闭提示后回到正常会话视图。 */ sx={{ borderRadius: 0 }}>{error}</Alert>}
        <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px minmax(0, 1fr)' } }}>
          <Stack sx={{ display: { xs: 'none', md: 'flex' }, minWidth: 0, borderRight: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 750, mb: 1 }}>会话</Typography>
              <TextField fullWidth size="small" value={search} onChange={event => /* 实时更新左侧筛选词。 */ setSearch(event.target.value)} placeholder="搜索会话" slotProps={{ input: { startAdornment: <InputAdornment position="start"><Iconify icon="search" width={18} /></InputAdornment> } }} />
            </Box>
            <Divider />
            <List disablePadding sx={{ overflowY: 'auto', p: 1 }}>
              {loadingSessions && <Stack role="status" aria-label="正在加载会话" sx={{ alignItems: 'center', py: 4 }}><CircularProgress size={24} /></Stack>}
              {!loadingSessions && !filteredSessions.length && <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 3 }}>暂无历史会话，发送消息后会在这里记录。</Typography>}
              {filteredSessions.map(session => /* 渲染可点击的会话摘要项。 */ <ListItemButton key={session.id} selected={selectedSessionId === session.id} onClick={() => /* 打开选中会话的历史消息。 */ void handleSelectSession(session)} sx={{ borderRadius: 1, mb: 0.5, alignItems: 'flex-start' }}><Avatar sx={{ width: 32, height: 32, mr: 1.25, bgcolor: 'primary.lighter', color: 'primary.main' }}><Iconify icon="user" width={18} /></Avatar><ListItemText primary={sessionTitle(session)} secondary={`${session.status || '会话'} · ${formatTime(session.updated_at)}`} slotProps={{ primary: { noWrap: true, sx: { fontWeight: 650 } }, secondary: { noWrap: true } }} /></ListItemButton>)}
            </List>
          </Stack>
          <Stack sx={{ minWidth: 0, minHeight: 0 }}>
            <Stack direction="row" spacing={1.25} sx={{ px: { xs: 2, md: 3 }, py: 1.5, alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.lighter' }}><DHBrandIcon size={28} decorative /></Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>{selectedSessionId ? (sessions.find(/* 定位当前会话标题。 */ session => session.id === selectedSessionId) ? sessionTitle(sessions.find(/* 读取当前会话对象。 */ session => session.id === selectedSessionId) as BrainSession) : '当前会话') : '智能管家'}</Typography><Typography variant="caption" color="text.secondary">建议会保留在当前会话中</Typography></Box>
              {loadingSession && <CircularProgress size={18} />}
            </Stack>
            <Stack role="log" aria-label="智能管家消息" sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: { xs: 2, md: 4 }, py: 3, gap: 2, bgcolor: 'grey.50' }}>
              {messages.map(/* 渲染当前会话中的每条消息。 */ message => <Stack key={message.id} direction={message.role === 'user' ? 'row-reverse' : 'row'} spacing={1} sx={{ alignItems: 'flex-start' }}><Avatar sx={{ width: 30, height: 30, bgcolor: message.role === 'user' ? 'primary.main' : 'primary.lighter', color: message.role === 'user' ? 'primary.contrastText' : 'primary.main' }}>{message.role === 'user' ? <Iconify icon="user" width={17} /> : <DHBrandIcon size={24} decorative />}</Avatar><Box sx={{ maxWidth: { xs: '84%', md: '72%' } }}><Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper', color: message.role === 'user' ? 'primary.contrastText' : 'text.primary', borderColor: message.role === 'user' ? 'primary.main' : 'divider' }}><Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.text}</Typography></Paper><Stack direction="row" spacing={1} sx={{ mt: 0.5, px: 0.5, justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}><Typography variant="caption" color="text.disabled">{formatTime(message.createdAt)}</Typography>{message.status && <Chip label={statusText(message.status)} size="small" color={message.status === 'handoff' ? 'warning' : 'default'} sx={{ height: 20, borderRadius: 1, fontSize: 11 }} />}</Stack></Box></Stack>)}
              {sending && <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}><CircularProgress size={18} /><Typography variant="body2">正在生成建议…</Typography></Stack>}
            </Stack>
            <Box sx={{ p: { xs: 1.5, md: 2.5 }, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <TextField fullWidth multiline maxRows={5} value={draft} onChange={event => /* 保持输入框草稿同步。 */ setDraft(event.target.value)} onKeyDown={event => { /* Enter 发送，Shift+Enter 保留换行。 */ if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} placeholder="输入要交给智能管家的问题…" aria-label="智能管家消息" slotProps={{ input: { endAdornment: <InputAdornment position="end" sx={{ alignSelf: 'flex-end', mb: 0.5 }}><Tooltip title="发送"><span><IconButton color="primary" aria-label="发送消息" onClick={() => /* 点击按钮提交草案请求。 */ void handleSend()} disabled={sending || !draft.trim()}><SendRoundedIcon /></IconButton></span></Tooltip></InputAdornment> } }} />
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.75 }}>Enter 发送，Shift + Enter 换行 · 结果仅作为草案</Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </MinimalPageFrame>
  );
};

export default Concierge;

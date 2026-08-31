import MuiBox from '@mui/material/Box';
import {
AlertCircle,Check,CheckCheck,ImagePlus,Loader2,MessageCircleMore,PanelRightClose,PanelRightOpen,
RefreshCw,Search,Send,Smile,UserRound,Wifi,WifiOff,X,
} from 'lucide-react';
import React from 'react';
import Box from '@mui/material/Box';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { AudioMessage } from '../components/AudioMessage';
import ChatMetadataFeature from '../components/ChatMetadataFeature';
import { useChat } from '../hooks';
import { unreadBadgeLabel,unreadBadgeSize } from '../state';
import { MinimalDialogSurface } from '@/components/minimal';

// unreadBadgeSx 组合未读数量尺寸与 Minimal/MUI 语义色。
const unreadBadgeSx = (count: number) => ({
  ...unreadBadgeSize(count),
  display: 'inline-flex',
  height: 20,
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  bgcolor: 'error.main',
  color: 'error.contrastText',
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1,
});

// Chat 展示实时会话、消息分页和消息发送界面。
const Chat: React.FC = () => {
  // chatState 是 Chat feature Hook 提供的状态、引用和交互动作。
  const {
    accounts, activeAccountID, activeChatID, activeAccount, selectedSession, filteredSessions,
    messages, search, unreadOnly, draft, loading, messagesLoading, olderLoading, hasOlder, contactsLoading,
    hasMoreContacts, emojiOpen, sending, error, liveState, pendingImage, scrollRef, imageInputRef, setActiveAccountID,
    setActiveChatID, setSearch, setUnreadOnly, setDraft, setEmojiOpen, reloadSessions, loadMoreContacts,
    loadOlderMessages, handleMessageScroll, handleSend, handleQuickReply, handleImage, handlePastedImages, confirmSendImage, closeImagePreview, retrySend, retryAvailable,
    unreadForAccount, emojiURL, xianyuEmojis, renderXianyuText, formatClock, messageTime,
  } = useChat();


  // imageMessages 保存当前会话中的图片消息，供灯箱按消息顺序浏览。
  const imageMessages = React.useMemo(/* 当前回调筛选当前会话中的图片消息。 */ () => messages.filter(/* 当前回调判断消息是否为图片类型。 */ message => message.message_type === 'image'), [messages]);
  // imageSlides 将聊天图片转换为灯箱组件所需的展示模型。
  const imageSlides = React.useMemo(/* 当前回调构造灯箱图片展示数据。 */ () => imageMessages.map(/* 当前回调转换单条图片消息。 */ message => ({ src: message.content, alt: '聊天图片' })), [imageMessages]);
  // lightboxIndex 保存当前灯箱图片下标；负值表示灯箱关闭。
  const [lightboxIndex, setLightboxIndex] = React.useState(-1);
  // openLightbox 根据消息键打开对应的图片灯箱。
  const openLightbox = React.useCallback(/* 当前回调定位并打开指定聊天图片。 */ (messageKey: string): void => {
    setLightboxIndex(imageMessages.findIndex(/* 当前回调匹配图片消息键。 */ item => item.message_key === messageKey));
  }, [imageMessages]);
  // quickReplyPanelOpen 保存右侧快捷回复抽屉的展开状态；页面卸载后恢复默认收起。
  const [quickReplyPanelOpen, setQuickReplyPanelOpen] = React.useState(false);

  if (loading) return <Box data-layout-contract="minimal-chat-loading" sx={{ minHeight: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Box component={Loader2} sx={{ width: 32, height: 32, animation: 'spin 1s linear infinite', color: 'primary.main' }} /></Box>;

  return (
    <Box
      component="section"
      data-layout-contract="minimal-chat-layout"
      sx={{
        display: 'flex',
        height: 'calc(100vh - 4rem)',
        minHeight: 560,
        flexDirection: 'column',
        overflow: 'hidden',
        border: 1,
        borderRadius: 2,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: 2,
      }}
    >
      <MuiBox component='header' sx={{
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  'backgroundColor': 'rgb(var(--minimal-color-slate-50)/.7)',
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '1rem',
}}>
        <MuiBox component='div' sx={{
  'marginBottom': '.75rem',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'gap': '1rem',
}}>
          <div>
            <MuiBox component='h2' sx={{
  'fontSize': '1.25rem',
  'lineHeight': '1.75rem',
  'fontWeight': '900',
  'letterSpacing': '-.025em',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-950)/var(--minimal-text-opacity,1))',
}}>在线聊天</MuiBox>
            <MuiBox component='p' sx={{
  'marginTop': '.125rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '500',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
}}>复用账号实时连接，消息按账号完全隔离</MuiBox>
          </div>
          <MuiBox component='div' sx={[{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'borderRadius': '9999px',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.375rem',
  'paddingBottom': '.375rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
}, liveState === 'online' ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
} : liveState === 'connecting' ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-warning-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-700)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
}]}>
            {liveState === 'online' ? <MuiBox component={Wifi} sx={{ 'height': '.875rem', 'width': '.875rem' }} /> : <MuiBox component={WifiOff} sx={{ 'height': '.875rem', 'width': '.875rem' }} />}
            {liveState === 'online' ? '实时同步中' : liveState === 'connecting' ? '正在连接' : '连接已断开'}
          </MuiBox>
        </MuiBox>
        <MuiBox component='div' sx={{ 'display': 'flex', 'gap': '.25rem', 'overflowX': 'auto', 'paddingBottom': '0' }} role="tablist" aria-label="聊天账号">
          {accounts.map(/* 当前回调处理集合中的单个元素。 */ account => {
            // active 当前状态。
            const active = account.id === activeAccountID;
            // unread unread，负责当前功能中的对应处理。
            const unread = unreadForAccount(account.id);
            // unreadLabel 保存账号未读徽标的展示文本。
            const unreadLabel = unreadBadgeLabel(unread);
            // online 响应当前用户操作（line）。
            const online = account.runtime_state === 'online';
            return (
              <MuiBox component='button' key={account.id} type="button" role="tab" aria-selected={active} onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setActiveAccountID(account.id)}
                sx={[{
  'position': 'relative',
  'display': 'flex',
  'height': '2.75rem',
  'flexShrink': '0',
  'alignItems': 'center',
  'gap': '.5rem',
  'borderBottomWidth': '2px',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, active ? {
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-brand-500)/var(--minimal-border-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
} : {
  'borderColor': 'var(--minimal-color-transparent)',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-slate-900)/var(--minimal-text-opacity,1))',
  },
}]}>
                <MuiBox component='span' sx={[{ 'height': '.5rem', 'width': '.5rem', 'borderRadius': '9999px' }, online ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-500)/var(--minimal-bg-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-slate-300)/var(--minimal-bg-opacity,1))',
}]} />
                <MuiBox component='span' sx={{ 'maxWidth': '9rem', 'overflow': 'hidden', 'textOverflow': 'ellipsis', 'whiteSpace': 'nowrap' }}>{account.nickname || account.remark || account.id}</MuiBox>
                {unread > 0 && <MuiBox component='span' aria-label={`未读消息 ${unreadLabel} 条`} sx={unreadBadgeSx(unread)}>{unreadLabel}</MuiBox>}
              </MuiBox>
            );
          })}
        </MuiBox>
      </MuiBox>

      {accounts.length === 0 ? (
        <MuiBox component='div' sx={{
  'display': 'flex',
  'flex': '1 1 0%',
  'flexDirection': 'column',
  'alignItems': 'center',
  'justifyContent': 'center',
  'textAlign': 'center',
}}>
          <MuiBox component={MessageCircleMore} sx={{
  'height': '3rem',
  'width': '3rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-300)/var(--minimal-text-opacity,1))',
}} />
          <MuiBox component='h3' sx={{
  'marginTop': '1rem',
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-800)/var(--minimal-text-opacity,1))',
}}>暂无启用账号</MuiBox>
          <MuiBox component='p' sx={{
  'marginTop': '.25rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
}}>先在账号管理中启用账号，聊天会话会自动出现。</MuiBox>
        </MuiBox>
      ) : (
        <MuiBox component='div' sx={{
  'display': 'grid',
  'minHeight': '0',
  'flex': '1 1 0%',
  'overflow': 'hidden',
  'gridTemplateColumns': 'minmax(0,1fr)',
  '@media (min-width:768px)': { 'gridTemplateColumns': '320px minmax(0,1fr)' },
}}>
          <MuiBox component='aside' sx={{
  'display': 'flex',
  'minHeight': '0',
  'flexDirection': 'column',
  'borderRightWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  'backgroundColor': 'rgb(var(--minimal-color-slate-50)/.4)',
}}>
            <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  'padding': '.75rem',
}}>
              <MuiBox component='div' sx={{ 'position': 'relative' }}>
                <MuiBox component={Search} sx={{
  'position': 'absolute',
  'left': '.75rem',
  'top': '50%',
  'height': '1rem',
  'width': '1rem',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
}} />
                <MuiBox component='input' value={search} onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setSearch(event.target.value)} placeholder="搜索用户、商品或消息"
                  sx={{
  'height': '2.5rem',
  'width': '100%',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '2.25rem',
  'paddingRight': '.75rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'outline': '2px solid transparent',
  'outlineOffset': '2px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:focus': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-brand-400)/var(--minimal-border-opacity,1))',
    '--minimal-ring-offset-shadow': 'var(--minimal-ring-inset) 0 0 0 var(--minimal-ring-offset-width) var(--minimal-ring-offset-color)',
    '--minimal-ring-shadow': 'var(--minimal-ring-inset) 0 0 0 calc(2px + var(--minimal-ring-offset-width)) var(--minimal-ring-color)',
    'boxShadow': 'var(--minimal-ring-offset-shadow),var(--minimal-ring-shadow),var(--minimal-shadow,0 0 transparent)',
    '--minimal-ring-opacity': '1',
    '--minimal-ring-color': 'rgb(var(--minimal-color-brand-100)/var(--minimal-ring-opacity,1))',
  },
}} />
              </MuiBox>
              <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between' }}>
                <MuiBox component='button' type="button" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setUnreadOnly(/* 当前回调处理用户交互或异步状态变化。 */ value => !value)}
                  sx={[{
  'borderRadius': '7px',
  'paddingLeft': '.625rem',
  'paddingRight': '.625rem',
  'paddingTop': '.375rem',
  'paddingBottom': '.375rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
}, unreadOnly ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-slate-100)/var(--minimal-bg-opacity,1))',
  },
}]}>
                  {unreadOnly ? '只看未读' : '全部会话'}
                </MuiBox>
                <MuiBox component='button' type="button" title="刷新会话" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void reloadSessions(activeAccountID)} sx={{
  'borderRadius': '7px',
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-slate-100)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-slate-700)/var(--minimal-text-opacity,1))',
  },
}}>
                  <MuiBox component={RefreshCw} sx={{ 'height': '1rem', 'width': '1rem' }} />
                </MuiBox>
              </MuiBox>
            </MuiBox>
            <MuiBox component='div' sx={{ 'minHeight': '0', 'flex': '1 1 0%', 'overflowY': 'auto' }}>
              {filteredSessions.map(/* 当前回调处理集合中的单个元素。 */ session => (
                <MuiBox component='button' key={session.chat_id} type="button" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setActiveChatID(session.chat_id)}
                  sx={[{
  'display': 'flex',
  'width': '100%',
  'gap': '.75rem',
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-100)/var(--minimal-border-opacity,1))',
  'padding': '.875rem',
  'textAlign': 'left',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, session.chat_id === activeChatID ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  '--minimal-shadow': 'var(--minimal-shadow-chat-active)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-chat-active)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
} : { '&:hover': { 'backgroundColor': 'rgb(var(--minimal-color-white)/.8)' } }]}>
                  <MuiBox component='div' sx={{
  'display': 'flex',
  'height': '2.5rem',
  'width': '2.5rem',
  'flexShrink': '0',
  'alignItems': 'center',
  'justifyContent': 'center',
  'overflow': 'hidden',
  'borderRadius': '9999px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
}}>
                    {session.buyer_avatar_url ? <MuiBox component='img' src={session.buyer_avatar_url} alt="" sx={{ 'height': '100%', 'width': '100%', 'objectFit': 'cover' }} /> : <MuiBox component={UserRound} sx={{ 'height': '1.25rem', 'width': '1.25rem' }} />}
                  </MuiBox>
                  <MuiBox component='div' sx={{ 'minWidth': '0', 'flex': '1 1 0%' }}>
                    <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.5rem' }}>
                      <MuiBox component='span' sx={{
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-900)/var(--minimal-text-opacity,1))',
}}>{session.buyer_name || `用户 ${session.buyer_id}`}</MuiBox>
                    </MuiBox>
                    <MuiBox component='div' sx={{ 'marginTop': '.25rem', 'display': 'flex', 'alignItems': 'center', 'gap': '.5rem' }}>
                      <MuiBox component='span' sx={{
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
}}>{session.last_message || '暂无消息'}</MuiBox>
                      {session.unread_count > 0 && <MuiBox component='span' aria-label={`未读消息 ${unreadBadgeLabel(session.unread_count)} 条`} sx={{ ...unreadBadgeSx(session.unread_count), ml: 'auto' }}>{unreadBadgeLabel(session.unread_count)}</MuiBox>}
                    </MuiBox>
                    {session.item_title && <MuiBox component='div' sx={{
  'marginTop': '.375rem',
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
  'fontSize': '10px',
  'fontWeight': '500',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
}}>商品 · {session.item_title}</MuiBox>}
                  </MuiBox>
                  <MuiBox component='div' sx={{
  'display': 'flex',
  'flexShrink': '0',
  'flexDirection': 'column',
  'alignItems': 'flex-end',
  'gap': '.375rem',
}}>
                    <MuiBox component='span' sx={{
  'fontSize': '10px',
  'fontWeight': '500',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
}}>{formatClock(session.last_message_at)}</MuiBox>
                    {session.item_image_url && <MuiBox component='img' src={session.item_image_url} alt="" sx={{
  'height': '2.25rem',
  'width': '2.75rem',
  'borderRadius': '4px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  'objectFit': 'cover',
}} />}
                  </MuiBox>
                </MuiBox>
              ))}
              {filteredSessions.length === 0 && <MuiBox component='div' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '4rem',
  'paddingBottom': '4rem',
  'textAlign': 'center',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
}}>当前账号暂无匹配会话</MuiBox>}
              {hasMoreContacts && !search && !unreadOnly && <MuiBox component='div' sx={{ 'display': 'flex', 'justifyContent': 'center', 'padding': '1rem' }}>
                <MuiBox component='button' type="button" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void loadMoreContacts()} disabled={contactsLoading}
                  sx={{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'borderRadius': '9999px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '&:hover': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-brand-200)/var(--minimal-border-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
  },
  '&:disabled': { 'opacity': '.5' },
}}>
                  {contactsLoading && <MuiBox component={Loader2} sx={{ 'height': '.875rem', 'width': '.875rem', 'animation': 'spin 1s linear infinite' }} />}{contactsLoading ? '正在加载' : '加载更多历史联系人'}
                </MuiBox>
              </MuiBox>}
            </MuiBox>
          </MuiBox>

          <MuiBox component='main' sx={{
  'position': 'relative',
  'display': 'flex',
  'minHeight': '0',
  'minWidth': '0',
  'flexDirection': 'column',
  'overflow': 'hidden',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-surface-subtle)/var(--minimal-bg-opacity,1))',
}}>
            {selectedSession ? (
              <>
                <MuiBox component='div' sx={{
  'display': 'flex',
  'height': '5rem',
  'flexShrink': '0',
  'alignItems': 'flex-start',
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '1rem',
}}>
                  <MuiBox component='div' sx={{ 'minWidth': '0' }}>
                    <MuiBox component='div' sx={{
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-950)/var(--minimal-text-opacity,1))',
}}>{selectedSession.buyer_name || selectedSession.buyer_id}</MuiBox>
                    <MuiBox component='div' sx={{
  'marginTop': '.125rem',
  'display': 'flex',
  'flexDirection': 'column',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
}}><span>用户 ID：</span><MuiBox component='span' sx={{ 'overflow': 'hidden', 'textOverflow': 'ellipsis', 'whiteSpace': 'nowrap' }}>{selectedSession.buyer_id}</MuiBox></MuiBox>
                  </MuiBox>
                  <MuiBox component='span' sx={[{
  'marginLeft': 'auto',
  'borderRadius': '9999px',
  'paddingLeft': '.625rem',
  'paddingRight': '.625rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  'fontSize': '10px',
  'fontWeight': '700',
}, activeAccount?.runtime_state === 'online' ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-slate-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
}]}>
                    {activeAccount?.runtime_state === 'online' ? '账号在线' : '账号离线'}
                  </MuiBox>
                </MuiBox>
                <MuiBox component='div' ref={scrollRef} onScroll={handleMessageScroll} sx={{
  'minHeight': '0',
  'flex': '1 1 0%',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
  'overflowY': 'auto',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
}}>
                  {messagesLoading ? <MuiBox component='div' sx={{ 'display': 'flex', 'justifyContent': 'center', 'paddingTop': '3rem', 'paddingBottom': '3rem' }}><MuiBox component={Loader2} sx={{
  'height': '1.5rem',
  'width': '1.5rem',
  'animation': 'spin 1s linear infinite',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-500)/var(--minimal-text-opacity,1))',
}} /></MuiBox> : <>
                    {hasOlder && <MuiBox component='div' sx={{ 'display': 'flex', 'justifyContent': 'center', 'paddingBottom': '.25rem' }}>
                      <MuiBox component='button' type="button" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void loadOlderMessages()} disabled={olderLoading}
                        sx={{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'borderRadius': '9999px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.375rem',
  'paddingBottom': '.375rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-brand-200)/var(--minimal-border-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
  },
  '&:disabled': { 'opacity': '.5' },
}}>
                        {olderLoading && <MuiBox component={Loader2} sx={{ 'height': '.875rem', 'width': '.875rem', 'animation': 'spin 1s linear infinite' }} />}{olderLoading ? '正在加载' : '加载更早消息'}
                      </MuiBox>
                    </MuiBox>}
                    {messages.map(/* 当前回调处理集合中的单个元素。 */ message => {
                    // outgoing 是否为发送方消息。
                    const outgoing = message.direction === 'outgoing';
                    // system 系统。
                    const system = message.message_type === 'system';
                    if (system) {
                      return (
                        <MuiBox component='div' key={message.message_key} sx={{ 'display': 'flex', 'justifyContent': 'center', 'paddingTop': '.25rem', 'paddingBottom': '.25rem' }}>
                          <MuiBox component='div' sx={{
  'maxWidth': '82%',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-slate-100)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'textAlign': 'center',
  'fontSize': '.75rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
}}>
                            {renderXianyuText(message.content)}
                            <MuiBox component='div' sx={{
  'marginTop': '.25rem',
  'fontSize': '10px',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
}}>{messageTime(message.sent_at)}</MuiBox>
                          </MuiBox>
                        </MuiBox>
                      );
                    }
                    return (
                      <MuiBox component='div' key={message.message_key} sx={[{ 'display': 'flex', 'alignItems': 'flex-end', 'gap': '.625rem' }, outgoing ? { 'justifyContent': 'flex-end' } : { 'justifyContent': 'flex-start' }]}>
                        {!outgoing && <MuiBox component='div' sx={{
  'height': '2.25rem',
  'width': '2.25rem',
  'flexShrink': '0',
  'overflow': 'hidden',
  'borderRadius': '9999px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-bg-opacity,1))',
  '--minimal-ring-offset-shadow': 'var(--minimal-ring-inset) 0 0 0 var(--minimal-ring-offset-width) var(--minimal-ring-offset-color)',
  '--minimal-ring-shadow': 'var(--minimal-ring-inset) 0 0 0 calc(2px + var(--minimal-ring-offset-width)) var(--minimal-ring-color)',
  'boxShadow': 'var(--minimal-ring-offset-shadow),var(--minimal-ring-shadow),var(--minimal-shadow,0 0 transparent)',
  '--minimal-ring-opacity': '1',
  '--minimal-ring-color': 'rgb(var(--minimal-color-white)/var(--minimal-ring-opacity,1))',
}}>
                          {selectedSession.buyer_avatar_url ? <MuiBox component='img' src={selectedSession.buyer_avatar_url} alt={selectedSession.buyer_name || '用户'} sx={{ 'height': '100%', 'width': '100%', 'objectFit': 'cover' }} /> : <MuiBox component={UserRound} sx={{
  'margin': '.5rem',
  'height': '1.25rem',
  'width': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
}} />}
                        </MuiBox>}
                        <MuiBox component='div' sx={[{ 'maxWidth': '72%' }, outgoing ? { 'alignItems': 'flex-end' } : { 'alignItems': 'flex-start' }, { 'display': 'flex', 'flexDirection': 'column' }]}>
                          <MuiBox component='div' sx={{
  'marginBottom': '.25rem',
  'paddingLeft': '.25rem',
  'paddingRight': '.25rem',
  'fontSize': '10px',
  'fontWeight': '600',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
}}>{outgoing ? (activeAccount?.nickname || activeAccount?.remark || '我') : (selectedSession.buyer_name || message.sender_name || selectedSession.buyer_id)}</MuiBox>
                          {message.message_type === 'image' ? (
                            <MuiBox component='button' type="button" title="点击预览大图" onClick={openLightbox.bind(null, message.message_key)} sx={[{
  'display': 'block',
  'cursor': 'zoom-in',
  'overflow': 'hidden',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'padding': '.25rem',
  'textAlign': 'left',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}, outgoing ? {
  'borderBottomRightRadius': '6px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-brand-200)/var(--minimal-border-opacity,1))',
} : {
  'borderBottomLeftRadius': '6px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
}]}>
                              <MuiBox component='img' src={message.content} alt="聊天图片" sx={{
  'maxHeight': '20rem',
  'maxWidth': '100%',
  'borderRadius': '8px',
  'objectFit': 'contain',
}} />
                            </MuiBox>
                          ) : message.message_type === 'video' ? (
                            <MuiBox component='video' src={message.content} controls preload="metadata" sx={{
  'maxHeight': '20rem',
  'maxWidth': '100%',
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-black)/var(--minimal-bg-opacity,1))',
}} />
                          ) : message.message_type === 'audio' ? (
                            <AudioMessage messageKey={message.message_key} src={message.content} outgoing={outgoing} initialDuration={message.media_duration} />
                          ) : (
                            <MuiBox component='div' sx={[{
  'borderRadius': '10px',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'fontSize': '.875rem',
  'lineHeight': '1.5rem',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}, outgoing ? {
  'borderBottomRightRadius': '6px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-500)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
} : {
  'borderBottomLeftRadius': '6px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-800)/var(--minimal-text-opacity,1))',
}]}>{renderXianyuText(message.content)}</MuiBox>
                          )}
                          <MuiBox component='div' sx={{
  'marginTop': '.25rem',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.25rem',
  'fontSize': '10px',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
}}>
                            {messageTime(message.sent_at)}
                            {outgoing && (message.status === 'failed' ? <MuiBox component={AlertCircle} sx={{
  'height': '.75rem',
  'width': '.75rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-500)/var(--minimal-text-opacity,1))',
}} aria-label="发送失败" /> : message.read_status === 2 ? <MuiBox component={CheckCheck} sx={{
  'height': '.75rem',
  'width': '.75rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-500)/var(--minimal-text-opacity,1))',
}} aria-label="对方已读" /> : message.status === 'sent' ? <MuiBox component={Check} sx={{
  'height': '.75rem',
  'width': '.75rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-500)/var(--minimal-text-opacity,1))',
}} aria-label="已发送未读" /> : <MuiBox component={Check} sx={{ 'height': '.75rem', 'width': '.75rem' }} aria-label="发送中" />)}
                          </MuiBox>
                        </MuiBox>
                        {outgoing && <MuiBox component='div' sx={{
  'height': '2.25rem',
  'width': '2.25rem',
  'flexShrink': '0',
  'overflow': 'hidden',
  'borderRadius': '9999px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-bg-opacity,1))',
  '--minimal-ring-offset-shadow': 'var(--minimal-ring-inset) 0 0 0 var(--minimal-ring-offset-width) var(--minimal-ring-offset-color)',
  '--minimal-ring-shadow': 'var(--minimal-ring-inset) 0 0 0 calc(2px + var(--minimal-ring-offset-width)) var(--minimal-ring-color)',
  'boxShadow': 'var(--minimal-ring-offset-shadow),var(--minimal-ring-shadow),var(--minimal-shadow,0 0 transparent)',
  '--minimal-ring-opacity': '1',
  '--minimal-ring-color': 'rgb(var(--minimal-color-white)/var(--minimal-ring-opacity,1))',
}}>
                          {activeAccount?.avatar_url ? <MuiBox component='img' src={activeAccount.avatar_url} alt="我" sx={{ 'height': '100%', 'width': '100%', 'objectFit': 'cover' }} /> : <MuiBox component={UserRound} sx={{
  'margin': '.5rem',
  'height': '1.25rem',
  'width': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
}} />}
                        </MuiBox>}
                      </MuiBox>
                    );
                    })}
                  </>}
                </MuiBox>
                {error && <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'gap': '.75rem',
  'borderTopWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-danger-100)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '500',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
}}><span>{error}</span>{retryAvailable && <MuiBox component='button' type="button" sx={{ 'fontWeight': '700', 'textDecorationLine': 'underline' }} onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void retrySend()}>重试发送</MuiBox>}</MuiBox>}
                <MuiBox component='div' sx={{
  'position': 'relative',
  'zIndex': '10',
  'flexShrink': '0',
  'borderTopWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '--minimal-shadow': 'var(--minimal-shadow-chat-input)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-chat-input)',
}}>
                  <MuiBox component='div' sx={{ 'marginBottom': '.5rem', 'display': 'flex', 'alignItems': 'center', 'gap': '.25rem' }}>
                    <MuiBox component='div' sx={{ 'position': 'relative' }}>
                      <MuiBox component='button' type="button" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setEmojiOpen(/* 当前回调处理用户交互或异步状态变化。 */ value => !value)} disabled={sending || activeAccount?.runtime_state !== 'online'} sx={{
  'borderRadius': '7px',
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
  },
  '&:disabled': { 'opacity': '.4' },
}} title="闲鱼表情"><MuiBox component={Smile} sx={{ 'height': '1.25rem', 'width': '1.25rem' }} /></MuiBox>
                      {emojiOpen && <MuiBox component='div' sx={{
  'position': 'absolute',
  'bottom': '2.75rem',
  'left': '0',
  'zIndex': '30',
  'width': '360px',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'padding': '.75rem',
  '--minimal-shadow': 'var(--minimal-shadow-2xl)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-2xl)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}}>
                        <MuiBox component='div' sx={{
  'marginBottom': '.5rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
}}>全部表情</MuiBox>
                        <MuiBox component='div' sx={{
  'display': 'grid',
  'maxHeight': '18rem',
  'gridTemplateColumns': 'repeat(8,minmax(0,1fr))',
  'gap': '.25rem',
  'overflowY': 'auto',
}}>
                          {xianyuEmojis.map(/* 当前回调处理集合中的单个元素。 */ ([name, file]) => <MuiBox component='button' key={name} type="button" title={`[${name}]`} onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => { setDraft(/* 当前回调处理用户交互或异步状态变化。 */ value => value + `[${name}]`); setEmojiOpen(false); }} sx={{
  'display': 'flex',
  'height': '2.5rem',
  'width': '2.5rem',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '7px',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-slate-100)/var(--minimal-bg-opacity,1))',
  },
}}><MuiBox component='img' src={emojiURL(file)} alt={`[${name}]`} sx={{ 'height': '2rem', 'width': '2rem', 'objectFit': 'contain' }} /></MuiBox>)}
                        </MuiBox>
                      </MuiBox>}
                    </MuiBox>
                    <MuiBox component='input' ref={imageInputRef} type="file" accept="image/*" sx={{ 'display': 'none' }} onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => void handleImage(event.target.files?.[0])} />
                    <MuiBox component='button' type="button" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => imageInputRef.current?.click()} disabled={sending || activeAccount?.runtime_state !== 'online'} sx={{
  'borderRadius': '7px',
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
  },
  '&:disabled': { 'opacity': '.4' },
}} title="发送图片（最大 10MB）"><MuiBox component={ImagePlus} sx={{ 'height': '1.25rem', 'width': '1.25rem' }} /></MuiBox>
                    <MuiBox component='button' type="button" onClick={/* 当前回调依当前渲染状态切换右侧账号快捷回复抽屉，避免页面级外部点击监听与按钮切换相互抵消。 */ () => setQuickReplyPanelOpen(!quickReplyPanelOpen)} sx={{
  'marginLeft': 'auto',
  'borderRadius': '7px',
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
  },
}} title={quickReplyPanelOpen ? '收起快捷回复' : '展开快捷回复'} aria-label={quickReplyPanelOpen ? '收起快捷回复' : '展开快捷回复'}>
                      {quickReplyPanelOpen ? <MuiBox component={PanelRightClose} sx={{ 'height': '1.25rem', 'width': '1.25rem' }} /> : <MuiBox component={PanelRightOpen} sx={{ 'height': '1.25rem', 'width': '1.25rem' }} />}
                    </MuiBox>
                  </MuiBox>
                  <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'flex-end',
  'gap': '.75rem',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-slate-50)/var(--minimal-bg-opacity,1))',
  'padding': '.5rem',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:focus-within': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-brand-400)/var(--minimal-border-opacity,1))',
    '--minimal-ring-offset-shadow': 'var(--minimal-ring-inset) 0 0 0 var(--minimal-ring-offset-width) var(--minimal-ring-offset-color)',
    '--minimal-ring-shadow': 'var(--minimal-ring-inset) 0 0 0 calc(2px + var(--minimal-ring-offset-width)) var(--minimal-ring-color)',
    'boxShadow': 'var(--minimal-ring-offset-shadow),var(--minimal-ring-shadow),var(--minimal-shadow,0 0 transparent)',
    '--minimal-ring-opacity': '1',
    '--minimal-ring-color': 'rgb(var(--minimal-color-brand-100)/var(--minimal-ring-opacity,1))',
  },
}}>
                    <MuiBox component='textarea' value={draft} onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setDraft(event.target.value)} rows={2} maxLength={2000}
                      onKeyDown={/* 当前回调处理用户交互或异步状态变化。 */ event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }}
                      onPaste={/* 当前回调识别剪贴板中的图片并进入预览流程。 */ event => {
                        // files 保存剪贴板提供的文件候选列表。
                        const files = Array.from(event.clipboardData?.files || []);
                        // image 保存候选列表中的首张图片。
                        const image = files.find(/* 当前回调判断剪贴板文件是否为图片。 */ file => file.type.startsWith('image/'));
                        if (image) {
                          event.preventDefault();
                          void handlePastedImages(files);
                        }
                      }}
                      disabled={activeAccount?.runtime_state !== 'online'} placeholder={activeAccount?.runtime_state === 'online' ? '输入消息，Enter 发送，Shift + Enter 换行，Ctrl + V 粘贴图片' : '账号离线，暂时无法发送'}
                      sx={{
  'maxHeight': '8rem',
  'minHeight': '3rem',
  'flex': '1 1 0%',
  'resize': 'none',
  'backgroundColor': 'var(--minimal-color-transparent)',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.5rem',
  'outline': '2px solid transparent',
  'outlineOffset': '2px',
  '&:disabled': { 'cursor': 'not-allowed' },
}} />
                    <MuiBox component='button' type="button" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void handleSend()} disabled={!draft.trim() || sending || activeAccount?.runtime_state !== 'online'} sx={{
  'display': 'flex',
  'height': '2.5rem',
  'width': '2.5rem',
  'flexShrink': '0',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-500)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '--minimal-shadow': 'var(--minimal-shadow-colored)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-md)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '--minimal-shadow-color': 'rgb(var(--minimal-color-brand-100)/1)',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-600)/var(--minimal-bg-opacity,1))',
  },
  '&:disabled': {
    'cursor': 'not-allowed',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-slate-300)/var(--minimal-bg-opacity,1))',
    '--minimal-shadow': 'var(--minimal-shadow-none)',
    '--minimal-shadow-colored': 'var(--minimal-shadow-none)',
    'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  },
}} aria-label="发送消息">
                      {sending ? <MuiBox component={Loader2} sx={{ 'height': '1rem', 'width': '1rem', 'animation': 'spin 1s linear infinite' }} /> : <MuiBox component={Send} sx={{ 'height': '1rem', 'width': '1rem' }} />}
                    </MuiBox>
                  </MuiBox>
                </MuiBox>
              </>
            ) : (
              <MuiBox component='div' sx={{
  'display': 'flex',
  'flex': '1 1 0%',
  'flexDirection': 'column',
  'alignItems': 'center',
  'justifyContent': 'center',
  'textAlign': 'center',
}}>
                <MuiBox component={MessageCircleMore} sx={{
  'height': '3rem',
  'width': '3rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-300)/var(--minimal-text-opacity,1))',
}} />
                <MuiBox component='h3' sx={{
  'marginTop': '1rem',
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-700)/var(--minimal-text-opacity,1))',
}}>选择一个用户开始聊天</MuiBox>
                <MuiBox component='p' sx={{
  'marginTop': '.25rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
}}>该账号的新消息会实时出现在左侧列表。</MuiBox>
              </MuiBox>
            )}
            <ChatMetadataFeature activeAccountID={activeAccountID} selectedSession={selectedSession} quickReplyPanelOpen={quickReplyPanelOpen} closeQuickReplyPanel={/* 当前回调收起右侧快捷回复抽屉。 */ () => setQuickReplyPanelOpen(false)} sendQuickReply={handleQuickReply} sending={sending} accountOnline={activeAccount?.runtime_state === 'online'} />
          </MuiBox>
        </MuiBox>
      )}

      {pendingImage && <MinimalDialogSurface open onClose={/* closeImageDialogAction 关闭待发送图片预览 Dialog。 */ () => closeImagePreview()} maxWidth="md" aria-labelledby="pending-image-title">
        <MuiBox component='div' sx={{ 'display': 'flex', 'maxHeight': '82vh', 'width': '100%', 'flexDirection': 'column', 'overflow': 'hidden' }}>
          <MuiBox component='div' sx={{
  'display': 'flex',
  'flexShrink': '0',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
}}>
            <MuiBox component='div' id="pending-image-title" sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-900)/var(--minimal-text-opacity,1))',
}}>发送图片预览</MuiBox>
            <MuiBox component='button' type="button" title="取消" onClick={/* 当前回调关闭图片预览。 */ closeImagePreview} sx={{
  'borderRadius': '7px',
  'padding': '.375rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-slate-100)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-slate-700)/var(--minimal-text-opacity,1))',
  },
}}><MuiBox component={X} sx={{ 'height': '1.25rem', 'width': '1.25rem' }} /></MuiBox>
          </MuiBox>
          <MuiBox component='div' sx={{
  'display': 'flex',
  'minHeight': '0',
  'flex': '1 1 0%',
  'alignItems': 'center',
  'justifyContent': 'center',
  'overflow': 'hidden',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-slate-100)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
}}><MuiBox component='img' src={pendingImage.url} alt="待发送图片预览" sx={{
  'maxHeight': '55vh',
  'maxWidth': '100%',
  'borderRadius': '8px',
  'objectFit': 'contain',
}} /></MuiBox>
          <MuiBox component='div' sx={{
  'display': 'flex',
  'flexShrink': '0',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'gap': '.75rem',
  'borderTopWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
}}>
            <MuiBox component='div' sx={{
  'minWidth': '0',
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
}}>{pendingImage.file.name || '粘贴的图片'} · {(pendingImage.file.size / 1024).toFixed(0)} KB</MuiBox>
            <MuiBox component='div' sx={{ 'display': 'flex', 'flexShrink': '0', 'alignItems': 'center', 'gap': '.5rem' }}>
              <MuiBox component='button' type="button" onClick={/* 当前回调取消图片发送。 */ closeImagePreview} sx={{
  'borderRadius': '8px',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-600)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-slate-100)/var(--minimal-bg-opacity,1))',
  },
}}>取消</MuiBox>
              <MuiBox component='button' type="button" onClick={/* 当前回调确认发送预览图片。 */ () => void confirmSendImage()} disabled={sending || activeAccount?.runtime_state !== 'online'} sx={{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-500)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '--minimal-shadow': 'var(--minimal-shadow-colored)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-md)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '--minimal-shadow-color': 'rgb(var(--minimal-color-brand-100)/1)',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-600)/var(--minimal-bg-opacity,1))',
  },
  '&:disabled': { 'cursor': 'not-allowed', 'opacity': '.5' },
}}>{sending ? <MuiBox component={Loader2} sx={{ 'height': '1rem', 'width': '1rem', 'animation': 'spin 1s linear infinite' }} /> : <MuiBox component={Send} sx={{ 'height': '1rem', 'width': '1rem' }} />}发送</MuiBox>
            </MuiBox>
          </MuiBox>
        </MuiBox>
      </MinimalDialogSurface>}

      <Lightbox open={lightboxIndex >= 0} index={Math.max(lightboxIndex, 0)} close={/* 当前回调关闭图片灯箱。 */ () => setLightboxIndex(-1)} slides={imageSlides} />
    </Box>
  );
};

export default Chat;

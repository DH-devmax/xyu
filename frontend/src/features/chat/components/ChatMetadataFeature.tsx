import MuiBox from '@mui/material/Box';
import { Clipboard,FilePenLine,Plus,Send,Trash2,X } from 'lucide-react';
import React from 'react';
import { MinimalDialogSurface } from '@/components/minimal';
import { useChatMetadata } from '../metadata';
import type { ChatSession } from '../models';

/** ChatMetadataFeatureProps 描述独立构建的聊天元数据控件所需上下文与外部发送能力。 */
type ChatMetadataFeatureProps = {
  /** activeAccountID 是当前选中的闲鱼账号标识。 */
  activeAccountID: string;
  /** selectedSession 是当前正在查看的聊天会话。 */
  selectedSession: ChatSession | undefined;
  /** quickReplyPanelOpen 控制右侧快捷回复抽屉是否可见。 */
  quickReplyPanelOpen: boolean;
  /** closeQuickReplyPanel 收起右侧快捷回复抽屉。 */
  closeQuickReplyPanel: () => void;
  /** sendQuickReply 将模板文本交给既有可靠聊天发送流程。 */
  sendQuickReply: (content: string) => Promise<void>;
  /** sending 表示当前聊天发送请求是否进行中。 */
  sending: boolean;
  /** accountOnline 表示当前账号是否可以向平台发送消息。 */
  accountOnline: boolean;
};

/** ChatMetadataFeature 提供账号快捷回复和买家备注交互，并由独立构建分片控制聊天页面体积。 */
const ChatMetadataFeature: React.FC<ChatMetadataFeatureProps> = ({ activeAccountID, selectedSession, quickReplyPanelOpen, closeQuickReplyPanel, sendQuickReply, sending, accountOnline }) => {
  // chatMetadata 保存账号快捷回复和当前买家备注的独立数据、取消控制及 UI 交互状态。
  const chatMetadata = useChatMetadata(activeAccountID, selectedSession);
  // buyerNoteContent 保存未经字符截断的完整备注；展示区域仅依标题栏的两行空间裁切可见文本。
  const buyerNoteContent = chatMetadata.buyerNote?.content.trim() || '';
  // quickReplyPanelRef 指向快捷回复抽屉根节点，用于区分抽屉内交互与页面外点击。
  const quickReplyPanelRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(/* 当前副作用在抽屉展开期间监听页面级指针事件，点击抽屉外部时自动收起并在 cleanup 中移除监听。 */ () => {
    if (!quickReplyPanelOpen) return undefined;
    /** closeWhenClickOutside 仅在指针目标不属于快捷回复抽屉时收起面板。 */
    const closeWhenClickOutside = (event: PointerEvent): void => {
      // eventTarget 保存当前指针事件的目标节点；非 DOM 节点不参与抽屉内外判断。
      const eventTarget = event.target;
      if (!(eventTarget instanceof Node) || quickReplyPanelRef.current?.contains(eventTarget)) return;
      closeQuickReplyPanel();
    };
    document.addEventListener('pointerdown', closeWhenClickOutside);
    return /* 当前 cleanup 在抽屉收起或组件卸载时移除页面级监听。 */ () => document.removeEventListener('pointerdown', closeWhenClickOutside);
  }, [closeQuickReplyPanel, quickReplyPanelOpen]);

  return <>
    {selectedSession && <MuiBox component='div' sx={{
  'position': 'absolute',
  'left': '10rem',
  'right': '5.5rem',
  'top': '.5rem',
  'zIndex': '10',
  'display': 'flex',
  'minHeight': '4rem',
  'alignItems': 'center',
  'justifyContent': 'center',
}}>
      <MuiBox component='button' type="button" onClick={/* 当前回调打开当前买家的完整备注弹窗。 */ chatMetadata.openNoteDialog} sx={{
  'display': 'inline-flex',
  'width': 'fit-content',
  'maxWidth': '100%',
  'alignItems': 'center',
  'gap': '.5rem',
  'borderRadius': '7px',
  'borderWidth': '1px',
  'borderColor': 'var(--minimal-color-transparent)',
  'paddingLeft': '.625rem',
  'paddingRight': '.625rem',
  'paddingTop': '.375rem',
  'paddingBottom': '.375rem',
  'textAlign': 'left',
  'fontSize': '.75rem',
  'lineHeight': '1.25rem',
  'fontWeight': '500',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-border-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
  },
}} title={buyerNoteContent || '添加用户备注'}>
        <MuiBox component={FilePenLine} sx={{
  'height': '1rem',
  'width': '1rem',
  'flexShrink': '0',
  'alignSelf': 'center',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
}} />
        <MuiBox component='span' sx={{
  'minWidth': '0',
  'overflowWrap': 'break-word',
  'overflow': 'hidden',
  'display': '-webkit-box',
  'WebkitBoxOrient': 'vertical',
  'WebkitLineClamp': '2',
}}>{chatMetadata.noteLoading ? '正在读取备注…' : buyerNoteContent || '添加用户备注'}</MuiBox>
      </MuiBox>
    </MuiBox>}
    {quickReplyPanelOpen && activeAccountID && <MuiBox component='aside' ref={quickReplyPanelRef} aria-label="账号快捷回复" sx={{
  'position': 'absolute',
  'top': '0',
  'bottom': '0',
  'right': '0',
  'zIndex': '20',
  'display': 'flex',
  'width': '304px',
  'maxWidth': '88%',
  'flexDirection': 'column',
  'borderLeftWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  '--minimal-shadow': 'var(--minimal-shadow-2xl)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-2xl)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}}>
      <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-100)/var(--minimal-border-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
}}>
        <div>
          <MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-900)/var(--minimal-text-opacity,1))',
}}>快捷回复</MuiBox>
          <MuiBox component='div' sx={{
  'marginTop': '.125rem',
  'fontSize': '11px',
  'fontWeight': '500',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
}}>当前账号 · {chatMetadata.quickReplies.length}/50</MuiBox>
        </div>
        <MuiBox component='button' type="button" onClick={/* 当前回调收起右侧快捷回复抽屉。 */ closeQuickReplyPanel} sx={{
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
}} aria-label="收起快捷回复"><MuiBox component={X} sx={{ 'height': '1rem', 'width': '1rem' }} /></MuiBox>
      </MuiBox>
      <MuiBox component='div' sx={{
  'minHeight': '0',
  'flex': '1 1 0%',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
  'overflowY': 'auto',
  'padding': '.75rem',
}}>
        {chatMetadata.quickReplies.map(/* reply 保存当前待展示的账号级快捷回复。 */ reply => <MuiBox component='article' key={reply.id} sx={{
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  'backgroundColor': 'rgb(var(--minimal-color-slate-50)/.7)',
  'padding': '.75rem',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-brand-200)/var(--minimal-border-opacity,1))',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/.4)',
  },
}}>
          <MuiBox component='p' sx={{
  'whiteSpace': 'pre-wrap',
  'overflowWrap': 'break-word',
  'fontSize': '.75rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-700)/var(--minimal-text-opacity,1))',
}}>{reply.content}</MuiBox>
          <MuiBox component='div' sx={{
  'marginTop': '.5rem',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'flex-end',
  'gap': '.25rem',
}}>
            <MuiBox component='button' type="button" onClick={/* 当前回调请求确认删除本条快捷回复。 */ () => chatMetadata.requestQuickReplyDelete(reply)} disabled={chatMetadata.quickReplyBusy} sx={{
  'borderRadius': '7px',
  'padding': '.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-danger-600)/var(--minimal-text-opacity,1))',
  },
  '&:disabled': { 'opacity': '.4' },
}} aria-label="删除快捷回复"><MuiBox component={Trash2} sx={{ 'height': '.875rem', 'width': '.875rem' }} /></MuiBox>
            <MuiBox component='button' type="button" onClick={/* 当前回调复制本条快捷回复后收起抽屉。 */ () => { closeQuickReplyPanel(); void chatMetadata.copyQuickReply(reply); }} sx={{
  'borderRadius': '7px',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  'fontSize': '11px',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
  },
}} title="复制快捷回复"><MuiBox component={Clipboard} sx={{ 'marginRight': '.25rem', 'display': 'inline', 'height': '.75rem', 'width': '.75rem' }} />{chatMetadata.copiedQuickReplyID === reply.id ? '已复制' : '复制'}</MuiBox>
            <MuiBox component='button' type="button" onClick={/* 当前回调发送本条快捷回复后收起抽屉。 */ () => { closeQuickReplyPanel(); void sendQuickReply(reply.content); }} disabled={!selectedSession || sending || !accountOnline} sx={{
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-500)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  'fontSize': '11px',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
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
  },
}} title="发送快捷回复"><MuiBox component={Send} sx={{ 'marginRight': '.25rem', 'display': 'inline', 'height': '.75rem', 'width': '.75rem' }} />发送</MuiBox>
          </MuiBox>
        </MuiBox>)}
        {chatMetadata.quickReplies.length === 0 && <MuiBox component='div' sx={{
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '3rem',
  'paddingBottom': '3rem',
  'textAlign': 'center',
  'fontSize': '.75rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
}}>还没有快捷回复。把常用话术添加在下方，当前账号的所有聊天都可以使用。</MuiBox>}
      </MuiBox>
      <MuiBox component='div' sx={{
  'borderTopWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  'backgroundColor': 'rgb(var(--minimal-color-slate-50)/.8)',
  'padding': '.75rem',
}}>
        {chatMetadata.metadataError && <MuiBox component='div' sx={{
  'marginBottom': '.5rem',
  'display': 'flex',
  'alignItems': 'flex-start',
  'justifyContent': 'space-between',
  'gap': '.5rem',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.625rem',
  'paddingRight': '.625rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '11px',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
}}><span>{chatMetadata.metadataError}</span><MuiBox component='button' type="button" onClick={/* 当前回调关闭当前快捷回复或备注错误提示。 */ chatMetadata.clearMetadataError} sx={{ 'flexShrink': '0' }} aria-label="关闭错误提示"><MuiBox component={X} sx={{ 'height': '.875rem', 'width': '.875rem' }} /></MuiBox></MuiBox>}
        <MuiBox component='textarea' value={chatMetadata.quickReplyDraft} onChange={/* 当前回调更新新增快捷回复表单文本。 */ event => chatMetadata.setQuickReplyDraft(event.target.value)} onKeyDown={/* 当前回调支持 Enter 添加、Shift Enter 换行的快捷回复输入。 */ event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void chatMetadata.addQuickReply(); } }} rows={2} maxLength={2000} placeholder="添加常用快捷回复…" sx={{
  'minHeight': '3.5rem',
  'width': '100%',
  'resize': 'none',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.75rem',
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
        <MuiBox component='button' type="button" onClick={/* 当前回调保存底部输入框中的快捷回复。 */ () => void chatMetadata.addQuickReply()} disabled={!chatMetadata.quickReplyDraft.trim() || chatMetadata.quickReplyBusy || chatMetadata.quickReplies.length >= 50} sx={{
  'marginTop': '.5rem',
  'display': 'flex',
  'width': '100%',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.375rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-slate-900)/var(--minimal-bg-opacity,1))',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-slate-700)/var(--minimal-bg-opacity,1))',
  },
  '&:disabled': {
    'cursor': 'not-allowed',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-slate-300)/var(--minimal-bg-opacity,1))',
  },
}}><MuiBox component={Plus} sx={{ 'height': '.875rem', 'width': '.875rem' }} />添加快捷回复</MuiBox>
      </MuiBox>
    </MuiBox>}
    {chatMetadata.noteDialogOpen && <MinimalDialogSurface open onClose={/* closeNoteDialogAction 关闭买家备注 Dialog。 */ () => chatMetadata.closeNoteDialog()} maxWidth="sm" aria-labelledby="buyer-note-title">
      <MuiBox component='div' sx={{ 'display': 'flex', 'maxHeight': '82vh', 'width': '100%', 'flexDirection': 'column', 'overflow': 'hidden' }}>
        <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '1rem',
  'paddingBottom': '1rem',
}}><MuiBox component='div' sx={{ 'minWidth': '0' }}><MuiBox component='div' id="buyer-note-title" sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-900)/var(--minimal-text-opacity,1))',
}}>用户备注</MuiBox><MuiBox component='div' sx={{
  'marginTop': '.125rem',
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
}}>{selectedSession?.buyer_name || selectedSession?.buyer_id || '当前用户'} · ID {selectedSession?.buyer_id || '-'}</MuiBox></MuiBox><MuiBox component='button' type="button" onClick={/* 当前回调关闭买家备注弹窗。 */ chatMetadata.closeNoteDialog} sx={{
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
}} aria-label="关闭备注"><MuiBox component={X} sx={{ 'height': '1.25rem', 'width': '1.25rem' }} /></MuiBox></MuiBox>
        <MuiBox component='div' sx={{ 'minHeight': '0', 'flex': '1 1 0%', 'overflowY': 'auto', 'padding': '1.25rem' }}>{chatMetadata.metadataError && <MuiBox component='div' sx={{
  'marginBottom': '1rem',
  'display': 'flex',
  'alignItems': 'flex-start',
  'justifyContent': 'space-between',
  'gap': '.5rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'fontSize': '.75rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
}}><span>{chatMetadata.metadataError}</span><button type="button" onClick={/* 当前回调关闭当前快捷回复或备注错误提示。 */ chatMetadata.clearMetadataError} aria-label="关闭错误提示"><MuiBox component={X} sx={{ 'height': '1rem', 'width': '1rem' }} /></button></MuiBox>}{chatMetadata.noteEditing ? <MuiBox component='textarea' autoFocus value={chatMetadata.noteDraft} onChange={/* 当前回调更新买家备注编辑表单。 */ event => chatMetadata.setNoteDraft(event.target.value)} maxLength={2000} rows={10} placeholder="记录该用户的沟通偏好、需求或重要事项…" sx={{
  'minHeight': '13rem',
  'width': '100%',
  'resize': 'vertical',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-slate-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontSize': '.875rem',
  'lineHeight': '1.5rem',
  'outline': '2px solid transparent',
  'outlineOffset': '2px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:focus': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-brand-400)/var(--minimal-border-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
    '--minimal-ring-offset-shadow': 'var(--minimal-ring-inset) 0 0 0 var(--minimal-ring-offset-width) var(--minimal-ring-offset-color)',
    '--minimal-ring-shadow': 'var(--minimal-ring-inset) 0 0 0 calc(2px + var(--minimal-ring-offset-width)) var(--minimal-ring-color)',
    'boxShadow': 'var(--minimal-ring-offset-shadow),var(--minimal-ring-shadow),var(--minimal-shadow,0 0 transparent)',
    '--minimal-ring-opacity': '1',
    '--minimal-ring-color': 'rgb(var(--minimal-color-brand-100)/var(--minimal-ring-opacity,1))',
  },
}} /> : <MuiBox component='div' sx={{
  'minHeight': '10rem',
  'whiteSpace': 'pre-wrap',
  'overflowWrap': 'break-word',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-100)/var(--minimal-border-opacity,1))',
  'backgroundColor': 'rgb(var(--minimal-color-slate-50)/.8)',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontSize': '.875rem',
  'lineHeight': '1.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-700)/var(--minimal-text-opacity,1))',
}}>{chatMetadata.buyerNote?.content || '尚未添加备注。点击“编辑”即可记录该用户的信息。'}</MuiBox>}</MuiBox>
        <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'flex-end',
  'gap': '.5rem',
  'borderTopWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-slate-200)/var(--minimal-border-opacity,1))',
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
}}>{chatMetadata.noteEditing ? <><MuiBox component='button' type="button" onClick={/* 当前回调关闭备注弹窗并放弃未保存变更。 */ chatMetadata.closeNoteDialog} disabled={chatMetadata.noteSaving} sx={{
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
  '&:disabled': { 'opacity': '.5' },
}}>取消</MuiBox><MuiBox component='button' type="button" onClick={/* 当前回调保存当前买家备注表单。 */ () => void chatMetadata.saveBuyerNote()} disabled={chatMetadata.noteSaving} sx={{
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
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
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
  },
}}>{chatMetadata.noteSaving ? '保存中…' : '保存'}</MuiBox></> : <MuiBox component='button' type="button" onClick={/* 当前回调将备注弹窗切换为编辑模式。 */ chatMetadata.beginNoteEditing} sx={{
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
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-600)/var(--minimal-bg-opacity,1))',
  },
}}>编辑</MuiBox>}</MuiBox>
      </MuiBox>
    </MinimalDialogSurface>}
    {chatMetadata.pendingDeleteQuickReply && <MinimalDialogSurface open onClose={/* cancelDeleteDialogAction 关闭快捷回复删除确认 Dialog。 */ () => chatMetadata.cancelQuickReplyDelete()} maxWidth="xs" aria-labelledby="quick-reply-delete-title">
      <MuiBox component='div' sx={{ 'width': '100%', 'padding': '1.25rem' }}>
        <MuiBox component='div' id="quick-reply-delete-title" sx={{
  'fontSize': '1rem',
  'lineHeight': '1.5rem',
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-900)/var(--minimal-text-opacity,1))',
}}>删除快捷回复？</MuiBox>
        <MuiBox component='p' sx={{
  'marginTop': '.5rem',
  'whiteSpace': 'pre-wrap',
  'overflowWrap': 'break-word',
  'fontSize': '.875rem',
  'lineHeight': '1.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-500)/var(--minimal-text-opacity,1))',
}}>“{chatMetadata.pendingDeleteQuickReply.content}” 将从当前账号的快捷回复中移除。</MuiBox>
        <MuiBox component='div' sx={{ 'marginTop': '1.25rem', 'display': 'flex', 'justifyContent': 'flex-end', 'gap': '.5rem' }}>
          <MuiBox component='button' type="button" onClick={/* 当前回调关闭快捷回复删除确认框。 */ chatMetadata.cancelQuickReplyDelete} disabled={chatMetadata.quickReplyBusy} sx={{
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
  '&:disabled': { 'opacity': '.5' },
}}>取消</MuiBox>
          <MuiBox component='button' type="button" onClick={/* 当前回调确认并删除快捷回复。 */ () => void chatMetadata.confirmQuickReplyDelete()} disabled={chatMetadata.quickReplyBusy} sx={{
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-500)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-danger-600)/var(--minimal-bg-opacity,1))',
  },
  '&:disabled': {
    'cursor': 'not-allowed',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-danger-300)/var(--minimal-bg-opacity,1))',
  },
}}>{chatMetadata.quickReplyBusy ? '删除中…' : '删除'}</MuiBox>
        </MuiBox>
      </MuiBox>
    </MinimalDialogSurface>}
  </>;
};

export default ChatMetadataFeature;

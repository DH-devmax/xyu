import MuiBox from '@mui/material/Box';
import { FileDown,ListPlus,Loader2,Plus,Upload,X } from 'lucide-react';
import React from 'react';
import { MinimalDialogSurface } from '@/components/minimal';
import type { Card } from '../api';
import type { CardBatchModalProps } from '../types';

// BatchCardImportModal 负责卡密批量创建和单组库存追加的交互界面。
export const BatchCardImportModal: React.FC<CardBatchModalProps> = ({
  dataCards,
  downloadCardTemplate,
  ...state
}) => {
  // handleFileChange 保存用户选择的批量导入文件。
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    state.setBatchFile(event.target.files?.[0] || null);
  };
  // handleAppendContentChange 更新追加文本并保留原始换行，预览由 Hook 派生。
  const handleAppendContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    state.setAppendContent(event.target.value);
  };
  // handleTargetChange 切换追加库存目标卡密组。
  const handleTargetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    state.setAppendTargetId(event.target.value);
  };
  // handleClose 关闭弹窗并取消当前批量请求。
  const handleClose = () => state.closeBatchModal();
  // handleCreateTab 切换到批量创建页签。
  const handleCreateTab = () => state.setBatchTab('create');
  // handleAppendTab 切换到库存追加页签。
  const handleAppendTab = () => state.setBatchTab('append');
  // handleRetryCreate 重试最近一次批量创建。
  const handleRetryCreate = () => void state.handleRetryBatchCreate();
  // handleRetryAppend 重试最近一次库存追加。
  const handleRetryAppend = () => void state.handleRetryBatchAppend();
  // completedBatchResult 只保留包含逐行统计的成功批量结果。
  const completedBatchResult = state.batchResult && 'rows' in state.batchResult ? state.batchResult : null;
  // renderCardOption 渲染追加目标卡密组的下拉选项。
  const renderCardOption = (card: Card) => <option key={card.id} value={String(card.id)}>{card.name}（ID: {card.id}）</option>;
  // handleSubmitCreate 提交批量创建请求。
  const handleSubmitCreate = () => void state.handleBatchCreate();
  // handleSubmitAppend 提交批量追加请求。
  const handleSubmitAppend = () => void state.handleBatchAppend();

  if (!state.showBatchModal) return null;

  return (
    <MinimalDialogSurface open onClose={handleClose} maxWidth="md" aria-labelledby="card-batch-title">
      <MuiBox component='div' sx={{ 'width': '100%' }}>
        <MuiBox component='div' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
}}>
            <MuiBox component='h3' id="card-batch-title" sx={{
  'fontSize': '1.25rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>批量导入卡密</MuiBox>
          <MuiBox component='button' onClick={handleClose} sx={{
  'width': '2.5rem',
  'height': '2.5rem',
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
}}>
            <MuiBox component={X} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}} />
          </MuiBox>
        </MuiBox>

        <MuiBox component='div' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
}}>
          <MuiBox component='div' sx={{
  'display': 'flex',
  'flexWrap': 'wrap',
  'gap': '.5rem',
  'padding': '.5rem',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/.5)',
  'borderRadius': '10px',
}}>
            <MuiBox component='button' onClick={handleCreateTab} sx={[{
  'flex': '1 1 0%',
  'display': 'inline-flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, state.batchTab === 'create' ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '--minimal-shadow': 'var(--minimal-shadow-md)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-md)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  },
}]}>
              <MuiBox component={ListPlus} sx={{ 'width': '1rem', 'height': '1rem' }} />批量创建卡密组
            </MuiBox>
            <MuiBox component='button' onClick={handleAppendTab} sx={[{
  'flex': '1 1 0%',
  'display': 'inline-flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, state.batchTab === 'append' ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '--minimal-shadow': 'var(--minimal-shadow-md)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-md)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  },
}]}>
              <MuiBox component={Upload} sx={{ 'width': '1rem', 'height': '1rem' }} />往单个组充卡密
            </MuiBox>
          </MuiBox>

          {state.batchTab === 'create' ? (
            <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
              <MuiBox component='div' sx={{
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-border-opacity,1))',
  'padding': '1rem',
  'fontSize': '.75rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-900)/var(--minimal-text-opacity,1))',
}}>
                上传表格，每行一个卡密组。表头：<MuiBox component='code' sx={{
  'backgroundColor': 'rgb(var(--minimal-color-brand-100)/.7)',
  'paddingLeft': '.375rem',
  'paddingRight': '.375rem',
  'paddingTop': '.125rem',
  'paddingBottom': '.125rem',
  'borderRadius': '6px',
}}>名称,类型,内容,描述,启用,延迟秒,多规格,规格名,规格值</MuiBox>。
                类型填 text/data/image；data 类型的“内容”按行存卡密（CSV 单元格内换行需用引号包裹）。
              </MuiBox>
              <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.75rem' }}>
                <MuiBox component='button' onClick={downloadCardTemplate} sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  'borderRadius': '8px',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>
                  <MuiBox component={FileDown} sx={{ 'width': '1rem', 'height': '1rem' }} />下载模板
                </MuiBox>
                <MuiBox component='label' sx={{
  'flex': '1 1 0%',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  'borderRadius': '8px',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'cursor': 'pointer',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>
                  <MuiBox component={Upload} sx={{ 'width': '1rem', 'height': '1rem' }} />{state.batchFile ? state.batchFile.name : '选择 .xlsx / .csv / .tsv'}
                  <MuiBox component='input' type="file" accept=".xlsx,.csv,.tsv" sx={{ 'display': 'none' }} onChange={handleFileChange} />
                </MuiBox>
              </MuiBox>
              {state.batchResult?.error && (
                <MuiBox component='div' sx={{
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-danger-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'gap': '.75rem',
}}>
                  <span>{state.batchResult.error}</span>
                  <MuiBox component='button' type="button" onClick={handleRetryCreate} disabled={!state.batchFile || state.batchBusy} sx={{ 'fontWeight': '700', 'whiteSpace': 'nowrap' }}>重试</MuiBox>
                </MuiBox>
              )}
              {completedBatchResult && (
                <MuiBox component='div' sx={{
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  'padding': '1rem',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>共 {completedBatchResult.total} 行 · 成功 {completedBatchResult.created} · 失败 {completedBatchResult.failed}</MuiBox>
                  {completedBatchResult.failed > 0 && (
                    <MuiBox component='div' sx={{
  'maxHeight': '12rem',
  'overflowY': 'auto',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.25rem*var(--minimal-space-y-reverse))',
  },
}}>
                      {completedBatchResult.rows.filter(
                        // row 是批量结果中的单行处理记录。
                        row => !row.success,
                      ).map(
                        // row 是待展示失败说明的单行结果。
                        row => (
                        <MuiBox component='div' key={row.row_no} sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-600)/var(--minimal-text-opacity,1))',
}}>第 {row.row_no} 行「{row.name}」：{row.error}</MuiBox>
                        ),
                      )}
                    </MuiBox>
                  )}
                </MuiBox>
              )}
            </MuiBox>
          ) : (
            <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
              {dataCards.length === 0 ? (
                <MuiBox component='div' sx={{
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-warning-50)/var(--minimal-bg-opacity,1))',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-warning-200)/var(--minimal-border-opacity,1))',
  'padding': '1rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-800)/var(--minimal-text-opacity,1))',
}}>暂无 data（批量卡密）类型的卡密组，请先创建一个再充卡密。</MuiBox>
              ) : (
                <>
                  <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                    <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>选择卡密组</MuiBox>
                    <MuiBox component='select' value={state.appendTargetId} onChange={handleTargetChange} sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}>
                      {dataCards.map(renderCardOption)}
                    </MuiBox>
                  </MuiBox>
                  <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                    <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>卡密号（每行一个）</MuiBox>
                    <MuiBox component='textarea' value={state.appendContent} onChange={handleAppendContentChange} placeholder={'VIP-001\nVIP-002\nVIP-003'} sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'height': '10rem',
  'resize': 'vertical',
}} />
                    <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>预览：{state.appendPreview.length} 个有效卡密，空行自动忽略。</MuiBox>
                  </MuiBox>
                  {state.appendError && (
                    <MuiBox component='div' sx={{
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-danger-200)/var(--minimal-border-opacity,1))',
  'padding': '.75rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'gap': '.75rem',
}}>
                      <span>{state.appendError}</span>
                      <MuiBox component='button' type="button" onClick={handleRetryAppend} disabled={state.batchBusy} sx={{ 'fontWeight': '700', 'whiteSpace': 'nowrap' }}>重试</MuiBox>
                    </MuiBox>
                  )}
                  {state.appendResult && <MuiBox component='div' sx={{
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-success-200)/var(--minimal-border-opacity,1))',
  'padding': '.75rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
  'fontWeight': '700',
}}>已追加 {state.appendResult.added} 个卡密</MuiBox>}
                </>
              )}
            </MuiBox>
          )}
        </MuiBox>

        <MuiBox component='div' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1rem',
  'paddingBottom': '1rem',
  'borderTopWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'flex-end',
  'gap': '.75rem',
}}>
          <MuiBox component='button' onClick={handleClose} sx={{
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>关闭</MuiBox>
          {state.batchTab === 'create' ? (
            <MuiBox component='button' onClick={handleSubmitCreate} disabled={!state.batchFile || state.batchBusy} sx={{
  'background': 'rgb(var(--minimal-color-brand))',
  'color': 'rgb(var(--minimal-color-white))',
  'fontWeight': '700',
  'border': 'none',
  'transition': 'all .2s cubic-bezier(.25,.8,.25,1)',
  'cursor': 'pointer',
  '&:hover:not(:disabled)': {
    'background': 'rgb(var(--minimal-color-brand-highlight))',
    'transform': 'translateY(-1px)',
    'boxShadow': 'var(--minimal-shadow-brand-strong)',
  },
  '&:active:not(:disabled)': { 'transform': 'translateY(1px)', 'boxShadow': 'var(--minimal-shadow-brand-soft)' },
  '&:disabled': {
    'background': 'rgb(var(--minimal-color-neutral-100))',
    'color': 'rgb(var(--minimal-color-neutral-400))',
    'boxShadow': 'none',
    'transform': 'none',
    'cursor': 'not-allowed',
    'opacity': '.5',
  },
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
}}>
              {state.batchBusy ? <MuiBox component={Loader2} sx={{ 'width': '1rem', 'height': '1rem', 'animation': 'spin 1s linear infinite' }} /> : <MuiBox component={Upload} sx={{ 'width': '1rem', 'height': '1rem' }} />}{state.batchBusy ? '处理中...' : '上传创建'}
            </MuiBox>
          ) : (
            <MuiBox component='button' onClick={handleSubmitAppend} disabled={!state.appendTargetId || state.appendPreview.length === 0 || state.batchBusy || dataCards.length === 0} sx={{
  'background': 'rgb(var(--minimal-color-brand))',
  'color': 'rgb(var(--minimal-color-white))',
  'fontWeight': '700',
  'border': 'none',
  'transition': 'all .2s cubic-bezier(.25,.8,.25,1)',
  'cursor': 'pointer',
  '&:hover:not(:disabled)': {
    'background': 'rgb(var(--minimal-color-brand-highlight))',
    'transform': 'translateY(-1px)',
    'boxShadow': 'var(--minimal-shadow-brand-strong)',
  },
  '&:active:not(:disabled)': { 'transform': 'translateY(1px)', 'boxShadow': 'var(--minimal-shadow-brand-soft)' },
  '&:disabled': {
    'background': 'rgb(var(--minimal-color-neutral-100))',
    'color': 'rgb(var(--minimal-color-neutral-400))',
    'boxShadow': 'none',
    'transform': 'none',
    'cursor': 'not-allowed',
    'opacity': '.5',
  },
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
}}>
              {state.batchBusy ? <MuiBox component={Loader2} sx={{ 'width': '1rem', 'height': '1rem', 'animation': 'spin 1s linear infinite' }} /> : <MuiBox component={Plus} sx={{ 'width': '1rem', 'height': '1rem' }} />}{state.batchBusy ? '处理中...' : '追加卡密'}
            </MuiBox>
          )}
        </MuiBox>
      </MuiBox>
    </MinimalDialogSurface>
  );
};

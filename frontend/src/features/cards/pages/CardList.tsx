import MuiBox from '@mui/material/Box';
import { Copy,CreditCard,Edit,FileText,Globe,Image as ImageIcon,Package,Plus,Save,Search,SlidersHorizontal,Trash2,Upload,X } from 'lucide-react';
import React from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { Card, testCardAPI } from '../api';
import { useCardActions } from '../cardActions';
import { APIRequestBuilder } from '../components/APIRequestBuilder';
import { BatchCardImportModal } from '../components/BatchCardImportModal';
import { CardIcon } from '../components/CardIcon';
import { useCardBatchActions,useCardsData } from '../hooks';
import { MinimalDialogSurface, MinimalEmptyState, MinimalFilterToolbar, MinimalPageFrame, MinimalStatusChip, MinimalTableShell } from '@/components/minimal';

// CardList 渲染卡密列表组件。
const CardList: React.FC = () => {
  // { 解构得到当前 Hook 返回的状态和操作函数。
  const { cards, loadCards } = useCardsData();
  // cardActions 集中管理卡密编辑、新增、删除、筛选和模板动作。
  const cardActions = useCardActions({ cards, loadCards });
  // actionState 解构得到卡密页面动作协调器状态和方法。
  const {
    dataCards,
    filteredCards,
    typeFilter,
    setTypeFilter,
    nameSearch,
    setNameSearch,
    showEditModal,
    setShowEditModal,
    showAddModal,
    setShowAddModal,
    selectedCard,
    editForm,
    setEditForm,
    addForm,
    setAddForm,
    handleEdit,
    handleSaveEdit,
    handleDelete,
    handleAddCard,
    toggleCardStatus,
    copyCardID,
    downloadCardTemplate,
  } = cardActions;
  // batchState 批量发布状态。
  const batchState = useCardBatchActions({ dataCards, loadCards });

  return (
    <MinimalPageFrame
      title="卡密库存"
      description="管理自动发货的卡密、链接或图片资源。"
      actions={(
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button variant="outlined" startIcon={<Upload size={17} />} onClick={batchState.openBatchModal}>批量导入</Button>
          <Button variant="contained" startIcon={<Plus size={17} />} onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowAddModal(true)}>添加新卡密</Button>
        </Stack>
      )}
    >
      <MinimalTableShell data-page-surface="minimal-card-inventory">
        <MinimalFilterToolbar>
          <MuiBox component='div' sx={{
  'display': 'flex',
  'flex': '1 1 0%',
  'flexDirection': 'column',
  'gap': '.75rem',
  '@media (min-width:640px)': { 'flexDirection': 'row' },
}}>
            <MuiBox component='div' sx={{
  'position': 'relative',
  '@media (min-width:640px)': { 'width': '12rem' },
}}>
              <MuiBox component={SlidersHorizontal} sx={{
  'pointerEvents': 'none',
  'position': 'absolute',
  'left': '1rem',
  'top': '50%',
  'height': '1rem',
  'width': '1rem',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}} />
              <MuiBox component='select'
                aria-label="按卡密类型筛选"
                value={typeFilter}
                onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setTypeFilter(event.target.value as Card['type'] | '')}
                sx={{
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
  'width': '100%',
  'borderRadius': '8px',
  'borderStyle': 'none',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'paddingLeft': '2.5rem',
  'paddingRight': '2.25rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}}
              >
                <option value="">全部类型</option>
                <option value="data">批量卡密</option>
                <option value="text">文本</option>
                <option value="api">API</option>
                <option value="image">图片</option>
              </MuiBox>
            </MuiBox>
            <MuiBox component='div' sx={{
  'position': 'relative',
  'width': '100%',
  '@media (min-width:640px)': { 'maxWidth': '24rem' },
}}>
              <MuiBox component={Search} sx={{
  'pointerEvents': 'none',
  'position': 'absolute',
  'left': '1rem',
  'top': '50%',
  'height': '1rem',
  'width': '1rem',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}} />
              <MuiBox component='input'
                type="search"
                aria-label="按卡密名称搜索"
                placeholder="搜索卡密名称..."
                value={nameSearch}
                onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setNameSearch(event.target.value)}
                sx={{
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
  'width': '100%',
  'borderRadius': '8px',
  'borderStyle': 'none',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'paddingLeft': '2.5rem',
  'paddingRight': '1rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}}
              />
            </MuiBox>
          </MuiBox>
          <MuiBox component='div' sx={{
  'whiteSpace': 'nowrap',
  'paddingLeft': '.25rem',
  'paddingRight': '.25rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>
            显示 {filteredCards.length} / {cards.length} 组
          </MuiBox>
        </MinimalFilterToolbar>
        <MuiBox component='div' sx={{ 'overflowX': 'auto' }}>
          <MuiBox component='table' sx={{ 'width': '100%', 'tableLayout': 'fixed', 'textAlign': 'left', 'borderCollapse': 'collapse' }}>
            <thead>
              <MuiBox component='tr' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  'textTransform': 'uppercase',
  'letterSpacing': '.05em',
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-border-opacity,1))',
}}>
                <MuiBox component='th' sx={{
  'width': '23%',
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
}}>卡密名称</MuiBox>
                <MuiBox component='th' sx={{
  'width': '8%',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
}}>卡密组ID</MuiBox>
                <MuiBox component='th' sx={{
  'width': '7%',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
}}>类型</MuiBox>
                <MuiBox component='th' sx={{
  'width': '27%',
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
}}>内容/库存</MuiBox>
                <MuiBox component='th' sx={{
  'width': '19%',
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
}}>描述</MuiBox>
                <MuiBox component='th' sx={{
  'width': '7%',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
}}>状态</MuiBox>
                <MuiBox component='th' sx={{
  'width': '9%',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
  'textAlign': 'right',
}}>操作</MuiBox>
              </MuiBox>
            </thead>
            <MuiBox component='tbody' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-divide-y-reverse': '0',
    'borderTopWidth': 'calc(1px*(1 - var(--minimal-divide-y-reverse)))',
    'borderBottomWidth': 'calc(1px*var(--minimal-divide-y-reverse))',
    '--minimal-divide-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-divide-opacity,1))',
  },
}}>
              {filteredCards.map(/* 当前回调处理集合中的单个元素。 */ (card) => {
                // 计算库存或内容预览
                let stockInfo = '';
                if (card.type === 'data' && card.data_content) {
                  // lines 文本行列表。
                  const lines = card.data_content.split('\n').filter(/* 当前回调处理集合中的单个元素。 */ line => line.trim());
                  stockInfo = `库存: ${lines.length} 条`;
                } else if (card.type === 'text' && card.text_content) {
                  stockInfo = card.text_content;
                } else if (card.type === 'api' && card.api_config) {
                  stockInfo = card.api_config.url;
                } else if (card.type === 'image' && card.image_url) {
                  stockInfo = '图片链接';
                }

                return (
                  <MuiBox component='tr' key={card.id} sx={{
  '&:hover': { 'backgroundColor': 'rgb(var(--minimal-color-warning-50)/.5)' },
  '&:hover [data-card-icon-shell]': { bgcolor: 'background.paper' },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>
                    <MuiBox component='td' sx={{
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
  'verticalAlign': 'middle',
}}>
                      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.625rem' }}>
                        <MuiBox component='div' data-card-icon-shell sx={{
  'flexShrink': '0',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'padding': '.5rem',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>
                          <CardIcon type={card.type} />
                        </MuiBox>
                        <MuiBox component='span' sx={{
  'overflow': 'hidden',
  'display': '-webkit-box',
  'WebkitBoxOrient': 'vertical',
  'WebkitLineClamp': '3',
  'minWidth': '0',
  'fontSize': '13px',
  'fontWeight': '700',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}} title={card.name}>{card.name}</MuiBox>
                      </MuiBox>
                    </MuiBox>
                    <MuiBox component='td' sx={{ 'paddingLeft': '.75rem', 'paddingRight': '.75rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }}>
                      <MuiBox component='button'
                        onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => copyCardID(card.id)}
                        sx={{
  'display': 'inline-flex',
  'maxWidth': '100%',
  'alignItems': 'center',
  'gap': '.25rem',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.375rem',
  'paddingBottom': '.375rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '11px',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
}}
                        title="复制卡密组ID，用于批量铺货表格"
                      >
                        <MuiBox component='span' sx={{ 'overflow': 'hidden', 'textOverflow': 'ellipsis', 'whiteSpace': 'nowrap' }}>{card.id}</MuiBox>
                        <MuiBox component={Copy} sx={{ 'height': '.75rem', 'width': '.75rem', 'flexShrink': '0' }} />
                      </MuiBox>
                    </MuiBox>
                    <MuiBox component='td' sx={{ 'paddingLeft': '.5rem', 'paddingRight': '.5rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }}>
                      <MinimalStatusChip
                        color={card.type === 'data' ? 'secondary' : card.type === 'image' ? 'warning' : 'info'}
                        label={card.type === 'text' ? '文本' : card.type === 'data' ? '批量' : card.type === 'api' ? 'API' : '图片'}
                      />
                    </MuiBox>
                    <MuiBox component='td' sx={{ 'paddingLeft': '1.25rem', 'paddingRight': '1.25rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }}>
                      <MuiBox component='span' sx={{
  'overflow': 'hidden',
  'display': '-webkit-box',
  'WebkitBoxOrient': 'vertical',
  'WebkitLineClamp': '3',
  'wordBreak': 'break-all',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}} title={stockInfo}>
                        {stockInfo}
                      </MuiBox>
                    </MuiBox>
                    <MuiBox component='td' sx={{ 'paddingLeft': '1.25rem', 'paddingRight': '1.25rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }}>
                      <MuiBox component='span'
                        sx={{
  'display': 'block',
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}
                        title={card.description || '-'}
                      >
                        {card.description || '-'}
                      </MuiBox>
                    </MuiBox>
                    <MuiBox component='td' sx={{ 'paddingLeft': '.5rem', 'paddingRight': '.5rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }}>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <MinimalStatusChip color={card.enabled ? 'success' : 'default'} label={card.enabled ? '启用' : '停用'} />
                      <MuiBox component='button'
                        onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => toggleCardStatus(card)}
                        aria-label={`切换卡密 ${card.name} 状态`}
                        sx={[{
  'width': '3rem',
  'height': '2rem',
  'borderRadius': '9999px',
  'position': 'relative',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, card.enabled ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-500)/var(--minimal-bg-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-bg-opacity,1))',
}]}
                      >
                        <MuiBox component='div' sx={[{
  'position': 'absolute',
  'top': '.25rem',
  'width': '1.5rem',
  'height': '1.5rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '9999px',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  'transitionProperty': 'transform',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, card.enabled ? { 'left': '1.25rem' } : { 'left': '.25rem' }]}></MuiBox>
                      </MuiBox>
                      </Stack>
                    </MuiBox>
                    <MuiBox component='td' sx={{ 'paddingLeft': '.75rem', 'paddingRight': '.75rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }}>
                      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'flex-end', 'gap': '.125rem' }}>
                        <Tooltip title="编辑"><IconButton
                          onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleEdit(card)}
                          title="编辑"
                          aria-label={`编辑卡密 ${card.name}`}
                          size="small"
                        >
                          <Edit size={16} />
                        </IconButton></Tooltip>
                        <Tooltip title="删除"><IconButton
                          onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleDelete(card.id)}
                          aria-label={`删除卡密 ${card.name}`}
                          title="删除"
                          size="small"
                          color="error"
                        >
                          <Trash2 size={16} />
                        </IconButton></Tooltip>
                      </MuiBox>
                    </MuiBox>
                  </MuiBox>
                );
              })}
            </MuiBox>
          </MuiBox>
        </MuiBox>

        {filteredCards.length === 0 && (
          <MinimalEmptyState
            icon={<Package size={42} />}
            title={cards.length === 0 ? '暂无卡密配置' : '没有符合当前筛选条件的卡密组'}
            description={cards.length === 0 ? '使用右上角入口添加卡密。' : '调整筛选条件后重试。'}
          />
        )}
      </MinimalTableShell>

      {/* 编辑卡密弹窗 - 使用 Minimal Dialog 管理焦点与响应式遮罩 */}
      {showEditModal && selectedCard && (
        <MinimalDialogSurface open onClose={/* closeEditCardDialog 关闭卡密编辑弹窗。 */ () => setShowEditModal(false)} maxWidth="md" aria-labelledby="edit-card-title">
          <MuiBox component='div' sx={{ 'width': '100%' }}>
            <MuiBox component='div' sx={{
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'flexShrink': '0',
  'padding': '2rem 2rem 1.5rem',
  'borderBottom': '1px solid rgb(var(--minimal-color-neutral-100))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='h3' id="edit-card-title" sx={{
  'fontSize': '1.5rem',
  'lineHeight': '2rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>编辑卡密</MuiBox>
              <MuiBox component='button'
                onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowEditModal(false)}
                sx={{
  'padding': '.5rem',
  'borderRadius': '8px',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
              >
                <MuiBox component={X} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}} />
              </MuiBox>
            </MuiBox>

            <MuiBox component='div' sx={{
  'flex': '1 1 auto',
  'overflowY': 'auto',
  'overflowX': 'hidden',
  'padding': '2rem',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
}}>
                {/* 基本信息 */}
                <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:768px)': { 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))' },
  'gap': '1rem',
}}>
                  <div>
                    <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>卡密名称 <MuiBox component='span' sx={{
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-500)/var(--minimal-text-opacity,1))',
}}>*</MuiBox></MuiBox>
                    <MuiBox component='input'
                      type="text"
                      value={editForm.name || ''}
                      onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setEditForm({ ...editForm, name: e.target.value })}
                      sx={{
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
}}
                      placeholder="例如：游戏点卡、会员卡等"
                    />
                  </div>
                  <div>
                    <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>卡券类型</MuiBox>
                    <MuiBox component='select'
                      value={editForm.type || 'text'}
                      onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setEditForm({ ...editForm, type: e.target.value as any })}
                      sx={{
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
}}
                    >
                      <option value="">请选择类型</option>
                      <option value="data">批量库存</option>
                      <option value="text">固定文字</option>
                      <option value="image">图片</option>
                      <option value="api">API 接口</option>
                    </MuiBox>
                  </div>
                </MuiBox>

                {/* API 配置 */}
                {editForm.type === 'api' && (
                  <>
                    <APIRequestBuilder
                      url={editForm.api_url || ''}
                      method={editForm.api_method || 'GET'}
                      timeout={editForm.api_timeout || 10}
                      headers={editForm.api_headers || ''}
                      params={editForm.api_params || ''}
                      contentType={editForm.api_content_type || 'application/json'}
                      body={editForm.api_body || ''}
                      responsePath={editForm.api_response_path || ''}
                      retryEnabled={editForm.api_retry_enabled || false}
                      headersAction={editForm.api_headers_action || 'retain'}
                      paramsAction={editForm.api_params_action || 'retain'}
	                      onTest={/* editAPITest 使用当前编辑草稿发起临时 API 测试，不保存草稿。 */ () => testCardAPI({ url: editForm.api_url || '', method: editForm.api_method || 'GET', timeout_seconds: editForm.api_timeout || 10, headers: editForm.api_headers || undefined, params: editForm.api_params || undefined, content_type: editForm.api_content_type || 'application/json', body: editForm.api_body || undefined, response_path: editForm.api_response_path || undefined, retry_enabled: editForm.api_retry_enabled || false })}
                      onChange={/* 当前回调把 API 请求编辑器字段写回编辑草稿。 */ (field, value) => setEditForm(/* currentUpdater 基于最新编辑草稿合并 API 字段。 */ current => ({
                        ...current,
                        ...(field === 'url' ? { api_url: String(value) } : {}),
                        ...(field === 'method' ? { api_method: value as 'GET' | 'POST' } : {}),
                        ...(field === 'timeout' ? { api_timeout: Number(value) } : {}),
                        ...(field === 'headers' ? { api_headers: String(value) } : {}),
                        ...(field === 'params' ? { api_params: String(value) } : {}),
                        ...(field === 'contentType' ? { api_content_type: String(value) } : {}),
                        ...(field === 'body' ? { api_body: String(value) } : {}),
                        ...(field === 'responsePath' ? { api_response_path: String(value) } : {}),
                        ...(field === 'retryEnabled' ? { api_retry_enabled: Boolean(value) } : {}),
                        ...(field === 'headersAction' ? { api_headers_action: value as 'retain' | 'replace' | 'clear' } : {}),
                        ...(field === 'paramsAction' ? { api_params_action: value as 'retain' | 'replace' | 'clear' } : {}),
                      }))}
                    />
                  </>
                )}

                {/* 固定文字配置 */}
                {editForm.type === 'text' && (
                  <MuiBox component='div' sx={{
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  'borderRadius': '8px',
  'padding': '1rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
}}>
                    <MuiBox component='h3' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'marginBottom': '.75rem',
}}>固定文字配置</MuiBox>
                    <div>
                      <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>文字内容</MuiBox>
                      <MuiBox component='textarea'
                        value={editForm.text_content || ''}
                        onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setEditForm({ ...editForm, text_content: e.target.value })}
                        sx={{
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
  'height': '8rem',
  'resize': 'none',
}}
                        placeholder="请输入要发送的固定文字内容..."
                      />
                    </div>
                  </MuiBox>
                )}

                {/* 批量数据配置 */}
                {editForm.type === 'data' && (
                  <MuiBox component='div' sx={{
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  'borderRadius': '8px',
  'padding': '1rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
}}>
                    <MuiBox component='h3' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'marginBottom': '.75rem',
}}>批量数据配置</MuiBox>
                    <div>
                      <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>数据内容（一行一个）</MuiBox>
                      <MuiBox component='textarea'
                        value={editForm.data_content || ''}
                        onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setEditForm({ ...editForm, data_content: e.target.value })}
                        sx={{
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
  'height': '20rem',
  'resize': 'none',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                        placeholder="请输入数据，每行一个：&#10;卡号1:密码1&#10;卡号2:密码2&#10;或者&#10;兑换码1&#10;兑换码2"
                      />
                      <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.5rem',
}}>支持格式：卡号:密码 或 单独的兑换码</MuiBox>
                      <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>当前库存：<MuiBox component='span' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
}}>
                        {editForm.data_content ? editForm.data_content.split('\n').filter(/* 当前回调处理集合中的单个元素。 */ line => line.trim()).length : 0}
                      </MuiBox> 条</MuiBox>
                    </div>
                  </MuiBox>
                )}

                {/* 图片配置 */}
                {editForm.type === 'image' && (
                  <MuiBox component='div' sx={{
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  'borderRadius': '8px',
  'padding': '1rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
}}>
                    <MuiBox component='h3' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'marginBottom': '.75rem',
}}>图片配置</MuiBox>
                    <div>
                      <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>图片 URL</MuiBox>
                      <MuiBox component='input'
                        type="url"
                        value={editForm.image_url || ''}
                        onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setEditForm({ ...editForm, image_url: e.target.value })}
                        sx={{
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
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                        placeholder="https://example.com/image.png"
                      />
                      <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.5rem',
}}>仅保存图片 URL；发货时会临时下载并上传到闲鱼</MuiBox>
                    </div>
                    {editForm.image_url && (
                      <MuiBox component='div' sx={{ 'marginTop': '.75rem' }}>
                        <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>图片预览</MuiBox>
                        <MuiBox component='img'
                          src={editForm.image_url}
                          alt="预览"
                          sx={{
  'maxWidth': '100%',
  'maxHeight': '12rem',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
}}
                          onError={/* 当前回调处理用户交互或异步状态变化。 */ (e) => { e.currentTarget.src = 'https://via.placeholder.com/400x200?text=图片加载失败'; }}
                        />
                      </MuiBox>
                    )}
                  </MuiBox>
                )}

                {/* 延时发货时间 */}
                <div>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>延时发货时间（秒）</MuiBox>
                  <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.5rem' }}>
                    <MuiBox component='input'
                      type="number"
                      value={editForm.delay_seconds || 0}
                      onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setEditForm({ ...editForm, delay_seconds: parseInt(e.target.value) || 0 })}
                      sx={{
  'flex': '1 1 0%',
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
}}
                      min="0"
                      max="3600"
                      placeholder="0"
                    />
                    <MuiBox component='span' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'whiteSpace': 'nowrap',
}}>秒</MuiBox>
                  </MuiBox>
                  <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>0表示立即发货，最大3600秒（1小时）</MuiBox>
                </div>

                {/* 备注信息 */}
                <div>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>备注信息</MuiBox>
                  <MuiBox component='textarea'
                    value={editForm.description || ''}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setEditForm({ ...editForm, description: e.target.value })}
                    sx={{
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
  'height': '10rem',
  'resize': 'none',
}}
                    placeholder="可选的备注信息"
                  />
                </div>

                {/* 启用状态 */}
                <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'padding': '1rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'borderRadius': '8px',
}}>
                  <MuiBox component='span' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>启用状态</MuiBox>
                  <MuiBox component='button'
                    type="button"
                    onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setEditForm({ ...editForm, enabled: !editForm.enabled })}
                    sx={[{
  'width': '3.5rem',
  'height': '2rem',
  'borderRadius': '9999px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.3s',
  'position': 'relative',
}, editForm.enabled ? { '--minimal-bg-opacity': '1', 'backgroundColor': 'rgb(var(--minimal-color-brand))' } : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-bg-opacity,1))',
}]}
                  >
                    <MuiBox component='span'
                      sx={[{
  'position': 'absolute',
  'top': '.25rem',
  'width': '1.5rem',
  'height': '1.5rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '9999px',
  '--minimal-shadow': 'var(--minimal-shadow-md)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-md)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  'transitionProperty': 'transform',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.3s',
  'display': 'block',
}, editForm.enabled ? {
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  '--minimal-translate-x': '1.75rem',
} : {
  '--minimal-translate-x': '0.25rem',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
}]}
                    />
                  </MuiBox>
                </MuiBox>
              </MuiBox>
            </MuiBox>

            <MuiBox component='div' sx={{
  'flexShrink': '0',
  'padding': '1.5rem 2rem 2rem',
  'borderTop': '1px solid rgb(var(--minimal-color-neutral-100))',
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='div' sx={{ 'display': 'flex', 'gap': '.75rem', 'width': '100%' }}>
                <MuiBox component='button'
                  onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowEditModal(false)}
                  sx={{
  'flex': '1 1 0%',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontWeight': '700',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                >
                  取消
                </MuiBox>
                <MuiBox component='button'
                  onClick={handleSaveEdit}
                  sx={{
  'flex': '1 1 0%',
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
  },
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
}}
                >
                  <MuiBox component={Save} sx={{ 'width': '1rem', 'height': '1rem' }} />
                  保存更改
                </MuiBox>
              </MuiBox>
            </MuiBox>
          </MuiBox>
        </MinimalDialogSurface>
      )}

      {/* 添加新卡密弹窗 - 使用 Minimal Dialog 管理焦点与响应式遮罩 */}
      {showAddModal && (
        <MinimalDialogSurface open onClose={/* closeAddCardDialog 关闭新增卡密弹窗。 */ () => setShowAddModal(false)} maxWidth="lg" aria-labelledby="add-card-title">
          <MuiBox component='div' sx={{ 'width': '100%' }}>
            <MuiBox component='div' sx={{
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'flexShrink': '0',
  'padding': '2rem 2rem 1.5rem',
  'borderBottom': '1px solid rgb(var(--minimal-color-neutral-100))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'gap': '1rem',
}}>
              <div>
                <MuiBox component='h3' id="add-card-title" sx={{
  'fontSize': '1.5rem',
  'lineHeight': '2rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>添加新卡密</MuiBox>
                <MuiBox component='p' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>选择交付方式并录入自动发货内容</MuiBox>
              </div>
              <MuiBox component='button'
                onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowAddModal(false)}
                sx={{
  'padding': '.5rem',
  'borderRadius': '8px',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  'flexShrink': '0',
}}
                title="关闭"
              >
                <MuiBox component={X} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}} />
              </MuiBox>
            </MuiBox>

            <MuiBox component='div' sx={{
  'flex': '1 1 auto',
  'overflowY': 'auto',
  'overflowX': 'hidden',
  'padding': '2rem',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.5rem*var(--minimal-space-y-reverse))',
  },
}}>
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
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>卡密名称</MuiBox>
                  <MuiBox component='input'
                    type="text"
                    value={addForm.name}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="例如：VIP会员卡密"
                    sx={{
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
}}
                  />
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
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>类型</MuiBox>
                  <MuiBox component='div' sx={{ 'display': 'grid', 'gridTemplateColumns': 'repeat(4,minmax(0,1fr))', 'gap': '.5rem' }}>
                    <MuiBox component='button'
                      type="button"
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setAddForm({ ...addForm, type: 'data', content: '' })}
                      sx={[{
  'padding': '.75rem',
  'borderRadius': '8px',
  'fontWeight': '700',
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, addForm.type === 'data' ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
}]}
                    >
                      <MuiBox component={CreditCard} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  'marginLeft': 'auto',
  'marginRight': 'auto',
  'marginBottom': '.25rem',
}} />
                      批量库存
                    </MuiBox>
                    <MuiBox component='button'
                      type="button"
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setAddForm({ ...addForm, type: 'text', content: '' })}
                      sx={[{
  'padding': '.75rem',
  'borderRadius': '8px',
  'fontWeight': '700',
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, addForm.type === 'text' ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}]}
                    >
                      <MuiBox component={FileText} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  'marginLeft': 'auto',
  'marginRight': 'auto',
  'marginBottom': '.25rem',
}} />
                      文本
                    </MuiBox>
                    <MuiBox component='button'
                      type="button"
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setAddForm({ ...addForm, type: 'image', content: '' })}
                      sx={[{
  'padding': '.75rem',
  'borderRadius': '8px',
  'fontWeight': '700',
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, addForm.type === 'image' ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}]}
                    >
                      <MuiBox component={ImageIcon} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  'marginLeft': 'auto',
  'marginRight': 'auto',
  'marginBottom': '.25rem',
}} />
                      图片
                    </MuiBox>
                    <MuiBox component='button'
                      type="button"
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setAddForm({ ...addForm, type: 'api', content: '' })}
                      sx={[{
  'padding': '.75rem',
  'borderRadius': '8px',
  'fontWeight': '700',
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, addForm.type === 'api' ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
}]}
                    >
                      <MuiBox component={Globe} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  'marginLeft': 'auto',
  'marginRight': 'auto',
  'marginBottom': '.25rem',
}} />
                      API 接口
                    </MuiBox>
                  </MuiBox>
                </MuiBox>

                {addForm.type !== 'api' && <MuiBox component='div' sx={{
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
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>
                    {addForm.type === 'data' ? '库存内容（一行一个）' : addForm.type === 'text' ? '固定回复内容' : '图片 URL'}
                  </MuiBox>
                  {addForm.type === 'image' ? (
                    <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                      <MuiBox component='input'
                        type="url"
                        value={addForm.content}
                        onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setAddForm({ ...addForm, content: e.target.value })}
                        sx={{
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
}}
                        placeholder="https://example.com/card.png"
                      />
                      <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>仅保存图片 URL；发货时会临时下载并上传到闲鱼</MuiBox>
                    </MuiBox>
                  ) : (
                    <MuiBox component='textarea'
                      value={addForm.content}
                      onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setAddForm({ ...addForm, content: e.target.value })}
                      sx={[{
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
  'resize': 'none',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}, addForm.type === 'data' ? {
  'height': '12rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
} : { 'height': '8rem' }]}
                      placeholder={addForm.type === 'data' ? 'CODE-123456\nCODE-789012\n...' : '请输入每次发货时发送的固定文字'}
                    />
                  )}
                  {addForm.type === 'data' && (
                    <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>当前库存：<MuiBox component='span' sx={{ 'fontWeight': '700', '--minimal-text-opacity': '1', 'color': 'rgb(var(--minimal-color-brand))' }}>{addForm.content.split('\n').filter(/* 当前回调处理集合中的单个元素。 */ line => line.trim()).length}</MuiBox> 条</MuiBox>
                  )}
                </MuiBox>}

                {addForm.type === 'api' && (
                  <>
                    <APIRequestBuilder
                      url={addForm.content}
                      method={addForm.api_method}
                      timeout={addForm.api_timeout}
                      headers={addForm.api_headers}
                      params={addForm.api_params}
                      contentType={addForm.api_content_type}
                      body={addForm.api_body}
                      responsePath={addForm.api_response_path}
                      retryEnabled={addForm.api_retry_enabled}
	                      onTest={/* addAPITest 使用当前新增草稿发起临时 API 测试，不创建卡密。 */ () => testCardAPI({ url: addForm.content, method: addForm.api_method, timeout_seconds: addForm.api_timeout, headers: addForm.api_headers || undefined, params: addForm.api_params || undefined, content_type: addForm.api_content_type, body: addForm.api_body || undefined, response_path: addForm.api_response_path || undefined, retry_enabled: addForm.api_retry_enabled })}
                      onChange={/* 当前回调把 API 请求编辑器字段写回新增草稿。 */ (field, value) => setAddForm(/* currentUpdater 基于最新新增草稿合并 API 字段。 */ current => ({
                        ...current,
                        ...(field === 'url' ? { content: String(value) } : {}),
                        ...(field === 'method' ? { api_method: value as 'GET' | 'POST' } : {}),
                        ...(field === 'timeout' ? { api_timeout: Number(value) } : {}),
                        ...(field === 'headers' ? { api_headers: String(value) } : {}),
                        ...(field === 'params' ? { api_params: String(value) } : {}),
                        ...(field === 'contentType' ? { api_content_type: String(value) } : {}),
                        ...(field === 'body' ? { api_body: String(value) } : {}),
                        ...(field === 'responsePath' ? { api_response_path: String(value) } : {}),
                        ...(field === 'retryEnabled' ? { api_retry_enabled: Boolean(value) } : {}),
                      }))}
                    />
                  </>
                )}

                <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:640px)': { 'gridTemplateColumns': '1fr 180px' },
  'gap': '1rem',
}}>
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
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>描述</MuiBox>
                    <MuiBox component='input' value={addForm.description} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setAddForm({...addForm, description: e.target.value})} placeholder="卡密用途描述（可选）" sx={{
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
}} />
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
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>延时发货（秒）</MuiBox>
                    <MuiBox component='input' type="number" value={addForm.delay_seconds} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setAddForm({...addForm, delay_seconds: parseInt(e.target.value) || 0})} sx={{
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
}} min="0" max="3600" />
                  </MuiBox>
                </MuiBox>

              </MuiBox>
            </MuiBox>

            <MuiBox component='div' sx={{
  'flexShrink': '0',
  'padding': '1.5rem 2rem 2rem',
  'borderTop': '1px solid rgb(var(--minimal-color-neutral-100))',
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='div' sx={{ 'display': 'flex', 'gap': '.75rem', 'width': '100%' }}>
                <MuiBox component='button'
                  onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowAddModal(false)}
                  sx={{
  'flex': '1 1 0%',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontWeight': '700',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                >
                  取消
                </MuiBox>
                <MuiBox component='button'
                  onClick={handleAddCard}
                  sx={{
  'flex': '1 1 0%',
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
  },
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
}}
                >
                  <MuiBox component={Plus} sx={{ 'width': '1rem', 'height': '1rem' }} />
                  添加卡密
                </MuiBox>
              </MuiBox>
            </MuiBox>
          </MuiBox>
        </MinimalDialogSurface>
      )}

      {/* 批量导入弹窗由 cards feature 组件负责渲染和请求边界。 */}
      <BatchCardImportModal
        dataCards={dataCards}
        downloadCardTemplate={downloadCardTemplate}
        {...batchState}
      />


    </MinimalPageFrame>
  );
};

export default CardList;

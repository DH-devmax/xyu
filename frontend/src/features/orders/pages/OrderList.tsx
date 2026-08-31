import MuiBox from '@mui/material/Box';
import { ChevronLeft,ChevronRight,Edit,ExternalLink,Eye,PackageCheck,Plus,RefreshCw,Save,Trash2,Truck,User as UserIcon,X } from 'lucide-react';
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatLocalDateTime } from '@/shared/dateTime';
import { MinimalDialogSurface, MinimalPageFrame, MinimalResponsiveDrawer, MinimalStatusChip, MinimalTableShell } from '@/components/minimal';
import type { OrderStatus } from '../api';
import { OrderFilterBar } from '../components/OrderFilterBar';
import { OrderImportModal } from '../components/OrderImportModal';
import { useOrderImport,useOrderQuery } from '../hooks';
import { useOrderActions } from '../orderActions';

// StatusBadge 渲染订单状态徽标。
const StatusBadge: React.FC<{ /** status 表示状态。 */ status: OrderStatus }> = ({ status }) => {
  // labels 将服务端状态转换为稳定的中文文案。
  const labels: Record<OrderStatus, string> = {
    processing: '处理中',
    pending_ship: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    refunding: '退款中',
    unknown: '未知',
  };

  // color 将订单状态适配到 Minimal 的语义色。
  const color: 'default' | 'success' | 'info' | 'warning' | 'error' = status === 'completed' ? 'success' : status === 'pending_ship' || status === 'processing' || status === 'shipped' ? 'info' : status === 'refunding' ? 'error' : status === 'cancelled' ? 'default' : 'warning';
  return <MinimalStatusChip color={color} label={labels[status] || status} />;
};

// DetailField 显示订单详情抽屉中的标签和值，并保持长文本可换行。
const DetailField: React.FC<{ /** label 是字段名称。 */ label: string; /** value 是字段值。 */ value: string; /** mono 表示使用等宽字体。 */ mono?: boolean }> = ({ label, value, mono }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 650, fontFamily: mono ? 'monospace' : undefined, overflowWrap: 'anywhere' }}>{value}</Typography>
  </Box>
);

// OrderList 渲染订单列表组件。
const OrderList: React.FC = () => {
  // orderQuery 负责订单查询、筛选、分页和展示辅助数据。
  const orderQuery = useOrderQuery();
  // importState 负责订单导入弹窗、上传取消和失败重试。
  const importState = useOrderImport(orderQuery.loadOrders);
  // { 解构得到当前 Hook 返回的状态和操作函数。
  const { orders, accounts, filter, setFilter, accountFilter, setAccountFilter, searchText, setSearchText, page, setPage, totalPages, loading, loadOrders, accountName, accountNickname, getItemNameById } = orderQuery;
  // orderActions 集中管理订单动作、弹窗状态和异步结果。
  const orderActions = useOrderActions({ orders, page, accountFilter, filter, setPage, loadOrders });
  // actionState 解构得到页面动作协调器的状态和操作函数。
  const {
    showDetailModal,
    selectedOrder,
    showEditModal,
    editingOrder,
    showShipModal,
    shipLoading,
    shipResult,
    syncingOrderId,
    deletingOrderId,
    handleSync,
    handleShip,
    executeShip,
    handleViewDetail,
    handleEdit,
    handleSaveEdit,
    updateEditingOrder,
    handleSyncSingle,
    handleDelete,
    closeDetailModal,
    closeEditModal,
    closeShipModal,
  } = orderActions;

  // handleFilterChange 切换订单状态筛选并回到第一页。
  const handleFilterChange = (value: string) => {
    setFilter(value);
    setPage(1);
    setSearchText('');
  };
  // handleAccountFilterChange 切换账号筛选并回到第一页。
  const handleAccountFilterChange = (value: string) => {
    setAccountFilter(value);
    setPage(1);
  };
  // handleSearchChange 更新订单搜索文本并回到第一页。
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  return (
    <MinimalPageFrame
      title="订单中心"
      description="查看所有闲鱼交易记录与状态。"
      actions={(
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <IconButton aria-label="刷新订单" title="刷新订单" onClick={loadOrders} disabled={loading} size="small">
            <MuiBox component={RefreshCw} size={18} sx={loading ? { 'animation': 'spin 1s linear infinite' } : undefined} />
          </IconButton>
          <Button variant="outlined" size="small" startIcon={<Plus size={16} />} onClick={importState.openImportModal}>插入订单</Button>
          <Button variant="contained" size="small" startIcon={<Truck size={16} />} onClick={handleSync}>一键同步订单</Button>
        </Stack>
      )}
    >
      <MinimalTableShell data-page-surface="minimal-order-table">
        <OrderFilterBar
          filter={filter}
          onFilterChange={handleFilterChange}
          accountFilter={accountFilter}
          onAccountFilterChange={handleAccountFilterChange}
          accounts={accounts}
          accountName={accountName}
          searchText={searchText}
          onSearchChange={handleSearchChange}
        />

        {/* Table */}
        <MuiBox component='div' sx={{ 'overflowX': 'auto', 'minHeight': '400px' }}>
          <MuiBox component='table' sx={{ 'width': '100%', 'textAlign': 'left', 'borderCollapse': 'collapse', 'tableLayout': 'fixed' }}>
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
                <MuiBox component='th' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }} style={{width: '28%'}}>订单信息</MuiBox>
                <MuiBox component='th' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }} style={{width: '26%'}}>买家信息</MuiBox>
                <MuiBox component='th' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }} style={{width: '11%'}}>实付金额</MuiBox>
                <MuiBox component='th' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }} style={{width: '13%'}}>当前状态</MuiBox>
                <MuiBox component='th' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
  'textAlign': 'right',
}} style={{width: '22%'}}>操作</MuiBox>
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
              {orders.map(/* 当前回调处理集合中的单个元素。 */ (order) => (
                <MuiBox component='tr' key={order.id} sx={{
  '&:hover': { 'backgroundColor': 'rgb(var(--minimal-color-warning-50)/.5)' },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>
                  <MuiBox component='td' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }}>
                    <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '1.25rem' }}>
                      <MuiBox component='div' sx={{
  'width': '3.5rem',
  'height': '3.5rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'overflow': 'hidden',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'flexShrink': '0',
}}>
                        {order.item_image ? (
                            <MuiBox component='img' src={order.item_image} alt="" sx={{ 'width': '100%', 'height': '100%', 'objectFit': 'cover' }} />
                        ) : (
                            <MuiBox component='div' sx={{
  'width': '100%',
  'height': '100%',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-text-opacity,1))',
}}><PackageCheck /></MuiBox>
                        )}
                      </MuiBox>
                      <MuiBox component='div' sx={{ 'minWidth': '0' }}>
                        <MuiBox component='div' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'WebkitLineClamp': '1',
  'overflow': 'hidden',
  'display': '-webkit-box',
  'WebkitBoxOrient': 'vertical',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}>
                          {getItemNameById(order.cookie_id, order.item_id, order.item_title)}
                        </MuiBox>
                        <MuiBox component='div' sx={{
  'marginTop': '.25rem',
  'display': 'flex',
  'width': 'fit-content',
  'minWidth': '0',
  'maxWidth': '100%',
  'alignItems': 'center',
  'gap': '.25rem',
  'borderRadius': '6px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  'fontSize': '10px',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
}} title={accountNickname(order.cookie_id)}>
                          <MuiBox component={UserIcon} sx={{ 'height': '.75rem', 'width': '.75rem', 'flexShrink': '0' }} />
                          <MuiBox component='span' sx={{ 'minWidth': '0', 'overflow': 'hidden', 'textOverflow': 'ellipsis', 'whiteSpace': 'nowrap' }}>{accountNickname(order.cookie_id)}</MuiBox>
                        </MuiBox>
                        <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
  'fontWeight': '500',
}}>订单ID: {order.order_id}</MuiBox>
                        <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'marginTop': '.125rem',
}}>数量: {order.quantity} • {formatLocalDateTime(order.created_at)}</MuiBox>
                      </MuiBox>
                    </MuiBox>
                  </MuiBox>
                  <MuiBox component='td' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }}>
                      <MuiBox component='div' sx={{ 'display': 'flex', 'flexDirection': 'column', 'gap': '.25rem' }}>
                          <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>买家ID</MuiBox>
                          <MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>{order.buyer_id}</MuiBox>
                          {order.receiver_name && (
                              <>
                                  <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>收货人</MuiBox>
                                  <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}}>{order.receiver_name}</MuiBox>
                              </>
                          )}
                          {order.receiver_phone && (
                              <>
                                  <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>联系电话</MuiBox>
                                  <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
}}>{order.receiver_phone}</MuiBox>
                              </>
                          )}
                          {order.receiver_address && (
                              <>
                                  <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>收货地址</MuiBox>
                                  <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'WebkitLineClamp': '1',
  'overflow': 'hidden',
  'display': '-webkit-box',
  'WebkitBoxOrient': 'vertical',
}}>{order.receiver_address}</MuiBox>
                              </>
                          )}
                      </MuiBox>
                  </MuiBox>
                  <MuiBox component='td' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
  'fontSize': '1rem',
  'lineHeight': '1.5rem',
  'fontWeight': '800',
  'fontVariantNumeric': 'tabular-nums',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>
                    {order.amount ? `¥${order.amount}` : <MuiBox component='span' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-600)/var(--minimal-text-opacity,1))',
  'fontWeight': '700',
}}>待获取</MuiBox>}
                  </MuiBox>
                  <MuiBox component='td' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1.25rem', 'paddingBottom': '1.25rem' }}>
                    <StatusBadge status={order.status} />
                  </MuiBox>
                  <MuiBox component='td' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1.25rem',
  'paddingBottom': '1.25rem',
  'textAlign': 'right',
}}>
                    {order.status === 'pending_ship' && (
                        <MuiBox component='button'
                            onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleShip(order.order_id)}
                            sx={{
  'marginRight': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-black)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-bg-opacity,1))',
  },
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '--minimal-shadow': 'var(--minimal-shadow-colored)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-lg)',
  '--minimal-shadow-color': 'rgb(var(--minimal-color-neutral-200)/1)',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'borderRadius': '8px',
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:active': {
    '--minimal-scale-x': '.95',
    '--minimal-scale-y': '.95',
    'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  },
}}
                        >
                            立即发货
                        </MuiBox>
                    )}
                    <MuiBox component='a'
                      href={`https://www.goofish.com/order-detail?orderId=${order.order_id}&role=seller`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
  'marginRight': '.5rem',
  'display': 'inline-flex',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  },
  'padding': '.5rem',
  'borderRadius': '8px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                      title="查看闲鱼详情"
                    >
                      <MuiBox component={ExternalLink} sx={{ 'width': '1rem', 'height': '1rem' }} />
                    </MuiBox>
                    <MuiBox component='button'
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleViewDetail(order)}
                      sx={{
  'marginRight': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  },
  'padding': '.5rem',
  'borderRadius': '8px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                      title="查看详情"
                    >
                      <MuiBox component={Eye} sx={{ 'width': '1rem', 'height': '1rem' }} />
                    </MuiBox>
                    <MuiBox component='button'
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleEdit(order)}
                      sx={{
  'marginRight': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-black)/var(--minimal-text-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
  'padding': '.5rem',
  'borderRadius': '8px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                      title="编辑订单"
                    >
                      <MuiBox component={Edit} sx={{ 'width': '1rem', 'height': '1rem' }} />
                    </MuiBox>
                    <MuiBox component='button'
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleSyncSingle(order.order_id)}
                      disabled={syncingOrderId === order.order_id}
                      sx={{
  'marginRight': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-success-600)/var(--minimal-text-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  },
  'padding': '.5rem',
  'borderRadius': '8px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:disabled': { 'opacity': '.5' },
}}
                      title="同步订单"
                    >
                      <MuiBox component={RefreshCw} sx={[{ 'width': '1rem', 'height': '1rem' }, syncingOrderId === order.order_id ? { 'animation': 'spin 1s linear infinite' } : {}]} />
                    </MuiBox>
                    <MuiBox component='button'
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleDelete(order.order_id)}
                      disabled={deletingOrderId === order.order_id}
                      sx={{
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-danger-500)/var(--minimal-text-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  },
  'padding': '.5rem',
  'borderRadius': '8px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:disabled': { 'opacity': '.5' },
}}
                      title="删除订单"
                    >
                      <MuiBox component={Trash2} sx={{ 'width': '1rem', 'height': '1rem' }} />
                    </MuiBox>
                  </MuiBox>
                </MuiBox>
              ))}
            </MuiBox>
          </MuiBox>
        </MuiBox>

        {/* Pagination */}
        <Stack direction="row" sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
            <MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'fontWeight': '500',
  'paddingLeft': '.5rem',
}}>
                第 {page} 页 / 共 {totalPages} 页
            </MuiBox>
            <Stack direction="row" spacing={0.5}>
                <IconButton
                    disabled={page <= 1}
                    onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setPage(/* 当前回调处理用户交互或异步状态变化。 */ p => p - 1)}
                    aria-label="上一页"
                    size="small"
                >
                    <ChevronLeft size={18} />
                </IconButton>
                <IconButton
                    disabled={page >= totalPages}
                    onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setPage(/* 当前回调处理用户交互或异步状态变化。 */ p => p + 1)}
                    aria-label="下一页"
                    size="small"
                >
                    <ChevronRight size={18} />
                </IconButton>
            </Stack>
        </Stack>
      </MinimalTableShell>

      {showDetailModal && selectedOrder && (
        <MinimalResponsiveDrawer open title="订单详情" onClose={closeDetailModal}>
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h3" sx={{ fontSize: '1rem' }}>订单信息</Typography>
                <StatusBadge status={selectedOrder.status} />
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25, p: 1.5, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <DetailField label="订单号" value={selectedOrder.order_id} mono />
                <DetailField label="所属账号" value={accountNickname(selectedOrder.cookie_id)} />
                <DetailField label="实付金额" value={selectedOrder.amount ? `¥${selectedOrder.amount}` : '待获取'} />
                <DetailField label="数量" value={String(selectedOrder.quantity)} />
                <Box sx={{ gridColumn: '1 / -1' }}><DetailField label="创建时间" value={formatLocalDateTime(selectedOrder.created_at)} /></Box>
              </Box>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="h3" sx={{ fontSize: '1rem' }}>商品信息</Typography>
              <Stack direction="row" spacing={1.5} sx={{ p: 1.5, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {selectedOrder.item_image ? <Box component="img" src={selectedOrder.item_image} alt="" sx={{ width: 64, height: 64, borderRadius: 1, objectFit: 'cover' }} /> : <Box sx={{ width: 64, height: 64, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', borderRadius: 1 }}><PackageCheck size={22} /></Box>}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{getItemNameById(selectedOrder.cookie_id, selectedOrder.item_id, selectedOrder.item_title)}</Typography>
                  <Typography variant="caption" color="text.secondary">商品ID: {selectedOrder.item_id}</Typography>
                  {selectedOrder.item_price && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>标价: ¥{selectedOrder.item_price}</Typography>}
                </Box>
              </Stack>
            </Stack>
            <Stack spacing={1}>
              <Typography variant="h3" sx={{ fontSize: '1rem' }}>买家信息</Typography>
              <Stack spacing={1} sx={{ p: 1.5, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <DetailField label="买家ID" value={selectedOrder.buyer_id} />
                {selectedOrder.receiver_name && <DetailField label="收货人" value={selectedOrder.receiver_name} />}
                {selectedOrder.receiver_phone && <DetailField label="联系电话" value={selectedOrder.receiver_phone} mono />}
                {selectedOrder.receiver_address && <DetailField label="收货地址" value={selectedOrder.receiver_address} />}
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button fullWidth variant="outlined" onClick={closeDetailModal}>关闭</Button>
              {selectedOrder.status === 'pending_ship' && <Button fullWidth variant="contained" onClick={/* detailShipAction 关闭详情并进入发货流程。 */ () => { closeDetailModal(); handleShip(selectedOrder.order_id); }}>立即发货</Button>}
            </Stack>
          </Stack>
        </MinimalResponsiveDrawer>
      )}

      <OrderImportModal {...importState} />

      {/* Ship Modal - 发货方式选择 */}
      {showShipModal && (
        <MinimalDialogSurface open onClose={closeShipModal} maxWidth="sm" aria-labelledby="ship-order-title">
          <MuiBox component='div' sx={{ 'width': '100%' }}>
            <MuiBox component='div' sx={{
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'flexShrink': '0',
  'padding': '2rem 2rem 1.5rem',
  'borderBottom': '1px solid rgb(var(--minimal-color-neutral-100))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between', 'width': '100%' }}>
                <MuiBox component='h3' id="ship-order-title" sx={{
  'fontSize': '1.5rem',
  'lineHeight': '2rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>立即发货</MuiBox>
                <MuiBox component='button'
                  onClick={closeShipModal}
                  sx={{
  'padding': '.5rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'borderRadius': '9999px',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
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
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}} />
                </MuiBox>
              </MuiBox>
            </MuiBox>

            <MuiBox component='div' sx={{
  'flex': '1 1 auto',
  'overflowY': 'auto',
  'overflowX': 'hidden',
  'padding': '2rem',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
              <MuiBox component='p' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}}>请选择发货方式：</MuiBox>

              {/* 选项A: 仅修改发货状态 */}
              <MuiBox component='button'
                onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => executeShip('status_only')}
                disabled={shipLoading}
                sx={{
  'width': '100%',
  'textAlign': 'left',
  'padding': '1rem',
  'borderRadius': '8px',
  'borderWidth': '2px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  '&:hover': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-border-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:disabled': { 'opacity': '.5', 'cursor': 'not-allowed' },
}}
              >
                <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'flex-start', 'gap': '.75rem' }}>
                  <MuiBox component='div' sx={{
  'width': '2.5rem',
  'height': '2.5rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-bg-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'flexShrink': '0',
  'marginTop': '.125rem',
}}>
                    <MuiBox component={Truck} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
}} />
                  </MuiBox>
                  <div>
                    <MuiBox component='div' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}>仅修改闲鱼发货状态</MuiBox>
                    <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1.625',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>
                      不实际扣除或发送卡券，仅在闲鱼平台将订单标记为"已发货"。
                      适用于已经给客户发过货、只是忘记在闲鱼修改状态的情况。
                    </MuiBox>
                  </div>
                </MuiBox>
              </MuiBox>

              {/* 选项B: 完整发货流程 */}
              <MuiBox component='button'
                onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => executeShip('full_delivery')}
                disabled={shipLoading}
                sx={{
  'width': '100%',
  'textAlign': 'left',
  'padding': '1rem',
  'borderRadius': '8px',
  'borderWidth': '2px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  '&:hover': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-brand)/var(--minimal-border-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:disabled': { 'opacity': '.5', 'cursor': 'not-allowed' },
}}
              >
                <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'flex-start', 'gap': '.75rem' }}>
                  <MuiBox component='div' sx={{
  'width': '2.5rem',
  'height': '2.5rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-bg-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'flexShrink': '0',
  'marginTop': '.125rem',
}}>
                    <MuiBox component={PackageCheck} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
}} />
                  </MuiBox>
                  <div>
                    <MuiBox component='div' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}>完整发货（匹配卡券并发送）</MuiBox>
                    <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1.625',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>
                      自动匹配发货规则、获取卡券、发送卡券信息给买家，并修改发货状态。
                      适用于订单既没有发送卡券给买家、也没有修改发货状态的情况。
                    </MuiBox>
                  </div>
                </MuiBox>
              </MuiBox>

              {/* 加载状态 */}
              {shipLoading && (
                <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
}}>
                  <MuiBox component={RefreshCw} sx={{
  'width': '1rem',
  'height': '1rem',
  'animation': 'spin 1s linear infinite',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}} />
                  <MuiBox component='span' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>正在处理中...</MuiBox>
                </MuiBox>
              )}

              {/* 结果显示 */}
              {shipResult && (
                <MuiBox component='div' sx={[{ 'padding': '.75rem', 'borderRadius': '8px', 'fontSize': '.875rem', 'lineHeight': '1.25rem' }, shipResult.success ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-800)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-800)/var(--minimal-text-opacity,1))',
}]}>
                  {shipResult.success ? '✓ ' : '✗ '}{shipResult.message}
                </MuiBox>
              )}
            </MuiBox>

            <MuiBox component='div' sx={{
  'flexShrink': '0',
  'padding': '1.5rem 2rem 2rem',
  'borderTop': '1px solid rgb(var(--minimal-color-neutral-100))',
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='button'
                onClick={closeShipModal}
                sx={{
  'width': '100%',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
  'fontWeight': '700',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
              >
                {shipResult?.success ? '完成' : '取消'}
              </MuiBox>
            </MuiBox>
          </MuiBox>
        </MinimalDialogSurface>
      )}

      {/* Edit Modal - 使用 Minimal Dialog 管理焦点与响应式遮罩 */}
      {showEditModal && editingOrder && (
        <MinimalDialogSurface open onClose={closeEditModal} maxWidth="md" aria-labelledby="edit-order-title">
          <MuiBox component='div' sx={{ 'width': '100%' }}>
            <MuiBox component='div' sx={{
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'flexShrink': '0',
  'padding': '2rem 2rem 1.5rem',
  'borderBottom': '1px solid rgb(var(--minimal-color-neutral-100))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between', 'width': '100%' }}>
                <MuiBox component='h3' id="edit-order-title" sx={{
  'fontSize': '1.5rem',
  'lineHeight': '2rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>编辑订单</MuiBox>
                <MuiBox component='button'
                  onClick={closeEditModal}
                  sx={{
  'padding': '.5rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'borderRadius': '9999px',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
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
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}} />
                </MuiBox>
              </MuiBox>
            </MuiBox>

            <MuiBox component='div' sx={{
  'flex': '1 1 auto',
  'overflowY': 'auto',
  'overflowX': 'hidden',
  'padding': '2rem',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
}}>
              <MuiBox component='div' sx={{ 'display': 'grid', 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))', 'gap': '1rem' }}>
                <div>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>订单号</MuiBox>
                  <MuiBox component='input'
                    type="text"
                    value={editingOrder.order_id}
                    disabled
                    sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
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
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
}}
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
}}>订单状态</MuiBox>
                  <MuiBox component='select'
                    value={editingOrder.status}
                    onChange={/* 当前回调更新订单状态草稿。 */ (e) => updateEditingOrder({ status: e.target.value as OrderStatus })}
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
                    <option value="processing">处理中</option>
                    <option value="pending_ship">待发货</option>
                    <option value="shipped">已发货</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                    <option value="refunding">退款中</option>
                  </MuiBox>
                </div>
              </MuiBox>

              <MuiBox component='div' sx={{ 'display': 'grid', 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))', 'gap': '1rem' }}>
                <div>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>买家ID</MuiBox>
                  <MuiBox component='input'
                    type="text"
                    value={editingOrder.buyer_id}
                    onChange={/* 当前回调更新买家标识草稿。 */ (e) => updateEditingOrder({ buyer_id: e.target.value })}
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
}}>实付金额</MuiBox>
                  <MuiBox component='input'
                    type="number"
                    value={editingOrder.amount}
                    onChange={/* 当前回调更新订单金额草稿。 */ (e) => updateEditingOrder({ amount: e.target.value })}
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
                </div>
              </MuiBox>

              <MuiBox component='div' sx={{ 'display': 'grid', 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))', 'gap': '1rem' }}>
                <div>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>收货人</MuiBox>
                  <MuiBox component='input'
                    type="text"
                    value={editingOrder.receiver_name || ''}
                    onChange={/* 当前回调更新收货人草稿。 */ (e) => updateEditingOrder({ receiver_name: e.target.value })}
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
}}>联系电话</MuiBox>
                  <MuiBox component='input'
                    type="text"
                    value={editingOrder.receiver_phone || ''}
                    onChange={/* 当前回调更新收货电话草稿。 */ (e) => updateEditingOrder({ receiver_phone: e.target.value })}
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
                </div>
              </MuiBox>

              <div>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>收货地址</MuiBox>
                <MuiBox component='textarea'
                  value={editingOrder.receiver_address || ''}
                  onChange={/* 当前回调更新收货地址草稿。 */ (e) => updateEditingOrder({ receiver_address: e.target.value })}
                  rows={2}
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
  'resize': 'none',
}}
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
}}>商品标题</MuiBox>
                <MuiBox component='input'
                  type="text"
                  value={editingOrder.item_title || ''}
                  onChange={/* 当前回调更新商品标题草稿。 */ (e) => updateEditingOrder({ item_title: e.target.value })}
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
              </div>
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
                  onClick={closeEditModal}
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
    </MinimalPageFrame>
  );
};

export default OrderList;

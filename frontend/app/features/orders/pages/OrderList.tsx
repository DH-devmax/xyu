import { ChevronLeft,ChevronRight,Edit,ExternalLink,Eye,PackageCheck,Plus,RefreshCw,Save,Trash2,Truck,User as UserIcon,X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatLocalDateTime } from '../../../../dateTime';
import { MinimalPageFrame, MinimalResponsiveDrawer, MinimalStatusChip, MinimalTableShell } from '../../../../shared/ui/minimal';
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
            <RefreshCw size={18} className={loading ? 'animate-spin' : undefined} />
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
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-white text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-50">
                <th className="px-6 py-5" style={{width: '28%'}}>订单信息</th>
                <th className="px-6 py-5" style={{width: '26%'}}>买家信息</th>
                <th className="px-6 py-5" style={{width: '11%'}}>实付金额</th>
                <th className="px-6 py-5" style={{width: '13%'}}>当前状态</th>
                <th className="px-6 py-5 text-right" style={{width: '22%'}}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(/* 当前回调处理集合中的单个元素。 */ (order) => (
                <tr key={order.id} className="hover:bg-warning-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shadow-sm border border-gray-100 flex-shrink-0">
                        {order.item_image ? (
                            <img src={order.item_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300"><PackageCheck /></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 line-clamp-1 text-sm">
                          {getItemNameById(order.cookie_id, order.item_id, order.item_title)}
                        </div>
                        <div className="mt-1 flex w-fit min-w-0 max-w-full items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-extrabold text-blue-700" title={accountNickname(order.cookie_id)}>
                          <UserIcon className="h-3 w-3 shrink-0" />
                          <span className="min-w-0 truncate whitespace-nowrap">{accountNickname(order.cookie_id)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-medium">订单ID: {order.order_id}</div>
                        <div className="text-xs text-gray-400 mt-0.5">数量: {order.quantity} • {formatLocalDateTime(order.created_at)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                          <div className="text-xs text-gray-500">买家ID</div>
                          <div className="text-sm font-bold text-gray-800">{order.buyer_id}</div>
                          {order.receiver_name && (
                              <>
                                  <div className="text-xs text-gray-500">收货人</div>
                                  <div className="text-xs text-gray-600">{order.receiver_name}</div>
                              </>
                          )}
                          {order.receiver_phone && (
                              <>
                                  <div className="text-xs text-gray-500">联系电话</div>
                                  <div className="text-xs text-gray-600 font-mono">{order.receiver_phone}</div>
                              </>
                          )}
                          {order.receiver_address && (
                              <>
                                  <div className="text-xs text-gray-500">收货地址</div>
                                  <div className="text-xs text-gray-600 line-clamp-1">{order.receiver_address}</div>
                              </>
                          )}
                      </div>
                  </td>
                  <td className="px-6 py-5 text-base font-extrabold text-gray-900 font-feature-settings-tnum">
                    {order.amount ? `¥${order.amount}` : <span className="text-xs text-amber-600 font-bold">待获取</span>}
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    {order.status === 'pending_ship' && (
                        <button
                            onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleShip(order.order_id)}
                            className="mr-2 text-white bg-black hover:bg-gray-800 shadow-lg shadow-gray-200 text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95"
                        >
                            立即发货
                        </button>
                    )}
                    <a
                      href={`https://www.goofish.com/order-detail?orderId=${order.order_id}&role=seller`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-2 inline-flex text-gray-400 hover:text-blue-600 p-2 rounded-xl hover:bg-blue-50 transition-colors"
                      title="查看闲鱼详情"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleViewDetail(order)}
                      className="mr-2 text-gray-400 hover:text-blue-600 p-2 rounded-xl hover:bg-blue-50 transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleEdit(order)}
                      className="mr-2 text-gray-400 hover:text-black p-2 rounded-xl hover:bg-gray-100 transition-colors"
                      title="编辑订单"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleSyncSingle(order.order_id)}
                      disabled={syncingOrderId === order.order_id}
                      className="mr-2 text-gray-400 hover:text-green-600 p-2 rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50"
                      title="同步订单"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncingOrderId === order.order_id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleDelete(order.order_id)}
                      disabled={deletingOrderId === order.order_id}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="删除订单"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Stack direction="row" sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
            <div className="text-sm text-gray-500 font-medium pl-2">
                第 {page} 页 / 共 {totalPages} 页
            </div>
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
      {showShipModal && createPortal(
        <div className="modal-overlay-centered">
          <div className="modal-container" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-2xl font-extrabold text-gray-900">立即发货</h3>
                <button
                  onClick={closeShipModal}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="modal-body space-y-4">
              <p className="text-sm text-gray-600">请选择发货方式：</p>

              {/* 选项A: 仅修改发货状态 */}
              <button
                onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => executeShip('status_only')}
                disabled={shipLoading}
                className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">仅修改闲鱼发货状态</div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                      不实际扣除或发送卡券，仅在闲鱼平台将订单标记为"已发货"。
                      适用于已经给客户发过货、只是忘记在闲鱼修改状态的情况。
                    </div>
                  </div>
                </div>
              </button>

              {/* 选项B: 完整发货流程 */}
              <button
                onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => executeShip('full_delivery')}
                disabled={shipLoading}
                className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-brand hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <PackageCheck className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">完整发货（匹配卡券并发送）</div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                      自动匹配发货规则、获取卡券、发送卡券信息给买家，并修改发货状态。
                      适用于订单既没有发送卡券给买家、也没有修改发货状态的情况。
                    </div>
                  </div>
                </div>
              </button>

              {/* 加载状态 */}
              {shipLoading && (
                <div className="flex items-center justify-center gap-2 py-3">
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">正在处理中...</span>
                </div>
              )}

              {/* 结果显示 */}
              {shipResult && (
                <div className={`p-3 rounded-xl text-sm ${shipResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {shipResult.success ? '✓ ' : '✗ '}{shipResult.message}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={closeShipModal}
                className="w-full px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold transition-colors"
              >
                {shipResult?.success ? '完成' : '取消'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal - 使用 Portal */}
      {showEditModal && editingOrder && createPortal(
        <div className="modal-overlay-centered">
          <div className="modal-container">
            <div className="modal-header">
              <div className="flex items-center justify-between w-full">
                <h3 className="text-2xl font-extrabold text-gray-900">编辑订单</h3>
                <button
                  onClick={closeEditModal}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="modal-body space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">订单号</label>
                  <input
                    type="text"
                    value={editingOrder.order_id}
                    disabled
                    className="w-full ios-input px-4 py-3 rounded-xl bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">订单状态</label>
                  <select
                    value={editingOrder.status}
                    onChange={/* 当前回调更新订单状态草稿。 */ (e) => updateEditingOrder({ status: e.target.value as OrderStatus })}
                    className="w-full ios-input px-4 py-3 rounded-xl"
                  >
                    <option value="processing">处理中</option>
                    <option value="pending_ship">待发货</option>
                    <option value="shipped">已发货</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                    <option value="refunding">退款中</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">买家ID</label>
                  <input
                    type="text"
                    value={editingOrder.buyer_id}
                    onChange={/* 当前回调更新买家标识草稿。 */ (e) => updateEditingOrder({ buyer_id: e.target.value })}
                    className="w-full ios-input px-4 py-3 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">实付金额</label>
                  <input
                    type="number"
                    value={editingOrder.amount}
                    onChange={/* 当前回调更新订单金额草稿。 */ (e) => updateEditingOrder({ amount: e.target.value })}
                    className="w-full ios-input px-4 py-3 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">收货人</label>
                  <input
                    type="text"
                    value={editingOrder.receiver_name || ''}
                    onChange={/* 当前回调更新收货人草稿。 */ (e) => updateEditingOrder({ receiver_name: e.target.value })}
                    className="w-full ios-input px-4 py-3 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">联系电话</label>
                  <input
                    type="text"
                    value={editingOrder.receiver_phone || ''}
                    onChange={/* 当前回调更新收货电话草稿。 */ (e) => updateEditingOrder({ receiver_phone: e.target.value })}
                    className="w-full ios-input px-4 py-3 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">收货地址</label>
                <textarea
                  value={editingOrder.receiver_address || ''}
                  onChange={/* 当前回调更新收货地址草稿。 */ (e) => updateEditingOrder({ receiver_address: e.target.value })}
                  rows={2}
                  className="w-full ios-input px-4 py-3 rounded-xl resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">商品标题</label>
                <input
                  type="text"
                  value={editingOrder.item_title || ''}
                  onChange={/* 当前回调更新商品标题草稿。 */ (e) => updateEditingOrder({ item_title: e.target.value })}
                  className="w-full ios-input px-4 py-3 rounded-xl"
                />
              </div>
            </div>

            <div className="modal-footer">
              <div className="flex gap-3 w-full">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 ios-btn-primary px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  保存更改
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </MinimalPageFrame>
  );
};

export default OrderList;

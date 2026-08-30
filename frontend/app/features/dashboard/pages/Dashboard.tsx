import { Activity,AlertCircle,DollarSign,ExternalLink,Package,PackageCheck,ShoppingCart,TrendingUp,Users } from 'lucide-react';
import React,{ useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { Cell,Legend,Pie,PieChart,ResponsiveContainer,Tooltip } from 'recharts';
import { getDateRange,TimeRange } from '../../../../dateRange';
import { formatLocalDateTime } from '../../../../dateTime';
import { MinimalPageHeader,MinimalSectionCard } from '../../../../shared/ui/minimal';
import { OrderStatus } from '../api';
import { DashboardTrendChart } from '../DashboardTrendChart';
import { useDashboard } from '../hooks';

// cssColor 状态颜色样式。
const cssColor = (token: string, alpha?: number) => (
  alpha === undefined
    ? `rgb(var(--color-${token}))`
    : `rgb(var(--color-${token}) / ${alpha})`
);

// StatusBadge 将订单状态适配为 Minimal/MUI 的紧凑状态芯片。
export const StatusBadge: React.FC<{ /** status 表示状态。 */ status: OrderStatus }> = ({ status }) => {
  // labels 是稳定的订单状态中文文案。
  const labels: Record<OrderStatus, string> = {
    processing: '处理中',
    pending_ship: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    refunding: '退款中',
    unknown: '未知',
  };
  // colors 将业务状态映射为 MUI 语义色，不改变服务端状态值。
  const colors: Record<OrderStatus, 'primary' | 'info' | 'success' | 'warning' | 'error' | 'default'> = {
    processing: 'info',
    pending_ship: 'primary',
    shipped: 'info',
    completed: 'success',
    cancelled: 'default',
    refunding: 'error',
    unknown: 'default',
  };

  return (
    <Chip
      className="inline-flex whitespace-nowrap"
      color={colors[status] || 'default'}
      label={labels[status] || status}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 700 }}
    />
  );
};

// StatTone 是统计卡片使用的有限语义色集合。
type StatTone = 'primary' | 'success' | 'warning' | 'info';

// StatToneStyle 描述统计图标容器需要的两项颜色令牌。
interface StatToneStyle {
  // backgroundColor 是图标容器的浅色背景。
  backgroundColor: string;
  // color 是图标和前景文字颜色。
  color: string;
}

// statToneStyles 提供不依赖 Tailwind 的图标容器颜色。
const statToneStyles: Record<StatTone, StatToneStyle> = {
  primary: { backgroundColor: 'rgb(var(--color-brand) / 0.12)', color: 'rgb(var(--color-brand))' },
  success: { backgroundColor: 'rgb(var(--color-success-500) / 0.12)', color: 'rgb(var(--color-success-500))' },
  warning: { backgroundColor: 'rgb(var(--color-warning-500) / 0.12)', color: 'rgb(var(--color-warning-500))' },
  info: { backgroundColor: 'rgb(var(--color-brand-highlight) / 0.12)', color: 'rgb(var(--color-brand-highlight))' },
};

// StatCard 渲染使用 Minimal outlined card 结构的统计指标。
interface StatCardProps {
  // title 是指标名称。
  title: string;
  // value 是指标当前值。
  value: string | number;
  // icon 是指标对应的 Lucide 图标组件。
  icon: React.ElementType;
  // tone 是指标的语义色调。
  tone: StatTone;
  // trend 是可选的环比趋势文案。
  trend?: string;
}

// StatCard 将统计指标、图标和趋势统一到 MUI 卡片语义中。
const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, tone, trend }) => {
  // toneStyle 是当前指标图标容器的颜色配置。
  const toneStyle = statToneStyles[tone];
  return (
    <MinimalSectionCard
      data-stat-card={title}
      contentSx={{ height: '100%' }}
      sx={{ height: '100%', transition: 'transform 180ms ease', '&:hover': { transform: 'translateY(-2px)' } }}
    >
      <Stack sx={{ height: '100%', justifyContent: 'space-between', gap: 2 }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'inline-flex', p: 1.25, borderRadius: 2, bgcolor: toneStyle.backgroundColor, color: toneStyle.color }}>
            <Icon size={22} aria-hidden="true" />
          </Box>
          {trend ? <Chip color="primary" icon={<TrendingUp size={14} />} label={trend} size="small" variant="filled" /> : null}
        </Stack>
        <Box>
          <Typography variant="h3" sx={{ fontSize: { xs: '1.55rem', sm: '1.8rem' }, fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {title}
          </Typography>
        </Box>
      </Stack>
    </MinimalSectionCard>
  );
};

// Dashboard 渲染仪表盘页面组件。
const Dashboard: React.FC = () => {
  // [timeRange, 解构得到当前 Hook 返回的状态和操作函数。
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  // [customStartDate, 解构得到当前 Hook 返回的状态和操作函数。
  const [customStartDate, setCustomStartDate] = useState('');
  // [customEndDate, 解构得到当前 Hook 返回的状态和操作函数。
  const [customEndDate, setCustomEndDate] = useState('');
  // [searchTerm, 解构得到当前 Hook 返回的状态和操作函数。
  const [searchTerm, setSearchTerm] = useState('');
  // [customRangeVersion, 解构得到当前 Hook 返回的状态和操作函数。
  const [customRangeVersion, setCustomRangeVersion] = useState(0);
  // dashboard 仪表盘数据。
  const dashboard = useDashboard({ range: timeRange, customStartDate, customEndDate, customRangeVersion });
  // { 解构得到当前 Hook 返回的状态和操作函数。
  const { data, status, chartData, productSalesData, sourceData: sourceDataData, categoryData: categoryDataData, maxProductSales, trendPercent, selectedRangeLabel, refresh } = dashboard;
  // stats 统计概览数据。
  const stats = data?.stats || null;
  // analytics 统计分析数据。
  const analytics = data?.analytics || null;
  // validOrders 有效订单列表。
  const validOrders = data?.validOrders.orders || [];
  // validOrdersTotal 有效数据订单列表总数，负责当前功能中的对应处理。
  const validOrdersTotal = data?.validOrders.total || 0;
  // validOrdersTruncated 有效数据订单列表Truncated，负责当前功能中的对应处理。
  const validOrdersTruncated = data?.validOrders.truncated || false;
  // ordersLoading 订单加载状态。
  const ordersLoading = status.range === 'loading';
  // loadError 加载当前数据（错误）。
  const loadError = status.error;

  // 颜色配置
  const COLORS = [
    cssColor('brand'),
    cssColor('brand-highlight'),
    cssColor('success-500'),
    cssColor('warning-500'),
    cssColor('accent-500'),
  ];
  // formatCurrency 格式化金额函数。
  const formatCurrency = (value: number) => `¥${Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;

  if (loadError && (!stats || !analytics)) {
    return (
      <Stack sx={{ p: { xs: 3, sm: 6 }, alignItems: 'center', gap: 1.5 }}>
        <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ width: '100%', maxWidth: 640 }}>{loadError}</Alert>
        <Button type="button" variant="contained" onClick={refresh}>重新加载</Button>
      </Stack>
    );
  }
  if (!stats || !analytics) {
    return (
      <Stack role="status" aria-label="正在加载仪表盘" sx={{ p: { xs: 3, sm: 6 }, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Stack>
    );
  }
  // totalOrders 总数订单列表，负责当前功能中的对应处理。
  const totalOrders = analytics.revenue_stats.total_orders || 0;
  // totalAmount 订单总金额。
  const totalAmount = analytics.revenue_stats.total_amount || 0;

  // timeRangeOptions time范围Options，负责当前功能中的对应处理。
  const timeRangeOptions = [
    { key: 'today' as TimeRange, label: '今天' },
    { key: 'yesterday' as TimeRange, label: '昨天' },
    { key: '3days' as TimeRange, label: '三天内' },
    { key: '7days' as TimeRange, label: '7天内' },
    { key: '30days' as TimeRange, label: '一个月内' },
    { key: 'custom' as TimeRange, label: '自定义' },
  ];
  // currentRangeDates 当前统计日期范围。
  let currentRangeDates;
  try {
    currentRangeDates = getDateRange(timeRange, new Date(), customStartDate, customEndDate);
  } catch {
    currentRangeDates = { startDate: customStartDate, endDate: customEndDate };
  }
  // normalizedSearchTerm 归一化当前数据（d搜索条件Term）。
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  // filteredValidOrders 过滤后的有效订单列表。
  const filteredValidOrders = validOrders.filter(/* 当前回调处理集合中的单个元素。 */ (order) =>
    order.order_id?.toLowerCase().includes(normalizedSearchTerm) ||
    order.item_id?.toLowerCase().includes(normalizedSearchTerm) ||
    order.item_title?.toLowerCase().includes(normalizedSearchTerm) ||
    order.buyer_id?.toLowerCase().includes(normalizedSearchTerm)
  );

  return (
    <Stack data-page-template="minimal-dashboard" spacing={{ xs: 2.5, sm: 3.5 }}>
      {loadError && (
        <Alert
          severity="warning"
          action={<Button color="inherit" size="small" onClick={refresh}>重试</Button>}
        >
          {loadError}
        </Alert>
      )}
      <MinimalPageHeader
        eyebrow="DH闲不下来"
        title="运营概览"
        description="欢迎回来，以下是闲鱼店铺的实时经营数据。"
        actions={<Chip color="success" label="系统正常运行" size="small" variant="outlined" />}
      />

      {/* Time Range Selector */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        sx={{ p: 1, alignItems: { xs: 'stretch', md: 'center' }, flexWrap: 'wrap', bgcolor: 'action.hover', borderRadius: 2 }}
      >
        <ToggleButtonGroup
          aria-label="统计时间范围"
          exclusive
          onChange={/* rangeChange 只在选择有效范围时更新仪表盘请求。 */ (_event, nextRange: TimeRange | null) => {
            if (nextRange) setTimeRange(nextRange);
          }}
          size="small"
          value={timeRange}
        >
          {timeRangeOptions.map(/* option 是当前时间范围的展示选项。 */ option => (
            <ToggleButton key={option.key} value={option.key}>{option.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        {timeRange === 'custom' && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, flex: 1 }}>
            <TextField
              label="开始日期"
              type="date"
              value={customStartDate}
              onChange={/* startDateChange 更新自定义统计范围的起始日期。 */ event => setCustomStartDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: { sm: 170 } }}
            />
            <Typography color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>至</Typography>
            <TextField
              label="结束日期"
              type="date"
              value={customEndDate}
              onChange={/* endDateChange 更新自定义统计范围的结束日期。 */ event => setCustomEndDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: { sm: 170 } }}
            />
            <Button variant="contained" color="inherit" onClick={/* applyRange 触发自定义日期范围重新查询。 */ () => setCustomRangeVersion(/* version 是当前自定义范围请求版本。 */ value => value + 1)}>应用</Button>
          </Stack>
        )}
      </Stack>

      {/* Stats Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 2, sm: 3 } }}>
        <StatCard
          title="累计营收 (CNY)"
          value={`¥${analytics.revenue_stats.total_amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          tone="primary"
          trend={trendPercent || undefined}
        />
        <StatCard
          title="活跃账号 / 总数"
          value={`${stats.active_cookies} / ${stats.total_cookies}`}
          icon={Users}
          tone="info"
        />
        <StatCard
          title="订单数"
          value={analytics.revenue_stats.total_orders.toLocaleString()}
          icon={ShoppingCart}
          tone="success"
        />
        <StatCard
          title="库存卡密余量"
          value={stats.available_card_stock}
          icon={Package}
          tone="warning"
        />
      </Box>

      <DashboardTrendChart chartData={chartData} selectedRangeLabel={selectedRangeLabel} totalAmount={totalAmount} />

      {/* 商品销量排行和订单来源分布 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: { xs: 2.5, sm: 3.5 } }}>
        {/* 商品销量排行 */}
        <MinimalSectionCard title="商品销量排行">
          <div className="h-[280px]">
            {productSalesData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">暂无数据</div>
            ) : (
              <div className="h-full space-y-4 overflow-y-auto pr-2">
                {productSalesData.map(/* 当前回调处理集合中的单个元素。 */ (item, index) => (
                  <div key={`${item.name}-${index}`} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold ${index < 3 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {index + 1}
                        </span>
                        <span className="font-bold text-gray-800 text-sm truncate">{item.name}</span>
                      </div>
                      <span className="font-mono text-sm font-extrabold text-gray-900">{item.sales} 单</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.max(8, (item.sales / maxProductSales) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MinimalSectionCard>

        {/* 商品下单占比 */}
        <MinimalSectionCard title="商品下单占比">
          <div
            className="dashboard-pie-chart h-[280px] relative"
            role="img"
            aria-label={`商品下单占比，共 ${totalOrders} 单`}
          >
            {sourceDataData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">暂无数据</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart accessibilityLayer={false}>
                    <Pie
                      data={sourceDataData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      activeShape={{
                        outerRadius: 96,
                        stroke: 'none',
                        strokeWidth: 0,
                      }}
                      rootTabIndex={-1}
                      label={false}
                      labelLine={false}
                    >
                      {sourceDataData.map(/* 当前回调处理集合中的单个元素。 */ (entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={/* 当前回调处理用户交互或异步状态变化。 */ (value) => `${Number(value || 0)} 单`}
                      wrapperStyle={{ zIndex: 30, outline: 'none' }}
                      contentStyle={{
                        backgroundColor: cssColor('white'),
                        border: `1px solid ${cssColor('neutral-200')}`,
                        borderRadius: '10px',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={/* 当前回调处理用户交互或异步状态变化。 */ (value) => <span style={{ color: cssColor('neutral-500'), fontWeight: 500 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center pb-9">
                  <span className="text-2xl font-extrabold text-gray-900 tabular-nums">{totalOrders}</span>
                  <span className="text-xs font-medium text-gray-400 mt-0.5">总订单</span>
                </div>
              </>
            )}
          </div>
        </MinimalSectionCard>
      </Box>

      {/* 收支明细和品类营收 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 2.5, sm: 3.5 } }}>
        {/* 参与统计的订单列表 */}
        <MinimalSectionCard
          className="lg:col-span-2 ios-card p-0 rounded-xl border-0 bg-white overflow-hidden flex flex-col"
          contentSx={{ p: 0, '&:last-child': { pb: 0 }, display: 'flex', flexDirection: 'column', minHeight: 320 }}
        >
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-surface-muted">
			<div>
			  <h3 className="font-bold text-lg text-gray-900">参与统计的订单</h3>
			  {validOrdersTruncated && (
				<p className="text-xs text-amber-700 mt-1">当前显示最近 {validOrders.length} / {validOrdersTotal} 条，搜索仅覆盖已加载明细。</p>
			  )}
			</div>
            <div className="relative">
              <input
                placeholder="搜索订单号/商品/买家..."
                value={searchTerm}
                onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-4 py-2 rounded-xl bg-white border border-gray-100 text-sm focus:border-blue-400 outline-none w-48"
                type="text"
              />
            </div>
          </div>
          <div className="overflow-x-auto flex-1 max-h-[400px]">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <Activity className="w-6 h-6 animate-spin mr-2" />
                加载中...
              </div>
            ) : filteredValidOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <PackageCheck className="w-7 h-7 text-gray-300" />
                </div>
                {normalizedSearchTerm ? (
                  <>
                    <div className="text-sm font-extrabold text-gray-900">没有匹配的订单</div>
                    <div className="text-xs text-gray-400 mt-2 max-w-md">
                      当前共有 {validOrders.length} 单参与统计，但没有订单号、商品、买家匹配“{searchTerm}”。
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-extrabold text-gray-900">当前范围内没有参与统计的订单</div>
                    <div className="text-xs text-gray-400 mt-2 max-w-lg leading-6">
                      日期范围：{currentRangeDates.startDate} 至 {currentRangeDates.endDate}；
                      统计口径：待发货、已发货、已完成，且订单金额不为空。
                      当前统计卡片订单数：{analytics.revenue_stats.total_orders} 单。
                    </div>
                  </>
                )}
              </div>
            ) : (
              <table className="w-full min-w-[760px] text-left border-collapse">
                <thead>
                  <tr className="bg-white text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-50">
                    <th className="px-6 py-4">订单信息</th>
                    <th className="px-6 py-4">买家信息</th>
                    <th className="px-6 py-4">金额</th>
                    <th className="px-6 py-4 whitespace-nowrap">状态</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredValidOrders.map(/* 当前回调处理集合中的单个元素。 */ (order) => (
                      <tr key={order.order_id} className="hover:bg-warning-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shadow-sm border border-gray-100 flex-shrink-0">
                              <PackageCheck className="w-full h-full text-gray-300 p-2" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 text-sm line-clamp-1">
                                {order.item_title || order.item_id || '未知商品'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 font-mono">{order.order_id}</div>
                              <div className="text-xs text-gray-400 mt-0.5">数量: {order.quantity || 1}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-800">{order.buyer_id}</div>
                          {order.created_at && (
                            <div className="text-xs text-gray-400 mt-1">{formatLocalDateTime(order.created_at)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-base font-extrabold text-gray-900 font-feature-settings-tnum">
                          ¥{order.amount || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={order.status || order.order_status || 'unknown'} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={`https://www.goofish.com/order-detail?orderId=${order.order_id}&role=seller`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex text-gray-400 hover:text-blue-600 p-2 rounded-xl hover:bg-blue-50 transition-colors"
                            title="查看闲鱼详情"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </MinimalSectionCard>

        {/* 商品金额分析 */}
        <MinimalSectionCard title="商品金额分析 (TOP5)" className="bg-white">
          {categoryDataData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400">暂无数据</div>
          ) : (
            <>
              <div
                className="dashboard-pie-chart h-[280px] relative"
                role="img"
                aria-label={`商品金额分析，总金额 ${formatCurrency(totalAmount)}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart accessibilityLayer={false}>
                    <Pie
                      data={categoryDataData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={92}
                      paddingAngle={2}
                      dataKey="value"
                      activeShape={{
                        outerRadius: 98,
                        stroke: 'none',
                        strokeWidth: 0,
                      }}
                      rootTabIndex={-1}
                      label={false}
                      labelLine={false}
                    >
                      {categoryDataData.map(/* 当前回调处理集合中的单个元素。 */ (entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      wrapperStyle={{ zIndex: 30, outline: 'none' }}
                      contentStyle={{
                        backgroundColor: cssColor('white'),
                        border: `1px solid ${cssColor('neutral-200')}`,
                        borderRadius: '6px',
                        boxShadow: 'var(--shadow-md)'
                      }}
                      formatter={/* 当前回调处理用户交互或异步状态变化。 */ (value) => `¥${Number(value || 0).toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-gray-900 tabular-nums">{formatCurrency(totalAmount)}</span>
                  <span className="text-xs font-medium text-gray-400 mt-0.5">总金额</span>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                {categoryDataData.map(/* 当前回调处理集合中的单个元素。 */ (cat) => (
                  <div key={cat.name} className="flex justify-between items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || COLORS[categoryDataData.indexOf(cat) % COLORS.length] }}
                      ></div>
                      <span className="text-gray-600 font-medium truncate" title={cat.name}>{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                      <span className="font-bold text-gray-900">¥{cat.value.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </MinimalSectionCard>
      </Box>
    </Stack>
  );
};

export default Dashboard;

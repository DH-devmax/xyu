import MuiBox from '@mui/material/Box';
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
import { getDateRange,TimeRange } from '@/shared/dateRange';
import { formatLocalDateTime } from '@/shared/dateTime';
import { MinimalPageHeader,MinimalSectionCard } from '@/components/minimal';
import { OrderStatus } from '../api';
import { DashboardTrendChart } from '../DashboardTrendChart';
import { useDashboard } from '../hooks';

// cssColor 状态颜色样式。
const cssColor = (token: string, alpha?: number) => (
  alpha === undefined
    ? `rgb(var(--minimal-color-${token}))`
    : `rgb(var(--minimal-color-${token}) / ${alpha})`
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
  // colors 将业务状态映射为 MUI 语义色，服务端状态值保持原样。
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
      color={colors[status] || 'default'}
      label={labels[status] || status}
      size="small"
      variant="outlined"
      sx={{ display: 'inline-flex', fontWeight: 700, whiteSpace: 'nowrap' }}
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

// statToneStyles 提供不依赖历史样式工具的图标容器颜色。
const statToneStyles: Record<StatTone, StatToneStyle> = {
  primary: { backgroundColor: 'rgb(var(--minimal-color-brand) / 0.12)', color: 'rgb(var(--minimal-color-brand))' },
  success: { backgroundColor: 'rgb(var(--minimal-color-success-500) / 0.12)', color: 'rgb(var(--minimal-color-success-500))' },
  warning: { backgroundColor: 'rgb(var(--minimal-color-warning-500) / 0.12)', color: 'rgb(var(--minimal-color-warning-500))' },
  info: { backgroundColor: 'rgb(var(--minimal-color-brand-highlight) / 0.12)', color: 'rgb(var(--minimal-color-brand-highlight))' },
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
          <MuiBox component='div' sx={{ 'height': '280px' }}>
            {productSalesData.length === 0 ? (
              <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'height': '100%',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>暂无数据</MuiBox>
            ) : (
              <MuiBox component='div' sx={{
  'height': '100%',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
  'overflowY': 'auto',
  'paddingRight': '.5rem',
}}>
                {productSalesData.map(/* 当前回调处理集合中的单个元素。 */ (item, index) => (
                  <MuiBox component='div' key={`${item.name}-${index}`} sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                    <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between', 'gap': '1rem' }}>
                      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.75rem', 'minWidth': '0' }}>
                        <MuiBox component='span' sx={[{
  'width': '1.75rem',
  'height': '1.75rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '800',
}, index < 3 ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-600)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}]}>
                          {index + 1}
                        </MuiBox>
                        <MuiBox component='span' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
}}>{item.name}</MuiBox>
                      </MuiBox>
                      <MuiBox component='span' sx={{
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>{item.sales} 单</MuiBox>
                    </MuiBox>
                    <MuiBox component='div' sx={{
  'height': '.75rem',
  'borderRadius': '9999px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'overflow': 'hidden',
}}>
                      <MuiBox component='div'
                        sx={{
  'height': '100%',
  'borderRadius': '9999px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand))',
}}
                        style={{ width: `${Math.max(8, (item.sales / maxProductSales) * 100)}%` }}
                      />
                    </MuiBox>
                  </MuiBox>
                ))}
              </MuiBox>
            )}
          </MuiBox>
        </MinimalSectionCard>

        {/* 商品下单占比 */}
        <MinimalSectionCard title="商品下单占比">
          <Box
            data-chart="dashboard-pie"
            role="img"
            aria-label={`商品下单占比，共 ${totalOrders} 单`}
            sx={{ height: 280, position: 'relative' }}
          >
            {sourceDataData.length === 0 ? (
              <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'height': '100%',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>暂无数据</MuiBox>
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
                        boxShadow: 'var(--minimal-shadow-md)'
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
                <MuiBox component='div' sx={{
  'pointerEvents': 'none',
  'position': 'absolute',
  'inset': '0',
  'zIndex': '10',
  'display': 'flex',
  'flexDirection': 'column',
  'alignItems': 'center',
  'justifyContent': 'center',
  'paddingBottom': '2.25rem',
}}>
                  <MuiBox component='span' sx={{
  'fontSize': '1.5rem',
  'lineHeight': '2rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  '--minimal-numeric-spacing': 'tabular-nums',
  'fontVariantNumeric': 'var(--minimal-ordinal) var(--minimal-slashed-zero) var(--minimal-numeric-figure) var(--minimal-numeric-spacing) var(--minimal-numeric-fraction)',
}}>{totalOrders}</MuiBox>
                  <MuiBox component='span' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '500',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'marginTop': '.125rem',
}}>总订单</MuiBox>
                </MuiBox>
              </>
            )}
          </Box>
        </MinimalSectionCard>
      </Box>

      {/* 收支明细和品类营收 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 2.5, sm: 3.5 } }}>
        {/* 参与统计的订单列表 */}
        <MinimalSectionCard
          sx={{
  '@media (min-width:1024px)': { 'gridColumn': 'span 2/span 2' },
  'background': 'rgb(var(--minimal-color-surface))',
  'borderRadius': '8px',
  'border': '1px solid rgb(var(--minimal-color-black)/.02)',
  'boxShadow': 'var(--minimal-shadow-card)',
  'transition': 'transform .2s ease,box-shadow .2s ease',
  '&:hover': { 'boxShadow': '0 12px 32px rgb(var(--minimal-color-black)/.06)' },
  '@media (max-width:768px)': { 'borderRadius': '6px' },
  'padding': '0',
  'borderWidth': '0',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'overflow': 'hidden',
  'display': 'flex',
  'flexDirection': 'column',
}}
          contentSx={{ p: 0, '&:last-child': { pb: 0 }, display: 'flex', flexDirection: 'column', minHeight: 320 }}
        >
          <MuiBox component='div' sx={{
  'padding': '1.5rem',
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-border-opacity,1))',
  'display': 'flex',
  'justifyContent': 'space-between',
  'alignItems': 'center',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-surface-muted)/var(--minimal-bg-opacity,1))',
}}>
			<div>
			  <MuiBox component='h3' sx={{
  'fontWeight': '700',
  'fontSize': '1.125rem',
  'lineHeight': '1.75rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>参与统计的订单</MuiBox>
			  {validOrdersTruncated && (
				<MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-700)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>当前显示最近 {validOrders.length} / {validOrdersTotal} 条，搜索仅覆盖已加载明细。</MuiBox>
			  )}
			</div>
            <MuiBox component='div' sx={{ 'position': 'relative' }}>
              <MuiBox component='input'
                placeholder="搜索订单号/商品/买家..."
                value={searchTerm}
                onChange={/* 当前回调处理用户交互或异步状态变化。 */ (e) => setSearchTerm(e.target.value)}
                sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '&:focus': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-brand-400)/var(--minimal-border-opacity,1))',
  },
  'outline': '2px solid transparent',
  'outlineOffset': '2px',
  'width': '12rem',
}}
                type="text"
              />
            </MuiBox>
          </MuiBox>
          <MuiBox component='div' sx={{ 'overflowX': 'auto', 'flex': '1 1 0%', 'maxHeight': '400px' }}>
            {ordersLoading ? (
              <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'paddingTop': '5rem',
  'paddingBottom': '5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>
                <MuiBox component={Activity} sx={{ 'width': '1.5rem', 'height': '1.5rem', 'animation': 'spin 1s linear infinite', 'marginRight': '.5rem' }} />
                加载中...
              </MuiBox>
            ) : filteredValidOrders.length === 0 ? (
              <MuiBox component='div' sx={{
  'display': 'flex',
  'flexDirection': 'column',
  'alignItems': 'center',
  'justifyContent': 'center',
  'paddingTop': '4rem',
  'paddingBottom': '4rem',
  'paddingLeft': '2rem',
  'paddingRight': '2rem',
  'textAlign': 'center',
}}>
                <MuiBox component='div' sx={{
  'width': '3.5rem',
  'height': '3.5rem',
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'marginBottom': '1rem',
}}>
                  <MuiBox component={PackageCheck} sx={{
  'width': '1.75rem',
  'height': '1.75rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-text-opacity,1))',
}} />
                </MuiBox>
                {normalizedSearchTerm ? (
                  <>
                    <MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>没有匹配的订单</MuiBox>
                    <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'marginTop': '.5rem',
  'maxWidth': '28rem',
}}>
                      当前共有 {validOrders.length} 单参与统计，但没有订单号、商品、买家匹配“{searchTerm}”。
                    </MuiBox>
                  </>
                ) : (
                  <>
                    <MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>当前范围内没有参与统计的订单</MuiBox>
                    <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'marginTop': '.5rem',
  'maxWidth': '32rem',
}}>
                      日期范围：{currentRangeDates.startDate} 至 {currentRangeDates.endDate}；
                      统计口径：待发货、已发货、已完成，且订单金额不为空。
                      当前统计卡片订单数：{analytics.revenue_stats.total_orders} 单。
                    </MuiBox>
                  </>
                )}
              </MuiBox>
            ) : (
              <MuiBox component='table' sx={{ 'width': '100%', 'minWidth': '760px', 'textAlign': 'left', 'borderCollapse': 'collapse' }}>
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
                    <MuiBox component='th' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1rem', 'paddingBottom': '1rem' }}>订单信息</MuiBox>
                    <MuiBox component='th' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1rem', 'paddingBottom': '1rem' }}>买家信息</MuiBox>
                    <MuiBox component='th' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1rem', 'paddingBottom': '1rem' }}>金额</MuiBox>
                    <MuiBox component='th' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1rem',
  'paddingBottom': '1rem',
  'whiteSpace': 'nowrap',
}}>状态</MuiBox>
                    <MuiBox component='th' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1rem',
  'paddingBottom': '1rem',
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
                  {filteredValidOrders.map(/* 当前回调处理集合中的单个元素。 */ (order) => (
                      <MuiBox component='tr' key={order.order_id} sx={{
  '&:hover': { 'backgroundColor': 'rgb(var(--minimal-color-warning-50)/.5)' },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>
                        <MuiBox component='td' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1rem', 'paddingBottom': '1rem' }}>
                          <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.75rem' }}>
                            <MuiBox component='div' sx={{
  'width': '3rem',
  'height': '3rem',
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
                              <MuiBox component={PackageCheck} sx={{
  'width': '100%',
  'height': '100%',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-text-opacity,1))',
  'padding': '.5rem',
}} />
                            </MuiBox>
                            <MuiBox component='div' sx={{ 'minWidth': '0' }}>
                              <MuiBox component='div' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'WebkitLineClamp': '1',
  'overflow': 'hidden',
  'display': '-webkit-box',
  'WebkitBoxOrient': 'vertical',
}}>
                                {order.item_title || order.item_id || '未知商品'}
                              </MuiBox>
                              <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
}}>{order.order_id}</MuiBox>
                              <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'marginTop': '.125rem',
}}>数量: {order.quantity || 1}</MuiBox>
                            </MuiBox>
                          </MuiBox>
                        </MuiBox>
                        <MuiBox component='td' sx={{ 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem', 'paddingTop': '1rem', 'paddingBottom': '1rem' }}>
                          <MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>{order.buyer_id}</MuiBox>
                          {order.created_at && (
                            <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>{formatLocalDateTime(order.created_at)}</MuiBox>
                          )}
                        </MuiBox>
                        <MuiBox component='td' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1rem',
  'paddingBottom': '1rem',
  'fontSize': '1rem',
  'lineHeight': '1.5rem',
  'fontWeight': '800',
  'fontVariantNumeric': 'tabular-nums',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>
                          ¥{order.amount || '0.00'}
                        </MuiBox>
                        <MuiBox component='td' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1rem',
  'paddingBottom': '1rem',
  'whiteSpace': 'nowrap',
}}>
                          <StatusBadge status={order.status || order.order_status || 'unknown'} />
                        </MuiBox>
                        <MuiBox component='td' sx={{
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '1rem',
  'paddingBottom': '1rem',
  'textAlign': 'right',
}}>
                          <MuiBox component='a'
                            href={`https://www.goofish.com/order-detail?orderId=${order.order_id}&role=seller`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
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
                        </MuiBox>
                      </MuiBox>
                    ))}
                </MuiBox>
              </MuiBox>
            )}
          </MuiBox>
        </MinimalSectionCard>

        {/* 商品金额分析 */}
        <MinimalSectionCard title="商品金额分析 (TOP5)" sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
}}>
          {categoryDataData.length === 0 ? (
            <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'height': '300px',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>暂无数据</MuiBox>
          ) : (
            <>
              <Box
                data-chart="dashboard-pie"
                role="img"
                aria-label={`商品金额分析，总金额 ${formatCurrency(totalAmount)}`}
                sx={{ height: 280, position: 'relative' }}
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
                        boxShadow: 'var(--minimal-shadow-md)'
                      }}
                      formatter={/* 当前回调处理用户交互或异步状态变化。 */ (value) => `¥${Number(value || 0).toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <MuiBox component='div' sx={{
  'pointerEvents': 'none',
  'position': 'absolute',
  'inset': '0',
  'zIndex': '10',
  'display': 'flex',
  'flexDirection': 'column',
  'alignItems': 'center',
  'justifyContent': 'center',
}}>
                  <MuiBox component='span' sx={{
  'fontSize': '1.125rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  '--minimal-numeric-spacing': 'tabular-nums',
  'fontVariantNumeric': 'var(--minimal-ordinal) var(--minimal-slashed-zero) var(--minimal-numeric-figure) var(--minimal-numeric-spacing) var(--minimal-numeric-fraction)',
}}>{formatCurrency(totalAmount)}</MuiBox>
                  <MuiBox component='span' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '500',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'marginTop': '.125rem',
}}>总金额</MuiBox>
                </MuiBox>
              </Box>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
  'marginTop': '1rem',
}}>
                {categoryDataData.map(/* 当前回调处理集合中的单个元素。 */ (cat) => (
                  <MuiBox component='div' key={cat.name} sx={{
  'display': 'flex',
  'justifyContent': 'space-between',
  'alignItems': 'center',
  'gap': '.75rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}>
                    <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.5rem', 'minWidth': '0', 'flex': '1 1 0%' }}>
                      <MuiBox component='div'
                        sx={{ 'width': '.75rem', 'height': '.75rem', 'borderRadius': '9999px', 'flexShrink': '0' }}
                        style={{ backgroundColor: cat.color || COLORS[categoryDataData.indexOf(cat) % COLORS.length] }}
                      ></MuiBox>
                      <MuiBox component='span' sx={{
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'fontWeight': '500',
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
}} title={cat.name}>{cat.name}</MuiBox>
                    </MuiBox>
                    <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.75rem', 'flexShrink': '0', 'whiteSpace': 'nowrap' }}>
                      <MuiBox component='span' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>¥{cat.value.toLocaleString()}</MuiBox>
                      <MuiBox component='span' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.125rem',
  'paddingBottom': '.125rem',
  'borderRadius': '6px',
}}>{cat.percentage}%</MuiBox>
                    </MuiBox>
                  </MuiBox>
                ))}
              </MuiBox>
            </>
          )}
        </MinimalSectionCard>
      </Box>
    </Stack>
  );
};

export default Dashboard;

import { AlertCircle,DollarSign,ExternalLink,Package,PackageCheck,Search,ShoppingCart,TrendingUp,Users } from 'lucide-react';
import React,{ useState } from 'react';
import { Cell,Line,LineChart,Pie,PieChart,ResponsiveContainer,Tooltip as RechartsTooltip } from 'recharts';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha,useTheme } from '@mui/material/styles';
import { MinimalSectionCard } from '@/components/minimal';
import { getDateRange,TimeRange } from '@/shared/dateRange';
import { formatLocalDateTime } from '@/shared/dateTime';
import type { OrderStatus } from '../api';
import { DashboardTrendChart } from '../DashboardTrendChart';
import { useDashboard } from '../hooks';

// DashboardEcommerceHero 延迟加载 Minimal 电商页首屏，保持仪表盘主分片预算稳定。
const DashboardEcommerceHero = React.lazy(/* loadDashboardEcommerceHero 加载 Minimal 仪表盘首屏组合。 */ () => import('../components/DashboardEcommerceHero'));

/** 格式化仪表盘内的人民币金额。 */
const formatCurrency = (value: number): string => `¥${Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;

/** StatusBadge 将订单状态适配为 Minimal/MUI 的紧凑状态芯片。 */
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

  return <Chip color={colors[status] || 'default'} label={labels[status] || status} size="small" variant="outlined" sx={{ display: 'inline-flex', fontWeight: 700, whiteSpace: 'nowrap' }} />;
};

/** StatTone 是仪表盘统计卡片使用的 MUI 语义色集合。 */
type StatTone = 'primary' | 'success' | 'warning' | 'info';

/** DashboardMetricCardProps 描述单个经营指标卡片。 */
interface DashboardMetricCardProps {
  /** title 是指标名称。 */
  title: string;
  /** value 是当前指标值。 */
  value: string | number;
  /** icon 是指标标题左侧的 Lucide 图标。 */
  icon: React.ElementType;
  /** tone 是统计图和趋势的 MUI 语义色。 */
  tone: StatTone;
  /** trend 是可选的周期趋势文案。 */
  trend?: string;
  /** series 是实际图表数据派生出的趋势序列。 */
  series?: number[];
}

/** DashboardMetricSparkline 以真实统计序列显示轻量趋势线。 */
const DashboardMetricSparkline: React.FC<{ /** series 是趋势序列。 */ series: number[]; /** color 是当前主题色。 */ color: string }> = ({ series, color }) => {
  if (series.length < 2) return null;
  return (
    <Box aria-hidden="true" sx={{ height: 54, width: 116, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series.map(/* value 转换为 Recharts 所需的数据点。 */ value => ({ value }))}>
          <Line dataKey="value" type="monotone" stroke={color} strokeWidth={3} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

/** DashboardMetricCard 以 Minimal 电商统计卡片结构呈现真实经营数据。 */
const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({ title, value, icon: Icon, tone, trend, series = [] }) => {
  // theme 确保图标、趋势线随设置抽屉中的颜色预设即时变化。
  const theme = useTheme();
  // color 是当前统计卡片采用的 MUI 语义色。
  const color = theme.palette[tone].main;
  return (
    <MinimalSectionCard data-stat-card={title} contentSx={{ height: '100%' }} sx={{ height: '100%', minHeight: 170 }}>
      <Stack sx={{ height: '100%', justifyContent: 'space-between', gap: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.primary' }}>
          <Icon aria-hidden="true" color={color} size={19} strokeWidth={2} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: { xs: '1.7rem', sm: '2rem' }, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
            {trend ? (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.75, color: trend.startsWith('-') ? 'error.main' : 'success.main' }}>
                <TrendingUp aria-hidden="true" size={16} strokeWidth={2.5} />
                <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 700 }}>{trend}</Typography>
                <Typography variant="body2" color="text.secondary">较上期</Typography>
              </Stack>
            ) : null}
          </Box>
          <DashboardMetricSparkline color={color} series={series} />
        </Stack>
      </Stack>
    </MinimalSectionCard>
  );
};

/** DashboardChartEmpty 显示无统计数据时的统一 Minimal 空状态。 */
const DashboardChartEmpty: React.FC<{ /** label 是空状态说明。 */ label: string }> = ({ label }) => (
  <Stack sx={{ height: '100%', minHeight: 180, alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'text.disabled' }} spacing={1}>
    <PackageCheck aria-hidden="true" size={40} strokeWidth={1.4} />
    <Typography variant="body2" color="text.secondary">{label}</Typography>
  </Stack>
);

/** Dashboard 显示与原有 API 对接的 Minimal 电商仪表盘。 */
const Dashboard: React.FC = () => {
  // [timeRange, setTimeRange] 保存当前查询的时间范围。
  const [timeRange, setTimeRange] = useState<TimeRange>('7days');
  // [customStartDate, setCustomStartDate] 保存自定义范围起始日期。
  const [customStartDate, setCustomStartDate] = useState('');
  // [customEndDate, setCustomEndDate] 保存自定义范围结束日期。
  const [customEndDate, setCustomEndDate] = useState('');
  // [searchTerm, setSearchTerm] 保存订单表格的本地过滤文本。
  const [searchTerm, setSearchTerm] = useState('');
  // [customRangeVersion, setCustomRangeVersion] 用于确认自定义日期后触发新请求。
  const [customRangeVersion, setCustomRangeVersion] = useState(0);
  // dashboard 保留原 feature Hook，页面仅重新组合 Minimal/MUI 呈现层。
  const dashboard = useDashboard({ range: timeRange, customStartDate, customEndDate, customRangeVersion });
  // dashboardData 汇总原有 Hook 返回的查询状态、统计和业务数据。
  const { data, status, chartData, productSalesData, sourceData, categoryData, maxProductSales, trendPercent, selectedRangeLabel, refresh } = dashboard;
  // theme 为卡片、图表和空状态提供当前 MUI 调色板。
  const theme = useTheme();
  // stats 是账号和卡密库存统计。
  const stats = data?.stats || null;
  // analytics 是营收、订单与商品分析结果。
  const analytics = data?.analytics || null;
  // validOrders 是参与统计且已加载的订单明细。
  const validOrders = data?.validOrders.orders || [];
  // validOrdersTotal 是服务端统计范围内的订单总数。
  const validOrdersTotal = data?.validOrders.total || 0;
  // validOrdersTruncated 表示当前订单明细是否被服务端截断。
  const validOrdersTruncated = data?.validOrders.truncated || false;
  // ordersLoading 只控制订单明细区域的加载状态。
  const ordersLoading = status.range === 'loading';
  // loadError 保留原有 Hook 的请求错误信息。
  const loadError = status.error;
  // chartColors 按当前主题为饼图、排行和图例分配稳定颜色。
  const chartColors = [theme.palette.primary.main, theme.palette.info.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.secondary.main];

  if (loadError && (!stats || !analytics)) {
    return (
      <Stack sx={{ p: { xs: 3, sm: 6 }, alignItems: 'center', gap: 1.5 }}>
        <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ width: '100%', maxWidth: 640 }}>{loadError}</Alert>
        <Button type="button" variant="contained" onClick={refresh}>重新加载</Button>
      </Stack>
    );
  }
  if (!stats || !analytics) {
    return <Stack role="status" aria-label="正在加载仪表盘" sx={{ p: { xs: 3, sm: 6 }, alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={32} /></Stack>;
  }

  // totalOrders 是当前日期范围内参与统计的订单数。
  const totalOrders = analytics.revenue_stats.total_orders || 0;
  // totalAmount 是当前日期范围内参与统计的订单金额。
  const totalAmount = analytics.revenue_stats.total_amount || 0;
  // timeRangeOptions 是时间筛选控件的固定业务范围。
  const timeRangeOptions = [
    { key: 'today' as TimeRange, label: '今天' },
    { key: 'yesterday' as TimeRange, label: '昨天' },
    { key: '3days' as TimeRange, label: '三天内' },
    { key: '7days' as TimeRange, label: '7天内' },
    { key: '30days' as TimeRange, label: '一个月内' },
    { key: 'custom' as TimeRange, label: '自定义' },
  ];
  // currentRangeDates 用于空订单提示中展示当前查询区间。
  let currentRangeDates;
  try {
    currentRangeDates = getDateRange(timeRange, new Date(), customStartDate, customEndDate);
  } catch {
    currentRangeDates = { startDate: customStartDate, endDate: customEndDate };
  }
  // normalizedSearchTerm 是用于本地订单筛选的规范化关键字。
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  // filteredValidOrders 将当前已加载订单按订单、商品或买家过滤。
  const filteredValidOrders = validOrders.filter(/* order 判断订单是否命中当前筛选关键字。 */ order => (
    order.order_id?.toLowerCase().includes(normalizedSearchTerm)
    || order.item_id?.toLowerCase().includes(normalizedSearchTerm)
    || order.item_title?.toLowerCase().includes(normalizedSearchTerm)
    || order.buyer_id?.toLowerCase().includes(normalizedSearchTerm)
  ));
  // amountSeries 从真实趋势图中提取营收迷你曲线。
  const amountSeries = chartData.map(/* point 提取单日营收。 */ point => point.amount);
  // orderSeries 从真实趋势图中提取订单量迷你曲线。
  const orderSeries = chartData.map(/* point 提取单日订单数量。 */ point => point.orders);

  return (
    <Stack data-page-template="minimal-dashboard" spacing={{ xs: 2.5, sm: 3 }}>
      {loadError ? <Alert severity="warning" action={<Button color="inherit" size="small" onClick={refresh}>重试</Button>}>{loadError}</Alert> : null}

      <React.Suspense fallback={<Box aria-busy="true" sx={{ minHeight: { xs: 430, md: 360 }, borderRadius: 1, bgcolor: 'action.hover' }} />}>
        <DashboardEcommerceHero totalAmount={totalAmount} totalOrders={totalOrders} items={data?.items || []} stats={stats} />
      </React.Suspense>

      <MinimalSectionCard contentSx={{ p: { xs: 1, sm: 1.25 } }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', lg: 'center' }, justifyContent: 'space-between' }}>
          <ToggleButtonGroup
            aria-label="统计时间范围"
            exclusive
            onChange={/* nextRange 切换统计时间范围。 */ (_event, nextRange: TimeRange | null) => { if (nextRange) setTimeRange(nextRange); }}
            size="small"
            value={timeRange}
          >
            {timeRangeOptions.map(/* option 渲染一个可选时间范围。 */ option => <ToggleButton key={option.key} value={option.key}>{option.label}</ToggleButton>)}
          </ToggleButtonGroup>
          {timeRange === 'custom' ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
              <TextField label="开始日期" type="date" value={customStartDate} onChange={/* event 更新自定义起始日期。 */ event => setCustomStartDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: { sm: 164 } }} />
              <TextField label="结束日期" type="date" value={customEndDate} onChange={/* event 更新自定义结束日期。 */ event => setCustomEndDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: { sm: 164 } }} />
              <Button variant="contained" onClick={/* value 递增以提交自定义范围。 */ () => setCustomRangeVersion(value => /* value 生成下一次请求版本。 */ value + 1)}>应用</Button>
            </Stack>
          ) : <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>{selectedRangeLabel}经营数据</Typography>}
        </Stack>
      </MinimalSectionCard>

      <Box data-dashboard-metric-grid sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 2, sm: 2.5 } }}>
        <DashboardMetricCard title="累计营收 (CNY)" value={formatCurrency(totalAmount)} icon={DollarSign} tone="primary" trend={trendPercent || undefined} series={amountSeries} />
        <DashboardMetricCard title="活跃账号 / 总数" value={`${stats.active_cookies} / ${stats.total_cookies}`} icon={Users} tone="info" />
        <DashboardMetricCard title="订单数" value={totalOrders.toLocaleString('zh-CN')} icon={ShoppingCart} tone="success" series={orderSeries} />
        <DashboardMetricCard title="库存卡密余量" value={stats.available_card_stock.toLocaleString('zh-CN')} icon={Package} tone="warning" />
      </Box>

      <Box data-dashboard-analytics-grid sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.45fr) minmax(300px, 0.9fr)' }, gap: { xs: 2.5, sm: 3 } }}>
        <DashboardTrendChart chartData={chartData} selectedRangeLabel={selectedRangeLabel} totalAmount={totalAmount} />
        <MinimalSectionCard title="商品下单占比" action={<Typography variant="body2" color="text.secondary">{totalOrders.toLocaleString('zh-CN')} 单</Typography>} contentSx={{ pt: 1.5 }}>
          <Box data-chart="dashboard-pie" role="img" aria-label={`商品下单占比，共 ${totalOrders} 单`} sx={{ height: 215, position: 'relative' }}>
            {sourceData.length === 0 ? <DashboardChartEmpty label="暂无商品下单数据" /> : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart accessibilityLayer={false}>
                    <Pie data={sourceData} cx="50%" cy="48%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" activeShape={{ outerRadius: 86, stroke: 'none', strokeWidth: 0 }} rootTabIndex={-1} label={false} labelLine={false}>
                      {sourceData.map(/* entry、index 为每个来源饼块匹配主题颜色。 */ (entry, index) => <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />)}
                    </Pie>
                    <RechartsTooltip wrapperStyle={{ zIndex: 30, outline: 'none' }} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, boxShadow: theme.shadows[8] }} formatter={/* value 格式化订单数量提示。 */ value => `${Number(value || 0)} 单`} />
                  </PieChart>
                </ResponsiveContainer>
                <Stack sx={{ pointerEvents: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', pb: 2.75 }}>
                  <Typography variant="h4" sx={{ fontVariantNumeric: 'tabular-nums' }}>{totalOrders}</Typography>
                  <Typography variant="caption" color="text.secondary">总订单</Typography>
                </Stack>
              </>
            )}
          </Box>
          {sourceData.map(/* item、index 渲染商品来源图例。 */ (item, index) => (
            <Stack key={item.name} direction="row" spacing={1} sx={{ alignItems: 'center', mt: index === 0 ? 0.5 : 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: chartColors[index % chartColors.length], flexShrink: 0 }} />
              <Typography noWrap variant="body2" sx={{ flex: 1 }}>{item.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{item.percent.toFixed(1)}%</Typography>
            </Stack>
          ))}
        </MinimalSectionCard>
      </Box>

      <Box data-dashboard-ranking-grid sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: { xs: 2.5, sm: 3 } }}>
        <MinimalSectionCard title="商品销量排行" action={<Typography variant="body2" color="text.secondary">TOP {productSalesData.length}</Typography>}>
          {productSalesData.length === 0 ? <DashboardChartEmpty label="暂无商品销量数据" /> : (
            <Stack spacing={1.75} sx={{ maxHeight: 338, overflowY: 'auto', pr: 0.5 }}>
              {productSalesData.map(/* item、index 按销量顺序渲染商品排行。 */ (item, index) => {
                // color 是当前排行项对应的主题色。
                const color = chartColors[index % chartColors.length];
                return (
                  <Box key={`${item.name}-${index}`}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                        <Typography color={index < 3 ? 'primary.main' : 'text.secondary'} sx={{ width: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{index + 1}</Typography>
                        <Typography noWrap variant="body2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{item.sales} 单</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={Math.max(8, (item.sales / maxProductSales) * 100)} sx={{ height: 6, bgcolor: alpha(color, 0.16), '& .MuiLinearProgress-bar': { bgcolor: color } }} />
                  </Box>
                );
              })}
            </Stack>
          )}
        </MinimalSectionCard>

        <MinimalSectionCard title="商品金额分析 (TOP5)" action={<Typography variant="body2" color="text.secondary">{formatCurrency(totalAmount)}</Typography>} contentSx={{ pt: 1.5 }}>
          {categoryData.length === 0 ? <DashboardChartEmpty label="暂无商品金额数据" /> : (
            <>
              <Box data-chart="dashboard-pie" role="img" aria-label={`商品金额分析，总金额 ${formatCurrency(totalAmount)}`} sx={{ height: 194, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart accessibilityLayer={false}>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={48} outerRadius={74} paddingAngle={3} dataKey="value" activeShape={{ outerRadius: 82, stroke: 'none', strokeWidth: 0 }} rootTabIndex={-1} label={false} labelLine={false}>
                      {categoryData.map(/* entry、index 为金额占比饼块匹配主题颜色。 */ (entry, index) => <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} />)}
                    </Pie>
                    <RechartsTooltip wrapperStyle={{ zIndex: 30, outline: 'none' }} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, boxShadow: theme.shadows[8] }} formatter={/* value 格式化金额提示。 */ value => formatCurrency(Number(value || 0))} />
                  </PieChart>
                </ResponsiveContainer>
                <Stack sx={{ pointerEvents: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(totalAmount)}</Typography>
                  <Typography variant="caption" color="text.secondary">总金额</Typography>
                </Stack>
              </Box>
              <Stack spacing={1.25} sx={{ mt: 1 }}>
                {categoryData.map(/* item、index 渲染商品金额图例。 */ (item, index) => (
                  <Stack key={item.name} direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: chartColors[index % chartColors.length], flexShrink: 0 }} />
                      <Typography noWrap variant="body2">{item.name}</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatCurrency(item.value)}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ width: 40, textAlign: 'right' }}>{item.percentage}%</Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </MinimalSectionCard>
      </Box>

      <MinimalSectionCard data-dashboard-order-table contentSx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ px: { xs: 2, sm: 3 }, py: 2.25, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6">参与统计的订单</Typography>
            {validOrdersTruncated ? <Typography variant="caption" color="warning.main">当前显示最近 {validOrders.length} / {validOrdersTotal} 条，搜索仅覆盖已加载明细。</Typography> : null}
          </Box>
          <TextField
            size="small"
            placeholder="搜索订单号、商品或买家"
            value={searchTerm}
            onChange={/* event 更新本地订单筛选词。 */ event => setSearchTerm(event.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> } }}
            sx={{ width: { xs: '100%', md: 280 } }}
          />
        </Stack>
        {ordersLoading ? <Stack sx={{ py: 8, alignItems: 'center', color: 'text.secondary' }} spacing={1}><CircularProgress size={26} /><Typography variant="body2">加载中...</Typography></Stack> : null}
        {!ordersLoading && filteredValidOrders.length === 0 ? (
          <Stack sx={{ py: 8, px: 3, alignItems: 'center', textAlign: 'center' }} spacing={1}>
            <PackageCheck aria-hidden="true" size={38} color={theme.palette.text.disabled} strokeWidth={1.4} />
            <Typography variant="subtitle1">{normalizedSearchTerm ? '没有匹配的订单' : '当前范围内没有参与统计的订单'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
              {normalizedSearchTerm ? `当前共有 ${validOrders.length} 单参与统计，但没有订单号、商品、买家匹配“${searchTerm}”。` : `日期范围：${currentRangeDates.startDate} 至 ${currentRangeDates.endDate}；统计口径为待发货、已发货、已完成且订单金额不为空。`}
            </Typography>
          </Stack>
        ) : null}
        {!ordersLoading && filteredValidOrders.length > 0 ? (
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader size="small" sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>订单信息</TableCell>
                  <TableCell>买家信息</TableCell>
                  <TableCell>金额</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredValidOrders.map(/* order 渲染参与统计的一条订单。 */ order => (
                  <TableRow hover key={order.order_id}>
                    <TableCell>
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 260 }}>
                        <PackageCheck aria-hidden="true" color={theme.palette.text.secondary} size={22} strokeWidth={1.8} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography noWrap variant="body2" sx={{ fontWeight: 700 }}>{order.item_title || order.item_id || '未知商品'}</Typography>
                          <Typography noWrap variant="caption" color="text.secondary">{order.order_id} · 数量 {order.quantity || 1}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{order.buyer_id}</Typography>
                      {order.created_at ? <Typography variant="caption" color="text.secondary">{formatLocalDateTime(order.created_at)}</Typography> : null}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>¥{order.amount || '0.00'}</TableCell>
                    <TableCell><StatusBadge status={order.status || order.order_status || 'unknown'} /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="查看闲鱼详情">
                        <IconButton component="a" href={`https://www.goofish.com/order-detail?orderId=${order.order_id}&role=seller`} target="_blank" rel="noopener noreferrer" size="small" aria-label="查看闲鱼详情">
                          <ExternalLink size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </MinimalSectionCard>
    </Stack>
  );
};

export default Dashboard;

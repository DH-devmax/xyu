import { ShoppingCart } from 'lucide-react';
import React from 'react';
import { Area,AreaChart,Bar,BarChart,CartesianGrid,Cell,ResponsiveContainer,Tooltip,XAxis,YAxis } from 'recharts';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha,useTheme } from '@mui/material/styles';
import { MinimalSectionCard } from '@/components/minimal';
import type { DashboardChartPoint } from './state';

/** 趋势图组件的输入参数。 */
export type DashboardTrendChartProps = {
  /** 趋势图的日期与营收数据点。 */
  chartData: DashboardChartPoint[];
  /** 当前选择范围的中文名称。 */
  selectedRangeLabel: string;
  /** 当前范围的营收总额。 */
  totalAmount: number;
};

/** 展示 Dashboard 营收趋势，并根据数据点数量选择柱状图或面积图。 */
export const DashboardTrendChart: React.FC<DashboardTrendChartProps> = ({ chartData, selectedRangeLabel, totalAmount }) => {
  // theme 读取当前设置抽屉生效后的 MUI 调色板，图表不再依赖旧 CSS 色彩令牌。
  const theme = useTheme();
  // tooltipStyle 统一 Recharts 浮层与 Minimal 卡片外观。
  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    boxShadow: theme.shadows[8],
    padding: '10px 12px',
  };

  return (
    <MinimalSectionCard contentSx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h6">营收趋势分析</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{selectedRangeLabel}的销售额走势</Typography>
        </Box>
        <Typography color="primary.main" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          ¥{totalAmount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
        </Typography>
      </Stack>
      <Box data-chart="dashboard-revenue" sx={{ height: 320, width: '100%' }}>
        {chartData.length === 0 || totalAmount === 0 ? (
          <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', textAlign: 'center' }} spacing={1}>
            <ShoppingCart size={44} strokeWidth={1.5} />
            <Typography variant="subtitle1" color="text.secondary">暂无营收数据</Typography>
            <Typography variant="body2" color="text.secondary">所选时间范围内暂无订单记录</Typography>
          </Stack>
        ) : chartData.length <= 2 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 12, left: 0, bottom: 18 }} barCategoryGap="45%">
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.disabled, fontSize: 12 }} tickFormatter={/* value 格式化纵轴金额。 */ value => `¥${value}`} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: theme.palette.text.secondary, fontWeight: 500 }}
                itemStyle={{ color: theme.palette.primary.main, fontWeight: 700 }}
                cursor={{ fill: alpha(theme.palette.primary.main, 0.08) }}
                formatter={/* value 格式化悬浮提示金额。 */ value => [`¥${Number(value).toFixed(2)}`, '营收']}
              />
              <Bar dataKey="amount" fill={theme.palette.primary.main} maxBarSize={72} radius={[8, 8, 0, 0]} activeBar={false} stroke="none" strokeWidth={0}>
                {chartData.map(/* _、index 将每个短周期数据点着色为主题主色。 */ (_, index) => <Cell key={`cell-${index}`} fill={theme.palette.primary.main} stroke="none" strokeWidth={0} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboard-revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.32} />
                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.disabled, fontSize: 12 }} dy={12} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.disabled, fontSize: 12 }} />
              <CartesianGrid vertical={false} stroke={theme.palette.divider} strokeDasharray="3 3" />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: theme.palette.text.secondary, fontWeight: 500 }}
                itemStyle={{ color: theme.palette.primary.main, fontWeight: 700 }}
                cursor={{ stroke: theme.palette.primary.main, strokeWidth: 2, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={theme.palette.primary.main}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#dashboard-revenue-gradient)"
                activeDot={{ r: 6, fill: theme.palette.background.paper, stroke: theme.palette.primary.main, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Box>
    </MinimalSectionCard>
  );
};

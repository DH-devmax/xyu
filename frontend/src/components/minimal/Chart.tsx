import type { ApexOptions } from 'apexcharts';
import type { SxProps, Theme } from '@mui/material/styles';
import type { Props as ApexReactProps } from 'react-apexcharts';
import React,{ useMemo } from 'react';
import ApexChart from 'react-apexcharts';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

/** MinimalChartProps 描述 Minimal 图表适配器的基础输入。 */
export interface MinimalChartProps {
  /** type 是 ApexCharts 图表类型。 */
  type: NonNullable<ApexReactProps['type']>;
  /** series 是 ApexCharts 使用的序列数据。 */
  series: NonNullable<ApexOptions['series']>;
  /** options 是已经合并主题后的图表配置。 */
  options?: ApexOptions;
  /** sx 是外层图表容器的 MUI 样式。 */
  sx?: SxProps<Theme>;
  /** height 是图表高度。 */
  height?: string | number;
  /** width 是图表宽度。 */
  width?: string | number;
  /** aria-hidden 保持图表装饰语义。 */
  'aria-hidden'?: boolean | 'true' | 'false';
}

/** useChart 合并 Minimal 基础配置与页面级图表配置。 */
export const useChart = (updatedOptions: ApexOptions = {}): ApexOptions => {
  // theme 将当前 MUI 配色、字体和明暗模式注入 ApexCharts。
  const theme = useTheme();
  return useMemo(/* buildChartOptions 合并主题默认值与当前页面覆盖项。 */ () => ({
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      parentHeightOffset: 0,
      fontFamily: theme.typography.fontFamily,
      foreColor: theme.palette.text.disabled,
      animations: { enabled: false },
      ...updatedOptions.chart,
    },
    colors: [theme.palette.primary.main],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', lineCap: 'round', width: 2.5, ...updatedOptions.stroke },
    markers: { size: 0, strokeColors: theme.palette.background.paper, ...updatedOptions.markers },
    grid: { show: false, padding: { top: 6, right: 6, bottom: 6, left: 6 }, ...updatedOptions.grid },
    tooltip: { theme: theme.palette.mode, fillSeriesColor: false, ...updatedOptions.tooltip },
    ...updatedOptions,
  }), [theme, updatedOptions]);
};

/** MinimalChart 复用 Minimal 原版 Chart/useChart 结构呈现 ApexCharts 图表。 */
export const MinimalChart: React.FC<MinimalChartProps> = ({ type, series, options, sx, height = '100%', width = '100%', ...other }) => (
  <Box sx={[{ width: '100%', flexShrink: 0, position: 'relative' }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
    <ApexChart type={type} series={series} options={options} width={width} height={height} />
  </Box>
);

export default MinimalChart;

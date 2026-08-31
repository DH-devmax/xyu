import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe,expect,test } from 'vitest';
import { StatusBadge } from './Dashboard';

// dashboardSource 仪表盘测试数据源。
const dashboardSource = readFileSync(resolve(__dirname, 'Dashboard.tsx'), 'utf8');
// trendChartSource 趋势图测试数据源。
const trendChartSource = readFileSync(resolve(__dirname, '../DashboardTrendChart.tsx'), 'utf8');
// globalStyles 测试用全局样式。
const globalStyles = readFileSync(resolve(__dirname, '../../../global.css'), 'utf8');

describe('Dashboard presentation safeguards', /* 当前回调处理用户交互或异步状态变化。 */ () => {
  test('keeps order status badges on one line', /* 当前回调处理用户交互或异步状态变化。 */ () => {
    // html 渲染后的 HTML。
    const html = renderToStaticMarkup(<StatusBadge status="shipped" />);

    expect(html).toContain('已发货');
    expect(html).toContain('inline-flex');
    expect(html).toContain('white-space:nowrap');
    expect(dashboardSource).toContain("'minWidth': '760px'");
  });

  test('keeps the shell title while using Minimal section adapters and business data hooks', /* 当前回调验证一级标题由应用壳提供，仪表盘仍使用模板适配切片。 */ () => {
    expect(dashboardSource).not.toContain('<MinimalPageHeader');
    expect(dashboardSource).toContain('系统正常运行');
    expect(dashboardSource).toContain('<MinimalSectionCard');
    expect(dashboardSource).toContain('useDashboard({ range: timeRange');
    expect(dashboardSource).toContain('<DashboardTrendChart');
  });

  test('pie charts use enlarged active sectors without focus rings or external label lines', /* 当前回调处理用户交互或异步状态变化。 */ () => {
    expect(dashboardSource.match(/accessibilityLayer=\{false\}/g)).toHaveLength(2);
    expect(dashboardSource.match(/activeShape=\{\{/g)).toHaveLength(2);
    expect(dashboardSource).toContain('outerRadius: 96');
    expect(dashboardSource).toContain('outerRadius: 98');
    expect(dashboardSource.match(/stroke: 'none'/g)).toHaveLength(2);
    expect(dashboardSource.match(/strokeWidth: 0/g)).toHaveLength(2);
    expect(dashboardSource.match(/rootTabIndex=\{-1\}/g)).toHaveLength(2);
    expect(dashboardSource.match(/label=\{false\}/g)).toHaveLength(2);
    expect(dashboardSource.match(/labelLine=\{false\}/g)).toHaveLength(2);
    expect(dashboardSource.match(/wrapperStyle=\{\{ zIndex: 30, outline: 'none' \}\}/g)).toHaveLength(2);
    expect(dashboardSource.match(/'position': 'absolute'/g)).toHaveLength(2);
    expect(dashboardSource.match(/'inset': '0'/g)).toHaveLength(2);
    expect(dashboardSource.match(/'zIndex': '10'/g)).toHaveLength(2);
    expect(globalStyles).toContain("[data-chart='dashboard-pie'] .recharts-pie-sector:focus");
    expect(trendChartSource).toContain('data-chart="dashboard-revenue"');
    expect(trendChartSource).toContain('height: 350');
    expect(trendChartSource).toContain('activeBar={false}');
    expect(trendChartSource).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(trendChartSource).toContain("fill={cssColor('brand')}");
    expect(globalStyles).toContain("[data-chart='dashboard-revenue'] .recharts-bar-rectangle:focus");
  });
});

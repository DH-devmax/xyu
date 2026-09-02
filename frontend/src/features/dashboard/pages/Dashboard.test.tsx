import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe,expect,test } from 'vitest';
import { StatusBadge } from './Dashboard';

// dashboardSource 仪表盘测试数据源。
const dashboardSource = readFileSync(resolve(__dirname, 'Dashboard.tsx'), 'utf8');
// ecommerceHeroSource Minimal 电商首屏组合源码。
const ecommerceHeroSource = readFileSync(resolve(__dirname, '../components/DashboardEcommerceHero.tsx'), 'utf8');
// trendChartSource 趋势图测试数据源。
const trendChartSource = readFileSync(resolve(__dirname, '../DashboardTrendChart.tsx'), 'utf8');
// minimalChartSource Minimal ApexCharts 适配器源码。
const minimalChartSource = readFileSync(resolve(__dirname, '../../../components/minimal/Chart.tsx'), 'utf8');
// globalStyles 测试用全局样式。
const globalStyles = readFileSync(resolve(__dirname, '../../../global.css'), 'utf8');

describe('Dashboard presentation safeguards', /* 当前回调处理用户交互或异步状态变化。 */ () => {
  test('keeps order status badges on one line', /* 当前回调处理用户交互或异步状态变化。 */ () => {
    // html 渲染后的 HTML。
    const html = renderToStaticMarkup(<StatusBadge status="shipped" />);

    expect(html).toContain('已发货');
    expect(html).toContain('inline-flex');
    expect(html).toContain('white-space:nowrap');
    expect(dashboardSource).toContain('minWidth: 760');
  });

  test('keeps the shell title while using Minimal section adapters and business data hooks', /* 当前回调验证一级标题由应用壳提供，仪表盘仍使用模板适配切片。 */ () => {
    expect(dashboardSource).not.toContain('<MinimalPageHeader');
    expect(ecommerceHeroSource).toContain('系统正常运行');
    expect(dashboardSource).toContain('<MinimalSectionCard');
    expect(dashboardSource).toContain('useDashboard({ range: timeRange');
    expect(dashboardSource).toContain('<DashboardTrendChart');
  });

  test('uses the Minimal ecommerce welcome composition with real dashboard data', /* 当前回调验证 Minimal 欢迎区仍绑定真实仪表盘数据。 */ () => {
    expect(dashboardSource).toContain('<DashboardEcommerceHero');
    expect(ecommerceHeroSource).toContain('data-dashboard-welcome');
    expect(ecommerceHeroSource).toContain('data-dashboard-minimal-grid');
    expect(ecommerceHeroSource).toContain('<MotivationIllustration');
    expect(ecommerceHeroSource).toContain("/static/assets/background/background-6.webp");
    expect(ecommerceHeroSource).toContain('totalOrders.toLocaleString');
  });

  test('uses MUI dashboards cards and charts without legacy color tokens', /* 当前回调验证仪表盘图表与卡片已使用 MUI 主题色。 */ () => {
    expect(dashboardSource).toContain('data-dashboard-metric-grid');
    expect(dashboardSource).toContain('data-dashboard-analytics-grid');
    expect(dashboardSource).toContain('data-dashboard-ranking-grid');
    expect(dashboardSource).toContain('<TableContainer');
    expect(dashboardSource).toContain('<DashboardMetricCard');
    expect(dashboardSource).not.toContain('--minimal-');
    expect(dashboardSource.match(/accessibilityLayer=\{false\}/g)).toHaveLength(2);
    expect(dashboardSource.match(/activeShape=\{\{/g)).toHaveLength(2);
    expect(dashboardSource).toContain('outerRadius: 86');
    expect(dashboardSource).toContain('outerRadius: 82');
    expect(dashboardSource.match(/stroke: 'none'/g)).toHaveLength(2);
    expect(dashboardSource.match(/strokeWidth: 0/g)).toHaveLength(2);
    expect(dashboardSource.match(/rootTabIndex=\{-1\}/g)).toHaveLength(2);
    expect(dashboardSource.match(/label=\{false\}/g)).toHaveLength(2);
    expect(dashboardSource.match(/labelLine=\{false\}/g)).toHaveLength(2);
    expect(dashboardSource.match(/wrapperStyle=\{\{ zIndex: 30, outline: 'none' \}\}/g)).toHaveLength(2);
    expect(dashboardSource.match(/position: 'absolute'/g)).toHaveLength(2);
    expect(dashboardSource.match(/inset: 0/g)).toHaveLength(2);
    expect(globalStyles).toContain("[data-chart='dashboard-pie'] .recharts-pie-sector:focus");
    expect(trendChartSource).toContain('data-chart="dashboard-revenue"');
    expect(trendChartSource).toContain('height: 320');
    expect(trendChartSource).toContain('activeBar={false}');
    expect(trendChartSource).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(trendChartSource).toContain('useTheme()');
    expect(trendChartSource).not.toContain('--minimal-');
    expect(globalStyles).toContain("[data-chart='dashboard-revenue'] .recharts-bar-rectangle:focus");
    expect(globalStyles).toContain('[data-dashboard-main]');
  });

  test('keeps Minimal ApexCharts sparklines visible for empty and snapshot metrics', /* 当前回调验证零值和缺少历史快照时仍保留 Minimal 折线图。 */ () => {
    expect(minimalChartSource).toContain("from 'react-apexcharts'");
    expect(minimalChartSource).toContain('export const useChart');
    expect(dashboardSource).toContain('<MinimalChart');
    expect(dashboardSource).toContain('normalizedSeries');
    expect(dashboardSource).toContain('series={activeCookieSeries}');
    expect(dashboardSource).toContain('series={cardStockSeries}');
  });
});

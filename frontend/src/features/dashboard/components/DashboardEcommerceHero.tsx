import React from 'react';
import { ExternalLink } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { MinimalSectionCard } from '@/components/minimal';
import MotivationIllustration from '@/components/minimal/MotivationIllustration';
import type { DashboardStats, Item } from '../api';

// DashboardEcommerceHeroProps 描述 Minimal 首屏组合所需的真实经营数据。
export interface DashboardEcommerceHeroProps {
  // totalOrders 是当前统计范围内的订单数。
  totalOrders: number;
  // totalAmount 是当前统计范围内的订单金额。
  totalAmount: number;
  // items 是服务端返回的商品列表。
  items: Item[];
  // stats 是账号与库存统计。
  stats: DashboardStats;
}

// MinimalEcommerceWelcome 复用 Minimal 电商首页的深色欢迎区与动机插画。
const MinimalEcommerceWelcome: React.FC<Pick<DashboardEcommerceHeroProps, 'totalOrders' | 'totalAmount'>> = ({ totalOrders, totalAmount }) => (
  <Box
    data-dashboard-welcome
    component="section"
    sx={{
      minHeight: { xs: 430, md: 360 },
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexDirection: { xs: 'column', md: 'row' },
      gap: { xs: 1, md: 3 },
      p: { xs: 3, md: 5 },
      borderRadius: 'var(--dh-component-radius)',
      color: 'rgb(var(--minimal-color-white))',
      backgroundImage: "linear-gradient(to right, rgb(var(--minimal-color-ink) / 0.98) 25%, rgb(var(--minimal-color-brand-950) / 0.9) 100%), url('/static/assets/background/background-6.webp')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      border: '1px solid rgb(var(--minimal-color-ink) / 0.2)',
    }}
  >
    <Stack sx={{ position: 'relative', zIndex: 1, alignItems: { xs: 'center', md: 'flex-start' }, textAlign: { xs: 'center', md: 'left' }, maxWidth: { md: 520 } }}>
      <Typography variant="h3" sx={{ color: 'inherit', fontWeight: 800, letterSpacing: 0 }}>
        恭喜你 🎉
      </Typography>
      <Typography variant="h3" sx={{ color: 'inherit', fontWeight: 800, letterSpacing: 0, mt: 0.5 }}>
        店铺运营稳步提升
      </Typography>
      <Typography sx={{ color: 'rgb(var(--minimal-color-white) / 0.72)', fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.7, mt: 2 }}>
        本周期完成 {totalOrders.toLocaleString('zh-CN')} 笔订单，累计营收 {`¥${Number(totalAmount || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`}。
      </Typography>
      <Button component="a" href="/app/orders" variant="contained" color="success" sx={{ mt: 3, px: 3, borderRadius: 'var(--dh-component-radius)', fontWeight: 700 }}>
        查看订单
      </Button>
    </Stack>
    <MotivationIllustration
      hideBackground
      aria-hidden="true"
      sx={{ width: { xs: 280, sm: 340, md: 390 }, mt: { xs: 1, md: 2 }, mr: { md: 1 } }}
    />
  </Box>
);

// MinimalEcommerceSummary 将账号、库存和商品摘要组合为 Minimal 信息卡。
const MinimalEcommerceSummary: React.FC<Pick<DashboardEcommerceHeroProps, 'items' | 'stats'>> = ({ items, stats }) => (
  <MinimalSectionCard title="店铺概览" data-dashboard-summary>
    <Stack spacing={2.25} sx={{ height: '100%', justifyContent: 'space-between' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">当前状态</Typography>
        <Chip color="success" label="系统正常运行" size="small" variant="outlined" />
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
        <Box sx={{ p: 1.5, borderRadius: 'var(--dh-component-radius)', bgcolor: 'action.hover' }}>
          <Typography variant="h5" sx={{ fontVariantNumeric: 'tabular-nums' }}>{stats.active_cookies} / {stats.total_cookies}</Typography>
          <Typography variant="caption" color="text.secondary">活跃账号 / 总数</Typography>
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 'var(--dh-component-radius)', bgcolor: 'action.hover' }}>
          <Typography variant="h5" sx={{ fontVariantNumeric: 'tabular-nums' }}>{stats.available_card_stock.toLocaleString('zh-CN')}</Typography>
          <Typography variant="caption" color="text.secondary">可用卡密</Typography>
        </Box>
      </Box>
      <Stack spacing={1}>
        <Typography variant="subtitle2">热门商品</Typography>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">暂无商品</Typography>
        ) : (
          items.slice(0, 4).map(/* item 是当前商品摘要行。 */ item => (
            <Stack key={String(item.id)} direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap title={item.item_title || item.item_id} sx={{ minWidth: 0 }}>
                {item.item_title || item.item_id}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                {item.item_price ? `¥${item.item_price}` : '待定'}
              </Typography>
            </Stack>
          ))
        )}
      </Stack>
      <Button component="a" href="/app/items" variant="text" color="inherit" endIcon={<ExternalLink size={16} />} sx={{ alignSelf: 'flex-start', px: 0 }}>
        管理商品
      </Button>
    </Stack>
  </MinimalSectionCard>
);

// DashboardEcommerceHero 渲染 Minimal 电商页首屏并保持业务数据边界。
const DashboardEcommerceHero: React.FC<DashboardEcommerceHeroProps> = ({ totalOrders, totalAmount, items, stats }) => (
  <Box
    data-dashboard-minimal-grid
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 2fr) minmax(280px, 1fr)' },
      gap: { xs: 2.5, sm: 3.5 },
      alignItems: 'stretch',
    }}
  >
    <MinimalEcommerceWelcome totalAmount={totalAmount} totalOrders={totalOrders} />
    <MinimalEcommerceSummary items={items} stats={stats} />
  </Box>
);

export default DashboardEcommerceHero;

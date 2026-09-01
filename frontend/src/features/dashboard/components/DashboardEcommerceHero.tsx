import React from 'react';
import { ExternalLink } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import { MinimalSectionCard } from '@/components/minimal';
import MotivationIllustration from '@/components/minimal/MotivationIllustration';
import type { DashboardStats, Item } from '../api';

/** Minimal 电商首屏组合所需的真实经营数据。 */
export interface DashboardEcommerceHeroProps {
  /** 当前统计范围内的订单数。 */
  totalOrders: number;
  /** 当前统计范围内的订单金额。 */
  totalAmount: number;
  /** 服务端返回的商品列表。 */
  items: Item[];
  /** 账号与库存统计。 */
  stats: DashboardStats;
}

/** 格式化仪表盘金额，避免展示层复用后端以外的金额逻辑。 */
const formatCurrency = (value: number): string => `¥${Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;

/** Minimal 电商欢迎区，保持模板构图并只填充真实业务统计。 */
const MinimalEcommerceWelcome: React.FC<Pick<DashboardEcommerceHeroProps, 'totalOrders' | 'totalAmount'>> = ({ totalOrders, totalAmount }) => (
  <Box
    component="section"
    data-dashboard-welcome
    sx={/* theme 将欢迎区颜色跟随 Minimal 设置抽屉。 */ theme => ({
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
      color: theme.palette.common.white,
      backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.common.black, 0.98)} 25%, ${alpha(theme.palette.primary.dark, 0.9)} 100%), url('/static/assets/background/background-6.webp')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      border: `1px solid ${alpha(theme.palette.common.black, 0.2)}`,
    })}
  >
    <Stack sx={{ position: 'relative', zIndex: 1, alignItems: { xs: 'center', md: 'flex-start' }, textAlign: { xs: 'center', md: 'left' }, maxWidth: { md: 520 } }}>
      <Typography variant="h3" sx={{ color: 'inherit', fontWeight: 800 }}>
        恭喜你 🎉
      </Typography>
      <Typography variant="h3" sx={{ color: 'inherit', fontWeight: 800, mt: 0.5 }}>
        店铺运营稳步提升
      </Typography>
      <Typography sx={{ color: alpha('#ffffff', 0.72), fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.7, mt: 2 }}>
        本周期完成 {totalOrders.toLocaleString('zh-CN')} 笔订单，累计营收 {formatCurrency(totalAmount)}。
      </Typography>
      <Button component="a" href="/app/orders" variant="contained" color="success" sx={{ mt: 3, px: 3, borderRadius: 'var(--dh-component-radius)', fontWeight: 700 }}>
        查看订单
      </Button>
    </Stack>
    <MotivationIllustration hideBackground aria-hidden="true" sx={{ width: { xs: 280, sm: 340, md: 390 }, mt: { xs: 1, md: 2 }, mr: { md: 1 } }} />
  </Box>
);

/** Minimal 电商摘要卡，采用表格化信息密度替换原有灰色块。 */
const MinimalEcommerceSummary: React.FC<Pick<DashboardEcommerceHeroProps, 'items' | 'stats'>> = ({ items, stats }) => (
  <MinimalSectionCard title="店铺概览" data-dashboard-summary contentSx={{ height: '100%' }} sx={{ height: '100%' }}>
    <Stack spacing={2.25} sx={{ height: '100%', justifyContent: 'space-between' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">当前状态</Typography>
        <Chip color="success" label="系统正常运行" size="small" variant="outlined" />
      </Stack>
      <Divider />
      <Stack direction="row" divider={<Divider flexItem orientation="vertical" />} sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0, pr: 1 }}>
          <Typography variant="h5" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 750 }}>{stats.active_cookies} / {stats.total_cookies}</Typography>
          <Typography variant="caption" color="text.secondary">活跃账号 / 总数</Typography>
        </Box>
        <Box sx={{ minWidth: 0, pl: 2 }}>
          <Typography variant="h5" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 750 }}>{stats.available_card_stock.toLocaleString('zh-CN')}</Typography>
          <Typography variant="caption" color="text.secondary">可用卡密</Typography>
        </Box>
      </Stack>
      <Divider />
      <Stack spacing={1} sx={{ minHeight: 0 }}>
        <Typography variant="subtitle2">热门商品</Typography>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">暂无商品</Typography>
        ) : (
          items.slice(0, 3).map(/* item 是当前商品摘要行。 */ item => (
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

/** 渲染 Minimal 电商页首屏并保持业务数据边界。 */
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

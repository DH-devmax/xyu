import type { AppPathKey } from '@/routes/paths';
import { appPaths } from '@/routes/paths';

/** DashboardNavItem 描述 Minimal 分组导航中的一个正式业务入口。 */
export interface DashboardNavItem {
  /** key 是页面稳定标识。 */
  key: AppPathKey;
  /** title 是导航展示名称。 */
  title: string;
  /** path 是 React Router 使用的正式 URL。 */
  path: string;
  /** icon 是 Minimal 本地 navbar SVG 文件名。 */
  icon: string;
  /** adminOnly 表示该入口只向管理员展示。 */
  adminOnly?: boolean;
}

/** DashboardNavGroup 描述 Minimal 的分组标题和可展开业务节点。 */
export interface DashboardNavGroup {
  /** title 是分组标题。 */
  title: string;
  /** items 是分组内的直接入口。 */
  items?: readonly DashboardNavItem[];
  /** children 是分组内可展开的父级入口。 */
  children?: readonly { /** 子级标题。 */ title: string; /** 子级图标。 */ icon: string; /** 子级入口。 */ items: readonly DashboardNavItem[] }[];
}

// item 创建一个带业务路径和权限标记的导航入口。
const item = (key: AppPathKey, title: string, icon: string, adminOnly = false): DashboardNavItem => ({
  key,
  title,
  path: appPaths[key],
  icon,
  ...(adminOnly ? { adminOnly: true } : {}),
});

/** dashboardNavGroups 保留 Minimal Overview/Management/Misc 结构并替换为业务入口。 */
export const dashboardNavGroups: readonly DashboardNavGroup[] = [
  {
    title: '概览',
    items: [
      item('dashboard', '仪表盘', 'ic-dashboard.svg'),
      item('chat', '在线聊天', 'ic-chat.svg'),
    ],
  },
  {
    title: '管理',
    children: [
      {
        title: '业务运营',
        icon: 'ic-ecommerce.svg',
        items: [
          item('accounts', '账号管理', 'ic-user.svg'),
          item('items', '商品列表', 'ic-product.svg'),
          item('orders', '订单管理', 'ic-order.svg'),
          item('cards', '卡密库存', 'ic-invoice.svg'),
          item('rules', '自动化规则', 'ic-params.svg'),
        ],
      },
      {
        title: '系统管理',
        icon: 'ic-folder.svg',
        items: [
          item('notifications', '通知设置', 'ic-mail.svg'),
          item('settings', '系统与 AI', 'ic-params.svg', true),
          item('brain', 'Brain Center', 'ic-kanban.svg', true),
        ],
      },
    ],
  },
];

/** dashboardNavItems 保留扁平导出，供搜索和兼容测试使用。 */
// dashboardNavItems 将分组导航展平，供横向导航和搜索入口复用。
export const dashboardNavItems: readonly DashboardNavItem[] = dashboardNavGroups.flatMap(/* 展开每个分组的业务入口。 */ group => [
  ...(group.items ?? []),
  ...(group.children ?? []).flatMap(/* 展开可折叠父级的子入口。 */ child => child.items),
]);

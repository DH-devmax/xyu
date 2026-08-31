// appPaths 集中保存 C 端正式页面的稳定 URL，避免页面组件自行拼接地址。
export const appPaths = {
  dashboard: '/app/dashboard',
  accounts: '/app/accounts',
  chat: '/app/chat',
  orders: '/app/orders',
  cards: '/app/cards',
  items: '/app/items',
  rules: '/app/rules',
  notifications: '/app/notifications',
  settings: '/app/settings',
  brain: '/app/brain',
} as const;

// AppPathKey 表示应用导航项的稳定标识。
export type AppPathKey = keyof typeof appPaths;

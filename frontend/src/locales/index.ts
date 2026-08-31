import zhCN from './langs/zh-CN/common';

/** localeCatalog 保存可扩展的 Minimal 本地化资源，不引入模板 mock Provider。 */
export const localeCatalog = { 'zh-CN': zhCN } as const;
/** defaultLocale 是 C 端首发的中文资源标识。 */
export const defaultLocale = 'zh-CN' as const;

export type Locale = keyof typeof localeCatalog;

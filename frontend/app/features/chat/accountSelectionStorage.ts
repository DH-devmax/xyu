// accountSelectionStorageKey 是 v2 聊天页记录最近账号的产品命名键。
const accountSelectionStorageKey = 'dh-xianyu-agentpanel.chat.account.v2';
// legacyAccountSelectionStorageKey 是 v1 回滚版本读取的兼容键；一个主版本内保持双写。
const legacyAccountSelectionStorageKey = 'ydisks.chat.account.v1';

/** readStoredChatAccountID 按新键优先读取最近账号，并兼容尚未迁移的 v1 浏览器状态。 */
export const readStoredChatAccountID = (): string => {
  try {
    return window.localStorage.getItem(accountSelectionStorageKey)
      ?? window.localStorage.getItem(legacyAccountSelectionStorageKey)
      ?? '';
  } catch {
    return '';
  }
};

/** writeStoredChatAccountID 双写新旧键，使 v2 升级选择和一个主版本内的 v1 回滚都保持一致。 */
export const writeStoredChatAccountID = (accountID: string): void => {
  try {
    window.localStorage.setItem(accountSelectionStorageKey, accountID);
    window.localStorage.setItem(legacyAccountSelectionStorageKey, accountID);
  } catch {
    // 浏览器禁用 Storage 时仅丢失跨刷新选择，当前聊天状态仍由 React 持有。
  }
};

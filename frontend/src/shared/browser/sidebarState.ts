// storageKey 侧边栏折叠状态存储键。
const storageKey = 'dh-xianyu-agentpanel.sidebar.v2';
// legacyStorageKey 是 v1 回滚版本仍会读取的旧键；v2 在一个主版本内保持双写。
const legacyStorageKey = 'ydisks.sidebar.v1';

// readSidebarCollapsed 读取侧边栏折叠状态。
export const readSidebarCollapsed = (): boolean => {
	try {
		// storedState 按新键优先读取，未迁移的浏览器继续使用 v1 状态。
		const storedState = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey);
		return storedState === 'collapsed';
	} catch {
		return false;
	}
};

// writeSidebarCollapsed 写入侧边栏折叠状态。
export const writeSidebarCollapsed = (collapsed: boolean): void => {
	try {
		// storedState 是新旧版本共享的稳定折叠状态文本。
		const storedState = collapsed ? 'collapsed' : 'expanded';
		window.localStorage.setItem(storageKey, storedState);
		window.localStorage.setItem(legacyStorageKey, storedState);
	} catch {
		// Storage can be unavailable in hardened browsers; the in-memory state
		// remains fully functional.
	}
};

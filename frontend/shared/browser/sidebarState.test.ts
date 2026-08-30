import { afterEach, describe, expect, test, vi } from 'vitest';
import { readSidebarCollapsed, writeSidebarCollapsed } from './sidebarState';

afterEach(/* 当前回调处理用户交互或异步状态变化。 */ () => vi.unstubAllGlobals());

describe('sidebar persistence', /* 当前回调处理用户交互或异步状态变化。 */ () => {
	test('defaults to expanded and persists both states', /* 当前回调处理用户交互或异步状态变化。 */ () => {
		// values 值列表。
		const values = new Map<string, string>();
		vi.stubGlobal('window', { localStorage: {
			getItem: /* 当前回调处理用户交互或异步状态变化。 */ (key: string) => values.get(key) ?? null,
			setItem: /* 当前回调处理用户交互或异步状态变化。 */ (key: string, value: string) => values.set(key, value),
		}});
		expect(readSidebarCollapsed()).toBe(false);
		writeSidebarCollapsed(true);
		expect(readSidebarCollapsed()).toBe(true);
		writeSidebarCollapsed(false);
		expect(readSidebarCollapsed()).toBe(false);
		expect(values.get('dh-xianyu-agentpanel.sidebar.v2')).toBe('expanded');
		expect(values.get('ydisks.sidebar.v1')).toBe('expanded');
	});

	test('reads the legacy key until the v2 key is written', /* 当前回调验证品牌迁移期间仍可读取旧版偏好。 */ () => {
		// values 保存仅包含 v1 键的升级前浏览器状态。
		const values = new Map<string, string>([['ydisks.sidebar.v1', 'collapsed']]);
		vi.stubGlobal('window', { localStorage: {
			getItem: /* 当前回调读取测试浏览器中的新旧品牌键。 */ (key: string) => values.get(key) ?? null,
			setItem: /* 当前回调记录迁移后的双写结果。 */ (key: string, value: string) => values.set(key, value),
		}});
		expect(readSidebarCollapsed()).toBe(true);
		writeSidebarCollapsed(true);
		expect(values.get('dh-xianyu-agentpanel.sidebar.v2')).toBe('collapsed');
	});

	test('storage failures safely fall back to expanded', /* 当前回调处理用户交互或异步状态变化。 */ () => {
		vi.stubGlobal('window', { localStorage: {
			getItem: /* 当前回调处理用户交互或异步状态变化。 */ () => { throw new Error('blocked'); },
			setItem: /* 当前回调处理用户交互或异步状态变化。 */ () => { throw new Error('blocked'); },
		}});
		expect(readSidebarCollapsed()).toBe(false);
		expect(/* 当前回调处理用户交互或异步状态变化。 */ () => writeSidebarCollapsed(true)).not.toThrow();
	});
});

import { afterEach, describe, expect, test, vi } from 'vitest';

import { readStoredChatAccountID, writeStoredChatAccountID } from './accountSelectionStorage';

afterEach(/* 当前回调恢复测试替换的浏览器全局。 */ () => vi.unstubAllGlobals());

describe('chat account brand storage migration', /* 当前测试组验证聊天账号选择的新旧键兼容。 */ () => {
  test('reads v2 first and writes both versions', /* 当前回调验证新键优先与回滚双写。 */ () => {
    // values 保存测试浏览器的聊天账号选择键值。
    const values = new Map<string, string>([
      ['ydisks.chat.account.v1', 'legacy-account'],
      ['dh-xianyu-agentpanel.chat.account.v2', 'current-account'],
    ]);
    vi.stubGlobal('window', { localStorage: {
      getItem: /* 当前回调按键读取测试值。 */ (key: string) => values.get(key) ?? null,
      setItem: /* 当前回调记录新旧键双写值。 */ (key: string, value: string) => values.set(key, value),
    } });
    expect(readStoredChatAccountID()).toBe('current-account');
    writeStoredChatAccountID('selected-account');
    expect(values.get('dh-xianyu-agentpanel.chat.account.v2')).toBe('selected-account');
    expect(values.get('ydisks.chat.account.v1')).toBe('selected-account');
  });

  test('falls back to v1 and tolerates blocked storage', /* 当前回调验证升级读取和隐私模式降级。 */ () => {
    // legacyValues 只包含升级前旧键。
    const legacyValues = new Map<string, string>([['ydisks.chat.account.v1', 'legacy-account']]);
    vi.stubGlobal('window', { localStorage: {
      getItem: /* 当前回调从旧键样本读取值。 */ (key: string) => legacyValues.get(key) ?? null,
      setItem: /* 当前回调在旧键读取场景记录写入。 */ (key: string, value: string) => legacyValues.set(key, value),
    } });
    expect(readStoredChatAccountID()).toBe('legacy-account');

    vi.stubGlobal('window', { localStorage: {
      getItem: /* 当前回调模拟隐私模式拒绝读取。 */ () => { throw new Error('blocked'); },
      setItem: /* 当前回调模拟隐私模式拒绝写入。 */ () => { throw new Error('blocked'); },
    } });
    expect(readStoredChatAccountID()).toBe('');
    expect(/* 当前回调执行被拒绝的兼容写入。 */ () => writeStoredChatAccountID('account')).not.toThrow();
  });
});

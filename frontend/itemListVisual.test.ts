import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe,expect,test } from 'vitest';

const itemList = readFileSync(resolve(__dirname, 'src/features/items/pages/ItemList.tsx'), 'utf8'); /* itemList 表示当前商品List。 */

describe('item list primary action colors', () => {
  test('uses the shared primary blue for batch publishing', () => {
    expect(itemList).toContain("'background': 'rgb(var(--minimal-color-brand))'");
    expect(itemList).toContain("'background': 'rgb(var(--minimal-color-brand-highlight))'");
    expect(itemList).not.toContain('bg-blue-600');
  } /* 测试回调断言批量发布使用共享品牌主色。 */);

  test('uses the lighter emerald tone for publishing actions', () => {
    expect(itemList).toContain("'backgroundColor': 'rgb(var(--minimal-color-success-500)/var(--minimal-bg-opacity,1))'");
    expect(itemList).toContain("'backgroundColor': 'rgb(var(--minimal-color-success-600)/var(--minimal-bg-opacity,1))'");
    expect(itemList).not.toContain('bg-emerald-600');
  } /* 测试回调断言发布操作使用约定的浅色绿色令牌。 */);
} /* 测试套件回调汇总商品列表视觉令牌契约。 */);

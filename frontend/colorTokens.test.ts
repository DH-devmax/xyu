import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

// read 读取 Minimal 主题和页面源码，确保颜色令牌不散落在业务页。
function read(path: string): string {
  return readFileSync(resolve(__dirname, path), 'utf8');
}

describe('Minimal design tokens', /* tokenSuite 汇总色彩令牌门禁。 */ () => {
  test('keeps business page colors out of literal declarations', /* pageColorTest 校验业务页面不写入色值。 */ () => {
    // files 是需要检查颜色声明的核心业务页面。
    const files = ['src/features/dashboard/pages/Dashboard.tsx', 'src/features/accounts/pages/AccountList.tsx', 'src/features/items/pages/ItemList.tsx', 'src/features/orders/pages/OrderList.tsx', 'src/features/chat/pages/Chat.tsx', 'src/features/settings/pages/Settings.tsx'];
    // pattern 匹配硬编码十六进制和非令牌 rgb 声明。
    const pattern = /#[0-9a-f]{3,8}\b|rgba?\((?!var\(--minimal-color-)/gi;
    // violations 保存命中的页面和色值。
    const violations: string[] = [];
    for (const file /* file 是当前待检查的业务页面路径。 */ of files) {
      for (const match /* match 是当前页面命中的硬编码色值。 */ of read(file).matchAll(pattern)) violations.push(`${file}:${match[0]}`);
    }
    expect(violations).toEqual([]);
  });

  test('defines the palette centrally in Minimal theme', /* themeTokenTest 校验主题集中定义调色板。 */ () => {
    // theme 是 Minimal core 主题源码。
    const theme = read('src/theme/core/index.ts');
    expect(theme).toContain("default: { main: '#21a675'");
    expect(theme).toContain("background: { default: '#f5f7f9'");
    expect(theme).toContain('shape: { borderRadius: 8 }');
  });
});

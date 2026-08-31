import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

describe('Minimal styling migration', /* stylingSuite 汇总旧样式清理门禁。 */ () => {
  test('removes Tailwind runtime configuration from production frontend', /* stylingConfigTest 校验配置文件和依赖已移除。 */ () => {
    // packageSource 是前端直接依赖清单。
    const packageSource = readFileSync(resolve(__dirname, 'package.json'), 'utf8');
    expect(packageSource).not.toContain('tailwindcss');
    expect(existsSync(resolve(__dirname, 'tailwind.config.js'))).toBe(false);
    expect(existsSync(resolve(__dirname, 'postcss.config.js'))).toBe(false);
  });
});

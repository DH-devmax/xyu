import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

// source 读取规则页及其路由上下文源码。
function source(path: string): string {
  return readFileSync(resolve(__dirname, path), 'utf8');
}

describe('Minimal rules section', /* rulesSuite 汇总自动化规则视图门禁。 */ () => {
  test('keeps Minimal containers and server aggregates', /* rulesContainerTest 校验规则页面骨架。 */ () => {
    // rules 是规则页面源码。
    const rules = source('src/features/rules/pages/Rules.tsx');
    expect(rules).toContain('MinimalPageFrame');
    expect(rules).toContain('automationTriggerCounts');
    expect(rules).toContain('筛选结果构成');
  });

  test('preserves item delivery handoff through route context', /* rulesContextTest 校验商品到规则联动。 */ () => {
    // routes 是规则联动路由源码。
    const routes = source('src/routes/sections/app-routes.tsx');
    expect(routes).toContain('ItemSectionRoute');
    expect(routes).toContain('RulesSectionRoute');
    expect(routes).toContain('clearTarget');
  });
});

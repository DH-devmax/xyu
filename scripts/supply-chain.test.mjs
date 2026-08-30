import test from 'node:test';
import assert from 'node:assert/strict';
import {
  goPURL,
  licenseEntries,
  mergeComponentsByRef,
  normalizedLicense,
  npmPackageName,
  npmPURL,
} from './generate-supply-chain.mjs';

// package-lock 的嵌套 node_modules 必须解析为最内层实际包名。
test('npmPackageName handles scoped and nested packages', () => {
  assert.equal(npmPackageName('node_modules/@scope/outer/node_modules/inner'), 'inner');
  assert.equal(npmPackageName('node_modules/@scope/package'), '@scope/package');
});

// PURL 必须保留 Go 模块路径并正确编码 npm scope 与版本。
test('package URLs are deterministic', () => {
  assert.equal(npmPURL('@scope/package', '1.2.3'), 'pkg:npm/%40scope/package@1.2.3');
  assert.equal(goPURL('example.com/module', 'v1.2.3'), 'pkg:golang/example.com/module@v1.2.3');
});

// 未识别的许可字段必须显式进入 NOASSERTION，不能在清单中消失。
test('license normalization remains explicit and sorted', () => {
  assert.equal(normalizedLicense('Unknown'), 'NOASSERTION');
  assert.deepEqual(licenseEntries(['MIT', '', 'MIT']), [
    { license: { name: 'MIT' } },
    { license: { name: 'NOASSERTION' } },
  ]);
});

// 相同包版本的嵌套安装应合并为一个组件，并保留可发布的必需 scope。
test('duplicate package versions merge without losing required scope', () => {
  const components = mergeComponentsByRef([
    { 'bom-ref': 'frontend:pkg:npm/example@1.0.0', scope: 'excluded', licenses: licenseEntries(['MIT']) },
    { 'bom-ref': 'frontend:pkg:npm/example@1.0.0', scope: 'required', licenses: licenseEntries(['Apache-2.0']) },
  ]);
  assert.equal(components.length, 1);
  assert.equal(components[0].scope, 'required');
  assert.deepEqual(components[0].licenses, licenseEntries(['MIT', 'Apache-2.0']));
});

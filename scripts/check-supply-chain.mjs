import { resolve } from 'node:path';
import {
  frontendInventory,
  goInventory,
  inputInventory,
  readJSON,
  repoRoot,
  supplyChainInputs,
} from './generate-supply-chain.mjs';

// assert 在供应链不变式失效时立即终止门禁，避免过期清单进入发布。
function assert(condition, message) {
  if (!condition) throw new Error(`supply-chain-check: ${message}`);
}

// propertyMap 把 CycloneDX properties 转为唯一键值表，同名属性视为生成错误。
function propertyMap(properties) {
  const result = new Map();
  for (const property of properties ?? []) {
    assert(!result.has(property.name), `SBOM 属性重复: ${property.name}`);
    result.set(property.name, property.value);
  }
  return result;
}

// verifyInputHashes 确认产物记录的输入集与当前锁文件逐项一致。
function verifyInputHashes(recordedInputs, actualInputs, label) {
  assert(Array.isArray(recordedInputs), `${label} 缺少 inputs`);
  assert(recordedInputs.length === supplyChainInputs.length, `${label} 输入数量不正确`);
  for (const [index, expectedPath] of supplyChainInputs.entries()) {
    const recorded = recordedInputs[index];
    const actual = actualInputs[index];
    assert(recorded?.path === expectedPath, `${label} 输入路径漂移: ${expectedPath}`);
    assert(recorded?.sha256 === actual.sha256, `${label} 已过期，请运行 make supply-chain-generate: ${expectedPath}`);
  }
}

// main 对 SBOM、许可证清单、锁文件和产品 manifest 执行交叉校验。
async function main() {
  const manifest = await readJSON('product/manifest.json');
  const sbom = await readJSON(manifest.supply_chain.sbom);
  const licenses = await readJSON(manifest.supply_chain.licenses);
  const actualInputs = await inputInventory();
  assert(sbom.bomFormat === 'CycloneDX' && sbom.specVersion === '1.6', 'SBOM 必须为 CycloneDX 1.6');
  assert(sbom.metadata?.component?.name === manifest.product.display_name, 'SBOM 产品名与 manifest 不一致');
  assert(sbom.metadata?.component?.version === manifest.product.version, 'SBOM 产品版本与 manifest 不一致');
  assert(licenses.product?.name === manifest.product.display_name, '许可证清单产品名不一致');
  assert(licenses.product?.version === manifest.product.version, '许可证清单产品版本不一致');

  const sbomProperties = propertyMap(sbom.metadata?.properties);
  for (const input of actualInputs) {
    assert(sbomProperties.get(`dh.input.sha256.${input.path}`) === input.sha256, `SBOM 已过期: ${input.path}`);
  }
  verifyInputHashes(licenses.inputs, actualInputs, '许可证清单');

  const components = sbom.components ?? [];
  const componentRefs = components.map(component => component['bom-ref']);
  const uniqueRefs = new Set(componentRefs);
  assert(uniqueRefs.size === componentRefs.length, 'SBOM 包含重复 bom-ref');
  assert(components.every(component => Array.isArray(component.licenses) && component.licenses.length > 0), 'SBOM 存在未记录许可声明的组件');

  const go = goInventory();
  const frontend = await frontendInventory();
  for (const component of [...go.dependencies, ...frontend.dependencies]) {
    assert(uniqueRefs.has(component['bom-ref']), `SBOM 缺少锁定组件: ${component['bom-ref']}`);
  }
  const goCount = Number(sbomProperties.get('dh.component-count.go'));
  const frontendCount = Number(sbomProperties.get('dh.component-count.frontend'));
  const harnessCount = Number(sbomProperties.get('dh.component-count.harness'));
  assert(goCount === go.dependencies.length, 'Go module 计数与 go.mod 不一致');
  assert(frontendCount === frontend.dependencies.length, '前端组件计数与 package-lock 不一致');
  assert(harnessCount >= 800, 'Harness 锁定闭包数量异常');
  // 产品根之外还登记 Minimal 视觉源，四个应用组件都必须计入总数。
  assert(components.length === 4 + goCount + frontendCount + harnessCount, 'SBOM 组件总数不一致');

  const licensedRefs = [];
  for (const group of licenses.licenses ?? []) {
    assert(group.component_count === group.components?.length, `许可分组计数错误: ${group.license}`);
    licensedRefs.push(...group.components);
  }
  assert(licenses.summary?.component_count === components.length, '许可证清单组件总数错误');
  assert(licenses.summary?.license_count === licenses.licenses?.length, '许可证类型计数错误');
  assert(licensedRefs.every(reference => uniqueRefs.has(reference)), '许可证清单引用了未知组件');
  assert(new Set(licensedRefs).size === uniqueRefs.size, '许可证清单未覆盖全部 SBOM 组件');

  console.log(`supply-chain-check: 通过（Go ${goCount}，前端 ${frontendCount}，Harness ${harnessCount}，合计 ${components.length}）`);
}

await main();

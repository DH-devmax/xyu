import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// repoRoot 指向产品根目录，保证脚本从任意工作目录运行时仍读取同一组锁定文件。
export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// supplyChainInputs 是 SBOM 和许可证清单的完整输入，任一文件变化都必须重新生成产物。
export const supplyChainInputs = [
  'scripts/generate-supply-chain.mjs',
  'product/manifest.json',
  'go.mod',
  'go.sum',
  'frontend/package.json',
  'frontend/package-lock.json',
  'brain/vendor/deepseek-harness/package.json',
  'brain/vendor/deepseek-harness/pnpm-lock.yaml',
  'brain/vendor/deepseek-harness/THIRD_PARTY_NOTICES.md',
];

// readJSON 读取根目录相对的 JSON，并让语法错误直接阻断生成。
export async function readJSON(relativePath) {
  return JSON.parse(await readFile(resolve(repoRoot, relativePath), 'utf8'));
}

// sha256File 为供应链输入生成稳定的小写十六进制指纹。
export async function sha256File(relativePath) {
  const bytes = await readFile(resolve(repoRoot, relativePath));
  return createHash('sha256').update(bytes).digest('hex');
}

// npmPackageName 从 package-lock 的安装路径中提取最内层 npm 包名。
export function npmPackageName(lockPath) {
  const marker = 'node_modules/';
  const markerIndex = lockPath.lastIndexOf(marker);
  if (markerIndex < 0) throw new Error(`无法从 package-lock 路径提取包名: ${lockPath}`);
  return lockPath.slice(markerIndex + marker.length);
}

// npmPURL 生成符合 package-url 语法的 npm 组件标识。
export function npmPURL(name, version) {
  if (name.startsWith('@')) {
    const [scope, packageName] = name.split('/');
    if (!scope || !packageName) throw new Error(`npm scope 包名无效: ${name}`);
    return `pkg:npm/${encodeURIComponent(scope)}/${encodeURIComponent(packageName)}@${encodeURIComponent(version)}`;
  }
  return `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(version)}`;
}

// goPURL 使用 Go module 路径和版本生成 package-url。
export function goPURL(modulePath, version) {
  return `pkg:golang/${modulePath}@${encodeURIComponent(version)}`;
}

// normalizedLicense 把依赖工具的空值或 Unknown 统一为可审计的 NOASSERTION。
export function normalizedLicense(value) {
  const text = String(value ?? '').trim();
  return text === '' || text.toLowerCase() === 'unknown' ? 'NOASSERTION' : text;
}

// licenseEntries 转换为 CycloneDX 许可证对象；保留复合声明原文，避免错误改写法律含义。
export function licenseEntries(values) {
  return [...new Set(values.map(normalizedLicense))]
    .sort((left, right) => left.localeCompare(right))
    .map(name => ({ license: { name } }));
}

// mergeComponentsByRef 合并同一包版本的多个安装路径，并保留最宽的运行时 scope 与全部许可声明。
export function mergeComponentsByRef(components) {
  const scopePriority = new Map([['excluded', 0], ['optional', 1], ['required', 2]]);
  const merged = new Map();
  for (const component of components) {
    const reference = component['bom-ref'];
    const existing = merged.get(reference);
    if (!existing) {
      merged.set(reference, component);
      continue;
    }
    const existingLicenses = (existing.licenses ?? []).map(entry => entry.license?.name);
    const incomingLicenses = (component.licenses ?? []).map(entry => entry.license?.name);
    existing.licenses = licenseEntries([...existingLicenses, ...incomingLicenses]);
    if ((scopePriority.get(component.scope) ?? 0) > (scopePriority.get(existing.scope) ?? 0)) existing.scope = component.scope;
  }
  return [...merged.values()].sort((left, right) => left['bom-ref'].localeCompare(right['bom-ref']));
}

// integrityHashes 把 npm integrity 的 base64 摘要转换为 CycloneDX 要求的十六进制形式。
function integrityHashes(integrity) {
  const match = /^(sha(?:256|384|512))-([A-Za-z0-9+/=]+)$/.exec(String(integrity ?? ''));
  if (!match) return undefined;
  return [{ alg: match[1].toUpperCase().replace('SHA', 'SHA-'), content: Buffer.from(match[2], 'base64').toString('hex') }];
}

// inputInventory 计算全部供应链输入的指纹，并以固定顺序输出。
export async function inputInventory() {
  return Promise.all(supplyChainInputs.map(async path => ({ path, sha256: await sha256File(path) })));
}

// productComponent 创建一体化产品的 CycloneDX 根组件。
function productComponent(manifest) {
  return {
    'bom-ref': 'product:dh-xianyu-agentpanel',
    type: 'application',
    name: manifest.product.display_name,
    version: manifest.product.version,
    licenses: licenseEntries(['Apache-2.0']),
    purl: `pkg:golang/github.com/DH-devmax/xyu@${encodeURIComponent(manifest.product.version)}`,
  };
}

// minimalSourceComponent 登记 Minimal 视觉源的版本、哈希和产品级许可策略。
function minimalSourceComponent(manifest) {
  const source = manifest.components?.minimal_frontend;
  if (!source?.version || !source.archive_sha256) throw new Error('Minimal 视觉源必须提供版本和 archive_sha256');
  return {
    'bom-ref': 'application:minimal-vite-ts',
    type: 'framework',
    name: source.name || 'Minimal Vite TS',
    version: source.version,
    licenses: licenseEntries(['Minimal product license (see https://docs.minimals.cc/package/)']),
    properties: [
      { name: 'dh.ecosystem', value: 'frontend-visual-source' },
      { name: 'dh.source.archive', value: source.archive },
      { name: 'dh.source.sha256', value: source.archive_sha256 },
      { name: 'dh.license.policy', value: source.license_policy || 'one-license-per-product' },
    ],
  };
}

// goInventory 通过 Go 自带的结构化 go mod edit 输出获取直接和间接 module。
export function goInventory() {
  const moduleFile = JSON.parse(execFileSync('go', ['mod', 'edit', '-json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  }));
  const dependencies = (moduleFile.Require ?? []).map(requirement => {
    const purl = goPURL(requirement.Path, requirement.Version);
    return {
      'bom-ref': `go:${purl}`,
      type: 'library',
      name: requirement.Path,
      version: requirement.Version,
      scope: requirement.Indirect ? 'optional' : 'required',
      licenses: licenseEntries(['NOASSERTION']),
      purl,
      properties: [
        { name: 'dh.ecosystem', value: 'go' },
        { name: 'dh.indirect', value: String(Boolean(requirement.Indirect)) },
      ],
    };
  });
  dependencies.sort((left, right) => left['bom-ref'].localeCompare(right['bom-ref']));
  return {
    root: {
      'bom-ref': 'application:go-server',
      type: 'application',
      name: moduleFile.Module.Path,
      version: moduleFile.Go,
      licenses: licenseEntries(['Apache-2.0']),
      purl: `pkg:golang/${moduleFile.Module.Path}`,
      properties: [{ name: 'dh.ecosystem', value: 'go-application' }],
    },
    dependencies,
  };
}

// frontendInventory 从 package-lock JSON 生成前端完整锁定组件清单。
export async function frontendInventory() {
  const lock = await readJSON('frontend/package-lock.json');
  const manifest = await readJSON('frontend/package.json');
  const lockedComponents = Object.entries(lock.packages ?? {})
    .filter(([lockPath, entry]) => lockPath !== '' && typeof entry?.version === 'string')
    .map(([lockPath, entry]) => {
      const name = npmPackageName(lockPath);
      const purl = npmPURL(name, entry.version);
      const component = {
        'bom-ref': `frontend:${purl}`,
        type: 'library',
        name,
        version: entry.version,
        scope: entry.dev ? 'excluded' : entry.optional ? 'optional' : 'required',
        licenses: licenseEntries([entry.license]),
        purl,
        properties: [{ name: 'dh.ecosystem', value: 'frontend-npm' }],
      };
      const hashes = integrityHashes(entry.integrity);
      if (hashes) component.hashes = hashes;
      if (typeof entry.resolved === 'string' && entry.resolved.startsWith('https://')) {
        component.externalReferences = [{ type: 'distribution', url: entry.resolved }];
      }
      return component;
    });
  const dependencies = mergeComponentsByRef(lockedComponents);
  return {
    root: {
      'bom-ref': 'application:frontend',
      type: 'application',
      name: manifest.name,
      version: manifest.version,
      licenses: licenseEntries(['Apache-2.0']),
      properties: [{ name: 'dh.ecosystem', value: 'frontend-application' }],
    },
    dependencies,
  };
}

// harnessInventory 使用 pnpm 的结构化 licenses JSON 输出统计 vendored workspace 全部已锁定版本。
export async function harnessInventory() {
  const harnessRoot = resolve(repoRoot, 'brain/vendor/deepseek-harness');
  const manifest = await readJSON('brain/vendor/deepseek-harness/package.json');
  if (!/^pnpm@\d+\.\d+\.\d+$/.test(manifest.packageManager ?? '')) {
    throw new Error('Harness packageManager 必须锁定精确 pnpm 版本');
  }
  const licenseOutput = execFileSync('corepack', [
    manifest.packageManager,
    '--dir',
    harnessRoot,
    'licenses',
    'list',
    '--json',
  ], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const groupedPackages = JSON.parse(licenseOutput);
  const dependencies = [];
  for (const [groupLicense, packages] of Object.entries(groupedPackages)) {
    for (const packageRecord of packages) {
      for (const version of packageRecord.versions ?? []) {
        const purl = npmPURL(packageRecord.name, version);
        const component = {
          'bom-ref': `harness:${purl}`,
          type: 'library',
          name: packageRecord.name,
          version,
          licenses: licenseEntries([packageRecord.license ?? groupLicense]),
          purl,
          properties: [{ name: 'dh.ecosystem', value: 'harness-pnpm' }],
        };
        if (typeof packageRecord.homepage === 'string' && packageRecord.homepage.startsWith('http')) {
          component.externalReferences = [{ type: 'website', url: packageRecord.homepage }];
        }
        dependencies.push(component);
      }
    }
  }
  dependencies.sort((left, right) => left['bom-ref'].localeCompare(right['bom-ref']));
  return {
    root: {
      'bom-ref': 'application:deepseek-harness',
      type: 'framework',
      name: manifest.name,
      version: manifest.version,
      licenses: licenseEntries([manifest.license]),
      purl: npmPURL(manifest.name, manifest.version),
      properties: [{ name: 'dh.ecosystem', value: 'harness-application' }],
    },
    dependencies,
  };
}

// licenseManifest 按许可证声明聚合 SBOM 组件，供发布审核快速定位。
export function licenseManifest(manifest, inputs, components) {
  const groups = new Map();
  for (const component of components) {
    for (const entry of component.licenses ?? licenseEntries(['NOASSERTION'])) {
      const name = normalizedLicense(entry.license?.name);
      const references = groups.get(name) ?? [];
      references.push(component['bom-ref']);
      groups.set(name, references);
    }
  }
  const licenses = [...groups.entries()]
    .map(([license, componentsForLicense]) => ({
      license,
      component_count: componentsForLicense.length,
      components: componentsForLicense.sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => left.license.localeCompare(right.license));
  return {
    schema_version: 1,
    product: { name: manifest.product.display_name, version: manifest.product.version },
    inputs,
    summary: {
      component_count: components.length,
      license_count: licenses.length,
      noassertion_count: licenses.find(entry => entry.license === 'NOASSERTION')?.component_count ?? 0,
    },
    licenses,
  };
}

// generateSupplyChain 生成确定性 SBOM 和许可证清单，输出中不包含本机路径或生成时间。
export async function generateSupplyChain() {
  const manifest = await readJSON('product/manifest.json');
  const inputs = await inputInventory();
  const go = goInventory();
  const frontend = await frontendInventory();
  const harness = await harnessInventory();
  const root = productComponent(manifest);
  const minimal = minimalSourceComponent(manifest);
  const components = [go.root, frontend.root, harness.root, minimal, ...go.dependencies, ...frontend.dependencies, ...harness.dependencies]
    .sort((left, right) => left['bom-ref'].localeCompare(right['bom-ref']));
  const componentReferences = components.map(component => component['bom-ref']);
  if (new Set(componentReferences).size !== componentReferences.length) throw new Error('SBOM 组件 bom-ref 重复');
  const inputProperties = inputs.map(input => ({ name: `dh.input.sha256.${input.path}`, value: input.sha256 }));
  const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    version: 1,
    metadata: {
      component: root,
      properties: [
        ...inputProperties,
        { name: 'dh.component-count.go', value: String(go.dependencies.length) },
        { name: 'dh.component-count.frontend', value: String(frontend.dependencies.length) },
        { name: 'dh.component-count.harness', value: String(harness.dependencies.length) },
      ],
    },
    components,
    dependencies: [
      { ref: root['bom-ref'], dependsOn: [go.root['bom-ref'], frontend.root['bom-ref'], harness.root['bom-ref'], minimal['bom-ref']] },
      { ref: go.root['bom-ref'], dependsOn: go.dependencies.map(component => component['bom-ref']) },
      { ref: frontend.root['bom-ref'], dependsOn: frontend.dependencies.map(component => component['bom-ref']) },
      { ref: harness.root['bom-ref'], dependsOn: harness.dependencies.map(component => component['bom-ref']) },
    ],
  };
  const licenses = licenseManifest(manifest, inputs, components);
  await writeFile(resolve(repoRoot, manifest.supply_chain.sbom), `${JSON.stringify(sbom, null, 2)}\n`);
  await writeFile(resolve(repoRoot, manifest.supply_chain.licenses), `${JSON.stringify(licenses, null, 2)}\n`);
  console.log(`supply-chain-generate: ${components.length} 个组件，${licenses.summary.license_count} 类许可声明`);
}

// isMain 区分命令行执行与测试导入，避免检查器导入时意外覆盖产物。
const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) await generateSupplyChain();

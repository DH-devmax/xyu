import { access, readFile, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// rootDir 是仓库根目录；资源校验不依赖当前 shell 工作目录。
const rootDir = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(await readFile(join(rootDir, 'product/manifest.json'), 'utf8'));
const branding = manifest.branding ?? {};
const expectedSourceHash = '726ee78d1a0d4f8979358ca2cae128fcf74aa73b5a24fe3d211e0c05b13da1ea';

// readBytes 读取二进制资源并在缺失时给出稳定错误。
const readBytes = async relativePath => {
  const absolutePath = join(rootDir, relativePath);
  await access(absolutePath, constants.R_OK);
  return readFile(absolutePath);
};

// pngDimensions 从 PNG IHDR 读取尺寸，避免引入额外图像解析依赖。
const pngDimensions = (bytes, relativePath) => {
  const signature = '89504e470d0a1a0a';
  if (bytes.subarray(0, 8).toString('hex') !== signature || bytes.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error(`品牌资源不是有效 PNG：${relativePath}`);
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};

if (branding.source !== 'branding/logo.jpg' || branding.crop !== '520x520+250+245') {
  throw new Error('品牌 manifest 缺少固定源图或裁剪参数');
}
const source = await readBytes(branding.source);
const sourceHash = createHash('sha256').update(source).digest('hex');
if (sourceHash !== expectedSourceHash || branding.source_sha256 !== expectedSourceHash) {
  throw new Error(`品牌源图哈希不匹配：${sourceHash}`);
}

const expectedPNGs = new Map([
  ['branding/app-icon.png', 1024],
  ['branding/favicon.png', 256],
  ['frontend/public/favicon.png', 256],
  ['docs/assets/favicon.png', 256],
  ['internal/webui/static/favicon.png', 256],
  ['icon/linux/icon.png', 512],
  ['icon/windows/icon.png', 512],
  ['cmd/tray/icon.png', 512],
  ['cmd/tray/icon-gray.png', 512],
]);
const hashes = new Map();
for (const [relativePath, size] of expectedPNGs) {
  const bytes = await readBytes(relativePath);
  const dimensions = pngDimensions(bytes, relativePath);
  if (dimensions.width !== size || dimensions.height !== size) {
    throw new Error(`品牌资源尺寸异常：${relativePath}=${dimensions.width}x${dimensions.height}`);
  }
  hashes.set(relativePath, createHash('sha256').update(bytes).digest('hex'));
}
// readPNGColorType 确认 Web favicon 保留 alpha 通道，避免背景色回归。
const faviconBytes = await readBytes('branding/favicon.png');
if (faviconBytes[25] !== 6) {
  throw new Error('Web favicon 必须使用 RGBA PNG 以支持透明背景');
}
for (const relativePath of [
  'frontend/public/favicon.png',
  'docs/assets/favicon.png',
  'internal/webui/static/favicon.png',
]) {
  if (hashes.get(relativePath) !== hashes.get('branding/favicon.png')) {
    throw new Error(`Web favicon 未从同一源图生成：${relativePath}`);
  }
}
for (const relativePath of ['icon/windows/icon.png', 'cmd/tray/icon.png']) {
  if (hashes.get(relativePath) !== hashes.get('icon/linux/icon.png')) {
    throw new Error(`平台彩色图标未从同一 master 生成：${relativePath}`);
  }
}
if (hashes.get('cmd/tray/icon-gray.png') === hashes.get('cmd/tray/icon.png')) {
  throw new Error('托盘灰度图标未与彩色状态区分');
}

const ico = await readBytes('icon/windows/icon.ico');
if (ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1 || ico.readUInt16LE(4) < 7) {
  throw new Error('Windows ICO 头或尺寸层不完整');
}
const icns = await readBytes('icon/macos/icon.icns');
if (icns.toString('ascii', 0, 4) !== 'icns' || icns.readUInt32BE(4) !== icns.length) {
  throw new Error('macOS ICNS 头或长度异常');
}
try {
  await stat(join(rootDir, 'icon/macos/Assets.car'));
  throw new Error('旧 Assets.car 仍存在，macOS 安装包会混入旧品牌资源');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

console.log('brand-assets: 通过');

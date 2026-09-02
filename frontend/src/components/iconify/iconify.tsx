import { addCollection, Icon } from '@iconify/react';
import type { IconProps } from '@iconify/react';
import type { FC } from 'react';
import { styled } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';

// localIcons 是产品顶栏与导航实际使用的 Minimal Solar/Eva 图标集合。
const localIcons = {
  menu: '<path fill="currentColor" d="M4 6.75A.75.75 0 0 1 4.75 6h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 6.75m0 5A.75.75 0 0 1 4.75 11h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 11.75m.75 4.25a.75.75 0 0 0 0 1.5h9.5a.75.75 0 0 0 0-1.5z"/>',
  search: '<path fill="currentColor" fill-rule="evenodd" d="M10.5 3a7.5 7.5 0 1 0 4.686 13.36l3.727 3.727a.75.75 0 1 0 1.06-1.06l-3.727-3.727A7.5 7.5 0 0 0 10.5 3m-6 7.5a6 6 0 1 1 12 0a6 6 0 0 1-12 0" clip-rule="evenodd"/>',
  bell: '<path fill="currentColor" d="M8.352 20.242A4.63 4.63 0 0 0 12 22a4.63 4.63 0 0 0 3.648-1.758a27.2 27.2 0 0 1-7.296 0"/><path fill="currentColor" fill-rule="evenodd" d="M18.75 9.704V9c0-3.866-3.023-7-6.75-7S5.25 5.134 5.25 9v.704c0 .845-.24 1.671-.692 2.374L3.45 13.801c-1.011 1.574-.239 3.713 1.52 4.21a25.8 25.8 0 0 0 14.06 0c1.759-.497 2.531-2.636 1.52-4.21l-1.108-1.723a4.4 4.4 0 0 1-.693-2.374M12 5.25a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75" clip-rule="evenodd"/>',
  settings: '<path fill="currentColor" fill-rule="evenodd" d="M14.279 2.152C13.909 2 13.439 2 12.5 2s-1.408 0-1.779.152a2.008 2.008 0 0 0-1.09 1.083c-.094.223-.13.484-.145.863a1.615 1.615 0 0 1-.796 1.353a1.64 1.64 0 0 1-1.579.008c-.338-.178-.583-.276-.825-.308a2.026 2.026 0 0 0-1.49.396c-.318.242-.553.646-1.022 1.453c-.47.807-.704 1.21-.757 1.605c-.07.526.074 1.058.4 1.479c.148.192.357.353.68.555c.477.297.783.803.783 1.361c0 .558-.306 1.064-.782 1.36c-.324.203-.533.364-.682.556a1.99 1.99 0 0 0-.399 1.479c.053.394.287.798.757 1.605c.47.807.704 1.21 1.022 1.453c.424.323.96.465 1.49.396c.242-.032.487-.13.825-.308a1.64 1.64 0 0 1 1.58.008c.486.28.774.795.795 1.353c.015.38.051.64.145.863c.204.49.596.88 1.09 1.083c.37.152.84.152 1.779.152s1.409 0 1.779-.152a2.008 2.008 0 0 0 1.09-1.083c.094-.223.13-.483.145-.863c.02-.558.309-1.074.796-1.353a1.64 1.64 0 0 1 1.579-.008c.338.178.583.276.825.308c.53.07 1.066-.073 1.49-.396c.318-.242.553-.646 1.022-1.453c.47-.807.704-1.21.757-1.605a1.99 1.99 0 0 0-.4-1.479c-.148-.192-.357-.353-.68-.555c-.477-.297-.783-.803-.783-1.361c0-.558.306-1.064.782-1.36c.324-.203.533-.364.682-.556a1.99 1.99 0 0 0 .399-1.479c-.053-.394-.287-.798-.757-1.605c-.47-.807-.704-1.21-1.022-1.453a2.026 2.026 0 0 0-1.49-.396c-.242.032-.487.13-.825.308a1.64 1.64 0 0 1-1.58-.008a1.615 1.615 0 0 1-.795-1.353c-.015-.38-.051-.64-.145-.863a2.007 2.007 0 0 0-1.09-1.083" clip-rule="evenodd" opacity=".42"/><path fill="currentColor" d="M15.523 12c0 1.657-1.354 3-3.023 3c-1.67 0-3.023-1.343-3.023-3S10.83 9 12.5 9c1.67 0 3.023 1.343 3.023 3"/>',
  user: '<circle cx="12" cy="7" r="4" fill="currentColor"/><path fill="currentColor" d="M4 21a8 8 0 0 1 16 0z"/>',
  chevron: '<path fill="currentColor" fill-rule="evenodd" d="M7.53 4.47a.75.75 0 0 1 1.06 0l5.47 5.47l5.47-5.47a.75.75 0 1 1 1.06 1.06l-6 6a.75.75 0 0 1-1.06 0l-6-6a.75.75 0 0 1 0-1.06" clip-rule="evenodd"/>',
  chevronSort: '<path fill="currentColor" fill-rule="evenodd" d="M8.53 3.47a.75.75 0 0 1 1.06 0l2.94 2.94l2.94-2.94a.75.75 0 1 1 1.06 1.06l-3.47 3.47a.75.75 0 0 1-1.06 0L8.53 4.53a.75.75 0 0 1 0-1.06m0 9a.75.75 0 0 1 1.06 0l2.94 2.94l2.94-2.94a.75.75 0 1 1 1.06 1.06l-3.47 3.47a.75.75 0 0 1-1.06 0l-3.47-3.47a.75.75 0 0 1 0-1.06" clip-rule="evenodd"/>',
  logout: '<path fill="currentColor" fill-rule="evenodd" d="M3.25 5A2.75 2.75 0 0 1 6 2.25h6a.75.75 0 0 1 0 1.5H6A1.25 1.25 0 0 0 4.75 5v14A1.25 1.25 0 0 0 6 20.25h6a.75.75 0 0 1 0 1.5H6A2.75 2.75 0 0 1 3.25 19z" clip-rule="evenodd"/><path fill="currentColor" fill-rule="evenodd" d="M14.47 7.47a.75.75 0 0 1 1.06 0l3.72 3.72H9a.75.75 0 0 0 0 1.5h10.25l-3.72 3.72a.75.75 0 1 0 1.06 1.06l5-5a.75.75 0 0 0 0-1.06l-5-5a.75.75 0 0 0-1.06 1.06" clip-rule="evenodd"/>',
  add: '<path fill="currentColor" fill-rule="evenodd" d="M12 3.25a.75.75 0 0 1 .75.75v7.25H20a.75.75 0 0 1 0 1.5h-7.25V20a.75.75 0 0 1-1.5 0v-7.25H4a.75.75 0 0 1 0-1.5h7.25V4a.75.75 0 0 1 .75-.75" clip-rule="evenodd"/>',
  moon: '<path fill="currentColor" d="M20.4 14.74A7.7 7.7 0 0 1 9.26 3.6A8.7 8.7 0 1 0 20.4 14.74"/>',
  contrast: '<path fill="currentColor" fill-rule="evenodd" d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18m0 1.5v15a7.5 7.5 0 0 1 0-15" clip-rule="evenodd"/>',
  direction: '<path fill="currentColor" d="M4 6h11.5l-2.75-2.75l1.06-1.06L18.38 6.75l-4.57 4.56l-1.06-1.06L15.5 7.5H4zm16 12H8.5l2.75 2.75l-1.06 1.06l-4.57-4.56l4.57-4.56l1.06 1.06L8.5 16.5H20z"/>',
  compact: '<path fill="currentColor" d="M4 5.25A2.25 2.25 0 0 1 6.25 3h11.5A2.25 2.25 0 0 1 20 5.25v2.5A2.25 2.25 0 0 1 17.75 10H6.25A2.25 2.25 0 0 1 4 7.75zm0 11A2.25 2.25 0 0 1 6.25 14h11.5A2.25 2.25 0 0 1 20 16.25v2.5A2.25 2.25 0 0 1 17.75 21H6.25A2.25 2.25 0 0 1 4 18.75z"/>',
  layoutVertical: '<path fill="currentColor" d="M3 4.25A1.25 1.25 0 0 1 4.25 3h15.5A1.25 1.25 0 0 1 21 4.25v15.5A1.25 1.25 0 0 1 19.75 21H4.25A1.25 1.25 0 0 1 3 19.75zm1.5.25v15h4v-15zm5.5 0v15h9.5v-15z"/>',
  layoutHorizontal: '<path fill="currentColor" d="M3 4.25A1.25 1.25 0 0 1 4.25 3h15.5A1.25 1.25 0 0 1 21 4.25v15.5A1.25 1.25 0 0 1 19.75 21H4.25A1.25 1.25 0 0 1 3 19.75zm1.5.25v4h15v-4zm0 5.5v9.5h15V10z"/>',
  layoutMini: '<path fill="currentColor" d="M3 4.25A1.25 1.25 0 0 1 4.25 3h15.5A1.25 1.25 0 0 1 21 4.25v15.5A1.25 1.25 0 0 1 19.75 21H4.25A1.25 1.25 0 0 1 3 19.75zm1.5.25v15h3v-15zm4.5 0v15h10.5v-15z"/>',
  preset: '<path fill="currentColor" d="M12 3a9 9 0 1 0 9 9a9.01 9.01 0 0 0-9-9m-3.5 13.25a1.75 1.75 0 1 1 0-3.5a1.75 1.75 0 0 1 0 3.5m3.5-5.5a1.75 1.75 0 1 1 0-3.5a1.75 1.75 0 0 1 0 3.5m3.5 5.5a1.75 1.75 0 1 1 0-3.5a1.75 1.75 0 0 1 0 3.5"/>',
  font: '<path fill="currentColor" d="M5 4h14v4h-1.5V5.5h-4.75v13h2v1.5H9.25v-1.5h2v-13H6.5V8H5z"/>',
  fullscreen: '<path fill="currentColor" d="M4 9V4h5v1.5H5.5V9zm11-5h5v5h-1.5V5.5H15zM4 15h1.5v3.5H9V20H4zm14.5 0H20v5h-5v-1.5h3.5z"/>',
  reset: '<path fill="currentColor" d="M12 4a8 8 0 0 0-7.45 5.1L3.16 8.5A9.5 9.5 0 1 1 3 13h1.5a8 8 0 1 0 2.1-5.46L9 8.5H3V2.5h1.5v5.04A9.48 9.48 0 0 1 12 4"/>',
  close: '<path fill="currentColor" d="m5.05 3.99l14.96 14.96l-1.06 1.06L3.99 5.05zm13.9 0l1.06 1.06L5.05 20.01l-1.06-1.06z"/>',
} as const;

// iconNames 是本地 Iconify 名称的类型约束，防止组件退回联网加载。
export type IconifyName = keyof typeof localIcons;

// registerLocalIcons 将产品所需图标一次性注册到 Iconify 内存集合。
let localIconsRegistered = false;
const registerLocalIcons = (): void => {
  if (localIconsRegistered) return;
  addCollection({ prefix: 'dh', width: 24, height: 24, icons: Object.fromEntries(Object.entries(localIcons).map(/* 转换本地 SVG 正文为 Iconify 条目。 */ ([name, body]) => [name, { body }])) });
  localIconsRegistered = true;
};

// IconRoot 是支持 MUI sx 的 Iconify 渲染根节点。
const IconRoot = styled(Icon)({ display: 'inline-flex', flexShrink: 0 });

/** Iconify 渲染已注册的 Minimal 本地图标。 */
export interface IconifyProps extends Omit<IconProps, 'icon'> {
  /** icon 是本地注册的图标名称。 */
  icon: IconifyName;
  /** sx 是 MUI 样式扩展。 */
  sx?: SxProps<Theme>;
}

/** Iconify 提供不依赖网络的 Minimal 图标适配器。 */
export const Iconify: FC<IconifyProps> = ({ icon, width = 24, height, sx, ...other }) => {
  registerLocalIcons();
  return <IconRoot ssr icon={`dh:${icon}`} width={width} height={height ?? width} sx={sx} {...other} />;
};

export default Iconify;

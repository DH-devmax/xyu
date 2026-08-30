import React from 'react';

interface DHBrandLogoProps {
  /** className 表示品牌图像的附加 CSS 类名。 */
  className?: string;
  /** decorative 表示图像是否已由外层可访问名称覆盖。 */
  decorative?: boolean;
}

interface DHBrandIconProps {
  /** sizeClass 指定品牌图标容器尺寸相关的 CSS 类名。 */
  sizeClass?: string;
  /** logoClassName 表示品牌图像的 CSS 类名。 */
  logoClassName?: string;
}

// BRAND_ASSET_PATH 是构建后由 Vite base=/static/ 提供的同源品牌资源。
const BRAND_ASSET_PATH = '/static/favicon.png';

// DHBrandLogo 渲染由 branding/logo.jpg 派生的统一产品标志。
const DHBrandLogo: React.FC<DHBrandLogoProps> = ({
  className = 'h-full w-full rounded-lg object-cover',
  decorative = false,
}) => (
  <img
    className={className}
    src={BRAND_ASSET_PATH}
    alt={decorative ? '' : 'DH闲不下来'}
    aria-hidden={decorative ? true : undefined}
  />
);

// DHBrandIcon 为认证页和侧边栏提供固定尺寸、无渐变冲突的品牌容器。
export const DHBrandIcon: React.FC<DHBrandIconProps> = ({
  sizeClass = 'w-12 h-12',
  logoClassName = 'h-full w-full rounded-lg object-cover',
}) => (
  <div className={`relative z-10 flex items-center justify-center overflow-hidden rounded-lg border border-black/10 ${sizeClass}`}>
    <DHBrandLogo className={logoClassName} decorative />
  </div>
);

export default DHBrandLogo;

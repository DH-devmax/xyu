import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import DHBrandLogo, { DHBrandIcon } from './DHBrandLogo';

describe('DHBrandLogo', /* 当前回调验证统一品牌资源在认证和导航场景下可复用。 */ () => {
  test('uses the generated favicon asset as the accessible product mark', /* 当前回调验证品牌资源路径不会回退到旧内联图形。 */ () => {
    // html 是服务端渲染后的品牌标记。
    const html = renderToStaticMarkup(<DHBrandLogo />);
    expect(html).toContain('src="/static/favicon.png"');
    expect(html).toContain('alt="DH闲不下来"');
  });

  test('renders a fixed-size image wrapper for navigation', /* 当前回调验证容器尺寸和装饰性图像属性稳定。 */ () => {
    // html 是侧边栏品牌容器的服务端输出。
    const html = renderToStaticMarkup(<DHBrandIcon />);
    expect(html).toContain('w-12 h-12');
    expect(html).toContain('overflow-hidden');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('src="/static/favicon.png"');
  });
});

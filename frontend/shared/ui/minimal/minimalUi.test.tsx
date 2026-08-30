import ReactDOMServer from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { MinimalAuthCenteredLayout, MinimalFormHead, MinimalMainSection, MinimalPageHeader, MinimalSectionCard } from './index';

// render 将模板原语转换为静态 HTML，验证布局契约不依赖浏览器尺寸或网络状态。
const render = (element: React.ReactElement): string => ReactDOMServer.renderToStaticMarkup(element);

describe('Minimal UI 模板原语', /* 当前回调验证模板适配层的固定结构和可访问标题。 */ () => {
  test('认证布局保留 centered content、品牌插槽和背景资源契约', /* 当前回调验证认证页确实使用 Minimal centered 结构。 */ () => {
    // markup 是带品牌和表单内容的 centered 布局静态结果。
    const markup = render(
      <MinimalAuthCenteredLayout brand={<span>品牌</span>}>
        <span>登录表单</span>
      </MinimalAuthCenteredLayout>,
    );

    expect(markup).toContain('data-layout-contract="minimal-auth-centered"');
    expect(markup).toContain('minimal-auth-centered__content');
    expect(markup).toContain('background-3-blur.webp');
    expect(markup).toContain('品牌');
    expect(markup).toContain('登录表单');
  });

  test('FormHead 输出标题、说明和可选图标插槽', /* 当前回调验证认证表单标题层级与说明文本。 */ () => {
    // markup 是带图标的 Minimal 表单标题静态结果。
    const markup = render(<MinimalFormHead icon={<span>图标</span>} title="欢迎回来" description="工作台登录" />);

    expect(markup).toContain('欢迎回来');
    expect(markup).toContain('工作台登录');
    expect(markup).toContain('图标');
  });

  test('主内容原语提供稳定的 Minimal layout contract', /* 当前回调验证登录后页面的主区契约。 */ () => {
    // markup 是主内容原语包裹业务节点后的静态结果。
    const markup = render(<MinimalMainSection><span>页面内容</span></MinimalMainSection>);

    expect(markup).toContain('data-layout-contract="minimal-main-section"');
    expect(markup).toContain('页面内容');
  });

  test('页面头部提供业务标题和动作插槽', /* 当前回调验证仪表盘等业务页调用 Minimal 标题结构。 */ () => {
    // markup 是带上下文、标题、说明和动作节点的页面头部静态结果。
    const markup = render(
      <MinimalPageHeader
        eyebrow="DH闲不下来"
        title="运营概览"
        description="实时经营数据"
        actions={<button type="button">刷新</button>}
      />,
    );

    expect(markup).toContain('data-layout-contract="minimal-page-header"');
    expect(markup).toContain('运营概览');
    expect(markup).toContain('实时经营数据');
    expect(markup).toContain('刷新');
  });

  test('区块卡片提供标题和内容插槽', /* 当前回调验证仪表盘分析区块的 Minimal outlined card 契约。 */ () => {
    // markup 是带标题和业务内容的区块卡片静态结果。
    const markup = render(
      <MinimalSectionCard title="商品销量排行">
        <span>商品数据</span>
      </MinimalSectionCard>,
    );

    expect(markup).toContain('data-layout-contract="minimal-section-card"');
    expect(markup).toContain('商品销量排行');
    expect(markup).toContain('商品数据');
  });
});

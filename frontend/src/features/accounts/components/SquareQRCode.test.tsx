import { renderToStaticMarkup } from 'react-dom/server';
import { expect,test } from 'vitest';
import { SquareQRCode } from './SquareQRCode';

test('login QR code preserves a square aspect ratio without stretching', /* 当前回调处理用户交互或异步状态变化。 */ () => {
  // html 渲染后的 HTML。
  const html = renderToStaticMarkup(<SquareQRCode src="data:image/png;base64,abc" alt="登录二维码" sx={{ p: 1 }} />);
  expect(html).toContain('aspect-ratio:1/1');
  expect(html).toContain('height:auto');
  expect(html).toContain('object-fit:contain');
  expect(html).toContain('padding:8px');
});

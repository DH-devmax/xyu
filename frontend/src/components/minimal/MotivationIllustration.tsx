import type { SvgIconProps } from '@mui/material/SvgIcon';
import { memo } from 'react';
import SvgIcon from '@mui/material/SvgIcon';

// MotivationIllustrationProps 描述 Minimal 欢迎区插画的可选样式参数。
type MotivationIllustrationProps = SvgIconProps & {
  /** hideBackground 控制是否隐藏插画底部装饰背景。 */
  hideBackground?: boolean;
};

// MotivationIllustration 复用 Minimal 7.7.0 的图表与人物构图，并使用本地静态资源。
const MotivationIllustration = memo(/* renderIllustration 生成欢迎区插画 SVG。 */ ({ hideBackground = false, sx, ...other }: MotivationIllustrationProps) => (
  <SvgIcon
    viewBox="0 0 480 360"
    xmlns="http://www.w3.org/2000/svg"
    sx={[
      /* themeColor 使用当前 Minimal 主题的主色令牌。 */ theme => ({
        '--primary-lighter': theme.palette.primary.light,
        '--primary-dark': theme.palette.primary.dark,
        '--primary-darker': theme.palette.primary.dark,
        width: 320,
        maxWidth: 1,
        flexShrink: 0,
        height: 'auto',
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...other}
  >
    {!hideBackground && (
      <path fill="rgba(255,255,255,0.12)" d="M30 258c70-45 148-55 230-30 71 22 126 13 190-20v98H30z" />
    )}
    <path
      fill="url(#dh_motivation_gradient)"
      d="M216.3 138v108.3c0 2.2-1.8 4-4 4H195c-2.2 0-4-1.8-4-4V138c0-2.2 1.8-4 4-4h17.3c2.2 0 4 1.8 4 4zm-55-68H144c-2.2 0-4 1.8-4 4v176.3c0 2.2 1.8 4 4 4h17.3c2.2 0 4-1.8 4-4V74c0-2.2-1.8-4-4-4zm102 93H246c-2.2 0-4 1.8-4 4v75.7c0 2.2 1.8 4 4 4h17.3c2.2 0 4-1.8 4-4V167c0-2.2-1.8-4-4-4z"
    />
    <path
      fill="var(--primary-darker)"
      d="M359.2 253.4c-1.1 3.1-2.3 6.3-3.7 9.7-5.1.1-10.1.3-15.2.4-3.3.1-6.9.2-9.6 2.1-5.2 3.6-.7 6.1-1.3 9.6-.7 4.2-4.9 5.1-9 5.1-14.1.1-27.7 4.6-41.5 7.3s-28.9 3.5-41.2-3.4c-.8-.5-1.7-1-2-2-.6-1.6.9-3.2 2.3-4.2 3.2-2.2 6.7-3.7 10.5-4.5 2.2-.5 4.5-.8 6.5-2 1.9-1.2 3.3-3.7 2.3-5.8-32.1 2-64.1 4.8-96 8.4-41.1 4.8-81.8 12.9-123 15.9h-.4c-2.9-2.9-5.5-6-7.9-9.3.2-.2.4-.5.6-.7 2-2.2 5-3.2 7.8-4.1 15.9-4.9 32.4-7.4 48.8-9.9 81.6-12.3 164.2-21.1 246.8-15.3 8.4.6 16.8 1.5 25.2 2.7z"
      opacity="0.24"
    />
    <path fill="#DFE3E8" d="M81.7 204.2l74 11v60.7h8.5v3.6h-19.5v-2.3h8.7v-50.3l-70-13.5v49h9.7v1.7H73.6V262h8.2v-57.8h-.1z" />
    <path fill="#C4CDD5" d="M80.6 204.2l74 11v60.7h8.5v3.6h-19.5v-2.3h8.7v-50.3l-70-13.5v49H92v1.7H72.4V262h8.2v-57.8z" />
    <defs>
      <linearGradient id="dh_motivation_gradient" x1="140" x2="276.5" y1="98" y2="312.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--primary-lighter)" />
        <stop offset="1" stopColor="var(--primary-dark)" />
      </linearGradient>
    </defs>
    <image href="/static/assets/illustrations/characters/character-fly.webp" height="280" x="260" y="40" />
  </SvgIcon>
));

MotivationIllustration.displayName = 'MotivationIllustration';

export default MotivationIllustration;

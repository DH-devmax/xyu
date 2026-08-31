import React from 'react';
import { MinimalAuthCenteredLayout } from '@/components/minimal';
import type { MinimalAuthCenteredLayoutProps } from '@/components/minimal';

/** AuthCenteredLayout 是 Minimal centered 认证布局的产品层入口。 */
export const AuthCenteredLayout: React.FC<MinimalAuthCenteredLayoutProps> = props => <MinimalAuthCenteredLayout {...props} />;

export default AuthCenteredLayout;

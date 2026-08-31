import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppErrorBoundary } from './errors/AppErrorBoundary';
import { SessionProvider } from './providers/SessionProvider';
import { MinimalSettingsProvider } from '@/theme';
import { appRouter } from '@/routes';

// App 组合 Minimal 主题设置、会话 Provider、错误边界和数据路由。
const App: React.FC = () => (
  <MinimalSettingsProvider>
    <AppErrorBoundary>
      <SessionProvider>
        <RouterProvider router={appRouter} />
      </SessionProvider>
    </AppErrorBoundary>
  </MinimalSettingsProvider>
);

export default App;

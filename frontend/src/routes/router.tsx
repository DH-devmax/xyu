import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard, AdminGuard } from '@/auth/guard';
import DashboardLayout from '@/layouts/dashboard/layout';
import { appPaths } from './paths';
import { appRoutes } from './sections/app-routes';

// appRouter 使用 React Router 7 数据路由承载 Minimal 应用壳和全部正式页面。
export const appRouter = createBrowserRouter([
  { path: '/', element: <Navigate to={appPaths.dashboard} replace /> },
  { path: '/dashboard', element: <Navigate to={appPaths.dashboard} replace /> },
  {
    path: '/app',
    element: <AuthGuard />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          ...appRoutes.filter(/* publicRouteFilter 把管理员页面移入独立 Guard。 */ route => route.path !== 'settings' && route.path !== 'brain'),
          {
            element: <AdminGuard />,
            children: [
              { path: 'settings', element: appRoutes.find(/* settingsRouteFinder 读取设置页面元素。 */ route => route.path === 'settings')?.element },
              { path: 'brain', element: appRoutes.find(/* brainRouteFinder 读取 Brain 页面元素。 */ route => route.path === 'brain')?.element },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={appPaths.dashboard} replace /> },
]);

export default appRouter;

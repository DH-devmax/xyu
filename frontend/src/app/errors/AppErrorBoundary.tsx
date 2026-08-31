import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/** ErrorBoundaryProps 描述顶层错误边界可恢复的页面子树。 */
interface ErrorBoundaryProps {
  /** children 是由错误边界保护的整个应用路由树。 */
  children: React.ReactNode;
}

/** ErrorBoundaryState 只记录渲染期故障，避免把错误对象或敏感响应写入浏览器状态。 */
interface ErrorBoundaryState {
  /** hasError 表示应用子树是否因渲染错误而被隔离。 */
  hasError: boolean;
}

/** AppErrorBoundary 隔离未捕获的页面渲染错误，并提供不依赖网络请求的恢复入口。 */
export class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /** state 保存当前子树的错误隔离状态。 */
  public state: ErrorBoundaryState = { hasError: false };

  /** getDerivedStateFromError 在 React 捕获到子树异常时切换到静态恢复视图。 */
  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  /** handleReload 由用户点击触发，使用完整刷新重新建立会话和路由运行环境。 */
  private handleReload = (): void => {
    window.location.reload();
  };

  /** render 在正常路径渲染应用子树；捕获异常后只暴露安全的恢复界面。 */
  public render(): React.ReactNode {
    // hasError 表示当前是否需要显示错误隔离界面。
    const { hasError } = this.state;
    // children 是未发生渲染错误时应继续展示的应用路由树。
    const { children } = this.props;
    if (!hasError) return children;

    return (
      <Box component="main" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, bgcolor: 'background.default' }}>
        <Stack spacing={2} sx={{ width: '100%', maxWidth: 420, alignItems: 'center', textAlign: 'center' }}>
          <Alert severity="error" sx={{ width: '100%' }}>页面暂时无法显示</Alert>
          <Typography variant="body2" color="text.secondary">重新加载后会重新校验当前会话。</Typography>
          <Button variant="contained" onClick={this.handleReload}>重新加载</Button>
        </Stack>
      </Box>
    );
  }
}

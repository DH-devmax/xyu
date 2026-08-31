import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './global.css';
import './theme/core/variables.css';

// rootElement 是 Go 嵌入页面提供的唯一 React 挂载节点。
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('找不到前端挂载节点');

// root 使用 React 19 createRoot 启动 Minimal 应用。
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

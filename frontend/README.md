# DH 闲不下来前端

本目录是 Go 服务嵌入的 C 端工作台。视觉层采用 Minimal Vite TS 7.7.0 的布局、Public Sans、MUI 组件和设置抽屉模式；业务请求、会话、OpenAPI、账号 runtime、自动化和聊天 WebSocket 仍由原有 feature/shared 边界负责。

## 目录

```text
frontend/
  index.html
  src/
    main.tsx                 React 挂载入口
    app/                     Provider、错误边界和应用组合根
    auth/guard/              会话与管理员路由守卫
    routes/                  createBrowserRouter、路径和跨页联动
    layouts/                 Minimal dashboard/auth 布局
    sections/                业务页面的 Minimal 视图组合
    features/                API adapter、Hook、状态、模型和页面实现
    components/minimal/      Minimal 7.7.0 视觉原语与 DH 品牌组件
    shared/                  API 契约、HTTP、异步和浏览器工具
    theme/                   Minimal 主题、变量和本地设置 Provider
    global.css               非业务全局样式
  scripts/check-api-contract.mjs
```

依赖方向固定为 `routes/layouts -> sections -> features -> shared`；主题和组件不依赖业务。生产页面不直接调用 `fetch`、`axios` 或 OpenAPI client，所有请求经过所属 feature adapter。

## 开发

```bash
cd /path/to/xyu/frontend
npm ci
npm run dev
```

Vite 默认监听 `http://localhost:3000`，将 `/api`、`/health` 和 WebSocket 代理到 `http://localhost:59188`。Go 服务可使用 `go run ./cmd/server -addr 127.0.0.1:59188` 启动。生产 `base` 固定为 `/static/`，因此直接访问 Vite 时使用 `/static/app/dashboard`。

## 构建与契约

```bash
npm run typecheck
npm test
npm run api:check
npm run comments:check
npm run build
```

`npm run build` 输出到 `../internal/webui/static/`，供 Go 的嵌入资源服务。OpenAPI 类型由 `api/openapi.yaml` 生成到 `src/shared/api-contract/generated/schema.ts`，禁止手工修改生成文件。

## 正式路由

`/app/dashboard`、`/app/accounts`、`/app/chat`、`/app/orders`、`/app/cards`、`/app/items`、`/app/rules`、`/app/notifications`、`/app/settings`、`/app/brain`。系统设置和 Brain 由 `AdminGuard` 保护；未认证地址显示现有 SessionGate，刷新深链由 Go 回退到 `index.html`。

正式页面只使用 MUI/Minimal 原语与 `sx`；`theme/core/variables.css` 只保留 Minimal 色阶、阴影和动画变量，不包含 utility class 或兼容样式层。Minimal 设置抽屉只持久化颜色模式、导航模式和舒适密度到浏览器本地，不写入业务数据库。聊天通知 WebSocket 仍由已认证应用壳单例拥有，Chat section 只订阅事件。

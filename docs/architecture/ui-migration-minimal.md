# Minimal UI 技术栈迁移记录

## 当前落点

DH 闲不下来继续使用现有 `frontend/` 作为唯一前端入口，运行时组合为 React 19、Vite 8、TypeScript 5.9、MUI 9、Emotion、React Router 7 和 `openapi-fetch`。本次接入增加了 Minimal 7.7.0 使用的 `minimal-shared` 与 Public Sans 字体，并把模板的 centered auth、FormHead、MainSection 原语适配到现有应用边界。

## 模板来源与复用

- 来源归档：`minimal-vite-ts-main.zip`，版本 7.7.0。
- 归档 SHA-256：`b058dbc7fa8d231d06663e46d3e1d8fbfd8d38e7bd22db8abe12afa6ab498dde`。
- 复用代码：`frontend/shared/ui/minimal/`。
- 复用资源：`frontend/public/assets/background/background-3-blur.webp`。
- 适配说明：模板只提供布局、排版和样式原语；认证状态仍由 `SessionProvider` 持有，登录和初始化仍通过特性 API adapter 调用 OpenAPI 契约。

## 迁移顺序

1. 认证页和应用壳：已接入 centered auth、FormHead、MainSection，保留旧 URL、权限和会话事件。
2. 业务页面：按仪表盘、账号、订单、商品、卡密、规则、通知、设置、聊天顺序，把 Tailwind class 迁移为 MUI `sx` 和模板共享组件。
3. 主题收束：页面迁移完成后删除 Tailwind 运行时与旧颜色令牌，保留 `minimal-shared`、MUI CSS variables 和 DH 品牌色。
4. 验收：每个页面同时通过 API/WebSocket 契约、权限回归、桌面/移动 Playwright 截图和 `make comments`。

## 兼容约束

- `SessionProvider`、`/app/*` 路由、OpenAPI DTO、WebSocket 单例和 Go 服务边界不随模板代码改变。
- Tailwind 目前是过渡依赖，尚未迁移的业务页面继续使用原 class，避免一次性改变业务行为。
- 模板演示账号、演示路由、第二套认证 Provider 和模板自带数据源不进入产品构建。

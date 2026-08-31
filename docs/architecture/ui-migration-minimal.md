# Minimal UI 技术栈迁移记录

## 当前落点

DH 闲不下来继续使用现有 `frontend/` 作为唯一前端入口，运行时组合为 React 19、Vite 8、TypeScript 5.9、MUI 9、Emotion、React Router 7 和 `openapi-fetch`。本次接入增加了 Minimal 7.7.0 使用的 `minimal-shared` 与 Public Sans 字体，并把模板的 centered auth、FormHead、MainSection、页面头部、区块卡片、卡片网格、筛选工具栏、状态标签、空状态和响应式 Drawer 原语适配到现有应用边界。

## 模板来源与复用

- 来源归档：`minimal-vite-ts-main.zip`，版本 7.7.0。
- 归档 SHA-256：`b058dbc7fa8d231d06663e46d3e1d8fbfd8d38e7bd22db8abe12afa6ab498dde`。
- 复用代码：`frontend/shared/ui/minimal/`，包含认证布局、主区、页面头部、区块卡片、列表网格、筛选栏、状态标签、空状态、表格壳、响应式 Drawer 和分段 Dialog 适配器。
- 复用资源：`frontend/public/assets/background/background-3-blur.webp`。
- 适配说明：模板只提供布局、排版和样式原语；认证状态仍由 `SessionProvider` 持有，登录和初始化仍通过特性 API adapter 调用 OpenAPI 契约。

## 迁移顺序

1. 认证页和应用壳：已接入 centered auth、FormHead、MainSection、MinimalPageHeader，侧边栏支持 Vertical + Mini 折叠和移动临时 Drawer，保留旧 URL、权限和会话事件。
2. 仪表盘第一切片：已接入 MinimalPageHeader、MinimalSectionCard、MUI ToggleButtonGroup、TextField、Alert、Chip 和统计卡；原有 `useDashboard`、Recharts、订单表和筛选逻辑保持不变。
3. 批次 A：账号使用 Minimal User Card/Grid，商品使用响应式 Product Grid，订单使用 Minimal Table Toolbar、状态标签和右侧详情 Drawer；API adapter、业务 Hook 和联动回调未改变。
4. 批次 B/C：卡密使用 Minimal Table/Filter Toolbar/Empty State，规则、通知和设置统一 Minimal 页面头部与区块容器；自动化规则编辑器使用 `MinimalSegmentedDialog` 包裹复杂表单，其他回复弹窗继续复用现有 Portal 实现。
5. 批次 D：聊天保留唯一 WebSocket 和多栏 ChatLayout，使用 Minimal 页面外框；Brain Center 使用 Minimal 页面框架包住 runtime、Provider、工具、测试台和会话审计区块。
6. 主题收束：Tailwind 目前仍是过渡依赖；所有业务页面进入 MUI 原语后再删除运行时与旧颜色令牌，保留 `minimal-shared`、MUI CSS variables 和 DH 品牌色。
7. 验收：每个页面同时通过 API/WebSocket 契约、权限回归、桌面/移动 Playwright 截图和 `make comments`。

## 兼容约束

- `SessionProvider`、`/app/*` 路由、OpenAPI DTO、WebSocket 单例和 Go 服务边界不随模板代码改变。
- Tailwind 目前是过渡依赖，尚未迁移的业务页面继续使用原 class，避免一次性改变业务行为。
- 模板演示账号、演示路由、第二套认证 Provider 和模板自带数据源不进入产品构建。
- 仪表盘本轮保留订单表和 Recharts 内部 class，以维持已有响应式、可访问性和截图契约；这些 class 会在对应页面切片中逐步收束。

## B 端扩展边界

本轮只交付 C 端 Minimal 视觉迁移，不在前端引入第二套控制面页面或远程执行逻辑。后续 B 端沿用同一仓库但独立部署：B 使用独立管理员会话并预留 OIDC/SSO，C 保留本机 HttpOnly `session` 作为执行面身份。C 首次通过一次性配对码注册设备密钥，之后主动建立出站 WSS；控制消息固定携带 `device_id`、`scope`、`request_id`、`nonce`、`expires_at`、签名和命令参数。

B 端只接收在线状态、任务进度、错误摘要和聚合指标，不接触闲鱼 Cookie、聊天正文或业务凭证；首批远程命令限定为运行/配置白名单，并按 TTL 和幂等规则过期。C 与 B 断开时继续本地运行。该边界作为后续控制面契约，当前页面适配不改变 Go API、数据库和 WebSocket 业务所有权。

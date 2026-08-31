# Minimal 7.7.0 全量前端迁移

## 范围

`frontend/src` 是唯一前端源码入口。Minimal 7.7.0 的 dashboard vertical/mini navigation、centered auth、Public Sans、MUI 主题、页面头部、区块卡片、表格工具栏、状态 Chip、Drawer/Dialog 和设置抽屉组成正式 C 端视觉层；模板 demo、mock provider、demo 路由和第二套认证不进入构建。

后端保持不变：Go API、数据库、账号 runtime、自动化、OpenAPI 契约、`/api/v1/chat/ws` 以及敏感字段边界继续由原实现拥有。`src/features` 只保留数据适配和业务动作，`src/sections` 组合 Minimal 视图，`src/routes` 负责 URL 和权限。

## 目录与依赖

```text
src/main.tsx -> src/app/App.tsx -> src/routes/router.tsx
routes/layouts -> sections -> features -> shared
components/minimal + theme -> 无业务依赖
```

OpenAPI 生成物位于 `frontend/src/shared/api-contract/generated/schema.ts`。Vite 使用 `@/* -> src/*`、`base=/static/`、Go API/健康检查/WebSocket 代理和 `internal/webui/static` 输出目录。

正式页面的布局、间距、响应式栅格、状态色和交互全部使用 MUI `sx` 与 `src/components/minimal` 原语。`frontend/src/theme/core/variables.css` 只定义 Minimal 色阶、阴影和动画变量，并随 `SettingsProvider` 的浅色/深色模式切换；仓库中没有 Tailwind runtime、utility class 或冻结兼容样式层。

## 页面映射

| URL | Minimal 组合 | 业务边界 |
| --- | --- | --- |
| `/app/dashboard` | Overview 指标、趋势图、订单摘要 | `useDashboard` 与 Recharts |
| `/app/accounts` | User Card/Grid、Drawer/Dialog | QR 登录、风险验证、运行状态 |
| `/app/items` | Product Grid、筛选工具栏、批量面板 | 商品同步、发布、规则联动 |
| `/app/orders` | Table、筛选 Tabs、详情 Drawer | 查询、导入、同步、发货 |
| `/app/cards` | Table Toolbar、批量操作 | 卡密导入、删除、API 构建器 |
| `/app/rules` | Tabs、Summary、Stepper/Dialog | 默认回复、自动化和校验 |
| `/app/notifications` | Settings Sections、Tabs | 渠道、事件、SMTP |
| `/app/settings` | Settings Sections、Form | 系统、AI、凭据（管理员） |
| `/app/chat` | Minimal 多栏 ChatLayout | 单例 WebSocket、消息和媒体 |
| `/app/brain` | Analytics Cards、Tabs、Tables | Harness runtime、Provider、测试台（管理员） |

所有页面实现加载、空数据、错误、权限、提交中和网络断开状态；桌面使用 Drawer/Dialog，窄屏使用全宽 Drawer。商品到规则页通过 `DeliveryRuleProvider` 传递一次性目标，消费后清理。

## Minimal 来源与许可

- 来源：`minimal-vite-ts-main.zip`，版本 7.7.0。
- SHA-256：`b058dbc7fa8d231d06663e46d3e1d8fbfd8d38e7bd22db8abe12afa6ab498dde`。
- 官方接入说明：<https://docs.minimals.cc/setup/vitejs/>；许可说明：<https://docs.minimals.cc/package/>。
- 本仓库只保留按产品许可入库后适配的视觉原语；模板 demo 数据与无关依赖不打包。来源、哈希和许可记录同步写入 `NOTICE`、`THIRD_PARTY_NOTICES.md`、`product/dependency-licenses.json` 和 `product/sbom.cdx.json`。

## 验收

迁移分支执行 `npm run typecheck --prefix frontend`、`npm test --prefix frontend`、`npm run api:check --prefix frontend`、`npm run comments:check --prefix frontend`、`npm run build --prefix frontend` 和 `git diff --check`。最终里程碑再运行 Go 全量门禁与 Playwright 桌面/移动截图。

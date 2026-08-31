# Minimal 7.7.0 迁移进度

## 已完成

- 建立 `codex/minimal-full-migration` 分支并保留回滚锚点 `875723b270`。
- 前端源码统一迁入 `frontend/src`，使用 `createBrowserRouter`、`Outlet`、SessionProvider、AdminGuard 和 Minimal DashboardLayout。
- 主题、Public Sans、Vertical/Mini 导航、移动 Drawer、SettingsDrawer、品牌资源和 `zh-CN` 页面文案接入。
- 全部 C 端 URL 通过 sections 重新对接现有 feature API/Hook；商品规则联动、聊天 WebSocket 单例和管理员权限保持。
- 全部业务弹窗统一使用 Minimal Dialog/Responsive Drawer，移动端使用全宽呈现；所有正式页面已清除 utility class，统一由 MUI `sx` 和 Minimal 主题变量呈现。
- 删除旧 `frontend/app`、旧 shell/router、根 `App.tsx`/`index.tsx`、Tailwind/PostCSS 配置与直接依赖；静态构建仍输出 `internal/webui/static`。
- OpenAPI 生成路径、架构门禁、打包检查和前端测试路径同步到 `src`。

## 当前验证记录

| 检查 | 结果 |
| --- | --- |
| `npm run typecheck --prefix frontend` | 通过 |
| `npm test --prefix frontend` | 73 个文件、414 个测试通过 |
| `npm run build --prefix frontend` | 通过，生成嵌入静态资源 |
| Go API/数据库 | 未修改，使用隔离 SQLite 实例验证登录和页面请求 |
| Playwright | 已验证登录、仪表盘、全部正式路由、导航折叠、设置抽屉、订单导入 Dialog 的桌面/移动布局；控制台 0 错误 |

## 交付后维护

1. 新增页面只从 `src/components/minimal`、MUI 主题和所属 feature 公共导出组合，不新增独立视觉体系。
2. 业务数据继续由 Go API 和 feature adapter 提供；页面变更不得绕过 OpenAPI、SessionProvider 或唯一聊天 WebSocket owner。
3. 发布提交使用 `界面：完成 Minimal 7.7.0 全量前端迁移 [ci full]`，回滚使用该提交的 `git revert`，无需数据库迁移。

## B 端边界

本轮不建立 B 端活动路由。未来控制面使用独立管理员会话、OIDC/SSO、设备配对、出站 WSS、命令 TTL 和签名；C 端继续持有本机 session、业务凭证、聊天正文和执行状态。

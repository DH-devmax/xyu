# DH闲不下来 v2.0 非 UI 阶段问题清单

> 该清单只记录前端视觉迁移以外的阶段问题、验证缺口和待决策项。UI 迁移可以按独立切片继续推进；每个非 UI 项在关闭前都需要补充命令、输入、原始输出和退出状态。

## 快照

- 记录日期：2026-08-31
- 仓库：`https://github.com/DH-devmax/xyu`
- 基线：`main`，提交 `a70a635e3e`
- 当前产品版本：`2.0.0-alpha.0`
- Harness 锁定：`dsh-v0.1.2-alpha.1` / `cd5ef8148158c3a752a658978873241fdf8e2bbc`

状态含义：`已完成` 表示仓库已有代码和门禁证据；`待实测` 表示实现已存在但还缺目标环境的可复现实测；`待决策` 表示需要产品选择后再落地；`进行中` 表示已有实现正在补齐证据。

## 已完成基线

| 范围 | 当前证据 | 结论 |
| --- | --- | --- |
| 仓库接管与品牌标识 | `origin/main` 已指向 `DH-devmax/xyu`；`product/manifest.json`、Go module、服务名和 Bundle ID 已统一 | 已完成 |
| CI 基础门禁 | `ci.yml`、桌面构建、Docker、Wiki 工作流均已进入 `main` | 已完成；每次依赖或 UI 变更仍需重新跑完整门禁 |
| OpenAPI 与 React adapter | `make api-check`、前端 API 检查和真实 Router 校验已纳入门禁 | 已完成基线 |
| 生命周期与数据库边界 | 组合根、Context、三方言迁移和业务所有权文档已存在 | 已完成基线；发布前仍需目标环境实测 |
| Harness vendor 与客服 profile | subtree、SDK 补丁、结果插件、工具 allowlist 和 runtime 检查脚本已存在 | 已完成基线；上游更新时按锁定流程复核 |

## 非 UI 阶段问题

### 1. Brain 真实链路验收（P0，待实测）

- 用隔离测试账号完成“收到消息 -> Brain 生成结构化草案 -> Go 校验 -> 成功发送”的端到端记录。
- 重复 `request_id`、迟到结果、无效插件结果、价格下限和砍价轮次需要分别保留测试输入与最终发送状态。
- 覆盖 gateway 启动超时、runtime 崩溃、指数退避重启、`drain`、服务关闭和再次启动；记录 `GET /api/v1/brain/status` 与内部健康回执。
- 验收入口：`make brain-check`、`make brain-profile-integration`，再补一条真实 Go 服务调用记录。

### 2. Provider 与密钥运维（P0，进行中）

- 对 `deepseek-official` 和受控兼容 provider 各完成一次可回放的连通性、超时和错误分类验证。
- 确认 API key 加密存储、只写更新、前端响应只返回 `api_key_configured`；日志、trace 和错误载荷执行脱敏抽样。
- 固定 provider、model、base URL、reasoning effort 和超时的管理员变更审计记录，并验证设置更新后的 runtime 原子重启。

### 3. 数据库迁移与升级（P0，待实测）

- SQLite、MySQL 8.4、PostgreSQL 17 分别执行 `brain_sessions`、`brain_turns` 迁移，记录迁移前后 schema、索引和回滚结果。
- 使用旧版设置字段（`ai_api_url`、`ai_api_key`、`ai_model` 及账号 AI 设置）验证迁移优先级、兼容读取和回滚副本。
- 运行严格三方言命令：`make test-multidb`；缺少两个外部 URL 时只记录为未执行，不将 SQLite 结果扩展为三库结论。

### 4. 产品数据迁移与回滚（P0，已有脚本待目标环境实测）

- Linux、Windows、macOS 各执行一次“源目录 -> staging -> 隔离验证副本 -> 切换”，保存源/副本哈希、数据库解密和 `migration.env`。
- 验证失败原子性：损坏数据库、错误数据密钥、哈希漂移均保持目标目录原状。
- 执行生成的 `rollback.sh`，确认回滚前先备份 v2 数据，回滚后旧副本只读且再次哈希一致。
- 验收入口：`bash scripts/migrate-product-data.test.sh`，以及对应平台安装器升级测试。

### 5. 桌面安装、签名和升级发布（P0，待实测）

- 预发布链路仍需依次建立 alpha、beta、rc、stable 标签；每个标签绑定绿灯的 `main` 提交和可下载制品校验和。
- macOS arm64/x64 的签名、公证、Bundle ID 和包内 Node 24 carrier 需要在干净 `PATH` 下复测；Intel Mac 使用 `node` 模式并记录 `node --version` 与 DSH 版本。
- Windows 服务安装/升级/卸载、Linux systemd 服务、托盘单实例和数据目录权限需要各保留一份安装日志。
- Docker 多架构镜像已构建门禁，仍需发布前做拉取、启动、健康检查和停止验证。

### 6. Harness 供应链与插件裁剪（P1，待决策/待实测）

- 客服 profile 已从注册层排除 coding、shell、文件系统、浏览器、编辑器和 PTY 工具；上游传递依赖仍保留在构建闭包中。
- 需要决定是否为体积优化物理删除未加载的 coding 相关传递包；决定前先对完整 Harness workspace 做依赖图和运行时回归，避免破坏 SDK 闭包。
- 每次上游同步必须运行 `scripts/update-deepseek-harness.sh`、`make brain-check`、profile allowlist、定向 SDK 测试和 `make supply-chain-generate`，并审核 `LICENSE`/`THIRD_PARTY_NOTICES.md` 的差异。

### 7. 供应链清单和发布审计（P1，进行中）

- `product/sbom.cdx.json` 与 `product/dependency-licenses.json` 必须和 Go、前端、Harness 三套锁文件保持同一提交更新。
- 依赖升级后记录组件版本、许可证、来源哈希和生成命令；发布包中只保留已检查的 runtime 闭包。
- 补充公开仓库的 Dependabot/漏洞告警处理流程和发布前人工审计记录。

### 8. 运行观测和故障处置（P1，待实测）

- 统一记录 Brain 状态转换、队列深度、活动会话、重启次数、超时和发送终态；日志字段须排除密钥、Cookie、完整消息上下文和内部路径。
- 为 runtime 崩溃、provider 限流、数据库不可用和 WebSocket 断线建立可执行的告警与人工处置步骤。
- 明确 `data/brain/` 派生数据的保留周期、清理命令和重建验证；业务数据库继续作为订单、商品、账号和消息的唯一真相。

### 9. 全平台质量证据（P1，待实测）

- 目标环境执行 `make check`、`make comments`、`make cover`、前端 typecheck/test/coverage/build、Harness 定向测试和 `git diff --check`。
- Playwright 需要补充登录、仪表盘、聊天、设置和 Brain Center 的桌面/移动流程；本清单只收集运行时和业务回归结果，视觉差异记录在 `ui-migration-minimal.md`。
- 真实浏览器、真实 provider、MySQL/PostgreSQL 和安装器测试要注明执行环境；本地替身测试不替代这些证据。

## 本轮明确不处理

本轮优先完成 Minimal 模板适配调用。以下项目只在本文件跟踪，不在当前 UI 切片中改变：Brain 真实 provider 联调、三方言实测、数据迁移执行、桌面签名/公证、Harness 传递依赖物理裁剪、发布标签和运行观测系统。

## 关闭规则

关闭一项时补充：负责人、变更提交、确切命令、输入/环境、原始输出、退出状态、产物路径和回滚动作。只完成代码而缺少目标环境证据的项目保持 `待实测`。

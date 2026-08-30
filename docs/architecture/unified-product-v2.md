# DH闲不下来 v2 一体化架构

## 决策

`xyu` 是唯一产品根仓库。Go 服务继续拥有账号运行时、业务数据、
自动化、消息发送、价格策略、HTTP/OpenAPI 和 WebSocket。DeepSeek Harness 是内部
`brain` 子系统，只生成结构化回复草案和决策建议。

产品对外是一个安装包，内部使用可独立监督的进程树：

```text
dh-xianyu-agentpanel-server (Go)
└── dh-xianyu-agentpanel-brain (TypeScript native carrier)
    └── dh-xianyu-agentpanel-runtime (DeepSeek Harness)
```

Go 与 brain 通过仅绑定 `127.0.0.1` 的随机端口和临时 bearer token 通信。Harness 通过
MCP 调用 Go application ports，不直连数据库、Cookie、MTOP、Chromium 或消息发送实现。

## 数据所有权

| 数据 | 唯一所有者 | Harness 使用方式 |
| --- | --- | --- |
| 账号、商品、订单、价格、规则、消息发送结果 | Go 业务库 | 通过受权 application tool 读取 |
| 价格下限、砍价轮次、发送与改价 | Go application service | 对 Harness 只暴露查询和建议契约 |
| Agent session、摘要、索引和轨迹 | `data/brain/` | 派生数据，可清空重建 |
| provider/model 设置 | Go 业务库 | 经过版本化配置传入 brain |
| provider 密钥 | Go 加密存储 | 只在子进程最小作用域内解密，不返回前端 |

## 契约和降级

`api/openapi.yaml` 仍是 `/api/v1/**` 和 `/health` 的唯一契约源。brain 的 alpha wire 只能
出现在 TypeScript gateway 内，Go 仅依赖产品自有 `BrainReplyRequest/BrainReplyResult`。

同一 session 串行，不同会话受全局并发上限保护。brain 不健康、超时、进程退出或结果
无效时，AI replier 返回无草案，继续走既有默认回复链。`/health` 只表示产品存活，
brain 状态由 `/api/v1/brain/status` 单独表达。

## 供应链

Harness 源码以 squash subtree 固定到 `product/manifest.json` 记录的 tag 和 commit。客服
profile 不加载 shell、PowerShell、editor、filesystem、subprocess、PTY、sandbox 和 coding 工具。
发布闭包由专用 deploy root 生成，CI 对最终工具目录执行 fail-closed 白名单断言。

`product/sbom.cdx.json` 是 Go module、前端 npm 和 vendored Harness pnpm workspace 的
CycloneDX 1.6 机器可读清单，`product/dependency-licenses.json` 按许可声明聚合全部组件。
两份产物记录 `product/manifest.json`、`go.mod`、`go.sum`、npm/pnpm 锁文件和上游
notices 的 SHA-256。`make supply-chain-check` 在本地 preflight 和 main CI 中阻断任何未重新
生成的依赖变更；更新依赖后需在已安装的 workspace 执行 `make supply-chain-generate`。

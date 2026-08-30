# CI 运行策略

## 目标

把长时间的发布矩阵留给发布或必要的大批量变更，把日常开发反馈集中在 Pull Request。工作流仍保留手动入口、并发取消和完整日志，代码与发布证据的门槛保持一致。

## 触发规则

| 工作流 | 日常提交 | Pull Request | 手动 dispatch | 发布标签 |
| --- | --- | --- | --- | --- |
| `main 与 Pull Request 质量门禁` | `main` 只有提交信息含 `[ci full]` 时运行；文档-only 提交按路径过滤 | 运行完整质量矩阵 | `full=true` 运行完整矩阵 | 由发布流程间接复用 |
| `构建桌面端安装包` | 手动入口 | 手动入口 | 启动全平台安装包矩阵 | `release.yml` 复用 |
| `构建并发布 Docker 镜像` | 手动入口 | 手动入口 | 启动多架构镜像矩阵 | `release.yml` 复用 |
| `同步 GitHub Wiki` | `docs/wiki/**` 变化时同步 | 触发条件为空 | 强制同步 | 发布流程无此步骤 |

质量工作流的主分支提交路径覆盖 Go、前端、OpenAPI、Brain、数据库、打包和工作流输入。其他文件由手动 dispatch 作为明确验收入口。

## 日常操作

### 合并前

Pull Request 会自动运行 Go、前端、Harness 和 MySQL/PostgreSQL 门禁。连续推送同一分支时，旧运行会由 concurrency 自动取消。

### 主分支必要大操作

完成一批代码后可在提交信息加入标记：

```text
界面：完成账号页 Minimal 适配 [ci full]
```

也可以直接手动运行完整质量矩阵：

```bash
gh workflow run ci.yml --repo DH-devmax/xyu --ref main -f full=true
```

### 桌面包和 Docker

这两条矩阵只在发布或明确需要制品时启动：

```bash
gh workflow run desktop-cd.yml --repo DH-devmax/xyu --ref main
gh workflow run docker-publish.yml --repo DH-devmax/xyu --ref main
```

需要固定版本号时追加 `-f app_version=2.0.0-alpha.1`。正式标签仍由 `release.yml` 同时调用桌面和 Docker 可复用工作流。

## 本地先行

提交前在本地完成与变更范围匹配的快速检查；准备合并或发布时运行完整入口：

```bash
npm run typecheck --prefix frontend
npm test --prefix frontend
make check
bash scripts/preflight-main.sh
```

CI 运行策略本身属于工程治理配置；修改 `.github/workflows/**`、`Makefile`、锁文件或发布脚本后，应手动 dispatch `ci.yml` 的 `full=true`，并把运行链接写入阶段验收记录。

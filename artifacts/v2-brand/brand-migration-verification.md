# DH闲不下来 v2 品牌迁移验证记录

## 变更身份

- 基线提交：`2bb0cd20a016fe9e3104f860ae0b7568bb0fb508`
- 基线含义：仓库接管与工程治理完成，品牌数据迁移尚未使用新二进制验证。
- 目标分支：`main`
- 产品身份：`DH闲不下来` / `dh-xianyu-agentpanel` / `github.com/DH-devmax/xyu`
- 服务身份：`dh-xianyu-agentpanel.service` / `DhXianyuAgentPanel` /
  `com.dhdevmax.xianyu-agentpanel`

## 四个验证角色

| 角色 | 路径 | 验证方式 |
| --- | --- | --- |
| 修改后制品 | `dist/verification/dh-xianyu-agentpanel-server` | 执行 `-version` 及真实加密数据迁移回归 |
| 可分发补丁 | `artifacts/v2-brand/brand-migration-completion-from-2bb0cd.patch` | 基线临时 worktree 中 `git apply --check` 和正向应用 |
| 验证记录 | `artifacts/v2-brand/brand-migration-verification.md` | 重新打开并检查基线、命令、输入、输出和退出码 |
| 仓库回滚 | `artifacts/v2-brand/rollback-brand-migration.sh` | `--check` 验证；`--apply` 创建普通 `git revert` 提交 |

修改后制品为本地可重建验证输出，受 `.gitignore` 的 `/dist/` 规则管理，不作为源码提交或发布包。
可分发补丁 SHA-256 为
`b3d7ec39d7204e852b2a6a6a744037e82d8a9ca443eb201874224b658d794497`；已在基线临时 worktree 执行
`git apply --check`、正向应用、关键文件断言、反向应用，最终工作树重新为干净状态。
回滚脚本 SHA-256 为
`f1c14bc8c95399e561363fd8764271a3e06986dedb027cf21a08bde743eafe95`；已在临时 worktree 实际创建聚合 revert，并以 tree 哈希复核。
补丁覆盖从工程治理基线到品牌阶段终点的产品源码与发布门禁，只排除本补丁、验证记录和
回滚脚本三个元工件，避免自引用。回滚脚本以
最近一次修改自身的提交锁定品牌阶段终点，只能从该干净 HEAD 执行，并按最新到最旧撤销
阶段全部提交；提交前通过 tree 哈希确认结果精确等于工程治理基线。

## 基线与修改后行为

### 基线

命令：

```bash
git worktree add --detach /tmp/xyu-brand-baseline 2bb0cd20a016fe9e3104f860ae0b7568bb0fb508
bash /tmp/xyu-brand-baseline/scripts/migrate-product-data.sh --help
```

字面输出：

```text
用法：migrate-product-data.sh --source DIR --destination DIR [--rollback-dir DIR] [--record FILE]
```

退出码：`0`。输入中没有新版数据验证器、旧环境文件或敏感字段解密契约。

命令：

```bash
git -C /tmp/xyu-brand-baseline grep -n -- '-verify-data' -- cmd/server/main.go
```

字面输出为空，退出码：`1`。

### 修改后

命令：

```bash
bash scripts/migrate-product-data.sh --help
```

字面输出：

```text
用法：migrate-product-data.sh --source DIR --destination DIR --validator FILE [--environment-file FILE] [--rollback-dir DIR] [--record FILE]
```

退出码：`0`。

命令：

```bash
dist/verification/dh-xianyu-agentpanel-server -version
```

字面输出：

```text
DH闲不下来 dev (commit unknown, built unknown)
```

退出码：`0`。制品 SHA-256：
`8a2c0f705b50b2ad8ad8c703d1ad0a4e6b9e5b7bf7159afc1915b94a194fa5b4`。

迁移回归输入为 SQLite v38、`system_settings.ai_api_key` 真实 AES-256-GCM 密文、
AAD `system-setting\0ai_api_key`、正确测试密钥、错误测试密钥及一个回滚后应恢复的
`settings.env`。测试值均为仓库内固定 fixture，不包含生产凭证。

命令：

```bash
MIGRATION_VALIDATOR="$PWD/dist/verification/dh-xianyu-agentpanel-server" \
  bash scripts/migrate-product-data.test.sh
```

关键字面输出：

```text
data-verification: ok
product-data-migration: 通过（哈希、解密、失败原子性、只读副本、回滚）
```

退出码：`0`。错误密钥分支在目标目录切换前返回非零；正确密钥分支记录
`database_integrity=ok`、`database_decryption=ok` 和 `legacy_readonly=true`，随后真实执行回滚脚本并恢复旧内容。

## 本地门禁

以下命令于 2026-08-30 执行，退出码均为 `0`：

| 命令 | 关键字面输出 |
| --- | --- |
| `make check` | `0 issues.`；Go 全量测试、Harness 结果插件、runtime package、allowlist、架构、OpenAPI 和中文注释通过 |
| `make cover` | `total: (statements) 70.3%` |
| `npm run typecheck --prefix frontend` | `tsc --noEmit` |
| `npm test --prefix frontend` | `Test Files 73 passed (73)`；`Tests 426 passed (426)` |
| `npm run test:coverage --prefix frontend` | Statements `77.41%`；Branches `54.84%`；Functions `66.24%`；Lines `79.73%` |
| `npm run api:check --prefix frontend` | OpenAPI 生成到 `dh-xianyu-agentpanel-openapi-*`并通过 |
| `npm run build --prefix frontend` | Vite `8.2.2`；`2983 modules transformed`；`built in 685ms` |
| `node scripts/check-packaging-manifest.mjs` | `packaging-manifest: 通过` |
| `node --test scripts/normalize-harness-runtime-closure.test.mjs` | `tests 2`；恢复缺包、解引用和缺失依赖负向分支通过 |
| 锁定 Harness 真实 `pnpm deploy` 与归一化 | `依赖 124，恢复 5，解除链接 4`；`symlinks=0`；`dsh-entry=true` |
| 全部 GitHub Actions YAML 本地解析 | `yaml-ok`；5 个 workflow 均通过 |
| Wiki 能力读取 | 远端 `has_wiki=false`；同步工作流输出 warning 并成功跳过，docs/wiki/ 保留为仓库事实来源 |
| Windows PowerShell 5.1 文件编码 | `service-control.ps1`、`migrate-data.ps1`、`migrate-data.test.ps1` 均以 UTF-8 BOM 开头；字节检查通过 |
| Docker amd64 资源门禁 | 载荷复验后释放 Harness、pnpm、npm 缓存，并由 `go clean -cache -modcache` 释放只读 Go 缓存；main 不导入或上传 GHA 缓存与 attestation，正式输入仍保留 `mode=min`、SBOM 与 provenance |
| 官方 Node 24 macOS arm64 载荷重建 | `node-v24.19.0-darwin-arm64.tar.gz: OK`；native/node manifest 与摘要复验通过 |
| 包内 Node 空 PATH 启动 | `macos-brain-empty-path: ok` |
| Windows 加密 fixture 语法与本地密钥回归 | `windows-encrypted-fixture: ok` |
| Windows 安装器迁移诊断 | `migrate-data.ps1` 接受可选 `-LogFile`；记录 `migration_start`、目录准备、源哈希、校验、切换、只读和失败异常阶段；日志写入失败不改变迁移结果 |
| `make product-data-migration-check` | `product-data-migration: 通过（哈希、解密、失败原子性、只读副本、回滚）` |
| `git diff --check` | 无输出 |

`make cover` 未设置 `RUN_BROWSER_INTEGRATION=1`。实账号、外部闲鱼平台、外部通知渠道、
MySQL/PostgreSQL 实例和真实浏览器风控仍是环境依赖例外。本阶段新增的数据验证、错误密钥、
失败原子性、前端兼容键和回滚均使用本地确定性 fixture。

## 跨平台门禁

`.github/workflows/desktop-cd.yml` 在 `main` 提交上必须完成：

- Linux amd64/arm64 分别用当前架构新服务器运行共享的真实加密迁移与回滚回归。
- macOS arm64 使用 `macos-14`，amd64 使用 `macos-15-intel`，各自在原生 runner 构建
  Go、Brain、Playwright runtime 和安装包并运行同一迁移回归；Intel 使用产品侧归一化器生成
  无链接 Node 闭包，再清空 `PATH` 直接执行包内 Node 24 与 DSH 版本探针。
- Windows 使用 Windows PowerShell 5.1、Node 24 `node:sqlite` 和 `node:crypto` 构造真实密文，
  验证错误密钥、验证器崩溃、成功切换、只读副本和真实回滚；Brain SDK ESM 探针把
  驱动器号路径转换为标准 `file://` URL。
- Windows Inno Setup 安装器将待安装的服务器作为临时验证器，完成 v1 数据升级、
  服务健康检查、安装后数据回滚和回滚后再次健康检查。
- `main` 构建在没有证书 Secret 时生成无签名安装包并完成安装/升级/回滚门禁，但不长期上传
  大体积安装产物；正式版本输入存在时，Windows/macOS 缺少任一签名 Secret 都会终止发布，
  且桌面安装包与 Docker 摘要仍作为 release artifact 上传。
- Docker 在 Brain 与 Chromium 载荷复验后释放已排除于构建上下文的 Harness 中间树，Buildx 只写入
  `mode=min` 缓存且忽略缓存配额错误；双架构镜像、SBOM、provenance、Chromium 与服务健康探针仍为必跑。

同一阶段提交的远端结果由 GitHub check suite 按提交 SHA 保存，避免在该提交内写入自引用结果。

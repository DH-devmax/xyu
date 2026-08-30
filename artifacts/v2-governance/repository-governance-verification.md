# 仓库接管与工程治理验证记录

## 基线与目标

- 基线提交：`c885ee73768584dfc88cab87b2e97b1082dbc12b`
- 基线 tree：`e167ad9313a3821f9c6d309af8f10838cb53d311`
- 目标提交：由回滚脚本按首次引入路径的提交动态解析
- 产品字段：`product/manifest.json.supply_chain`
- SBOM：`product/sbom.cdx.json`
- 许可证清单：`product/dependency-licenses.json`
- 差异文件：`artifacts/v2-governance/engineering-governance-from-c885ee.patch`
- 回滚入口：`artifacts/v2-governance/rollback-engineering-governance.sh`

## 仓库接管读回

```text
$ gh auth status
github.com active account: DH-devmax
token scopes: gist, read:org, repo, workflow
exit_status=0

$ gh repo view DH-devmax/xyu --json defaultBranchRef,isPrivate,nameWithOwner
{"defaultBranchRef":{"name":"main"},"isPrivate":true,"nameWithOwner":"DH-devmax/xyu"}
exit_status=0

$ git rev-parse HEAD
c885ee73768584dfc88cab87b2e97b1082dbc12b
$ gh api repos/DH-devmax/xyu/git/ref/heads/main --jq '.object.sha'
c885ee73768584dfc88cab87b2e97b1082dbc12b
exit_status=0

$ gh api repos/DH-devmax/xyu/git/matching-refs/tags/ --jq '.[].ref'
refs/tags/v1.0.0
refs/tags/v1.0.1
refs/tags/v1.0.2
refs/tags/v1.0.3
refs/tags/v1.0.4
refs/tags/v1.0.5
exit_status=0

$ gh workflow list --repo DH-devmax/xyu --all
main 与 Pull Request 质量门禁 active
构建桌面端安装包 active
构建并发布 Docker 镜像 active
发布正式版本 active
同步 GitHub Wiki active
exit_status=0
```

Git HTTPS 的 `github.com:443` 在本机网络中连接超时，GitHub API 和 SSH 443 正常。
`origin` 的 fetch URL 保持 HTTPS，push URL 使用目标仓库专用写入 deploy key 和 SSH 443；
密钥内容、token 和本机凭据均不进入仓库。

## 供应链输入与指纹

SBOM 记录生成器、产品 manifest、Go module、前端 npm 和 vendored Harness pnpm/notices
输入的 SHA-256。锁文件变化后，`make supply-chain-check` 会要求重新生成产物。

```text
$ git show c885ee7376:product/manifest.json | shasum -a 256
82ac26679fd31907f7f2d73e9354160524f896ba4a9f54c5a103a8999967845a  -
$ shasum -a 256 product/manifest.json
9b6530f4d7391f015b8c19809e0d79df00911680565591bc9402b3f3de402d3e  product/manifest.json
$ shasum -a 256 product/sbom.cdx.json product/dependency-licenses.json
08a07872f18b6cb361cba2641c06891afac28502dbf5d16f3a57163495c9b4cd  product/sbom.cdx.json
33d5ff42967fbd0de9ee1a97d6a606aec70d145de2e00bb0affd401858d08417  product/dependency-licenses.json
$ shasum -a 256 artifacts/v2-governance/engineering-governance-from-c885ee.patch
a2b5abeb552dbde99a899e2c954fc496c99dab056651c3755cdc4bf69ceb45c6  artifacts/v2-governance/engineering-governance-from-c885ee.patch
exit_status=0
```

## 修改后验证

```text
$ make supply-chain-check
supply-chain-check: 通过（Go 39，前端 374，Harness 1001，合计 1417）
exit_status=0

$ CycloneDX 1.6 official JSON Schema + SPDX/JSF child schemas
cyclonedx_schema_valid=true
exit_status=0

$ make check
product-manifest: 通过
supply-chain-check: 通过（Go 39，前端 374，Harness 1001，合计 1417）
brand-assets: 通过
packaging-manifest: 通过
product-data-migration: 通过
brain-tool-allowlist: 通过
architecturecheck: 通过
api-check: 通过
0 issues.
commentlint: 通过（无缺少中文注释或模板化注释）
exit_status=0

$ make preflight
preflight-main: 通过
exit_status=0

$ npm run typecheck --prefix frontend
> tsc --noEmit
exit_status=0
$ npm test --prefix frontend
Test Files  72 passed (72)
Tests  423 passed (423)
exit_status=0
$ npm run test:coverage --prefix frontend
Statements   : 77.35% (4031/5211)
Branches     : 54.83% (2211/4032)
Functions    : 66.19% (942/1423)
Lines        : 79.67% (3465/4349)
exit_status=0
$ npm run api:check --prefix frontend
openapi-typescript 7.9.1
exit_status=0
$ npm run build --prefix frontend
vite v8.2.2
2982 modules transformed
exit_status=0

$ make cover
total: (statements) 70.3%
exit_status=0

$ go test ./internal/brainruntime -count=1
ok github.com/DH-devmax/xyu/internal/brainruntime
exit_status=0
$ corepack pnpm@11.7.0 --dir brain/vendor/deepseek-harness exec vitest run packages/sdk/client
Test Files  3 passed (3)
Tests  72 passed (72)
exit_status=0
$ make brain-profile-integration
"toolNames": ["mcp__dh-xianyu__ping", "submit_reply_draft"]
"codingToolsPresent": false
"code": 0
exit_status=0

$ git diff --check
stdout/stderr=(empty)
exit_status=0
```

## CI 基线诊断

首次远端 run `33310162066` 完成了真实 checkout：前端和 MySQL/PostgreSQL 任务通过。
Go 任务的生命周期测试意外依赖未安装的 Harness workspace，Brain 任务使用了漂移的
pnpm `11.24.0`。治理提交将 Supervisor 生命周期改为无外部依赖的 Node fixture，并固定
`corepack pnpm@11.7.0`。真实 SDK/profile 启动仍在 Brain 任务中独立执行。

## 回滚

```text
$ artifacts/v2-governance/rollback-engineering-governance.sh --check
rollback-check: 通过，工作树干净且 <TARGET_COMMIT> 可回滚
exit_status=0

$ git apply --check --reverse artifacts/v2-governance/engineering-governance-from-c885ee.patch
stdout/stderr=(empty)
exit_status=0

$ <temporary-worktree>/artifacts/v2-governance/rollback-engineering-governance.sh --apply
rollback: 已创建 revert commit，目标 <TARGET_COMMIT>
expected_base_tree=e167ad9313a3821f9c6d309af8f10838cb53d311
actual_reverted_tree=e167ad9313a3821f9c6d309af8f10838cb53d311
rollback_tree_match=true
main_unchanged=true
exit_status=0
```

`--apply` 创建普通 `git revert` 提交，保留全部历史并恢复到治理基线。

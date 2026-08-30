# Brain runtime 载荷验证记录

## 修改物

- 目标提交：`6a171d08294367a2ca7cf1fa8c75d3efd2c6d483`
- 基线提交：`be1c0c3dfc480134e3a6f65007d7631062642c6a`
- 修改字段：`product/manifest.json.runtime.brain_runtime_modes`、`product/manifest.json.runtime.brain_layout`
- 修改物路径：`product/manifest.json`
- 基线 tree：`0b1b559da8ce30650c905923ddc1e82ef58ce40a`
- 修改 tree：`c5ee35010ccb5d9516aa1d353d359b707e3bfbd4`

## 基线与修改摘要

```text
$ git rev-parse be1c0c3dfc^{tree}
0b1b559da8ce30650c905923ddc1e82ef58ce40a
$ git rev-parse 6a171d0829^{tree}
c5ee35010ccb5d9516aa1d353d359b707e3bfbd4
$ git show be1c0c3dfc:product/manifest.json | shasum -a 256
9a3029ba92f82a1e5dc206d7a6257789be0a05aae4c4d2b196a14a017a8b46c4  -
$ shasum -a 256 product/manifest.json
82ac26679fd31907f7f2d73e9354160524f896ba4a9f54c5a103a8999967845a  product/manifest.json
```

以上命令退出码均为 `0`。

## 修改后验证

```text
$ make check
product-manifest: 通过
packaging-manifest: 通过
brain-tool-allowlist: 通过
architecturecheck: 通过
0 issues.
commentlint: 通过（无缺少中文注释或模板化注释）
<Go 全量测试全部 ok>
<命令退出码 0>

$ go test ./... -count=1
<全部包 ok>
<命令退出码 0>

$ npm run typecheck --prefix frontend
<命令退出码 0>
$ npm test --prefix frontend
Test Files  72 passed (72)
Tests  423 passed (423)
<命令退出码 0>

$ make cover
total: (statements) 70.3%
<命令退出码 0>

$ make cover-frontend
Statements   : 77.35% ( 4031/5211 )
<命令退出码 0>

$ node --test scripts/brain-runtime-package.test.mjs
ℹ pass 2
<命令退出码 0>

$ make brain-profile-integration
"toolNames": ["mcp__dh-xianyu__ping", "submit_reply_draft"]
"codingToolsPresent": false
"code": 0
<命令退出码 0>

$ node scripts/check-brain-runtime-package.mjs --root /tmp/dh-brain-package-arm64 --probe
"node_version": "v24.20.0"
"node_arch": "arm64"
"dsh_version": "0.1.2-alpha.1"
"hashed_files": 9
"symlinks": 0
<命令退出码 0>

$ git diff --check
<无输出>
<命令退出码 0>
```

Docker 实机构建本轮未执行：本机 Docker daemon 没有连接，`docker buildx build --call=check` 返回退出码 `1`；CI 工作流已包含同一载荷构建和检查步骤。

## 回滚验证

回滚脚本：[`artifacts/v2-alpha/rollback-brain-runtime-packaging.sh`](rollback-brain-runtime-packaging.sh)

```text
$ artifacts/v2-alpha/rollback-brain-runtime-packaging.sh --check
rollback-check: 通过，工作树干净且 6a171d08294367a2ca7cf1fa8c75d3efd2c6d483 可回滚
<命令退出码 0>

$ git apply --check --reverse artifacts/v2-alpha/brain-runtime-packaging-6a171d0829.patch
<无输出>
<命令退出码 0>
```

`--apply` 会创建普通 `git revert` 提交，保留历史并恢复到基线行为。临时 worktree 的实际输出为：

```text
rollback: 已创建 revert commit，目标 6a171d08294367a2ca7cf1fa8c75d3efd2c6d483
reverted_commit=a4ee64f5d0bafd83db02f6bc8e9f1a4c7c81378c
expected_base_tree=0b1b559da8ce30650c905923ddc1e82ef58ce40a
actual_tree=676f90bf0c72bc3c0b81abe0358fa644b3e8361e
implementation_paths_restored=0
<命令退出码 0>
```

`actual_tree` 还包含本证据提交新增的三个 artifact；`implementation_paths_restored=0` 表示 29 个实现路径均恢复到 `be1c0c3dfc` 的内容。

差异文件：[`artifacts/v2-alpha/brain-runtime-packaging-6a171d0829.patch`](brain-runtime-packaging-6a171d0829.patch)

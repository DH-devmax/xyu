# Brain Runtime 打包边界

DH 闲不下来把 Go 服务、TypeScript gateway 和 DeepSeek Harness runtime 分成三个进程。安装包只需要把 `brain/` 目录放在产品资源根，Go 通过 `-product-root` 和 `-brain-runtime-root` 传入固定路径；gateway 再从 `runtime.json` 对应的布局读取 carrier 和 SDK。

## 载荷布局

```text
brain/
  gateway/index.mjs
  profile/customer-service.patch.yml
  runtime/
    runtime.json
    node-carrier(.exe)
    dsh-runtime(.exe)                 # native 平台
    dsh-runtime-rg(.exe)              # native 平台 sidecar
    dsh-runtime-spawn-helper          # macOS native
    result-tool.mjs
    node/
      package.json
      node_modules/                    # 官方无符号链接闭包
        @deepseek-ai/dsh/
        @deepseek-ai/dsh-sdk-client/
        @deepseek-ai/dsh-sdk-protocol/
```

`scripts/build-brain-runtime.mjs` 负责组装载荷并写入关键文件 SHA-256；`scripts/check-brain-runtime-package.mjs` 会重新打开 manifest、遍历符号链接、执行 Node `--version`、执行 DSH `--version`，并导入构建版 SDK。macOS 构建还会用 `otool -L` 拒绝指向 Homebrew 或其他安装包外路径的动态库；同目标 runner 会再执行复制后的 carrier，避免源目录依赖掩盖残缺包。

## 平台策略

| 目标 | 模式 | 入口 |
| --- | --- | --- |
| Linux amd64/arm64 | `native` | 单文件 `dsh-runtime` |
| Windows amd64 | `native` | 单文件 `dsh-runtime.exe` |
| macOS arm64 | `native` | 单文件 `dsh-runtime` |
| macOS amd64 | `node` | Node 24 carrier + `@deepseek-ai/dsh/lib/bin.js` |

Intel Mac 使用 Node 模式，是因为 Harness 当前没有 macOS x64 原生目标。Node carrier 必须是官方 Node 24 分发版本；Homebrew 的动态 `node` 可能依赖机器上的 `libnode` 和 Homebrew 动态库，构建器会先执行 `--version`，检查器会在打包前实际启动它。

Intel runner 不伪造 arm64 原生目标：CI 直接用 Harness 锁定 workspace 执行 `pnpm deploy`，再由产品侧 `scripts/normalize-harness-runtime-closure.mjs` 恢复 legacy hoist、解引用 workspace 链接并删除 deploy 文档。正负 fixture 检查缺失依赖、嵌套 `node_modules`、`.bin` 与残留符号链接；因此 `sdk-native-launch.patch` 仍是唯一 Harness vendor 补丁。Windows 的 SDK 导入探针使用 `file://` URL，与 POSIX 和驱动器号路径都兼容。

## 插件裁剪

客服 profile 的工具边界由 `brain/profile/customer-service.patch.yml` 和 allowlist 检查确定，只暴露五个只读 MCP 工具及 `submit_reply_draft`。Harness 的官方闭包仍保留运行时所需的传递依赖；coding、shell、文件系统、浏览器和编辑器工具不会注册到客服 profile。物理删除传递包会破坏 Cordis 依赖图，因此作为后续体积优化，不作为当前安全边界。

## 构建示例

```bash
cd brain/vendor/deepseek-harness
corepack pnpm install --frozen-lockfile
CI=true corepack pnpm run build
CI=true corepack pnpm exec tsx scripts/build-exe-for-python-sdk.ts \
  --targets=node24-macos-arm64 --skip-build
cd ../../..
node scripts/build-brain-runtime.mjs \
  --output /tmp/dh-brain-arm64 \
  --platform darwin --arch arm64 --mode native \
  --node-binary /path/to/node-24/bin/node
node scripts/check-brain-runtime-package.mjs \
  --root /tmp/dh-brain-arm64 --probe
```

开发树没有 `brain/runtime/node` 时，Go supervisor 会回落到 Harness workspace 的 `tsx` 源码入口；发布包始终要求构建版 SDK 和 Node carrier，缺少任一项会在构建或安装检查阶段报告。

## 本地门禁

不下载上游依赖的载荷回归会用最小 fixture 覆盖 native/node 两种模式、manifest 摘要、路径边界、篡改文件和符号链接：

```bash
node --test scripts/brain-runtime-package.test.mjs
node --test scripts/normalize-harness-runtime-closure.test.mjs
make brain-check
```

Docker 构建只把已经检查的 `.docker/brain-runtime` 和 Playwright runtime 放入上下文；Harness workspace、`node_modules`、`dist-exe` 和 `.dsh-build` 均由 `.dockerignore` 排除。两个运行时载荷检查后，CI 会通过固定绝对路径边界删除不再使用的 Harness 构建树，再启动 Buildx；GHA 缓存只保留最终镜像层且配额错误不影响已构建制品，避免标准 amd64 runner 的磁盘和远端缓存峰值。

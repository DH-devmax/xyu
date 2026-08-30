# DH闲不下来常用命令入口。详见各 target 注释。

GO ?= go
GOLANGCI_LINT ?= golangci-lint

.PHONY: build build-int build-browser-install build-tray brain-check brain-profile-integration brain-runtime-build brain-runtime-check test test-server test-server-race test-multidb test-int vet lint architecture api-generate api-check product-check brand-assets-check packaging-check product-data-migration-check preflight cover cover-browser cover-frontend tidy frontend fmt comments check

## build: 编译 server（默认，跳过 integration build tag）
build:
	$(GO) build ./cmd/server

## build-browser-install: 编译独立的 Chromium 安装辅助程序
build-browser-install:
	$(GO) build ./cmd/browser-install

## build-tray: 编译 Windows/macOS 菜单栏控制器（需在目标桌面系统上编译）
build-tray:
	$(GO) build ./cmd/tray

## brain-check: 验证 Harness 客服 profile 、结果插件和发布工具白名单
brain-check:
	node --test brain/runtime/result-tool.test.mjs
	node --test scripts/brain-runtime-package.test.mjs
	node brain/profile/verify-tool-allowlist.mjs

## brain-profile-integration: 使用本地 MCP/模型 fixture 启动真实 DSH profile 并断言最终工具目录
brain-profile-integration:
	node brain/profile/verify-runtime-profile.mjs

## brain-runtime-build: 组装指定平台的 Brain 安装载荷；必须显式提供 BRAIN_RUNTIME_OUTPUT、BRAIN_PLATFORM 和 BRAIN_ARCH
brain-runtime-build:
	node scripts/build-brain-runtime.mjs --output "$${BRAIN_RUNTIME_OUTPUT:?缺少 BRAIN_RUNTIME_OUTPUT}" --platform "$${BRAIN_PLATFORM:?缺少 BRAIN_PLATFORM}" --arch "$${BRAIN_ARCH:?缺少 BRAIN_ARCH}" $${BRAIN_RUNTIME_MODE:+--mode "$$BRAIN_RUNTIME_MODE"} $${BRAIN_NODE_BINARY:+--node-binary "$$BRAIN_NODE_BINARY"} $${BRAIN_DSH_RUNTIME:+--dsh-runtime "$$BRAIN_DSH_RUNTIME"}

## brain-runtime-check: 检查已组装载荷；BRAIN_RUNTIME_ROOT 指向包含 gateway/profile/runtime 的 brain 目录
brain-runtime-check:
	node scripts/check-brain-runtime-package.mjs --root "$${BRAIN_RUNTIME_ROOT:?缺少 BRAIN_RUNTIME_ROOT}" --probe

## build-int: 带 integration tag 编译（含 browser 包，需要 Chromium 环境）
build-int:
	$(GO) build -tags integration ./...

## test: 跑全部单元测试（默认跳过 browser 集成包）
test:
	$(GO) test ./...

## test-server: 跑 HTTP server 全量单元测试
test-server:
	$(GO) test ./internal/server

## test-server-race: 跑已验证的 server 生命周期与凭证并发 race 子集
test-server-race:
	$(GO) test -race ./internal/server -run 'TestRun_|TestPublishWorkerTrackingWaitsForCompletion|TestPublishRecoveryLifecycleStopsBeforeWorkerWait|TestUpdateRunningCookieWakesCredentialBlockedAutomationWithoutManager|TestSetCookieStatusWaitsForCredentialTransition|TestDeleteCookieRechecksOwnershipInsideCredentialLock'

## test-multidb: 严格执行 SQLite、MySQL、PostgreSQL 三方言回归；缺少任一外部 URL 时明确失败
test-multidb:
	@test -n "$${TEST_MYSQL_URL:-}" || (echo '缺少 TEST_MYSQL_URL，无法执行 MySQL 实测' >&2; exit 2)
	@test -n "$${TEST_POSTGRES_URL:-}" || (echo '缺少 TEST_POSTGRES_URL，无法执行 PostgreSQL 实测' >&2; exit 2)
	REQUIRE_MULTIDB=1 $(GO) test ./internal/db -run '^TestMultiDB_' -v -count=1

## test-int: 带 integration tag 跑测试（含 browser，需 Chromium）
test-int:
	$(GO) test -tags integration ./...

## vet: go vet
vet:
	$(GO) vet ./...

## lint: golangci-lint（需先安装：brew install golangci-lint 或见 README）
lint:
	$(GOLANGCI_LINT) run ./...

## architecture: 按总计划当前阶段启用完整架构规则目录中的对应门禁
architecture:
	$(GO) run ./tools/architecturecheck

## api-generate: 从 OpenAPI 唯一契约源生成只读 TypeScript transport 类型
api-generate:
	npm run api:generate --prefix frontend

## api-check: 校验 OpenAPI 规范、版本化路由登记和生成 TypeScript 产物漂移
api-check:
	npm run api:check --prefix frontend
	$(GO) run ./tools/apicheck
	$(GO) test ./internal/server -run '^TestOpenAPIRoutesMatchRouter$$' -count=1
	$(GO) test ./internal/server -run '^TestOpenAPIOperationsHaveContractScenarios$$' -count=1
	$(GO) test ./internal/server -run '^TestOpenAPISuccessContractCoverage$$' -count=1
	$(GO) test ./internal/server -run '^(TestOpenAPIPasswordLoginDisabledOperations|TestDownloadItemPublishBatchResultExportsRows|TestChatEventDTOUsesFrontendContract|TestChatWebSocketStreamsOnlyAuthenticatedAccountEvents)$$' -count=1

## packaging-check: 校验跨平台安装器、服务和发布工作流使用统一产品身份
packaging-check:
	node scripts/check-packaging-manifest.mjs

## brand-assets-check: 校验源图哈希、派生尺寸和平台资源一致性
brand-assets-check:
	node scripts/check-brand-assets.mjs

## product-data-migration-check: 执行复制、哈希、只读和回滚验证
product-data-migration-check:
	bash scripts/migrate-product-data.test.sh

## product-check: 校验品牌、契约版本、上游组件和打包输入
product-check:
	node scripts/check-product-manifest.mjs
	$(MAKE) brand-assets-check
	$(MAKE) packaging-check
	$(MAKE) product-data-migration-check

## preflight: 在直接推送 main 前从干净工作树运行全部本地门禁
preflight:
	bash scripts/preflight-main.sh

## cover: 生成覆盖率报告
cover:
	$(GO) test -coverprofile=cover.out ./... && $(GO) tool cover -func=cover.out | tail -1

## cover-browser: 在本地 Chromium 可用时补齐浏览器页面与 CDP 集成覆盖率
cover-browser:
	RUN_BROWSER_INTEGRATION=1 $(GO) test -coverprofile=cover-browser.out ./internal/browser && $(GO) tool cover -func=cover-browser.out | tail -1

## cover-frontend: 生成前端 V8 覆盖率报告（文本、JSON 摘要和 HTML）
cover-frontend:
	npm run test:coverage --prefix frontend

## fmt: 格式化所有 Go 源码
fmt:
	$(GO) fmt ./...

## tidy: 整理 go.mod
tidy:
	$(GO) mod tidy

## frontend: 安装依赖并构建前端到 internal/webui/static/
frontend:
	cd frontend && npm ci && npm run build

## comments: 严格检查 Go 与 TypeScript/TSX 声明的中文语义注释和模板债务
comments:
	$(GO) run ./tools/commentlint -mode check -root .
	node frontend/scripts/check-comments.mjs --mode check --root frontend

## check: 本地提交前全套检查（fmt + vet + lint + test）
check: fmt product-check brain-check architecture api-check vet lint test comments

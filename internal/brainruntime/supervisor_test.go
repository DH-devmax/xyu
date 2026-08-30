package brainruntime

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	brainapp "github.com/DH-devmax/xyu/internal/application/brain"
)

// brainGatewayFixture 是 Supervisor 进程生命周期测试的最小 Node 子进程，不引入 Harness workspace 依赖。
const brainGatewayFixture = `
import { createServer } from 'node:http'

const token = String(process.env.DH_BRAIN_TOKEN ?? '')
const contractVersion = String(process.env.DH_BRAIN_CONTRACT_VERSION ?? '')
const server = createServer((request, response) => {
  response.setHeader('content-type', 'application/json')
  if (request.headers.authorization !== 'Bearer ' + token) {
    response.writeHead(401)
    response.end(JSON.stringify({ error: 'unauthorized' }))
    return
  }
  if (request.method === 'GET' && request.url === '/internal/v1/health') {
    response.end(JSON.stringify({
      contract_version: contractVersion,
      state: 'running',
      healthy: true,
      runtime_version: 'dsh-v0.1.2-alpha.1',
      active_sessions: 0,
      queue_depth: 0,
      restart_count: 0,
      last_error: '',
      updated_at: Date.now(),
    }))
    return
  }
  if (request.method === 'POST' && request.url === '/internal/v1/drain') {
    response.end(JSON.stringify({ contract_version: contractVersion, drained: true }))
    server.close(() => process.exit(0))
    return
  }
  response.writeHead(404)
  response.end(JSON.stringify({ error: 'not_found' }))
})

server.listen(0, '127.0.0.1', () => {
  const address = server.address()
  process.stdout.write(JSON.stringify({
    ready: true,
    host: '127.0.0.1',
    port: address.port,
    contract_version: contractVersion,
  }) + '\n')
})
`

// productRootForTest 从测试运行目录向上寻找已 vendor 的 Brain 产品根目录。
func productRootForTest(t *testing.T) string {
	t.Helper()
	// err、workingDirectory 保存当前步骤的中间结果。
	workingDirectory, err := os.Getwd()
	if err != nil {
		t.Fatalf("get working directory: %v", err)
	}
	// current 保存当前步骤的中间结果。
	for current := workingDirectory; ; current = filepath.Dir(current) {
		// statErr 保存当前步骤的中间结果。
		if _, statErr := os.Stat(filepath.Join(current, "brain/gateway/index.mjs")); statErr == nil {
			return current
		}
		// parent 保存当前步骤的中间结果。
		parent := filepath.Dir(current)
		if parent == current {
			break
		}
	}
	t.Fatal("product root not found")
	return ""
}

// TestSupervisorStartsHealthAndDrains 验证 Go supervisor 能启动独立 gateway fixture、读取状态并优雅排空。
func TestSupervisorStartsHealthAndDrains(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("fixture uses the POSIX Node carrier command line")
	}
	// root 是不依赖 vendored node_modules 的最小产品目录。
	root := t.TempDir()
	// gatewayPath 是测试进程的 ESM 入口。
	gatewayPath := filepath.Join(root, "brain", "gateway", "index.mjs")
	// err 保存 fixture 目录的创建结果。
	if err := os.MkdirAll(filepath.Dir(gatewayPath), 0o755); err != nil {
		t.Fatalf("mkdir gateway fixture: %v", err)
	}
	// err 保存 Node fixture 入口文件的写入结果。
	if err := os.WriteFile(gatewayPath, []byte(brainGatewayFixture), 0o600); err != nil {
		t.Fatalf("write gateway fixture: %v", err)
	}
	// dataRoot 保存当前步骤的中间结果。
	dataRoot := filepath.Join(t.TempDir(), "brain")
	// err、supervisor 保存当前步骤的中间结果。
	supervisor, err := NewSupervisor(Options{
		ProductRoot: root,
		GatewayPath: gatewayPath,
		HarnessRoot: root,
		// SDKClientEntry 仅用于选择无 tsx loader 的已构建启动路径，fixture 不会读取其内容。
		SDKClientEntry: gatewayPath,
		DataRoot:       dataRoot,
		Settings: func(context.Context) (brainapp.Settings, error) {
			return brainapp.Settings{Enabled: true, Provider: brainapp.DefaultProvider, Model: brainapp.DefaultModel,
				BaseURL: brainapp.DefaultBaseURL, ReasoningEffort: "high", TimeoutMS: 30_000, QueueTimeoutMS: 5_000, MaxConcurrency: 4}, nil
		},
		APIKey:       func(context.Context) (string, error) { return "", nil },
		StartTimeout: 20 * time.Second,
	})
	if err != nil {
		t.Fatalf("new supervisor: %v", err)
	}
	// cancel、ctx 保存当前步骤的中间结果。
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	// err 保存当前步骤的中间结果。
	if err := supervisor.Start(ctx); err != nil {
		t.Fatalf("start supervisor: %v", err)
	}
	// status 保存当前步骤的中间结果。
	status := supervisor.Status()
	if status.State != "running" || !status.Healthy || status.RuntimeVersion != "dsh-v0.1.2-alpha.1" {
		t.Fatalf("unexpected status: %+v", status)
	}
	// tools 保存当前步骤的中间结果。
	tools := supervisor.Tools()
	if len(tools) != 6 || tools[len(tools)-1].Name != "submit_reply_draft" {
		t.Fatalf("unexpected tools: %+v", tools)
	}
	// err 保存当前步骤的中间结果。
	if err := supervisor.Start(ctx); err != nil {
		t.Fatalf("idempotent start: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := supervisor.CloseContext(ctx); err != nil {
		t.Fatalf("close supervisor: %v", err)
	}
	// status 保存当前步骤的中间结果。
	if status := supervisor.Status(); status.State != "stopped" || status.Healthy {
		t.Fatalf("unexpected stopped status: %+v", status)
	}
}

// TestSupervisorDisabledDoesNotSpawn 验证全局关闭时 Start 保持 stopped 且不创建数据进程。
func TestSupervisorDisabledDoesNotSpawn(t *testing.T) {
	// root 保存当前步骤的中间结果。
	root := productRootForTest(t)
	// dataRoot 保存当前步骤的中间结果。
	dataRoot := filepath.Join(t.TempDir(), "brain")
	// err、supervisor 保存当前步骤的中间结果。
	supervisor, err := NewSupervisor(Options{ProductRoot: root, DataRoot: dataRoot, Settings: func(context.Context) (brainapp.Settings, error) {
		return brainapp.Settings{Enabled: false}, nil
	}})
	if err != nil {
		t.Fatalf("new supervisor: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := supervisor.Start(context.Background()); err != nil {
		t.Fatalf("disabled start: %v", err)
	}
	// status 保存当前步骤的中间结果。
	if status := supervisor.Status(); status.State != "stopped" || status.Healthy {
		t.Fatalf("unexpected disabled status: %+v", status)
	}
	// err 保存当前步骤的中间结果。
	if _, err := os.Stat(dataRoot); !os.IsNotExist(err) {
		t.Fatalf("disabled start should not create data root, stat err=%v", err)
	}
}

// TestNewSupervisorDerivesPackagedRuntimePaths 验证安装布局可在只提供产品根目录时自动解析全部 carrier 入口。
func TestNewSupervisorDerivesPackagedRuntimePaths(t *testing.T) {
	// root 是一个最小安装包目录，文件内容只用于路径探测，不启动真实进程。
	root := t.TempDir()
	// runtimeRoot 是安装包内 Brain runtime 的目录。
	runtimeRoot := filepath.Join(root, "brain", "runtime")
	// paths 保存用于验证自动推导逻辑的最小文件集合。
	paths := []string{
		filepath.Join(root, "brain", "gateway", "index.mjs"),
		filepath.Join(runtimeRoot, "node-carrier"),
		filepath.Join(runtimeRoot, "dsh-runtime"),
		filepath.Join(runtimeRoot, "node", "node_modules", "@deepseek-ai", "dsh", "lib", "bin.js"),
		filepath.Join(runtimeRoot, "node", "node_modules", "@deepseek-ai", "dsh-sdk-client", "lib", "index.js"),
	}
	// path 是当前待创建的 fixture 文件路径。
	for _, path := range paths {
		// err 保存创建 fixture 父目录的结果。
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatalf("mkdir %s: %v", path, err)
		}
		// err 保存写入 fixture 文件的结果。
		if err := os.WriteFile(path, []byte("fixture"), 0o755); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
	// supervisor 保存自动推导后的安装入口，设置 disabled 避免测试拉起 carrier。
	supervisor, err := NewSupervisor(Options{ProductRoot: root, Settings: func(context.Context) (brainapp.Settings, error) {
		return brainapp.Settings{Enabled: false}, nil
	}})
	if err != nil {
		t.Fatalf("new supervisor: %v", err)
	}
	if supervisor.options.RuntimeRoot != runtimeRoot || supervisor.options.NodeBinary != filepath.Join(runtimeRoot, "node-carrier") || supervisor.options.DSHRuntime != filepath.Join(runtimeRoot, "dsh-runtime") || supervisor.options.DSHEntry != filepath.Join(runtimeRoot, "node", "node_modules", "@deepseek-ai", "dsh", "lib", "bin.js") || supervisor.options.SDKClientEntry != filepath.Join(runtimeRoot, "node", "node_modules", "@deepseek-ai", "dsh-sdk-client", "lib", "index.js") {
		t.Fatalf("packaged paths not derived: %+v", supervisor.options)
	}
}

// TestNewSupervisorResolvesRelativeResourcePaths 验证相对产品资源路径以 ProductRoot 为基准解析。
func TestNewSupervisorResolvesRelativeResourcePaths(t *testing.T) {
	// root 是当前工作目录下的相对产品根；使用目录名避免依赖固定绝对路径。
	root := filepath.Join("relative-brain-root", "product")
	// supervisor 保存路径解析结果，disabled 设置避免创建 runtime 数据目录。
	supervisor, err := NewSupervisor(Options{
		ProductRoot:    root,
		GatewayPath:    "brain/gateway/index.mjs",
		HarnessRoot:    "brain/vendor/deepseek-harness",
		RuntimeRoot:    "brain/runtime",
		DataRoot:       "data/brain",
		NodeBinary:     "node",
		DSHRuntime:     "brain/runtime/dsh-runtime",
		DSHEntry:       "brain/runtime/node/bin.js",
		SDKClientEntry: "brain/runtime/node/sdk.js",
		Settings: func(context.Context) (brainapp.Settings, error) {
			return brainapp.Settings{Enabled: false}, nil
		},
	})
	if err != nil {
		t.Fatalf("new supervisor: %v", err)
	}
	// absoluteRoot 是与 NewSupervisor 相同规则计算出的预期绝对产品根。
	absoluteRoot, err := filepath.Abs(root)
	if err != nil {
		t.Fatalf("abs root: %v", err)
	}
	if supervisor.options.ProductRoot != absoluteRoot || supervisor.options.GatewayPath != filepath.Join(absoluteRoot, "brain/gateway/index.mjs") || supervisor.options.HarnessRoot != filepath.Join(absoluteRoot, "brain/vendor/deepseek-harness") || supervisor.options.RuntimeRoot != filepath.Join(absoluteRoot, "brain/runtime") || supervisor.options.DataRoot != filepath.Join(absoluteRoot, "data/brain") || supervisor.options.NodeBinary != "node" || supervisor.options.DSHRuntime != filepath.Join(absoluteRoot, "brain/runtime/dsh-runtime") || supervisor.options.DSHEntry != filepath.Join(absoluteRoot, "brain/runtime/node/bin.js") || supervisor.options.SDKClientEntry != filepath.Join(absoluteRoot, "brain/runtime/node/sdk.js") {
		t.Fatalf("relative paths not resolved: %+v", supervisor.options)
	}
}

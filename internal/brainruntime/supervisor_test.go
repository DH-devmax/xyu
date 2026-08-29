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

// TestSupervisorStartsHealthAndDrains 验证 Go supervisor 能启动真实 gateway、读取状态并优雅排空。
func TestSupervisorStartsHealthAndDrains(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("fixture uses the POSIX Node carrier command line")
	}
	// root 保存当前步骤的中间结果。
	root := productRootForTest(t)
	// dataRoot 保存当前步骤的中间结果。
	dataRoot := filepath.Join(t.TempDir(), "brain")
	// err、supervisor 保存当前步骤的中间结果。
	supervisor, err := NewSupervisor(Options{
		ProductRoot: root,
		GatewayPath: filepath.Join(root, "brain/gateway/index.mjs"),
		HarnessRoot: filepath.Join(root, "brain/vendor/deepseek-harness"),
		DataRoot:    dataRoot,
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

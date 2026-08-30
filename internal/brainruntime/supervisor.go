// Package brainruntime 管理 Go 服务与本地 Harness gateway 的进程边界。
package brainruntime

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	brainapp "github.com/DH-devmax/xyu/internal/application/brain"
)

const (
	// defaultGatewayContract 是 gateway 与 Go supervisor 的固定内部契约版本。
	defaultGatewayContract = brainapp.ContractVersion
	// defaultGatewayStartTimeout 限制 Node gateway 输出 ready 回执的时间。
	defaultGatewayStartTimeout = 15 * time.Second
	// defaultGatewayDrainTimeout 限制旧 gateway 优雅排空的时间。
	defaultGatewayDrainTimeout = 90 * time.Second
	// defaultGatewayStopTimeout 限制无法排空时的进程回收时间。
	defaultGatewayStopTimeout = 3 * time.Second
)

// SettingsProvider 在 runtime 重启前读取最新的非敏感 Brain 设置。
type SettingsProvider func(context.Context) (brainapp.Settings, error)

// APIKeyProvider 在 gateway 启动前读取已解密的短暂 API key；调用方不得记录返回值。
type APIKeyProvider func(context.Context) (string, error)

// MCPBackend 是 Go 业务真相向 Brain 只读工具提供数据的窄回调。
type MCPBackend func(context.Context, string, map[string]any) (any, error)

// Options 描述 supervisor 如何定位 Node carrier、gateway 和运行数据根目录。
type Options struct {
	// ProductRoot 是包含 brain、data 和前端资源的产品根目录。
	ProductRoot string
	// GatewayPath 是 gateway/index.mjs 的绝对或相对路径。
	GatewayPath string
	// HarnessRoot 是 vendored Harness workspace 根目录。
	HarnessRoot string
	// RuntimeRoot 是安装包内 Brain runtime 载荷根目录。
	RuntimeRoot string
	// NodeBinary 是包内 Node carrier；空值时使用 PATH 中的 node。
	NodeBinary string
	// DSHRuntime 是原生平台的单文件 Harness runtime；空值时尝试闭包入口。
	DSHRuntime string
	// DSHEntry 是 Node carrier 模式下的构建 dsh 入口。
	DSHEntry string
	// SDKClientEntry 是构建后的 SDK 客户端入口；空值时使用 vendor 源码。
	SDKClientEntry string
	// DataRoot 是 Harness 会话派生数据目录。
	DataRoot string
	// MCPBackendURL 是 Go 业务 MCP 端点地址。
	MCPBackendURL string
	// Logger 是不记录密钥的结构化日志器。
	Logger *slog.Logger
	// Settings 读取运行时最新配置。
	Settings SettingsProvider
	// APIKey 读取运行时所需的解密密钥。
	APIKey APIKeyProvider
	// HTTPClient 允许测试注入确定性 HTTP transport。
	HTTPClient *http.Client
	// MCPBackend 是可选的 Go 业务上下文回调；未提供时 gateway 保持空上下文兼容模式。
	MCPBackend MCPBackend
	// StartTimeout 覆盖 gateway 启动预算；零值采用默认值。
	StartTimeout time.Duration
}

// GatewayStatus 是 gateway 健康接口的内部响应模型。
type GatewayStatus struct {
	// ContractVersion 是 gateway 报告的契约版本。
	ContractVersion string `json:"contract_version"`
	// State 是 stopped、starting、running、degraded 或 draining。
	State string `json:"state"`
	// Healthy 表示 gateway 最近一次健康检查成功。
	Healthy bool `json:"healthy"`
	// RuntimeVersion 是 Harness 固定版本。
	RuntimeVersion string `json:"runtime_version"`
	// ActiveSessions 是当前持有并发槽位的 session 数量。
	ActiveSessions int `json:"active_sessions"`
	// QueueDepth 是等待并发槽位的请求数量。
	QueueDepth int `json:"queue_depth"`
	// RestartCount 是已完成的重启次数。
	RestartCount int `json:"restart_count"`
	// LastError 是 gateway 脱敏故障摘要。
	LastError string `json:"last_error"`
	// UpdatedAt 是状态更新时间 Unix 毫秒。
	UpdatedAt int64 `json:"updated_at"`
}

// readyMessage 是 gateway 启动时写入 stdout 的单行回执。
type readyMessage struct {
	// Ready 标识 gateway 已绑定 loopback 端口。
	Ready bool `json:"ready"`
	// Host 是 loopback 主机名。
	Host string `json:"host"`
	// Port 是随机监听端口。
	Port int `json:"port"`
	// ContractVersion 是 gateway 使用的契约版本。
	ContractVersion string `json:"contract_version"`
}

// replyEnvelope 是内部草案接口的命名响应 DTO。
type replyEnvelope struct {
	// ContractVersion 是响应契约版本。
	ContractVersion string `json:"contract_version"`
	// RequestID 是消息幂等键。
	RequestID string `json:"request_id"`
	// Status 是 reply、no_reply 或 handoff。
	Status string `json:"status"`
	// ReplyText 是买家可见草案文本。
	ReplyText string `json:"reply_text,omitempty"`
	// Intent 是结构化意图。
	Intent string `json:"intent"`
	// QuoteProposalCents 是可选的分单位报价建议。
	QuoteProposalCents *int64 `json:"quote_proposal_cents,omitempty"`
	// HandoffReason 是人工接管原因。
	HandoffReason string `json:"handoff_reason,omitempty"`
	// TraceJSON 是裁剪后的 session event 轨迹。
	TraceJSON string `json:"trace_json,omitempty"`
}

// replyWireRequest 是发送给 gateway 的命名请求 DTO。
type replyWireRequest struct {
	// ContractVersion 是固定的内部契约版本。
	ContractVersion string `json:"contract_version"`
	// RequestID 是消息幂等键。
	RequestID string `json:"request_id"`
	// SessionID 是串行执行的 session 标识。
	SessionID string `json:"session_id"`
	// UserID 是本地所有者标识。
	UserID int64 `json:"user_id"`
	// AccountID 是业务账号标识。
	AccountID string `json:"account_id"`
	// ChatID 是平台聊天标识。
	ChatID string `json:"chat_id"`
	// BuyerID 是买家平台标识。
	BuyerID string `json:"buyer_id"`
	// ItemID 是商品标识。
	ItemID string `json:"item_id"`
	// Message 是当前买家消息。
	Message string `json:"message"`
	// DeadlineAt 是迟到结果失效的 Unix 毫秒时间。
	DeadlineAt int64 `json:"deadline_at"`
}

// Supervisor 实现应用层 Brain runtime Port，并拥有 gateway 子进程的完整生命周期。
type Supervisor struct {
	// options 保存构造期不可变路径、配置回调和 HTTP 客户端。
	options Options
	// operationMu 串行化启动、重启、排空和关闭，避免两个实例交叉操作。
	operationMu sync.Mutex
	// mu 保护当前进程、地址和状态快照。
	mu sync.RWMutex
	// process 是当前 gateway 子进程；nil 表示尚未启动或已回收。
	process *exec.Cmd
	// processDone 在当前子进程 Wait 完成后关闭。
	processDone chan struct{}
	// baseURL 是当前 gateway 的 loopback HTTP 地址。
	baseURL string
	// token 是当前进程专用 bearer，永不进入状态响应。
	token string
	// status 保存最新运行状态。
	status brainapp.RuntimeStatus
	// intentionalStop 表示 Wait 退出来自 supervisor 主动排空。
	intentionalStop bool
	// stderrTail 保存最近少量 stderr 诊断，不包含请求正文或密钥。
	stderrTail string
	// mcpServer 是当前 gateway 专用的 Go 只读上下文 HTTP 服务。
	mcpServer *httptest.Server
}

// NewSupervisor 构造未启动的 Brain supervisor，并校验产品路径边界。
func NewSupervisor(options Options) (*Supervisor, error) {
	if strings.TrimSpace(options.ProductRoot) == "" {
		return nil, errors.New("brain supervisor 产品根目录不能为空")
	}
	if options.Logger == nil {
		options.Logger = slog.Default()
	}
	// rootErr 保存产品根目录绝对化失败原因，安装服务不能依赖启动时的当前目录。
	if productRoot, rootErr := filepath.Abs(options.ProductRoot); rootErr == nil {
		options.ProductRoot = productRoot
	} else {
		return nil, fmt.Errorf("解析 Brain 产品根目录失败: %w", rootErr)
	}
	// resolveProductPath 把相对资源路径解释为产品根目录下的路径，避免服务工作目录改变后失效。
	resolveProductPath := func(value string) string {
		if value == "" || filepath.IsAbs(value) {
			return value
		}
		return filepath.Join(options.ProductRoot, value)
	}
	options.GatewayPath = resolveProductPath(options.GatewayPath)
	options.HarnessRoot = resolveProductPath(options.HarnessRoot)
	options.RuntimeRoot = resolveProductPath(options.RuntimeRoot)
	options.DataRoot = resolveProductPath(options.DataRoot)
	// nodeBinaryPath 允许传入 PATH 中的 node；含路径的值则相对产品根解析。
	if options.NodeBinary != "" && (filepath.IsAbs(options.NodeBinary) || strings.ContainsAny(options.NodeBinary, `/\\`)) {
		options.NodeBinary = resolveProductPath(options.NodeBinary)
	}
	options.DSHRuntime = resolveProductPath(options.DSHRuntime)
	options.DSHEntry = resolveProductPath(options.DSHEntry)
	options.SDKClientEntry = resolveProductPath(options.SDKClientEntry)
	if options.GatewayPath == "" {
		options.GatewayPath = filepath.Join(options.ProductRoot, "brain/gateway/index.mjs")
	}
	if options.HarnessRoot == "" {
		options.HarnessRoot = filepath.Join(options.ProductRoot, "brain/vendor/deepseek-harness")
	}
	if options.RuntimeRoot == "" {
		options.RuntimeRoot = filepath.Join(options.ProductRoot, "brain/runtime")
	}
	// 安装包使用固定文件名，开发树没有这些文件时继续走 PATH 和源码模式。
	if options.NodeBinary == "" {
		options.NodeBinary = firstExistingFile(filepath.Join(options.RuntimeRoot, "node-carrier"), filepath.Join(options.RuntimeRoot, "node-carrier.exe"))
	}
	if options.DSHRuntime == "" {
		options.DSHRuntime = firstExistingFile(filepath.Join(options.RuntimeRoot, "dsh-runtime"), filepath.Join(options.RuntimeRoot, "dsh-runtime.exe"))
	}
	if options.DSHEntry == "" {
		options.DSHEntry = firstExistingFile(filepath.Join(options.RuntimeRoot, "node/node_modules/@deepseek-ai/dsh/lib/bin.js"))
	}
	if options.SDKClientEntry == "" {
		options.SDKClientEntry = firstExistingFile(filepath.Join(options.RuntimeRoot, "node/node_modules/@deepseek-ai/dsh-sdk-client/lib/index.js"))
	}
	if options.DataRoot == "" {
		options.DataRoot = filepath.Join(options.ProductRoot, "data/brain")
	}
	if options.HTTPClient == nil {
		options.HTTPClient = &http.Client{}
	}
	if options.StartTimeout <= 0 {
		options.StartTimeout = defaultGatewayStartTimeout
	}
	return &Supervisor{options: options, status: brainapp.RuntimeStatus{State: "stopped", UpdatedAt: time.Now().UnixMilli()}}, nil
}

// firstExistingFile 返回候选中的第一个普通文件，避免把目录误当作可执行入口。
func firstExistingFile(candidates ...string) string {
	// candidate 是当前尝试的候选路径。
	for _, candidate := range candidates {
		// info、err 保存当前候选路径的文件状态和检查结果。
		info, err := os.Stat(candidate)
		if err == nil && info.Mode().IsRegular() {
			return candidate
		}
	}
	return ""
}

// Start 启动 gateway、读取随机端口回执并完成健康检查；重复启动保持幂等。
func (supervisor *Supervisor) Start(ctx context.Context) error {
	if supervisor == nil {
		return errors.New("brain supervisor 未初始化")
	}
	supervisor.operationMu.Lock()
	defer supervisor.operationMu.Unlock()
	if supervisor.running(ctx) {
		return nil
	}
	// 健康探测失败时先回收旧进程，避免下一次启动与失联实例并存并继续占用业务端口。
	if supervisor.hasProcess() {
		// stopErr 是回收失联 gateway 进程时返回的错误。
		if stopErr := supervisor.stopLocked(ctx, defaultGatewayStopTimeout); stopErr != nil {
			return fmt.Errorf("回收失联 Brain gateway 失败: %w", stopErr)
		}
	}
	return supervisor.startLocked(ctx)
}

// startLocked 在 operationMu 保护下创建 gateway 子进程。
func (supervisor *Supervisor) startLocked(ctx context.Context) error {
	// settings 保存启动时最新的非敏感配置；读取失败时拒绝半初始化进程。
	settings := brainapp.Settings{Provider: brainapp.DefaultProvider, Model: brainapp.DefaultModel, BaseURL: brainapp.DefaultBaseURL,
		ReasoningEffort: "high", TimeoutMS: 30_000, QueueTimeoutMS: 5_000, MaxConcurrency: 4}
	if supervisor.options.Settings != nil {
		// settingsErr 保存当前流程所需的配置或状态。
		var settingsErr error
		settings, settingsErr = supervisor.options.Settings(ctx)
		if settingsErr != nil {
			return settingsErr
		}
	}
	if !settings.Enabled {
		supervisor.mu.Lock()
		supervisor.status = brainapp.RuntimeStatus{State: "stopped", Healthy: false, RuntimeVersion: "dsh-v0.1.2-alpha.1", UpdatedAt: time.Now().UnixMilli()}
		supervisor.mu.Unlock()
		return nil
	}
	// apiKey 保存只在子进程环境构造期间存在的解密值。
	apiKey := strings.TrimSpace(os.Getenv("DEEPSEEK_API_KEY"))
	if supervisor.options.APIKey != nil {
		// apiKeyErr 保存当前流程所需的配置或状态。
		var apiKeyErr error
		apiKey, apiKeyErr = supervisor.options.APIKey(ctx)
		if apiKeyErr != nil {
			return apiKeyErr
		}
	}
	// token 是本次 gateway 实例的高熵 bearer，不写入日志或磁盘。
	token, tokenErr := newToken()
	if tokenErr != nil {
		return tokenErr
	}
	// err 保存当前步骤的中间结果。
	if err := os.MkdirAll(supervisor.options.DataRoot, 0o700); err != nil {
		return fmt.Errorf("创建 Brain 数据目录失败: %w", err)
	}
	// mcpServer 在 gateway 子进程启动前绑定随机 loopback 端口，避免模型直接接触业务数据库。
	var mcpServer *httptest.Server
	if supervisor.options.MCPBackend != nil {
		mcpServer = newMCPBackendServer(supervisor.options.MCPBackend, token, defaultGatewayContract)
	}
	// nodeBinary 是包内 carrier 或 PATH 中 Node 的最终执行路径。
	nodeBinary := strings.TrimSpace(supervisor.options.NodeBinary)
	if nodeBinary == "" {
		// lookErr 保存当前流程所需的配置或状态。
		var lookErr error
		nodeBinary, lookErr = exec.LookPath("node")
		if lookErr != nil {
			if mcpServer != nil {
				mcpServer.Close()
			}
			return fmt.Errorf("查找 Node carrier 失败: %w", lookErr)
		}
	}
	// gatewayArgs 根据是否存在构建 SDK 选择无 loader 的安装模式或源码 tsx 模式。
	gatewayArgs := []string{supervisor.options.GatewayPath}
	// commandDir 是 gateway 子进程的工作目录。
	commandDir := supervisor.options.ProductRoot
	if supervisor.options.SDKClientEntry == "" {
		gatewayArgs = []string{"--import", "tsx/esm", supervisor.options.GatewayPath}
		commandDir = supervisor.options.HarnessRoot
	}
	// command 是 gateway 子进程命令；安装包由 Node 24 carrier 直接执行 mjs。
	command := exec.Command(nodeBinary, gatewayArgs...)
	command.Dir = commandDir
	command.Env = append(os.Environ(),
		"DH_BRAIN_TOKEN="+token,
		"DH_BRAIN_CONTRACT_VERSION="+defaultGatewayContract,
		"DH_BRAIN_RUNTIME_ROOT="+supervisor.options.RuntimeRoot,
		"DH_BRAIN_HARNESS_ROOT="+supervisor.options.HarnessRoot,
		"DH_BRAIN_NODE_BINARY="+nodeBinary,
		"DH_BRAIN_DSH_RUNTIME="+supervisor.options.DSHRuntime,
		"DH_BRAIN_DSH_ENTRY="+supervisor.options.DSHEntry,
		"DH_BRAIN_SDK_CLIENT_ENTRY="+supervisor.options.SDKClientEntry,
		"DH_BRAIN_DATA_ROOT="+supervisor.options.DataRoot,
		"DH_BRAIN_PROFILE_PATH="+filepath.Join(supervisor.options.ProductRoot, "brain/profile/customer-service.patch.yml"),
		"DH_BRAIN_PROVIDER="+settings.Provider,
		"DH_BRAIN_MODEL="+settings.Model,
		"DH_BRAIN_BASE_URL="+settings.BaseURL,
		"DH_BRAIN_REASONING_EFFORT="+settings.ReasoningEffort,
		"DH_BRAIN_TIMEOUT_MS="+formatInt(settings.TimeoutMS),
		"DH_BRAIN_QUEUE_TIMEOUT_MS="+formatInt(settings.QueueTimeoutMS),
		"DH_BRAIN_MAX_CONCURRENCY="+formatInt(settings.MaxConcurrency),
		"DH_BRAIN_MCP_BACKEND_URL="+mcpBackendURL(mcpServer, supervisor.options.MCPBackendURL),
		"DH_BRAIN_MCP_BACKEND_TOKEN="+token,
		"DEEPSEEK_BASE_URL="+settings.BaseURL,
		"DEEPSEEK_API_KEY="+apiKey,
	)
	// stdout、stdoutErr 保存 gateway ready 回执管道及打开错误。
	stdout, stdoutErr := command.StdoutPipe()
	if stdoutErr != nil {
		if mcpServer != nil {
			mcpServer.Close()
		}
		return stdoutErr
	}
	// stderr、stderrErr 保存 gateway 诊断管道及打开错误。
	stderr, stderrErr := command.StderrPipe()
	if stderrErr != nil {
		if mcpServer != nil {
			mcpServer.Close()
		}
		return stderrErr
	}
	// startErr 保存当前步骤的中间结果。
	if startErr := command.Start(); startErr != nil {
		if mcpServer != nil {
			mcpServer.Close()
		}
		return fmt.Errorf("启动 Brain gateway 失败: %w", startErr)
	}
	// lines 接收 stdout 单行，ready 回执之外的内容不进入业务状态。
	lines := make(chan string, 16)
	go scanLines(stdout, lines)
	go supervisor.captureStderr(stderr)
	// ready、readyErr 保存 gateway 端口回执及等待错误。
	ready, readyErr := waitReady(ctx, supervisor.options.StartTimeout, lines)
	if readyErr != nil {
		if mcpServer != nil {
			mcpServer.Close()
		}
		supervisor.killAndWait(command)
		return fmt.Errorf("等待 Brain gateway ready 失败: %w", readyErr)
	}
	if !ready.Ready || ready.Port <= 0 || ready.Host != "127.0.0.1" || ready.ContractVersion != defaultGatewayContract {
		if mcpServer != nil {
			mcpServer.Close()
		}
		supervisor.killAndWait(command)
		return errors.New("brain gateway ready 回执无效")
	}
	// done 是当前 gateway 子进程退出通知。
	done := make(chan struct{})
	supervisor.mu.Lock()
	supervisor.process = command
	supervisor.processDone = done
	supervisor.mcpServer = mcpServer
	supervisor.baseURL = fmt.Sprintf("http://%s:%d", ready.Host, ready.Port)
	supervisor.token = token
	supervisor.intentionalStop = false
	supervisor.status = brainapp.RuntimeStatus{State: "starting", UpdatedAt: time.Now().UnixMilli()}
	supervisor.mu.Unlock()
	go supervisor.waitProcess(command, done)
	// healthCtx 是启动健康探测的独立短上下文，避免继承已接近截止的 HTTP 请求。
	healthCtx, cancelHealth := context.WithTimeout(context.Background(), supervisor.options.StartTimeout)
	defer cancelHealth()
	// healthErr 保存当前步骤的中间结果。
	if _, healthErr := supervisor.health(healthCtx); healthErr != nil {
		// stopErr 保存健康检查失败后的回收结果。
		if stopErr := supervisor.stopLocked(context.Background(), defaultGatewayStopTimeout); stopErr != nil {
			return fmt.Errorf("brain gateway 健康检查失败: %v（回收失败: %w）", healthErr, stopErr)
		}
		return fmt.Errorf("brain gateway 健康检查失败: %w", healthErr)
	}
	supervisor.mu.Lock()
	supervisor.status.State = "running"
	supervisor.status.Healthy = true
	supervisor.status.RuntimeVersion = "dsh-v0.1.2-alpha.1"
	supervisor.status.UpdatedAt = time.Now().UnixMilli()
	supervisor.mu.Unlock()
	return nil
}

// Reply 执行一轮草案请求，超时或 gateway 错误均返回可识别错误且不发送消息。
func (supervisor *Supervisor) Reply(ctx context.Context, request brainapp.ReplyRequest) (brainapp.ReplyDraft, error) {
	// err 保存当前步骤的中间结果。
	if err := supervisor.Start(ctx); err != nil {
		return brainapp.ReplyDraft{}, err
	}
	// wireRequest 是内部 HTTP 命名请求 DTO，不包含 Cookie 或其他凭证。
	wireRequest := replyWireRequest{ContractVersion: brainapp.ContractVersion, RequestID: request.RequestID, SessionID: request.SessionID,
		UserID: request.UserID, AccountID: request.AccountID, ChatID: request.ChatID, BuyerID: request.BuyerID, ItemID: request.ItemID,
		Message: request.Message, DeadlineAt: request.DeadlineAt}
	// envelope、requestErr 保存 gateway 结构化草案和传输错误。
	envelope, requestErr := supervisor.postJSON(ctx, "/internal/v1/replies", wireRequest)
	if requestErr != nil {
		supervisor.markDegraded(requestErr)
		return brainapp.ReplyDraft{}, requestErr
	}
	// draft 是应用层草案；请求 ID 强制与当前消息一致。
	draft := brainapp.ReplyDraft{RequestID: envelope.RequestID, Status: envelope.Status, ReplyText: envelope.ReplyText,
		Intent: envelope.Intent, QuoteProposalCents: envelope.QuoteProposalCents, HandoffReason: envelope.HandoffReason, TraceJSON: envelope.TraceJSON}
	if draft.RequestID != request.RequestID {
		return brainapp.ReplyDraft{}, errors.New("brain gateway 返回了错误 request_id")
	}
	return draft, nil
}

// TestTurn 执行与 Reply 相同的隔离草案流程；调用方不应把结果直接发送。
func (supervisor *Supervisor) TestTurn(ctx context.Context, request brainapp.ReplyRequest) (brainapp.ReplyDraft, error) {
	return supervisor.Reply(ctx, request)
}

// Status 返回当前 supervisor 与 gateway 的合并状态快照。
func (supervisor *Supervisor) Status() brainapp.RuntimeStatus {
	if supervisor == nil {
		return brainapp.RuntimeStatus{State: "stopped"}
	}
	supervisor.mu.RLock()
	// status 保存当前步骤的中间结果。
	status := supervisor.status
	supervisor.mu.RUnlock()
	return status
}

// Tools 返回客服 profile 允许的固定工具目录，结果由调用方复制后再使用。
func (supervisor *Supervisor) Tools() []brainapp.Tool {
	return []brainapp.Tool{
		{Name: "get_conversation_context", Kind: "mcp_read", Description: "读取当前聊天上下文"},
		{Name: "get_item_snapshot", Kind: "mcp_read", Description: "读取商品快照"},
		{Name: "get_order_snapshot", Kind: "mcp_read", Description: "读取订单快照"},
		{Name: "get_bargain_policy", Kind: "mcp_read", Description: "读取议价策略"},
		{Name: "search_knowledge", Kind: "mcp_read", Description: "只读搜索业务知识"},
		{Name: "submit_reply_draft", Kind: "result", Description: "提交唯一回复草案"},
	}
}

// Restart 排空并关闭旧 gateway，再读取新设置启动下一实例。
func (supervisor *Supervisor) Restart(ctx context.Context) error {
	if supervisor == nil {
		return errors.New("brain supervisor 未初始化")
	}
	supervisor.operationMu.Lock()
	defer supervisor.operationMu.Unlock()
	// err 保存当前步骤的中间结果。
	if err := supervisor.stopLocked(ctx, defaultGatewayDrainTimeout); err != nil {
		return err
	}
	// err 保存当前步骤的中间结果。
	if err := supervisor.startLocked(ctx); err != nil {
		supervisor.markDegraded(err)
		return err
	}
	supervisor.mu.Lock()
	supervisor.status.RestartCount++
	supervisor.status.UpdatedAt = time.Now().UnixMilli()
	supervisor.mu.Unlock()
	return nil
}

// CloseContext 排空并回收 gateway，供生命周期协调器调用。
func (supervisor *Supervisor) CloseContext(ctx context.Context) error {
	if supervisor == nil {
		return nil
	}
	supervisor.operationMu.Lock()
	defer supervisor.operationMu.Unlock()
	return supervisor.stopLocked(ctx, defaultGatewayDrainTimeout)
}

// running 判断当前进程是否仍可用；健康探测失败时返回 false 交给启动逻辑修复。
func (supervisor *Supervisor) running(ctx context.Context) bool {
	supervisor.mu.RLock()
	// process 保存当前步骤的中间结果。
	process := supervisor.process
	supervisor.mu.RUnlock()
	if process == nil {
		return false
	}
	// err 保存当前步骤的中间结果。
	_, err := supervisor.health(ctx)
	return err == nil
}

// hasProcess 在锁内读取当前 gateway 是否仍登记为活动进程。
func (supervisor *Supervisor) hasProcess() bool {
	supervisor.mu.RLock()
	defer supervisor.mu.RUnlock()
	return supervisor.process != nil
}

// health 调用当前 gateway 健康接口并同步状态字段。
func (supervisor *Supervisor) health(ctx context.Context) (GatewayStatus, error) {
	// status 保存 gateway 返回的健康快照。
	var status GatewayStatus
	// err 保存当前步骤的中间结果。
	if err := supervisor.getJSON(ctx, "/internal/v1/health", &status); err != nil {
		return status, err
	}
	if status.ContractVersion != defaultGatewayContract {
		return status, errors.New("brain gateway contract version mismatch")
	}
	supervisor.mu.Lock()
	supervisor.status.State = status.State
	supervisor.status.Healthy = status.Healthy
	supervisor.status.RuntimeVersion = status.RuntimeVersion
	supervisor.status.ActiveSessions = status.ActiveSessions
	supervisor.status.QueueDepth = status.QueueDepth
	supervisor.status.RestartCount = status.RestartCount
	supervisor.status.LastError = status.LastError
	supervisor.status.UpdatedAt = status.UpdatedAt
	supervisor.mu.Unlock()
	return status, nil
}

// postJSON 发送带 bearer 的命名 JSON 请求，并把非 2xx 错误压缩为稳定诊断。
func (supervisor *Supervisor) postJSON(ctx context.Context, path string, body any) (replyEnvelope, error) {
	// envelope 保存草案响应；responseBody 保存非成功响应的脱敏错误文本。
	var envelope replyEnvelope
	// err、responseBody 保存当前步骤的中间结果。
	responseBody, err := supervisor.doJSON(ctx, http.MethodPost, path, body)
	if err != nil {
		return envelope, err
	}
	// err 保存当前步骤的中间结果。
	if err := json.Unmarshal(responseBody, &envelope); err != nil {
		return envelope, fmt.Errorf("解析 Brain gateway 响应失败: %w", err)
	}
	if envelope.ContractVersion != defaultGatewayContract {
		return envelope, errors.New("brain gateway response contract version mismatch")
	}
	return envelope, nil
}

// getJSON 读取带 bearer 的命名 JSON 状态响应。
func (supervisor *Supervisor) getJSON(ctx context.Context, path string, target any) error {
	// err、responseBody 保存当前步骤的中间结果。
	responseBody, err := supervisor.doJSON(ctx, http.MethodGet, path, nil)
	if err != nil {
		return err
	}
	return json.Unmarshal(responseBody, target)
}

// doJSON 执行内部 HTTP 请求并检查状态码、响应大小和 bearer 认证。
func (supervisor *Supervisor) doJSON(ctx context.Context, method, path string, body any) ([]byte, error) {
	supervisor.mu.RLock()
	// baseURL、token 保存当前步骤的中间结果。
	baseURL, token := supervisor.baseURL, supervisor.token
	// httpClient 保存当前步骤的中间结果。
	httpClient := supervisor.options.HTTPClient
	supervisor.mu.RUnlock()
	if baseURL == "" || token == "" {
		return nil, brainapp.ErrRuntimeUnavailable
	}
	// requestBody 是序列化后的请求内容；空 body 保持 GET 无负载。
	var requestBody io.Reader
	if body != nil {
		// encodeErr、encoded 保存当前步骤的中间结果。
		encoded, encodeErr := json.Marshal(body)
		if encodeErr != nil {
			return nil, encodeErr
		}
		requestBody = strings.NewReader(string(encoded))
	}
	// request、requestErr 保存当前步骤的中间结果。
	request, requestErr := http.NewRequestWithContext(ctx, method, baseURL+path, requestBody)
	if requestErr != nil {
		return nil, requestErr
	}
	request.Header.Set("Authorization", "Bearer "+token)
	request.Header.Set("Accept", "application/json")
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	// response、responseErr 保存当前步骤的中间结果。
	response, responseErr := httpClient.Do(request)
	if responseErr != nil {
		return nil, responseErr
	}
	defer response.Body.Close()
	// limitedBody 限制 gateway 异常响应进入日志或错误字符串的大小。
	limitedBody, readErr := io.ReadAll(io.LimitReader(response.Body, 256*1024))
	if readErr != nil {
		return nil, readErr
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("brain gateway HTTP %d: %s", response.StatusCode, strings.TrimSpace(string(limitedBody)))
	}
	return limitedBody, nil
}

// stopLocked 请求 gateway drain，超时后执行有界信号回收。
func (supervisor *Supervisor) stopLocked(ctx context.Context, timeout time.Duration) error {
	supervisor.mu.RLock()
	// done、process 保存当前步骤的中间结果。
	process, done := supervisor.process, supervisor.processDone
	supervisor.mu.RUnlock()
	if process == nil {
		supervisor.mu.Lock()
		supervisor.status = brainapp.RuntimeStatus{State: "stopped", UpdatedAt: time.Now().UnixMilli()}
		supervisor.mu.Unlock()
		return nil
	}
	supervisor.mu.Lock()
	supervisor.intentionalStop = true
	supervisor.status.State = "draining"
	supervisor.status.Healthy = false
	supervisor.status.UpdatedAt = time.Now().UnixMilli()
	supervisor.mu.Unlock()
	// drainCtx 是 gateway 优雅排空请求的独立预算。
	drainCtx, cancelDrain := context.WithTimeout(ctx, timeout)
	defer cancelDrain()
	_, _ = supervisor.doJSON(drainCtx, http.MethodPost, "/internal/v1/drain", nil)
	// waitCtx 是进程退出确认预算，避免 supervisor 永久等待子进程。
	waitCtx, cancelWait := context.WithTimeout(context.Background(), defaultGatewayStopTimeout)
	defer cancelWait()
	select {
	case <-done:
	case <-waitCtx.Done():
		// 监控 goroutine 已经拥有 process.Wait；这里仅发出终止信号并等待同一回执，避免并发 Wait。
		_ = process.Process.Kill()
		select {
		case <-done:
		case <-time.After(defaultGatewayStopTimeout):
		}
	}
	supervisor.mu.Lock()
	// backendServer 保存待在锁外关闭的 MCP 服务。
	backendServer := supervisor.mcpServer
	supervisor.mcpServer = nil
	supervisor.process = nil
	supervisor.processDone = nil
	supervisor.baseURL = ""
	supervisor.token = ""
	supervisor.status = brainapp.RuntimeStatus{State: "stopped", UpdatedAt: time.Now().UnixMilli()}
	supervisor.mu.Unlock()
	if backendServer != nil {
		backendServer.Close()
	}
	return nil
}

// mcpBackendURL 优先使用 supervisor 为本实例创建的随机地址。
func mcpBackendURL(server *httptest.Server, configured string) string {
	if server != nil {
		return server.URL
	}
	return strings.TrimSpace(configured)
}

// newMCPBackendServer 创建带 bearer 和契约校验的只读 Go 业务上下文服务。
func newMCPBackendServer(backend MCPBackend, token, contract string) *httptest.Server {
	// handler 校验内部调用身份和契约后转发到 Go 业务回调。
	handler := http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodPost || request.URL.Path != "/" {
			writeMCPJSON(response, http.StatusNotFound, map[string]any{"error": "not_found"})
			return
		}
		if request.Header.Get("Authorization") != "Bearer "+token {
			writeMCPJSON(response, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
			return
		}
		// payload 保存经过大小限制的 MCP 请求字段。
		var payload struct {
			ContractVersion string         `json:"contract_version"`
			Name            string         `json:"name"`
			Arguments       map[string]any `json:"arguments"`
		}
		// decoder 从请求体读取有限大小的 JSON。
		decoder := json.NewDecoder(io.LimitReader(request.Body, 128*1024))
		// decodeErr 保存请求体解析结果。
		decodeErr := decoder.Decode(&payload)
		if decodeErr != nil || payload.ContractVersion != contract || strings.TrimSpace(payload.Name) == "" {
			writeMCPJSON(response, http.StatusBadRequest, map[string]any{"error": "invalid_request"})
			return
		}
		// result、backendErr 保存业务回调结果和错误。
		result, backendErr := backend(request.Context(), payload.Name, payload.Arguments)
		if backendErr != nil {
			writeMCPJSON(response, http.StatusUnprocessableEntity, map[string]any{"error": trimDiagnostic(backendErr, "")})
			return
		}
		writeMCPJSON(response, http.StatusOK, map[string]any{"contract_version": contract, "name": payload.Name, "data": result})
	})
	return httptest.NewServer(handler)
}

// writeMCPJSON 返回不缓存的内部业务上下文响应。
func writeMCPJSON(response http.ResponseWriter, status int, value any) {
	response.Header().Set("Content-Type", "application/json; charset=utf-8")
	response.Header().Set("Cache-Control", "no-store")
	response.WriteHeader(status)
	_ = json.NewEncoder(response).Encode(value)
}

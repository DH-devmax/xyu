// Package brain 提供 Harness 客服大脑的设置、状态、会话轨迹和测试用例。
package brain

import (
	"context"
	"errors"
	"net/url"
	"regexp"
	"strings"
)

var (
	// ErrForbidden 表示普通用户尝试执行管理员专属 Brain 操作。
	ErrForbidden = errors.New("需要管理员权限")
	// ErrInvalidSettings 表示 Brain 设置字段或边界无效。
	ErrInvalidSettings = errors.New("brain 设置无效")
	// ErrSessionNotFound 表示授权范围内不存在指定 Brain 会话。
	ErrSessionNotFound = errors.New("brain 会话不存在")
	// ErrRuntimeUnavailable 表示 gateway 未启动或健康检查失败。
	ErrRuntimeUnavailable = errors.New("brain runtime 不可用")
)

const (
	// ContractVersion 是 Go 与 gateway 请求共同携带的内部契约版本。
	ContractVersion = "brain.internal.v1"
	// DefaultProvider 是新安装默认使用的 Harness provider route。
	DefaultProvider = "deepseek-official"
	// DefaultModel 是新安装默认使用的客服模型。
	DefaultModel = "deepseek-v4-flash"
	// DefaultBaseURL 是默认 DeepSeek 服务地址。
	DefaultBaseURL = "https://api.deepseek.com"
)

// providerPattern 约束 provider route 只能使用可审计的稳定标识符。
var providerPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9._-]{0,63}$`)

// Settings 是管理员可见的 Brain 全局配置，不包含 API key 明文。
type Settings struct {
	// Enabled 表示账号 AI 回复是否允许调用 Harness。
	Enabled bool
	// Provider 是 Harness 初始化使用的 provider route。
	Provider string
	// Model 是 provider route 下的模型标识。
	Model string
	// BaseURL 是模型服务 HTTP(S) 地址。
	BaseURL string
	// ReasoningEffort 是 off、low、high 或 max。
	ReasoningEffort string
	// TimeoutMS 是 Go 接受草案结果的毫秒预算。
	TimeoutMS int
	// QueueTimeoutMS 是请求等待全局并发槽位的毫秒预算。
	QueueTimeoutMS int
	// MaxConcurrency 是不同 session 可同时运行的上限。
	MaxConcurrency int
	// APIKeyConfigured 只表明密钥是否存在，不暴露其值或长度。
	APIKeyConfigured bool
}

// SettingsUpdate 是管理员保存 Brain 设置的完整命令。
type SettingsUpdate struct {
	// Settings 保存全部非敏感字段。
	Settings Settings
	// APIKeyAction 是 retain、replace 或 clear。
	APIKeyAction string
	// APIKeyValue 是 replace 时短暂存在于请求作用域的明文，禁止日志记录。
	APIKeyValue string
}

// RuntimeStatus 是 supervisor 的并发安全运行快照。
type RuntimeStatus struct {
	// State 是 stopped、starting、running、degraded 或 draining。
	State string
	// Healthy 表示最近一次内部健康检查成功。
	Healthy bool
	// RuntimeVersion 是 gateway 报告的版本，不包含路径信息。
	RuntimeVersion string
	// ActiveSessions 是当前正在运行的不同 session 数量。
	ActiveSessions int
	// QueueDepth 是等待并发槽位的请求数量。
	QueueDepth int
	// RestartCount 是当前进程生命周期内完成的重启次数。
	RestartCount int
	// LastError 是脱敏后的最近故障摘要。
	LastError string
	// UpdatedAt 是状态最近变化的 Unix 毫秒时间。
	UpdatedAt int64
}

// Tool 描述客服 profile 允许模型调用的受控工具。
type Tool struct {
	// Name 是 gateway/Harness 中的稳定工具名。
	Name string
	// Kind 是 mcp_read 或 result。
	Kind string
	// Description 是管理界面展示的简短职责说明。
	Description string
}

// Session 是 Brain Center 展示的非敏感会话摘要。
type Session struct {
	// ID 是 Harness session 标识。
	ID string
	// UserID 是本地所有者；普通用户只能看到自己的记录。
	UserID int64
	// AccountID 是业务账号标识。
	AccountID string
	// ChatID 是平台会话标识。
	ChatID string
	// ItemID 是关联商品标识。
	ItemID string
	// Status 是会话当前运行状态。
	Status string
	// Provider 是最近一轮使用的 provider route。
	Provider string
	// Model 是最近一轮使用的模型。
	Model string
	// Summary 是可重建的短摘要。
	Summary string
	// LastRequestID 是最近消息幂等键。
	LastRequestID string
	// CreatedAt 是创建 Unix 毫秒时间。
	CreatedAt int64
	// UpdatedAt 是最近变化 Unix 毫秒时间。
	UpdatedAt int64
}

// Turn 是 Brain Center 展示的单轮账本和裁剪轨迹。
type Turn struct {
	// ID 是数据库主键。
	ID int64
	// SessionID 是所属会话标识。
	SessionID string
	// RequestID 是消息幂等键。
	RequestID string
	// Status 是模型处理终态。
	Status string
	// TraceJSON 是裁剪后的 session event JSON。
	TraceJSON string
	// ResultJSON 是结构化草案 JSON。
	ResultJSON string
	// ErrorMessage 是脱敏错误摘要。
	ErrorMessage string
	// SendStatus 是 Go 侧唯一发送终态。
	SendStatus string
	// DeadlineAt 是迟到结果失效 Unix 毫秒时间。
	DeadlineAt int64
	// CreatedAt 是创建 Unix 毫秒时间。
	CreatedAt int64
	// UpdatedAt 是最近变化 Unix 毫秒时间。
	UpdatedAt int64
}

// SessionDetail 聚合一个授权会话及其最近 turn。
type SessionDetail struct {
	// Session 是会话摘要。
	Session Session
	// Turns 从新到旧排列。
	Turns []Turn
}

// ReplyRequest 是 Go 发送给 gateway 的内部草案请求。
type ReplyRequest struct {
	// ContractVersion 必须等于 ContractVersion。
	ContractVersion string
	// RequestID 是 `msg:<message_id>` 形式的幂等键。
	RequestID string
	// SessionID 是同一账号会话串行执行所使用的稳定标识。
	SessionID string
	// UserID 是本地所有者标识。
	UserID int64
	// AccountID 是业务账号标识。
	AccountID string
	// ChatID 是平台聊天会话标识。
	ChatID string
	// BuyerID 是买家平台标识。
	BuyerID string
	// ItemID 是关联商品标识。
	ItemID string
	// Message 是当前买家消息，不包含账号 Cookie。
	Message string
	// DeadlineAt 是 gateway 必须丢弃迟到结果的 Unix 毫秒时间。
	DeadlineAt int64
}

// ReplyDraft 是 Harness 结果插件返回且经 gateway 校验的草案。
type ReplyDraft struct {
	// RequestID 必须与请求完全一致。
	RequestID string
	// Status 是 reply、no_reply 或 handoff。
	Status string
	// ReplyText 是仅在 reply 状态存在的买家可见草案。
	ReplyText string
	// Intent 是 chat、bargain、support、handoff 或 other。
	Intent string
	// QuoteProposalCents 是模型建议的单件成交价，仍须 Go 价格边界校验。
	QuoteProposalCents *int64
	// HandoffReason 是人工接管原因，不包含完整上下文。
	HandoffReason string
	// TraceJSON 是 gateway 裁剪后的类型化 session event 轨迹。
	TraceJSON string
}

// TestTurnInput 是管理员测试台发送的一条无外部动作消息。
type TestTurnInput struct {
	// Request 是完整内部草案请求，测试台仍需使用隔离 session 和 request ID。
	Request ReplyRequest
}

// Repository 定义 Brain 管理用例所需的设置和会话持久化能力。
type Repository interface {
	// GetSettings 返回脱敏全局设置。
	GetSettings(context.Context) (Settings, error)
	// UpdateSettings 原子保存普通设置和敏感 key 命令。
	UpdateSettings(context.Context, SettingsUpdate) error
	// ListSessions 返回管理员全局或普通用户范围内的会话。
	ListSessions(context.Context, int64, bool, int) ([]Session, error)
	// GetSession 返回授权会话和最近 turn。
	GetSession(context.Context, int64, bool, string, int) (SessionDetail, error)
}

// Runtime 定义应用服务操作 supervisor 所需的最小能力。
type Runtime interface {
	// Status 返回无阻塞运行快照。
	Status() RuntimeStatus
	// Restart 在调用方预算内排空旧 runtime 并启动新实例。
	Restart(context.Context) error
	// TestTurn 执行无发送能力的隔离测试轮次。
	TestTurn(context.Context, ReplyRequest) (ReplyDraft, error)
	// Tools 返回当前客服 profile 的固定工具目录。
	Tools() []Tool
}

// Service 编排管理员设置、runtime 控制和用户范围会话查询。
type Service struct {
	// repository 保存设置与轨迹，不接触 HTTP。
	repository Repository
	// runtime 拥有 gateway 进程和 Harness runtime 生命周期。
	runtime Runtime
}

// NewService 构造 Brain 应用服务并保留必需 Port。
func NewService(repository Repository, runtime Runtime) (*Service, error) {
	if repository == nil || runtime == nil {
		return nil, errors.New("brain 应用服务依赖不完整")
	}
	return &Service{repository: repository, runtime: runtime}, nil
}

// Status 返回任意已认证用户可见的非敏感 runtime 状态。
func (service *Service) Status(_ context.Context, userID int64) (RuntimeStatus, error) {
	if userID <= 0 {
		return RuntimeStatus{}, ErrForbidden
	}
	return service.runtime.Status(), nil
}

// GetSettings 返回管理员可见的脱敏设置。
func (service *Service) GetSettings(ctx context.Context, userID int64, admin bool) (Settings, error) {
	if userID <= 0 || !admin {
		return Settings{}, ErrForbidden
	}
	return service.repository.GetSettings(ctx)
}

// UpdateSettings 校验并保存完整设置，成功后重启 runtime 使配置原子切换到下一实例。
func (service *Service) UpdateSettings(ctx context.Context, userID int64, admin bool, update SettingsUpdate) (Settings, error) {
	if userID <= 0 || !admin {
		return Settings{}, ErrForbidden
	}
	// validationErr 保存当前步骤的中间结果。
	if validationErr := ValidateSettingsUpdate(update); validationErr != nil {
		return Settings{}, validationErr
	}
	// persistErr 保存当前步骤的中间结果。
	if persistErr := service.repository.UpdateSettings(ctx, update); persistErr != nil {
		return Settings{}, persistErr
	}
	// restartErr 保存当前步骤的中间结果。
	if restartErr := service.runtime.Restart(ctx); restartErr != nil {
		return Settings{}, restartErr
	}
	return service.repository.GetSettings(ctx)
}

// ListSessions 返回授权范围内最近会话；管理员可观察全局，普通用户仅观察自己的账号。
func (service *Service) ListSessions(ctx context.Context, userID int64, admin bool, limit int) ([]Session, error) {
	if userID <= 0 {
		return nil, ErrForbidden
	}
	return service.repository.ListSessions(ctx, userID, admin, limit)
}

// GetSession 返回授权会话详情，仓储以不存在语义隐藏跨用户资源。
func (service *Service) GetSession(ctx context.Context, userID int64, admin bool, sessionID string, turnLimit int) (SessionDetail, error) {
	if userID <= 0 {
		return SessionDetail{}, ErrForbidden
	}
	sessionID = strings.TrimSpace(sessionID)
	if sessionID == "" {
		return SessionDetail{}, ErrSessionNotFound
	}
	return service.repository.GetSession(ctx, userID, admin, sessionID, turnLimit)
}

// Tools 返回已认证用户可审计的固定客服工具目录。
func (service *Service) Tools(_ context.Context, userID int64) ([]Tool, error) {
	if userID <= 0 {
		return nil, ErrForbidden
	}
	return service.runtime.Tools(), nil
}

// TestTurn 执行管理员测试轮次；runtime 没有消息发送或改价能力。
func (service *Service) TestTurn(ctx context.Context, userID int64, admin bool, input TestTurnInput) (ReplyDraft, error) {
	if userID <= 0 || !admin {
		return ReplyDraft{}, ErrForbidden
	}
	if input.Request.ContractVersion != ContractVersion || strings.TrimSpace(input.Request.RequestID) == "" || strings.TrimSpace(input.Request.SessionID) == "" || strings.TrimSpace(input.Request.Message) == "" {
		return ReplyDraft{}, errors.New("brain 测试请求无效")
	}
	return service.runtime.TestTurn(ctx, input.Request)
}

// Restart 允许管理员显式排空并重启 gateway/runtime。
func (service *Service) Restart(ctx context.Context, userID int64, admin bool) error {
	if userID <= 0 || !admin {
		return ErrForbidden
	}
	return service.runtime.Restart(ctx)
}

// ValidateSettingsUpdate 检查设置枚举、URL 和资源预算，禁止无界并发或超时进入 supervisor。
func ValidateSettingsUpdate(update SettingsUpdate) error {
	// settings 是待校验的非敏感字段快照。
	settings := update.Settings
	settings.Provider = strings.TrimSpace(settings.Provider)
	settings.Model = strings.TrimSpace(settings.Model)
	settings.BaseURL = strings.TrimRight(strings.TrimSpace(settings.BaseURL), "/")
	settings.ReasoningEffort = strings.TrimSpace(settings.ReasoningEffort)
	if !providerPattern.MatchString(settings.Provider) || settings.Model == "" || len(settings.Model) > 255 {
		return ErrInvalidSettings
	}
	// parsedURL、parseErr 保存模型服务地址的结构化解析结果及错误。
	parsedURL, parseErr := url.Parse(settings.BaseURL)
	if parseErr != nil || parsedURL.Host == "" || parsedURL.User != nil || parsedURL.RawQuery != "" || parsedURL.Fragment != "" || parsedURL.Scheme != "https" && parsedURL.Scheme != "http" {
		return ErrInvalidSettings
	}
	switch settings.ReasoningEffort {
	case "off", "low", "high", "max":
	default:
		return ErrInvalidSettings
	}
	if settings.TimeoutMS < 1_000 || settings.TimeoutMS > 90_000 || settings.QueueTimeoutMS < 100 || settings.QueueTimeoutMS > 30_000 || settings.MaxConcurrency < 1 || settings.MaxConcurrency > 16 {
		return ErrInvalidSettings
	}
	switch update.APIKeyAction {
	case "retain", "clear":
		if strings.TrimSpace(update.APIKeyValue) != "" {
			return ErrInvalidSettings
		}
	case "replace":
		if strings.TrimSpace(update.APIKeyValue) == "" || len(update.APIKeyValue) > 8_192 {
			return ErrInvalidSettings
		}
	default:
		return ErrInvalidSettings
	}
	return nil
}

package server

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	brainapp "xianyu-go/internal/application/brain"
	"xianyu-go/internal/auth"
)

// brainSettingsResponse 是 Brain 管理页面使用的脱敏全局设置响应 DTO。
type brainSettingsResponse struct {
	// Enabled 表示是否允许业务消息进入 Harness。
	Enabled bool `json:"enabled"`
	// Provider 是当前模型提供方标识。
	Provider string `json:"provider"`
	// Model 是当前模型名称。
	Model string `json:"model"`
	// BaseURL 是模型服务基础地址。
	BaseURL string `json:"base_url"`
	// ReasoningEffort 是推理强度枚举。
	ReasoningEffort string `json:"reasoning_effort"`
	// TimeoutMS 是单轮草案等待预算。
	TimeoutMS int `json:"timeout_ms"`
	// QueueTimeoutMS 是排队预算。
	QueueTimeoutMS int `json:"queue_timeout_ms"`
	// MaxConcurrency 是全局并发上限。
	MaxConcurrency int `json:"max_concurrency"`
	// APIKeyConfigured 只表示密钥存在，不返回密钥内容。
	APIKeyConfigured bool `json:"api_key_configured"`
}

// brainSettingsUpdateRequest 是管理员保存 Brain 设置的具名请求 DTO。
type brainSettingsUpdateRequest struct {
	// Enabled 表示是否启用 Harness 草案流程。
	Enabled bool `json:"enabled"`
	// Provider 是受控 provider route。
	Provider string `json:"provider"`
	// Model 是模型标识。
	Model string `json:"model"`
	// BaseURL 是模型服务 HTTP(S) 地址。
	BaseURL string `json:"base_url"`
	// ReasoningEffort 是 off、low、high 或 max。
	ReasoningEffort string `json:"reasoning_effort"`
	// TimeoutMS 是单轮等待毫秒数。
	TimeoutMS int `json:"timeout_ms"`
	// QueueTimeoutMS 是排队等待毫秒数。
	QueueTimeoutMS int `json:"queue_timeout_ms"`
	// MaxConcurrency 是并发 session 数量。
	MaxConcurrency int `json:"max_concurrency"`
	// APIKeyAction 是 retain、replace 或 clear。
	APIKeyAction string `json:"api_key_action"`
	// APIKeyValue 仅在 replace 时接收一次性明文。
	APIKeyValue string `json:"api_key_value,omitempty"`
}

// brainStatusResponse 是 runtime 状态页面的具名响应 DTO。
type brainStatusResponse struct {
	// State 是 runtime 生命周期状态。
	State string `json:"state"`
	// Healthy 表示最近健康检查结果。
	Healthy bool `json:"healthy"`
	// RuntimeVersion 是固定 Harness 版本。
	RuntimeVersion string `json:"runtime_version"`
	// ActiveSessions 是当前执行 session 数量。
	ActiveSessions int `json:"active_sessions"`
	// QueueDepth 是等待队列长度。
	QueueDepth int `json:"queue_depth"`
	// RestartCount 是本进程重启次数。
	RestartCount int `json:"restart_count"`
	// LastError 是脱敏故障摘要。
	LastError string `json:"last_error,omitempty"`
	// UpdatedAt 是状态更新时间 Unix 毫秒。
	UpdatedAt int64 `json:"updated_at"`
}

// brainToolResponse 是 profile 工具目录中的单个具名 DTO。
type brainToolResponse struct {
	// Name 是稳定工具名。
	Name string `json:"name"`
	// Kind 是 mcp_read 或 result。
	Kind string `json:"kind"`
	// Description 是工具职责说明。
	Description string `json:"description"`
}

// brainToolsResponse 是 profile 工具目录响应 DTO。
type brainToolsResponse struct {
	// Tools 是当前固定 allowlist。
	Tools []brainToolResponse `json:"tools"`
}

// brainSessionResponse 是会话列表和详情共用的脱敏 DTO。
type brainSessionResponse struct {
	// ID 是 Harness session 标识。
	ID string `json:"id"`
	// UserID 是本地所有者标识。
	UserID int64 `json:"user_id"`
	// AccountID 是业务账号标识。
	AccountID string `json:"account_id"`
	// ChatID 是平台聊天标识。
	ChatID string `json:"chat_id"`
	// ItemID 是商品标识。
	ItemID string `json:"item_id"`
	// Status 是会话状态。
	Status string `json:"status"`
	// Provider 是最近 provider route。
	Provider string `json:"provider"`
	// Model 是最近模型标识。
	Model string `json:"model"`
	// Summary 是短摘要。
	Summary string `json:"summary"`
	// LastRequestID 是最近消息幂等键。
	LastRequestID string `json:"last_request_id"`
	// CreatedAt 是创建时间 Unix 毫秒。
	CreatedAt int64 `json:"created_at"`
	// UpdatedAt 是更新时间 Unix 毫秒。
	UpdatedAt int64 `json:"updated_at"`
}

// brainTurnResponse 是会话详情中的单轮账本 DTO。
type brainTurnResponse struct {
	// ID 是 turn 数据库主键。
	ID int64 `json:"id"`
	// SessionID 是所属 session。
	SessionID string `json:"session_id"`
	// RequestID 是消息幂等键。
	RequestID string `json:"request_id"`
	// Status 是模型处理状态。
	Status string `json:"status"`
	// TraceJSON 是裁剪后的轨迹 JSON。
	TraceJSON string `json:"trace_json"`
	// ResultJSON 是结构化草案 JSON。
	ResultJSON string `json:"result_json"`
	// ErrorMessage 是脱敏错误摘要。
	ErrorMessage string `json:"error_message"`
	// SendStatus 是 Go 发送终态。
	SendStatus string `json:"send_status"`
	// DeadlineAt 是截止时间 Unix 毫秒。
	DeadlineAt int64 `json:"deadline_at"`
	// CreatedAt 是创建时间 Unix 毫秒。
	CreatedAt int64 `json:"created_at"`
	// UpdatedAt 是更新时间 Unix 毫秒。
	UpdatedAt int64 `json:"updated_at"`
}

// brainSessionDetailResponse 是单会话详情响应 DTO。
type brainSessionDetailResponse struct {
	// Session 是会话摘要。
	Session brainSessionResponse `json:"session"`
	// Turns 是从新到旧的 turn 轨迹。
	Turns []brainTurnResponse `json:"turns"`
}

// brainSessionsResponse 是会话列表响应 DTO。
type brainSessionsResponse struct {
	// Sessions 是授权范围内的会话摘要。
	Sessions []brainSessionResponse `json:"sessions"`
}

// brainTestTurnRequest 是管理员测试台的隔离请求 DTO。
type brainTestTurnRequest struct {
	// RequestID 是测试用幂等键。
	RequestID string `json:"request_id"`
	// SessionID 是隔离 Harness session。
	SessionID string `json:"session_id"`
	// AccountID 是可选的业务账号上下文。
	AccountID string `json:"account_id"`
	// ChatID 是可选的平台聊天上下文。
	ChatID string `json:"chat_id"`
	// BuyerID 是可选的买家上下文。
	BuyerID string `json:"buyer_id"`
	// ItemID 是可选的商品上下文。
	ItemID string `json:"item_id"`
	// Message 是测试消息。
	Message string `json:"message"`
}

// brainReplyDraftResponse 是测试台返回的结构化草案 DTO。
type brainReplyDraftResponse struct {
	// RequestID 是草案对应的请求键。
	RequestID string `json:"request_id"`
	// Status 是 reply、no_reply 或 handoff。
	Status string `json:"status"`
	// ReplyText 是买家可见草案。
	ReplyText string `json:"reply_text,omitempty"`
	// Intent 是意图分类。
	Intent string `json:"intent"`
	// QuoteProposalCents 是报价建议分值。
	QuoteProposalCents *int64 `json:"quote_proposal_cents,omitempty"`
	// HandoffReason 是人工接管原因。
	HandoffReason string `json:"handoff_reason,omitempty"`
	// TraceJSON 是裁剪后的轨迹。
	TraceJSON string `json:"trace_json,omitempty"`
}

// mountVersionedBrainRoutes 挂载 Brain Center 的 `/api/v1` 管理与观察接口。
func (s *Server) mountVersionedBrainRoutes(r chi.Router) {
	r.Group(func(r chi.Router) {
		r.Use(s.Auth.Middleware)
		r.Use(auth.RequireAuth)
		r.Get("/api/v1/brain/status", s.brainStatus)
		r.Get("/api/v1/brain/sessions", s.brainSessions)
		r.Get("/api/v1/brain/sessions/{id}", s.brainSession)
		r.Get("/api/v1/brain/tools", s.brainTools)
		r.Group(func(r chi.Router) {
			r.Use(auth.RequireAdmin)
			r.Get("/api/v1/brain/settings", s.brainSettings)
			r.Put("/api/v1/brain/settings", s.updateBrainSettings)
			r.Post("/api/v1/brain/test-turn", s.brainTestTurn)
			r.Post("/api/v1/brain/restart", s.brainRestart)
		})
	})
}

// brainStatus 返回当前用户可见的 runtime 状态。
func (s *Server) brainStatus(w http.ResponseWriter, r *http.Request) {
	// identity、ok 保存当前会话裁剪出的最小身份。
	identity, ok := brainIdentity(r)
	if !ok {
		writeErrRequest(w, r, http.StatusUnauthorized, "未授权访问")
		return
	}
	// application 保存 Brain 应用 Port；缺失表示当前安装未启用 Brain。
	application := s.brainApplication()
	if application == nil {
		writeErrRequest(w, r, http.StatusServiceUnavailable, "Brain 服务未启用")
		return
	}
	// status、err 保存应用层状态快照及错误。
	status, err := application.Status(r.Context(), identity.UserID)
	if err != nil {
		writeBrainError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, brainStatusModel(status))
}

// brainSettings 返回管理员可见的脱敏全局设置。
func (s *Server) brainSettings(w http.ResponseWriter, r *http.Request) {
	// identity、ok 保存当前会话裁剪出的最小身份。
	identity, ok := brainIdentity(r)
	if !ok {
		writeErrRequest(w, r, http.StatusUnauthorized, "未授权访问")
		return
	}
	// settings、err 保存脱敏设置及应用层错误。
	settings, err := s.brainApplication().GetSettings(r.Context(), identity.UserID, true)
	if err != nil {
		writeBrainError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, brainSettingsModel(settings))
}

// updateBrainSettings 校验并保存管理员提交的设置，API key 只按三态命令处理。
func (s *Server) updateBrainSettings(w http.ResponseWriter, r *http.Request) {
	// identity、ok 保存当前管理员身份。
	identity, ok := brainIdentity(r)
	if !ok {
		writeErrRequest(w, r, http.StatusUnauthorized, "未授权访问")
		return
	}
	// request 保存具名设置更新 DTO。
	var request brainSettingsUpdateRequest
	// err 保存当前步骤的中间结果。
	if err := decodeJSON(r, &request); err != nil {
		writeErrRequest(w, r, http.StatusBadRequest, "请求格式错误")
		return
	}
	// update 是转换后的应用设置命令，API key 明文不进入日志。
	update := brainapp.SettingsUpdate{Settings: brainapp.Settings{Enabled: request.Enabled, Provider: request.Provider, Model: request.Model,
		BaseURL: request.BaseURL, ReasoningEffort: request.ReasoningEffort, TimeoutMS: request.TimeoutMS, QueueTimeoutMS: request.QueueTimeoutMS,
		MaxConcurrency: request.MaxConcurrency}, APIKeyAction: request.APIKeyAction, APIKeyValue: request.APIKeyValue}
	// settings、err 保存保存后重新读取的脱敏设置及错误。
	settings, err := s.brainApplication().UpdateSettings(r.Context(), identity.UserID, true, update)
	if err != nil {
		writeBrainError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, brainSettingsModel(settings))
}

// brainSessions 返回当前用户授权范围内的会话摘要。
func (s *Server) brainSessions(w http.ResponseWriter, r *http.Request) {
	// identity、ok 保存当前会话身份和管理员标记。
	identity, ok := brainIdentity(r)
	if !ok {
		writeErrRequest(w, r, http.StatusUnauthorized, "未授权访问")
		return
	}
	// limit、limitErr 保存查询分页上限及解析错误。
	limit, limitErr := queryLimit(r, 50)
	if limitErr != nil {
		writeErrRequest(w, r, http.StatusBadRequest, "limit 参数无效")
		return
	}
	// sessions、err 保存授权会话列表及错误。
	sessions, err := s.brainApplication().ListSessions(r.Context(), identity.UserID, identity.Admin, limit)
	if err != nil {
		writeBrainError(w, r, err)
		return
	}
	// response 保存传输层会话列表 DTO。
	response := brainSessionsResponse{Sessions: make([]brainSessionResponse, 0, len(sessions))}
	// session 表示当前遍历项及其索引。
	for _, session := range sessions {
		response.Sessions = append(response.Sessions, brainSessionModel(session))
	}
	writeJSON(w, http.StatusOK, response)
}

// brainSession 返回单个授权会话及最近 turn 轨迹。
func (s *Server) brainSession(w http.ResponseWriter, r *http.Request) {
	// identity、ok 保存当前会话身份和管理员标记。
	identity, ok := brainIdentity(r)
	if !ok {
		writeErrRequest(w, r, http.StatusUnauthorized, "未授权访问")
		return
	}
	// limit、limitErr 保存 turn 查询上限及解析错误。
	limit, limitErr := queryLimit(r, 50)
	if limitErr != nil {
		writeErrRequest(w, r, http.StatusBadRequest, "limit 参数无效")
		return
	}
	// detail、err 保存授权会话详情及错误。
	detail, err := s.brainApplication().GetSession(r.Context(), identity.UserID, identity.Admin, chi.URLParam(r, "id"), limit)
	if err != nil {
		writeBrainError(w, r, err)
		return
	}
	// response 保存详情 DTO 及轨迹转换结果。
	response := brainSessionDetailResponse{Session: brainSessionModel(detail.Session), Turns: make([]brainTurnResponse, 0, len(detail.Turns))}
	// turn 表示当前遍历项及其索引。
	for _, turn := range detail.Turns {
		response.Turns = append(response.Turns, brainTurnModel(turn))
	}
	writeJSON(w, http.StatusOK, response)
}

// brainTools 返回客服 profile 当前 allowlist。
func (s *Server) brainTools(w http.ResponseWriter, r *http.Request) {
	// identity、ok 保存当前会话身份。
	identity, ok := brainIdentity(r)
	if !ok {
		writeErrRequest(w, r, http.StatusUnauthorized, "未授权访问")
		return
	}
	// tools、err 保存固定工具目录及应用错误。
	tools, err := s.brainApplication().Tools(r.Context(), identity.UserID)
	if err != nil {
		writeBrainError(w, r, err)
		return
	}
	// response 保存工具 DTO 列表。
	response := brainToolsResponse{Tools: make([]brainToolResponse, 0, len(tools))}
	// tool 表示当前遍历项及其索引。
	for _, tool := range tools {
		response.Tools = append(response.Tools, brainToolResponse{Name: tool.Name, Kind: tool.Kind, Description: tool.Description})
	}
	writeJSON(w, http.StatusOK, response)
}

// brainTestTurn 执行管理员隔离测试轮次，不触发平台发送或改价。
func (s *Server) brainTestTurn(w http.ResponseWriter, r *http.Request) {
	// identity、ok 保存当前管理员身份。
	identity, ok := brainIdentity(r)
	if !ok {
		writeErrRequest(w, r, http.StatusUnauthorized, "未授权访问")
		return
	}
	// request 保存具名测试请求 DTO。
	var request brainTestTurnRequest
	// err 保存当前步骤的中间结果。
	if err := decodeJSON(r, &request); err != nil {
		writeErrRequest(w, r, http.StatusBadRequest, "请求格式错误")
		return
	}
	// now 保存当前测试轮次截止时间基准。
	now := timeNowMillis()
	// input 保存转换后的隔离应用请求。
	input := brainapp.TestTurnInput{Request: brainapp.ReplyRequest{ContractVersion: brainapp.ContractVersion, RequestID: strings.TrimSpace(request.RequestID),
		SessionID: strings.TrimSpace(request.SessionID), UserID: identity.UserID, AccountID: strings.TrimSpace(request.AccountID), ChatID: strings.TrimSpace(request.ChatID),
		BuyerID: strings.TrimSpace(request.BuyerID), ItemID: strings.TrimSpace(request.ItemID), Message: strings.TrimSpace(request.Message), DeadlineAt: now + 30_000}}
	// draft、err 保存测试草案及应用错误。
	draft, err := s.brainApplication().TestTurn(r.Context(), identity.UserID, true, input)
	if err != nil {
		writeBrainError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, brainDraftModel(draft))
}

// brainRestart 允许管理员显式排空并重启 gateway。
func (s *Server) brainRestart(w http.ResponseWriter, r *http.Request) {
	// identity、ok 保存当前管理员身份。
	identity, ok := brainIdentity(r)
	if !ok {
		writeErrRequest(w, r, http.StatusUnauthorized, "未授权访问")
		return
	}
	// err 保存当前步骤的中间结果。
	if err := s.brainApplication().Restart(r.Context(), identity.UserID, true); err != nil {
		writeBrainError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, operationResponse{Success: true})
}

// brainIdentity 从认证上下文提取最小用户身份和管理员标记。
func brainIdentity(r *http.Request) (*brainIdentityView, bool) {
	// session 保存认证中间件注入的会话；只读取授权字段，不向下传递凭证。
	session := auth.SessionFromContext(r.Context())
	if session == nil || session.UserID <= 0 {
		return nil, false
	}
	return &brainIdentityView{UserID: session.UserID, Admin: session.IsAdmin}, true
}

// brainIdentityView 保存 Brain handler 使用的最小认证视图。
type brainIdentityView struct {
	// UserID 是当前用户数据库标识。
	UserID int64
	// Admin 表示当前用户是否为管理员。
	Admin bool
}

// queryLimit 解析并限制列表查询上限，避免请求放大数据库读取。
func queryLimit(r *http.Request, fallback int) (int, error) {
	// raw 保存 URL 中的 limit 文本。
	raw := strings.TrimSpace(r.URL.Query().Get("limit"))
	if raw == "" {
		return fallback, nil
	}
	// limit、err 保存十进制上限及解析错误。
	limit, err := strconv.Atoi(raw)
	if err != nil || limit < 1 || limit > 200 {
		return 0, errors.New("invalid limit")
	}
	return limit, nil
}

// writeBrainError 将应用错误映射为统一 HTTP 错误 envelope。
func writeBrainError(w http.ResponseWriter, r *http.Request, err error) {
	// status 保存当前步骤的中间结果。
	status := http.StatusInternalServerError
	// code 保存当前步骤的中间结果。
	code := "brain_error"
	// message 保存当前步骤的中间结果。
	message := "Brain 操作失败"
	switch {
	case errors.Is(err, brainapp.ErrForbidden):
		status, code, message = http.StatusForbidden, "forbidden", "需要管理员或资源所有者权限"
	case errors.Is(err, brainapp.ErrInvalidSettings):
		status, code, message = http.StatusBadRequest, "brain_invalid_settings", "Brain 设置无效"
	case errors.Is(err, brainapp.ErrSessionNotFound):
		status, code, message = http.StatusNotFound, "brain_session_not_found", "Brain 会话不存在"
	case errors.Is(err, brainapp.ErrRuntimeUnavailable):
		status, code, message = http.StatusServiceUnavailable, "brain_runtime_unavailable", "Brain runtime 不可用"
	case errors.Is(err, context.DeadlineExceeded):
		status, code, message = http.StatusGatewayTimeout, "brain_timeout", "Brain 操作超时"
	}
	writeErrCode(w, status, code, message, requestIDFromRequest(r))
}

// requestIDFromRequest 返回 chi 请求追踪标识，不生成新的业务幂等键。
func requestIDFromRequest(r *http.Request) string {
	return r.Header.Get("X-Request-ID")
}

// timeNowMillis 提供可替换的毫秒时钟，测试台不会依赖系统时区。
func timeNowMillis() int64 {
	return time.Now().UnixMilli()
}

// brainSettingsModel 转换应用设置为脱敏 transport DTO。
func brainSettingsModel(settings brainapp.Settings) brainSettingsResponse {
	return brainSettingsResponse{Enabled: settings.Enabled, Provider: settings.Provider, Model: settings.Model, BaseURL: settings.BaseURL,
		ReasoningEffort: settings.ReasoningEffort, TimeoutMS: settings.TimeoutMS, QueueTimeoutMS: settings.QueueTimeoutMS, MaxConcurrency: settings.MaxConcurrency,
		APIKeyConfigured: settings.APIKeyConfigured}
}

// brainStatusModel 转换 runtime 状态为 transport DTO。
func brainStatusModel(status brainapp.RuntimeStatus) brainStatusResponse {
	return brainStatusResponse{State: status.State, Healthy: status.Healthy, RuntimeVersion: status.RuntimeVersion, ActiveSessions: status.ActiveSessions,
		QueueDepth: status.QueueDepth, RestartCount: status.RestartCount, LastError: status.LastError, UpdatedAt: status.UpdatedAt}
}

// brainSessionModel 转换应用会话为脱敏 transport DTO。
func brainSessionModel(session brainapp.Session) brainSessionResponse {
	return brainSessionResponse{ID: session.ID, UserID: session.UserID, AccountID: session.AccountID, ChatID: session.ChatID, ItemID: session.ItemID,
		Status: session.Status, Provider: session.Provider, Model: session.Model, Summary: session.Summary, LastRequestID: session.LastRequestID,
		CreatedAt: session.CreatedAt, UpdatedAt: session.UpdatedAt}
}

// brainTurnModel 转换应用 turn 为轨迹 DTO。
func brainTurnModel(turn brainapp.Turn) brainTurnResponse {
	return brainTurnResponse{ID: turn.ID, SessionID: turn.SessionID, RequestID: turn.RequestID, Status: turn.Status, TraceJSON: turn.TraceJSON,
		ResultJSON: turn.ResultJSON, ErrorMessage: turn.ErrorMessage, SendStatus: turn.SendStatus, DeadlineAt: turn.DeadlineAt, CreatedAt: turn.CreatedAt, UpdatedAt: turn.UpdatedAt}
}

// brainDraftModel 转换草案为测试台响应 DTO。
func brainDraftModel(draft brainapp.ReplyDraft) brainReplyDraftResponse {
	return brainReplyDraftResponse{RequestID: draft.RequestID, Status: draft.Status, ReplyText: draft.ReplyText, Intent: draft.Intent,
		QuoteProposalCents: draft.QuoteProposalCents, HandoffReason: draft.HandoffReason, TraceJSON: draft.TraceJSON}
}

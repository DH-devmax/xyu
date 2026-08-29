package brain

import (
	"context"
	"errors"
	"testing"
)

// repositoryFake 是 Brain 应用服务测试使用的内存仓储替身。
type repositoryFake struct {
	// settings 是仓储读取时返回的脱敏设置。
	settings Settings
	// update 保存最近一次收到的完整更新命令。
	update SettingsUpdate
	// sessions 是会话列表预置结果。
	sessions []Session
	// detail 是会话详情预置结果。
	detail SessionDetail
	// err 控制全部仓储操作返回的错误。
	err error
	// listUserID、listAdmin、listLimit 保存会话列表查询参数。
	listUserID int64
	listAdmin  bool
	listLimit  int
	// detailUserID、detailAdmin、detailID、detailLimit 保存详情查询参数。
	detailUserID int64
	detailAdmin  bool
	detailID     string
	detailLimit  int
}

// GetSettings 返回测试预置的脱敏设置。
func (repository *repositoryFake) GetSettings(context.Context) (Settings, error) {
	return repository.settings, repository.err
}

// UpdateSettings 记录测试设置更新命令。
func (repository *repositoryFake) UpdateSettings(_ context.Context, update SettingsUpdate) error {
	repository.update = update
	return repository.err
}

// ListSessions 记录授权范围并返回测试会话。
func (repository *repositoryFake) ListSessions(_ context.Context, userID int64, admin bool, limit int) ([]Session, error) {
	repository.listUserID, repository.listAdmin, repository.listLimit = userID, admin, limit
	return repository.sessions, repository.err
}

// GetSession 记录授权范围并返回测试会话详情。
func (repository *repositoryFake) GetSession(_ context.Context, userID int64, admin bool, sessionID string, limit int) (SessionDetail, error) {
	repository.detailUserID, repository.detailAdmin, repository.detailID, repository.detailLimit = userID, admin, sessionID, limit
	return repository.detail, repository.err
}

// runtimeFake 是 Brain 应用服务测试使用的 supervisor 替身。
type runtimeFake struct {
	// status 是状态接口返回的运行快照。
	status RuntimeStatus
	// draft 是测试轮次返回的草案。
	draft ReplyDraft
	// tools 是客服 profile 的固定工具目录。
	tools []Tool
	// restartErr、turnErr 控制运行时操作错误。
	restartErr error
	turnErr    error
	// restartCalls 记录重启调用次数。
	restartCalls int
	// request 保存最近一次测试轮次请求。
	request ReplyRequest
}

// Status 返回测试预置的运行快照。
func (runtime *runtimeFake) Status() RuntimeStatus {
	return runtime.status
}

// Restart 记录显式或设置切换触发的重启。
func (runtime *runtimeFake) Restart(context.Context) error {
	runtime.restartCalls++
	return runtime.restartErr
}

// TestTurn 记录无外部动作的隔离测试请求。
func (runtime *runtimeFake) TestTurn(_ context.Context, request ReplyRequest) (ReplyDraft, error) {
	runtime.request = request
	return runtime.draft, runtime.turnErr
}

// Tools 返回固定客服工具目录。
func (runtime *runtimeFake) Tools() []Tool {
	return runtime.tools
}

// validSettingsUpdate 返回覆盖默认边界的合法设置命令。
func validSettingsUpdate() SettingsUpdate {
	return SettingsUpdate{Settings: Settings{Enabled: true, Provider: DefaultProvider, Model: DefaultModel, BaseURL: DefaultBaseURL,
		ReasoningEffort: "high", TimeoutMS: 30_000, QueueTimeoutMS: 5_000, MaxConcurrency: 4}, APIKeyAction: "retain"}
}

// TestServiceAdminSettings 验证设置只允许管理员访问，保存后触发一次 runtime 原子重启。
func TestServiceAdminSettings(t *testing.T) {
	// repository、runtime 是本场景的可观察依赖。
	repository := &repositoryFake{settings: validSettingsUpdate().Settings}
	// runtime 保存当前步骤的中间结果。
	runtime := &runtimeFake{}
	// service、err 保存应用服务构造结果。
	service, err := NewService(repository, runtime)
	if err != nil {
		t.Fatalf("构造 Brain 服务失败: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if _, err := service.GetSettings(context.Background(), 7, false); !errors.Is(err, ErrForbidden) {
		t.Fatalf("普通用户读取设置未被阻止: %v", err)
	}
	// update 是管理员保存的完整设置命令。
	update := validSettingsUpdate()
	update.APIKeyAction = "replace"
	update.APIKeyValue = "fixture-secret"
	// settings、updateErr 保存更新后的脱敏设置及错误。
	settings, updateErr := service.UpdateSettings(context.Background(), 1, true, update)
	if updateErr != nil || runtime.restartCalls != 1 || repository.update.APIKeyValue != "fixture-secret" || !settings.Enabled {
		t.Fatalf("设置更新未完整执行: settings=%+v restart=%d update=%+v err=%v", settings, runtime.restartCalls, repository.update, updateErr)
	}
}

// TestServiceSettingsFailures 验证无效设置不会持久化，runtime 重启错误会返回管理员。
func TestServiceSettingsFailures(t *testing.T) {
	// repository、runtime 保存当前失败场景依赖。
	repository := &repositoryFake{settings: validSettingsUpdate().Settings}
	// runtime 保存当前步骤的中间结果。
	runtime := &runtimeFake{}
	// service 是待测试的 Brain 应用服务。
	service, _ := NewService(repository, runtime)
	// invalid 是带内嵌凭证 URL 的非法设置。
	invalid := validSettingsUpdate()
	invalid.Settings.BaseURL = "https://user:secret@example.test"
	// err 保存当前步骤的中间结果。
	if _, err := service.UpdateSettings(context.Background(), 1, true, invalid); !errors.Is(err, ErrInvalidSettings) || runtime.restartCalls != 0 {
		t.Fatalf("无效设置仍触发运行时: err=%v restart=%d", err, runtime.restartCalls)
	}
	// expected 是 runtime 重启失败的可识别错误。
	expected := errors.New("runtime restart failed")
	runtime.restartErr = expected
	// err 保存当前步骤的中间结果。
	if _, err := service.UpdateSettings(context.Background(), 1, true, validSettingsUpdate()); !errors.Is(err, expected) {
		t.Fatalf("重启错误未透传: %v", err)
	}
}

// TestServiceSessionScopeAndRuntime 验证会话范围、工具状态和测试台均保留调用者权限语义。
func TestServiceSessionScopeAndRuntime(t *testing.T) {
	// repository 预置一条用户会话和详情。
	repository := &repositoryFake{sessions: []Session{{ID: "session-1", UserID: 7}}, detail: SessionDetail{Session: Session{ID: "session-1", UserID: 7}}}
	// runtime 预置状态、工具和草案。
	runtime := &runtimeFake{status: RuntimeStatus{State: "running", Healthy: true}, tools: []Tool{{Name: "search_knowledge", Kind: "mcp_read"}}, draft: ReplyDraft{RequestID: "test:1", Status: "reply", ReplyText: "测试草案"}}
	// service 是待测试的 Brain 应用服务。
	service, _ := NewService(repository, runtime)
	// sessions、listErr 保存普通用户列表查询结果。
	sessions, listErr := service.ListSessions(context.Background(), 7, false, 25)
	if listErr != nil || len(sessions) != 1 || repository.listUserID != 7 || repository.listAdmin || repository.listLimit != 25 {
		t.Fatalf("用户会话范围错误: sessions=%+v repo=%+v err=%v", sessions, repository, listErr)
	}
	// detail、detailErr 保存管理员详情读取结果。
	detail, detailErr := service.GetSession(context.Background(), 1, true, " session-1 ", 10)
	if detailErr != nil || detail.Session.ID != "session-1" || repository.detailID != "session-1" || !repository.detailAdmin {
		t.Fatalf("会话详情参数错误: detail=%+v repo=%+v err=%v", detail, repository, detailErr)
	}
	// status、statusErr 保存已认证用户可见状态。
	status, statusErr := service.Status(context.Background(), 7)
	if statusErr != nil || !status.Healthy {
		t.Fatalf("运行状态错误: status=%+v err=%v", status, statusErr)
	}
	// tools、toolsErr 保存固定 profile 工具目录。
	tools, toolsErr := service.Tools(context.Background(), 7)
	if toolsErr != nil || len(tools) != 1 || tools[0].Name != "search_knowledge" {
		t.Fatalf("工具目录错误: tools=%+v err=%v", tools, toolsErr)
	}
	// request 是管理员测试台的隔离请求。
	request := ReplyRequest{ContractVersion: ContractVersion, RequestID: "test:1", SessionID: "test-session", Message: "你好"}
	// draft、turnErr 保存 runtime 测试结果。
	draft, turnErr := service.TestTurn(context.Background(), 1, true, TestTurnInput{Request: request})
	if turnErr != nil || draft.ReplyText != "测试草案" || runtime.request.SessionID != "test-session" {
		t.Fatalf("测试轮次错误: draft=%+v request=%+v err=%v", draft, runtime.request, turnErr)
	}
	// err 保存当前步骤的中间结果。
	if _, err := service.TestTurn(context.Background(), 7, false, TestTurnInput{Request: request}); !errors.Is(err, ErrForbidden) {
		t.Fatalf("普通用户测试台未被阻止: %v", err)
	}
}

// TestValidateSettingsUpdate 验证 provider、URL、推理强度、资源预算和密钥命令边界。
func TestValidateSettingsUpdate(t *testing.T) {
	// cases 保存每个应被拒绝的设置变体。
	cases := []struct {
		// name 是子测试名称。
		name string
		// mutate 修改一项合法设置以构造边界错误。
		mutate func(*SettingsUpdate)
	}{
		{name: "provider", mutate: func(update *SettingsUpdate) { update.Settings.Provider = "Invalid Provider" }},
		{name: "url query", mutate: func(update *SettingsUpdate) { update.Settings.BaseURL = "https://example.test?v=1" }},
		{name: "effort", mutate: func(update *SettingsUpdate) { update.Settings.ReasoningEffort = "medium" }},
		{name: "timeout", mutate: func(update *SettingsUpdate) { update.Settings.TimeoutMS = 999 }},
		{name: "queue", mutate: func(update *SettingsUpdate) { update.Settings.QueueTimeoutMS = 30_001 }},
		{name: "concurrency", mutate: func(update *SettingsUpdate) { update.Settings.MaxConcurrency = 17 }},
		{name: "key action", mutate: func(update *SettingsUpdate) { update.APIKeyAction = "unknown" }},
		{name: "empty replacement", mutate: func(update *SettingsUpdate) { update.APIKeyAction = "replace" }},
		{name: "retain with value", mutate: func(update *SettingsUpdate) { update.APIKeyValue = "unexpected" }},
	}
	// testCase 表示当前遍历项及其索引。
	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			// update 是当前子测试修改的独立设置副本。
			update := validSettingsUpdate()
			testCase.mutate(&update)
			// err 保存当前步骤的中间结果。
			if err := ValidateSettingsUpdate(update); !errors.Is(err, ErrInvalidSettings) {
				t.Fatalf("无效设置未被拒绝: update=%+v err=%v", update, err)
			}
		})
	}
}

// TestNewServiceRejectsMissingDependencies 验证启动期禁止半初始化 Brain 服务。
func TestNewServiceRejectsMissingDependencies(t *testing.T) {
	// err 保存当前步骤的中间结果。
	if _, err := NewService(nil, &runtimeFake{}); err == nil {
		t.Fatal("缺失仓储时构造应失败")
	}
	// err 保存当前步骤的中间结果。
	if _, err := NewService(&repositoryFake{}, nil); err == nil {
		t.Fatal("缺失 runtime 时构造应失败")
	}
}

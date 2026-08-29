package adapter

import (
	"context"
	"database/sql"
	"errors"
	"strconv"
	"strings"

	brainapp "github.com/DH-devmax/xyu/internal/application/brain"
	"github.com/DH-devmax/xyu/internal/db"
)

// BrainRepository 将数据库 Brain 仓储转换为应用层所需的脱敏 Port。
type BrainRepository struct {
	// store 是组合根拥有的数据库聚合入口，适配器之外不暴露 SQL 连接。
	store *db.Store
}

// NewBrainRepository 构造 Brain 设置和会话轨迹适配器。
func NewBrainRepository(store *db.Store) *BrainRepository {
	return &BrainRepository{store: store}
}

// GetSettings 读取全局 Brain 设置并把密钥压缩为 configured 标记。
func (repository *BrainRepository) GetSettings(ctx context.Context) (brainapp.Settings, error) {
	// err 保存当前步骤的中间结果。
	if err := repository.validate(); err != nil {
		return brainapp.Settings{}, err
	}
	// read 是读取普通设置的局部函数，所有值均来自受控的系统设置仓储。
	read := func(key string) (string, error) {
		return repository.store.Settings.Get(ctx, key)
	}
	// enabled、provider、model、baseURL、effort、timeout、queueTimeout、concurrency 保存普通设置。
	enabled, err := read("brain_enabled")
	if err != nil {
		return brainapp.Settings{}, err
	}
	// err、provider 保存当前步骤的中间结果。
	provider, err := read("brain_provider")
	if err != nil {
		return brainapp.Settings{}, err
	}
	// err、model 保存当前步骤的中间结果。
	model, err := read("brain_model")
	if err != nil {
		return brainapp.Settings{}, err
	}
	// baseURL、err 保存当前步骤的中间结果。
	baseURL, err := read("brain_base_url")
	if err != nil {
		return brainapp.Settings{}, err
	}
	// effort、err 保存当前步骤的中间结果。
	effort, err := read("brain_reasoning_effort")
	if err != nil {
		return brainapp.Settings{}, err
	}
	// err、timeout 保存当前步骤的中间结果。
	timeout, err := read("brain_timeout_ms")
	if err != nil {
		return brainapp.Settings{}, err
	}
	// err、queueTimeout 保存当前步骤的中间结果。
	queueTimeout, err := read("brain_queue_timeout_ms")
	if err != nil {
		return brainapp.Settings{}, err
	}
	// concurrency、err 保存当前步骤的中间结果。
	concurrency, err := read("brain_max_concurrency")
	if err != nil {
		return brainapp.Settings{}, err
	}
	// apiKey 是一次性读取的解密值；只保留是否为空，绝不返回或记录明文。
	apiKey, err := read("brain_api_key")
	if err != nil {
		return brainapp.Settings{}, err
	}
	return brainapp.Settings{
		Enabled:          strings.EqualFold(strings.TrimSpace(enabled), "true"),
		Provider:         provider,
		Model:            model,
		BaseURL:          baseURL,
		ReasoningEffort:  effort,
		TimeoutMS:        parseSettingInt(timeout, 30_000),
		QueueTimeoutMS:   parseSettingInt(queueTimeout, 5_000),
		MaxConcurrency:   parseSettingInt(concurrency, 4),
		APIKeyConfigured: strings.TrimSpace(apiKey) != "",
	}, nil
}

// UpdateSettings 将管理员命令写入普通设置和加密密钥事务。
func (repository *BrainRepository) UpdateSettings(ctx context.Context, update brainapp.SettingsUpdate) error {
	// err 保存当前步骤的中间结果。
	if err := repository.validate(); err != nil {
		return err
	}
	// settings 是已由应用层校验过的普通字段快照。
	settings := update.Settings
	// values 保存不含秘密的普通设置更新。
	values := map[string]string{
		"brain_enabled":          boolSetting(settings.Enabled),
		"brain_provider":         strings.TrimSpace(settings.Provider),
		"brain_model":            strings.TrimSpace(settings.Model),
		"brain_base_url":         strings.TrimRight(strings.TrimSpace(settings.BaseURL), "/"),
		"brain_reasoning_effort": strings.TrimSpace(settings.ReasoningEffort),
		"brain_timeout_ms":       formatSettingInt(settings.TimeoutMS),
		"brain_queue_timeout_ms": formatSettingInt(settings.QueueTimeoutMS),
		"brain_max_concurrency":  formatSettingInt(settings.MaxConcurrency),
	}
	// secrets 保存显式三态密钥命令，明文只在数据库加密函数调用链中短暂存在。
	secrets := map[string]db.SensitiveSettingChange{"brain_api_key": {
		Action: update.APIKeyAction,
		Value:  update.APIKeyValue,
	}}
	return repository.store.Settings.ApplyChanges(ctx, values, secrets)
}

// ReadAPIKey 读取 gateway 启动所需的已解密密钥；调用方必须把值限制在子进程环境构造期间。
func (repository *BrainRepository) ReadAPIKey(ctx context.Context) (string, error) {
	// err 保存当前步骤的中间结果。
	if err := repository.validate(); err != nil {
		return "", err
	}
	return repository.store.Settings.Get(ctx, "brain_api_key")
}

// ListSessions 返回数据库会话摘要并转换为应用模型。
func (repository *BrainRepository) ListSessions(ctx context.Context, userID int64, admin bool, limit int) ([]brainapp.Session, error) {
	// err 保存当前步骤的中间结果。
	if err := repository.validate(); err != nil {
		return nil, err
	}
	// records、err 保存数据库会话摘要及读取错误。
	records, err := repository.store.Brain.ListSessions(ctx, userID, admin, limit)
	if err != nil {
		return nil, err
	}
	// sessions 保存脱敏后的应用会话列表。
	sessions := make([]brainapp.Session, 0, len(records))
	// record 表示当前遍历项及其索引。
	for _, record := range records {
		sessions = append(sessions, sessionModel(record))
	}
	return sessions, nil
}

// GetSession 返回授权会话详情及其最近 turn。
func (repository *BrainRepository) GetSession(ctx context.Context, userID int64, admin bool, sessionID string, limit int) (brainapp.SessionDetail, error) {
	// err 保存当前步骤的中间结果。
	if err := repository.validate(); err != nil {
		return brainapp.SessionDetail{}, err
	}
	// session、turns、err 保存数据库聚合结果及查询错误。
	session, turns, err := repository.store.Brain.GetSession(ctx, userID, admin, sessionID, limit)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return brainapp.SessionDetail{}, brainapp.ErrSessionNotFound
		}
		return brainapp.SessionDetail{}, err
	}
	// result 保存转换后的会话详情。
	result := brainapp.SessionDetail{Session: sessionModel(session), Turns: make([]brainapp.Turn, 0, len(turns))}
	// turn 表示当前遍历项及其索引。
	for _, turn := range turns {
		result.Turns = append(result.Turns, turnModel(turn))
	}
	return result, nil
}

// validate 检查适配器、系统设置和 Brain 数据仓储是否已经装配。
func (repository *BrainRepository) validate() error {
	if repository == nil || repository.store == nil || repository.store.Settings == nil || repository.store.Brain == nil {
		return errors.New("brain 数据适配器未初始化")
	}
	return nil
}

// parseSettingInt 将数据库中的整数设置转换为应用值，空值采用迁移兼容默认值。
func parseSettingInt(value string, fallback int) int {
	// parsed、err 保存整数解析结果及错误。
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil {
		return fallback
	}
	return parsed
}

// formatSettingInt 将整数设置格式化为稳定的十进制存储值。
func formatSettingInt(value int) string {
	return strconv.Itoa(value)
}

// boolSetting 将布尔值转换为系统设置兼容文本。
func boolSetting(value bool) string {
	if value {
		return "true"
	}
	return "false"
}

// sessionModel 将数据库会话模型转换为不含凭证的应用摘要。
func sessionModel(record db.BrainSession) brainapp.Session {
	return brainapp.Session{ID: record.ID, UserID: record.UserID, AccountID: record.CookieID, ChatID: record.ChatID, ItemID: record.ItemID,
		Status: record.Status, Provider: record.Provider, Model: record.Model, Summary: record.Summary, LastRequestID: record.LastRequestID,
		CreatedAt: record.CreatedAt, UpdatedAt: record.UpdatedAt}
}

// turnModel 将数据库 turn 转换为 Brain Center 可展示的轨迹摘要。
func turnModel(record db.BrainTurn) brainapp.Turn {
	return brainapp.Turn{ID: record.ID, SessionID: record.SessionID, RequestID: record.RequestID, Status: record.Status,
		TraceJSON: record.TraceJSON, ResultJSON: record.ResultJSON, ErrorMessage: record.ErrorMessage, SendStatus: record.SendStatus,
		DeadlineAt: record.DeadlineAt, CreatedAt: record.CreatedAt, UpdatedAt: record.UpdatedAt}
}

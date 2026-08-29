package db

import (
	"context"
	"strings"
)

const (
	// legacyDefaultAIBaseURL 是旧版本自动写入的地址，不视为用户主动配置。
	legacyDefaultAIBaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	// legacyDefaultAIModel 是旧版本自动写入的模型，不覆盖 v2 DeepSeek 默认值。
	legacyDefaultAIModel = "qwen-plus"
	// defaultBrainBaseURL 是 v2 默认 DeepSeek 服务地址。
	defaultBrainBaseURL = "https://api.deepseek.com"
	// defaultBrainModel 是 v2 默认客服模型。
	defaultBrainModel = "deepseek-v4-flash"
)

// MigrateLegacyBrainSettings 把用户自定义旧 AI 设置一次性迁移到新命名空间。
// 旧字段继续保留用于一个主版本内回滚；秘密经解密后用新键重新加密，禁止复制带旧 AAD 的密文。
func (store *Store) MigrateLegacyBrainSettings(ctx context.Context) error {
	if store == nil || store.Settings == nil {
		return nil
	}
	// migrated、readErr 保存一次性迁移标志及其读取错误。
	migrated, readErr := store.Settings.Get(ctx, "brain_settings_migrated_v2")
	if readErr != nil || strings.EqualFold(strings.TrimSpace(migrated), "true") {
		return readErr
	}
	// oldBaseURL、oldModel、oldAPIKey 是旧设置的解密后值，只在本函数作用域存在且不记录日志。
	oldBaseURL, readErr := store.Settings.Get(ctx, "ai_api_url")
	if readErr != nil {
		return readErr
	}
	// oldModel、readErr 保存当前步骤的中间结果。
	oldModel, readErr := store.Settings.Get(ctx, "ai_model")
	if readErr != nil {
		return readErr
	}
	// oldAPIKey、readErr 保存当前步骤的中间结果。
	oldAPIKey, readErr := store.Settings.Get(ctx, "ai_api_key")
	if readErr != nil {
		return readErr
	}
	// brainBaseURL、brainModel、brainAPIKey 是新设置当前值；非默认新值拥有最高优先级。
	brainBaseURL, readErr := store.Settings.Get(ctx, "brain_base_url")
	if readErr != nil {
		return readErr
	}
	// brainModel、readErr 保存当前步骤的中间结果。
	brainModel, readErr := store.Settings.Get(ctx, "brain_model")
	if readErr != nil {
		return readErr
	}
	// brainAPIKey、readErr 保存当前步骤的中间结果。
	brainAPIKey, readErr := store.Settings.Get(ctx, "brain_api_key")
	if readErr != nil {
		return readErr
	}
	// values 保存普通兼容迁移值；迁移标志与设置同一事务提交。
	values := map[string]string{"brain_settings_migrated_v2": "true"}
	// legacyCustomized 表示旧地址或模型与历史默认值不同，需要启用受控兼容 provider。
	legacyCustomized := false
	oldBaseURL = strings.TrimRight(strings.TrimSpace(oldBaseURL), "/")
	if oldBaseURL != "" && !strings.EqualFold(oldBaseURL, legacyDefaultAIBaseURL) && strings.EqualFold(strings.TrimRight(strings.TrimSpace(brainBaseURL), "/"), defaultBrainBaseURL) {
		values["brain_base_url"] = oldBaseURL
		legacyCustomized = true
	}
	oldModel = strings.TrimSpace(oldModel)
	if oldModel != "" && oldModel != legacyDefaultAIModel && strings.TrimSpace(brainModel) == defaultBrainModel {
		values["brain_model"] = oldModel
		legacyCustomized = true
	}
	if legacyCustomized {
		values["brain_provider"] = "openai-compatible"
	}
	// secrets 仅在新 key 未配置时保存旧明文，SystemSettings 负责用新 owner 键加密。
	secrets := make(map[string]SensitiveSettingChange)
	if strings.TrimSpace(brainAPIKey) == "" && strings.TrimSpace(oldAPIKey) != "" {
		secrets["brain_api_key"] = SensitiveSettingChange{Action: "replace", Value: oldAPIKey}
	}
	return store.Settings.ApplyChanges(ctx, values, secrets)
}

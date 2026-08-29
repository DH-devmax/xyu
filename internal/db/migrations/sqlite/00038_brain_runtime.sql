-- +goose Up
CREATE TABLE brain_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    cookie_id TEXT NOT NULL,
    chat_id TEXT NOT NULL,
    item_id TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'idle',
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    last_request_id TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cookie_id) REFERENCES cookies(id) ON DELETE CASCADE
);
CREATE INDEX idx_brain_sessions_user_updated ON brain_sessions(user_id, updated_at DESC);
CREATE INDEX idx_brain_sessions_account_chat ON brain_sessions(cookie_id, chat_id);

CREATE TABLE brain_turns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    request_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    trace_json TEXT NOT NULL DEFAULT '[]',
    result_json TEXT NOT NULL DEFAULT '',
    error_message TEXT NOT NULL DEFAULT '',
    send_status TEXT NOT NULL DEFAULT 'pending',
    deadline_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES brain_sessions(id) ON DELETE CASCADE
);
CREATE INDEX idx_brain_turns_session_created ON brain_turns(session_id, created_at DESC);
CREATE INDEX idx_brain_turns_status_updated ON brain_turns(status, updated_at);

INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
    ('brain_enabled', 'true', '是否启用 Harness 客服大脑'),
    ('brain_provider', 'deepseek-official', 'Harness 默认模型提供方'),
    ('brain_model', 'deepseek-v4-flash', 'Harness 默认模型'),
    ('brain_base_url', 'https://api.deepseek.com', 'Harness 模型服务地址'),
    ('brain_reasoning_effort', 'high', 'Harness 推理强度'),
    ('brain_timeout_ms', '30000', 'Go 等待草案的毫秒预算'),
    ('brain_queue_timeout_ms', '5000', 'Harness 排队毫秒预算'),
    ('brain_max_concurrency', '4', 'Harness 全局最大并发会话数'),
    ('brain_api_key', '', 'Harness 模型服务密钥'),
    ('brain_settings_migrated_v2', 'false', '旧 AI 设置是否完成兼容迁移');

-- +goose Down
DELETE FROM system_settings WHERE key IN (
    'brain_enabled', 'brain_provider', 'brain_model', 'brain_base_url',
    'brain_reasoning_effort', 'brain_timeout_ms', 'brain_queue_timeout_ms',
    'brain_max_concurrency', 'brain_api_key', 'brain_settings_migrated_v2'
);
DROP TABLE IF EXISTS brain_turns;
DROP TABLE IF EXISTS brain_sessions;

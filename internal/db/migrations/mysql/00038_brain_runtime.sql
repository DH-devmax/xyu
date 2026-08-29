-- +goose Up
CREATE TABLE brain_sessions (
    id VARCHAR(191) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    cookie_id VARCHAR(255) NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    item_id VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'idle',
    provider VARCHAR(128) NOT NULL,
    model VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    last_request_id VARCHAR(320) NOT NULL DEFAULT '',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CONSTRAINT fk_brain_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_brain_sessions_cookie FOREIGN KEY (cookie_id) REFERENCES cookies(id) ON DELETE CASCADE,
    INDEX idx_brain_sessions_user_updated (user_id, updated_at),
    INDEX idx_brain_sessions_account_chat (cookie_id, chat_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE brain_turns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(191) NOT NULL,
    request_id VARCHAR(320) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL,
    trace_json LONGTEXT NOT NULL,
    result_json LONGTEXT NOT NULL,
    error_message TEXT NOT NULL,
    send_status VARCHAR(32) NOT NULL DEFAULT 'pending',
    deadline_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CONSTRAINT fk_brain_turns_session FOREIGN KEY (session_id) REFERENCES brain_sessions(id) ON DELETE CASCADE,
    INDEX idx_brain_turns_session_created (session_id, created_at),
    INDEX idx_brain_turns_status_updated (status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO system_settings (`key`, value, description) VALUES
    ('brain_enabled', 'true', '是否启用 Harness 客服大脑'),
    ('brain_provider', 'deepseek-official', 'Harness 默认模型提供方'),
    ('brain_model', 'deepseek-v4-flash', 'Harness 默认模型'),
    ('brain_base_url', 'https://api.deepseek.com', 'Harness 模型服务地址'),
    ('brain_reasoning_effort', 'high', 'Harness 推理强度'),
    ('brain_timeout_ms', '30000', 'Go 等待草案的毫秒预算'),
    ('brain_queue_timeout_ms', '5000', 'Harness 排队毫秒预算'),
    ('brain_max_concurrency', '4', 'Harness 全局最大并发会话数'),
    ('brain_api_key', '', 'Harness 模型服务密钥'),
    ('brain_settings_migrated_v2', 'false', '旧 AI 设置是否完成兼容迁移')
ON DUPLICATE KEY UPDATE `key`=`key`;

-- +goose Down
DELETE FROM system_settings WHERE `key` IN (
    'brain_enabled', 'brain_provider', 'brain_model', 'brain_base_url',
    'brain_reasoning_effort', 'brain_timeout_ms', 'brain_queue_timeout_ms',
    'brain_max_concurrency', 'brain_api_key', 'brain_settings_migrated_v2'
);
DROP TABLE IF EXISTS brain_turns;
DROP TABLE IF EXISTS brain_sessions;

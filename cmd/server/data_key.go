package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// ensureDataKeyForDatabase 确保数据库使用稳定的数据加密主密钥。
func ensureDataKeyForDatabase(rawDBURL string, dataKeyFile *string) error {
	if strings.TrimSpace(os.Getenv("XIANYU_DATA_KEY")) != "" || strings.TrimSpace(*dataKeyFile) != "" {
		return nil
	}
	if isRemoteDatabaseURL(rawDBURL) {
		return errors.New("MySQL/PostgreSQL 必须配置 XIANYU_DATA_KEY 或 -data-key-file")
	}
	// keyPath 是无显式数据目录时与 SQLite 数据库绑定的稳定密钥文件路径。
	keyPath := filepath.Join(filepath.Dir(strings.TrimPrefix(strings.TrimPrefix(rawDBURL, "sqlite://"), "sqlite3://")), defaultDataKeyName)
	if keyPath == defaultDataKeyName || keyPath == "."+string(filepath.Separator)+defaultDataKeyName {
		keyPath = filepath.Join("data", defaultDataKeyName)
	}
	*dataKeyFile = keyPath
	// key 是自动生成或读取的 SQLite 持久化主密钥；不得写入日志。
	key, keyErr := loadOrCreateDataKey(keyPath)
	if keyErr != nil {
		return keyErr
	}
	// err 表示写入当前进程数据密钥环境变量失败。
	if err := os.Setenv("XIANYU_DATA_KEY", key); err != nil {
		return fmt.Errorf("设置 XIANYU_DATA_KEY 失败: %w", err)
	}
	return nil
}

// isRemoteDatabaseURL 判断数据库地址是否需要跨进程共享持久化密钥。
func isRemoteDatabaseURL(raw string) bool {
	raw = strings.ToLower(strings.TrimSpace(raw))
	return strings.HasPrefix(raw, "mysql://") || strings.HasPrefix(raw, "postgres://") || strings.HasPrefix(raw, "postgresql://") || strings.HasPrefix(raw, "pgx://")
}

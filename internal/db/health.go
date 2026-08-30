package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
)

// HealthProbe 是数据库连接可用性的窄探针，不向上层传递可执行任意 SQL 的连接。
type HealthProbe struct {
	// database 保存被探测的连接池；连接池的关闭责任仍属于启动装配方。
	database *sql.DB
}

// newHealthProbe 构造数据库健康探针。
// database 可以为空，用于保留可诊断但不可用的依赖状态。
func newHealthProbe(database *sql.DB) *HealthProbe {
	return &HealthProbe{database: database}
}

// HealthProbe 返回 Store 对应连接池的健康探针。
// Store 为空时返回不可用探针，使调用方得到稳定错误而不是访问裸连接或发生 panic。
func (s *Store) HealthProbe() *HealthProbe {
	if s == nil {
		return newHealthProbe(nil)
	}
	return newHealthProbe(s.DB)
}

// Ping 在 ctx 的取消期限内探测连接池；未装配连接时返回初始化错误。
func (probe *HealthProbe) Ping(ctx context.Context) error {
	if probe == nil || probe.database == nil {
		return errors.New("数据库健康检查未初始化")
	}
	return probe.database.PingContext(ctx)
}

// VerifyIntegrity 对迁移副本执行方言对应的完整性检查；SQLite 使用完整页级校验，外置数据库使用连接探针。
func (s *Store) VerifyIntegrity(ctx context.Context) error {
	if s == nil || s.DB == nil {
		return errors.New("数据库完整性检查未初始化")
	}
	if s.Dialect != DialectSQLite {
		return s.DB.PingContext(ctx)
	}
	// result 是 SQLite 对整个数据库页树和索引关系给出的完整性结论。
	var result string
	// queryErr 表示执行或读取 SQLite 页级完整性检查的失败原因。
	if queryErr := s.DB.QueryRowContext(ctx, "PRAGMA integrity_check").Scan(&result); queryErr != nil {
		return fmt.Errorf("执行 SQLite 完整性检查: %w", queryErr)
	}
	if !strings.EqualFold(strings.TrimSpace(result), "ok") {
		return fmt.Errorf("SQLite 完整性检查失败: %s", strings.TrimSpace(result))
	}
	return nil
}

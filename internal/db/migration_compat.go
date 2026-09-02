package db

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/pressly/goose/v3"
)

// adoptUpstreamV107History 识别已执行上游 00038-00041 的数据库，并接管到本地顺延版本。
// 本地 00038 已被 brain_runtime 占用，不能再次执行同编号迁移；只有对应结构完整时才写入
// 42-45 的 goose 记录，避免对已有列重复 ALTER，同时保留未完成迁移的正常升级路径。
func adoptUpstreamV107History(ctx context.Context, db *sql.DB, dialect Dialect) error {
	// version、err 保存当前迁移版本及读取错误。
	version, err := goose.GetDBVersionContext(ctx, db)
	if err != nil {
		return fmt.Errorf("读取迁移版本: %w", err)
	}
	if version < 38 || version >= 45 {
		return nil
	}

	// features 按上游原始迁移顺序排列；每一步都要求前一步已接管，防止跳过依赖。
	features := []struct {
		version int64
		ready   func(context.Context, *sql.DB, Dialect) (bool, error)
	}{
		{version: 42, ready: hasDeliveryTemplateSchema},
		{version: 43, ready: hasDeliveryProofSchema},
		{version: 44, ready: hasSKUMigrationSchema},
		{version: 45, ready: hasChatVisibilitySchema},
	}
	// feature 表示待接管的单个结构版本。
	for _, feature := range features {
		if version >= feature.version {
			continue
		}
		// ready、readyErr 表示结构是否已存在及检查错误。
		ready, readyErr := feature.ready(ctx, db, dialect)
		if readyErr != nil {
			return readyErr
		}
		if !ready {
			break
		}
		// insertErr 表示写入本地顺延迁移记录失败。
		if _, insertErr := db.ExecContext(ctx,
			"INSERT INTO "+goose.TableName()+" (version_id, is_applied) VALUES (?, ?)",
			feature.version, true,
		); insertErr != nil {
			return fmt.Errorf("接管迁移版本 %d: %w", feature.version, insertErr)
		}
		version = feature.version
	}
	return nil
}

// hasDeliveryTemplateSchema 检查上游发货模板迁移产生的表、列和索引。
func hasDeliveryTemplateSchema(ctx context.Context, db *sql.DB, dialect Dialect) (bool, error) {
	// checks 保存当前功能所需的数据库结构检查项。
	checks := []struct {
		kind  string
		name  string
		table string
		col   string
	}{
		{kind: "table", name: "delivery_templates"},
		{kind: "table", name: "delivery_template_messages"},
		{kind: "table", name: "automation_action_template_bindings"},
		{kind: "column", table: "automation_rule_actions", col: "delivery_template_id"},
		{kind: "index", name: "idx_delivery_templates_user"},
		{kind: "index", name: "idx_delivery_template_messages_template"},
		{kind: "index", name: "idx_automation_rule_actions_template"},
		{kind: "index", name: "idx_automation_template_bindings_action"},
	}
	return schemaChecksPass(ctx, db, dialect, checks)
}

// hasDeliveryProofSchema 检查自动化运行发货凭证列。
func hasDeliveryProofSchema(ctx context.Context, db *sql.DB, dialect Dialect) (bool, error) {
	return schemaChecksPass(ctx, db, dialect, []struct {
		kind  string
		name  string
		table string
		col   string
	}{{kind: "column", table: "automation_runs", col: "delivery_proof"}})
}

// hasSKUMigrationSchema 检查多 SKU 规则状态列及其查询索引。
func hasSKUMigrationSchema(ctx context.Context, db *sql.DB, dialect Dialect) (bool, error) {
	return schemaChecksPass(ctx, db, dialect, []struct {
		kind  string
		name  string
		table string
		col   string
	}{{kind: "column", table: "automation_rules", col: "sku_migration_status"}, {kind: "index", name: "idx_automation_rules_sku_migration"}})
}

// hasChatVisibilitySchema 检查聊天会话可见性列及其分页索引。
func hasChatVisibilitySchema(ctx context.Context, db *sql.DB, dialect Dialect) (bool, error) {
	return schemaChecksPass(ctx, db, dialect, []struct {
		kind  string
		name  string
		table string
		col   string
	}{{kind: "column", table: "chat_sessions", col: "is_visible"}, {kind: "index", name: "idx_chat_sessions_account_visibility_recent"}})
}

// schemaChecksPass 使用各方言的系统目录验证迁移产物，不读取业务数据。
func schemaChecksPass(ctx context.Context, db *sql.DB, dialect Dialect, checks []struct {
	kind  string
	name  string
	table string
	col   string
}) (bool, error) {
	// check 表示当前方言下的一项结构检查。
	for _, check := range checks {
		// query、args 保存结构目录查询及其参数。
		var query string
		// args 保存结构目录查询参数。
		var args []any
		switch dialect {
		case DialectSQLite:
			switch check.kind {
			case "table":
				query, args = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", []any{check.name}
			case "index":
				query, args = "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name=?", []any{check.name}
			case "column":
				query, args = "SELECT COUNT(*) FROM pragma_table_info(?) WHERE name=?", []any{check.table, check.col}
			}
		case DialectMySQL:
			switch check.kind {
			case "table":
				query, args = "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?", []any{check.name}
			case "index":
				query, args = "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND INDEX_NAME=?", []any{check.name}
			case "column":
				query, args = "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?", []any{check.table, check.col}
			}
		case DialectPostgres:
			switch check.kind {
			case "table":
				query, args = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name=?", []any{check.name}
			case "index":
				query, args = "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND indexname=?", []any{check.name}
			case "column":
				query, args = "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name=? AND column_name=?", []any{check.table, check.col}
			}
		default:
			return false, fmt.Errorf("检查迁移结构时遇到未知方言: %s", dialect)
		}
		// count 保存结构目录中匹配项数量。
		var count int
		// err 表示执行结构检查查询失败。
		if err := db.QueryRowContext(ctx, query, args...).Scan(&count); err != nil {
			return false, fmt.Errorf("检查迁移结构 %s.%s: %w", check.table, check.col, err)
		}
		if count == 0 {
			return false, nil
		}
	}
	return true, nil
}

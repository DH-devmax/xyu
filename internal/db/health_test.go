package db

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestStoreVerifyIntegrity 验证健康 SQLite 副本通过完整性检查，缺失连接则稳定失败。
func TestStoreVerifyIntegrity(t *testing.T) {
	// database 是内存 SQLite 样本，避免完整性测试修改任何持久数据。
	database, openErr := sql.Open("sqlite", "file::memory:?cache=shared")
	if openErr != nil {
		t.Fatalf("open sqlite fixture: %v", openErr)
	}
	t.Cleanup(func() { _ = database.Close() })
	// store 是绑定健康样本的正式仓储集合。
	store := NewStore(database, DialectSQLite)
	// verifyErr 表示健康 SQLite 样本不应产生的完整性错误。
	if verifyErr := store.VerifyIntegrity(context.Background()); verifyErr != nil {
		t.Fatalf("verify healthy sqlite fixture: %v", verifyErr)
	}
	// missingErr 是空 Store 必须返回的可诊断初始化错误。
	missingErr := (*Store)(nil).VerifyIntegrity(context.Background())
	if missingErr == nil || !strings.Contains(missingErr.Error(), "未初始化") {
		t.Fatalf("missing store integrity error=%v", missingErr)
	}

	// corruptPath 是一个不符合 SQLite 页格式的持久化样本。
	corruptPath := filepath.Join(t.TempDir(), "corrupt.db")
	// writeErr 表示构造损坏数据库样本的文件错误。
	if writeErr := os.WriteFile(corruptPath, []byte("not-a-sqlite-database"), 0o600); writeErr != nil {
		t.Fatalf("write corrupt sqlite fixture: %v", writeErr)
	}
	// corruptDatabase 是延迟打开的损坏 SQLite 连接，真正错误应由完整性查询返回。
	corruptDatabase, corruptOpenErr := sql.Open("sqlite", corruptPath)
	if corruptOpenErr != nil {
		t.Fatalf("open corrupt sqlite fixture: %v", corruptOpenErr)
	}
	t.Cleanup(func() { _ = corruptDatabase.Close() })
	// corruptErr 证明损坏页不会被当作成功迁移。
	if corruptErr := NewStore(corruptDatabase, DialectSQLite).VerifyIntegrity(context.Background()); corruptErr == nil {
		t.Fatal("损坏 SQLite 样本应当验证失败")
	}

	// closedDatabase 模拟外置数据库在验证前已断开的连接。
	closedDatabase, closedOpenErr := sql.Open("sqlite", "file::memory:?cache=shared")
	if closedOpenErr != nil {
		t.Fatalf("open external probe fixture: %v", closedOpenErr)
	}
	// closeErr 表示为外置连接探针构造不可用状态时的关闭错误。
	if closeErr := closedDatabase.Close(); closeErr != nil {
		t.Fatalf("close external probe fixture: %v", closeErr)
	}
	// externalErr 证明非 SQLite 方言使用连接探针并传播不可用状态。
	if externalErr := NewStore(closedDatabase, DialectPostgres).VerifyIntegrity(context.Background()); externalErr == nil {
		t.Fatal("已关闭的外置数据库探针应当失败")
	}
}

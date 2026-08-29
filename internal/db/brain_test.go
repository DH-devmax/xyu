package db

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"
)

// TestBrainTurnIdempotency 验证同一 request_id 只能创建一条账本且发送终态只能成功一次。
func TestBrainTurnIdempotency(t *testing.T) {
	// store、cleanup 保存隔离数据库及其关闭责任。
	store, cleanup := newTestDB(t)
	defer cleanup()
	// ctx 是本次仓储操作使用的独立生命周期上下文。
	ctx := context.Background()
	// now 是测试账本统一使用的 Unix 毫秒时间。
	now := time.Now().UnixMilli()
	// userID、cookieID 先建立满足外键约束的会话归属。
	if _, err := store.Users.Create(ctx, "brain-owner", "brain-owner@example.com", "pw"); err != nil {
		t.Fatalf("create user: %v", err)
	}
	// err、user 保存当前步骤的中间结果。
	user, err := store.Users.GetByUsername(ctx, "brain-owner")
	if err != nil {
		t.Fatalf("get user: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := store.Cookies.Save(ctx, "brain-account", "fixture-cookie", user.ID); err != nil {
		t.Fatalf("save cookie: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := store.Brain.UpsertSession(ctx, BrainSession{ID: "session-1", UserID: user.ID, CookieID: "brain-account", ChatID: "chat-1", Provider: "deepseek-official", Model: "deepseek-v4-flash", Status: "idle", CreatedAt: now, UpdatedAt: now}); err != nil {
		t.Fatalf("upsert session: %v", err)
	}
	// turn 是第一次请求的待处理账本。
	turn := BrainTurn{SessionID: "session-1", RequestID: "msg:1", Status: "queued", TraceJSON: "[]", SendStatus: "pending", DeadlineAt: now + 30_000, CreatedAt: now, UpdatedAt: now}
	// created、err 保存当前步骤的中间结果。
	created, err := store.Brain.CreateTurn(ctx, turn)
	if err != nil || !created {
		t.Fatalf("create first turn: created=%v err=%v", created, err)
	}
	created, err = store.Brain.CreateTurn(ctx, turn)
	if err != nil || created {
		t.Fatalf("duplicate turn should be ignored: created=%v err=%v", created, err)
	}
	// err 保存当前步骤的中间结果。
	if err := store.Brain.FinishTurn(ctx, "msg:1", "completed", "[]", `{"status":"reply"}`, "", now+1); err != nil {
		t.Fatalf("finish turn: %v", err)
	}
	// claimed、err 保存当前步骤的中间结果。
	claimed, err := store.Brain.MarkTurnSendStatus(ctx, "msg:1", "sent", "", now+2)
	if err != nil || !claimed {
		t.Fatalf("claim send status: claimed=%v err=%v", claimed, err)
	}
	claimed, err = store.Brain.MarkTurnSendStatus(ctx, "msg:1", "sent", "", now+3)
	if err != nil || claimed {
		t.Fatalf("duplicate send status should be ignored: claimed=%v err=%v", claimed, err)
	}
	// err、got 保存当前步骤的中间结果。
	got, err := store.Brain.GetTurnByRequestID(ctx, "msg:1")
	if err != nil || got.SendStatus != "sent" || got.Status != "completed" {
		t.Fatalf("get turn=%+v err=%v", got, err)
	}
}

// TestBrainSessionOwnershipAndMigration 验证普通用户范围过滤以及旧设置迁移不覆盖显式新设置。
func TestBrainSessionOwnershipAndMigration(t *testing.T) {
	// store、cleanup 保存隔离数据库及其关闭责任。
	store, cleanup := newTestDB(t)
	defer cleanup()
	// ctx 是本次仓储操作使用的独立生命周期上下文。
	ctx := context.Background()
	// createOwner 创建测试用户和账号，返回用户主键。
	createOwner := func(username, email, accountID string) int64 {
		// createErr 是用户创建错误。
		if _, createErr := store.Users.Create(ctx, username, email, "pw"); createErr != nil {
			t.Fatalf("create user: %v", createErr)
		}
		// owner、ownerErr 保存新用户摘要及读取错误。
		owner, ownerErr := store.Users.GetByUsername(ctx, username)
		if ownerErr != nil {
			t.Fatalf("get user: %v", ownerErr)
		}
		// saveErr 保存当前步骤的中间结果。
		if saveErr := store.Cookies.Save(ctx, accountID, "fixture-cookie", owner.ID); saveErr != nil {
			t.Fatalf("save cookie: %v", saveErr)
		}
		return owner.ID
	}
	// firstUser、secondUser 是两个互不相同的会话所有者。
	firstUser := createOwner("brain-one", "brain-one@example.com", "brain-account-one")
	// secondUser 保存当前步骤的中间结果。
	secondUser := createOwner("brain-two", "brain-two@example.com", "brain-account-two")
	// now 是测试会话统一使用的 Unix 毫秒时间。
	now := time.Now().UnixMilli()
	// session 表示当前遍历项及其索引。
	for _, session := range []BrainSession{
		{ID: "session-one", UserID: firstUser, CookieID: "brain-account-one", ChatID: "chat-one", Provider: "deepseek-official", Model: "deepseek-v4-flash", Status: "idle", CreatedAt: now, UpdatedAt: now},
		{ID: "session-two", UserID: secondUser, CookieID: "brain-account-two", ChatID: "chat-two", Provider: "deepseek-official", Model: "deepseek-v4-flash", Status: "idle", CreatedAt: now + 1, UpdatedAt: now + 1},
	} {
		// err 保存当前步骤的中间结果。
		if err := store.Brain.UpsertSession(ctx, session); err != nil {
			t.Fatalf("upsert session: %v", err)
		}
	}
	// err、owned 保存当前步骤的中间结果。
	owned, err := store.Brain.ListSessions(ctx, firstUser, false, 50)
	if err != nil || len(owned) != 1 || owned[0].UserID != firstUser {
		t.Fatalf("owned sessions=%+v err=%v", owned, err)
	}
	// all、err 保存当前步骤的中间结果。
	all, err := store.Brain.ListSessions(ctx, firstUser, true, 50)
	if err != nil || len(all) != 2 {
		t.Fatalf("admin sessions=%+v err=%v", all, err)
	}
	_, _, err = store.Brain.GetSession(ctx, firstUser, false, "session-two", 10)
	if !errors.Is(err, sql.ErrNoRows) {
		t.Fatalf("cross-user session should be hidden, err=%v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := store.Settings.Set(ctx, "ai_api_url", "https://legacy.example/v1"); err != nil {
		t.Fatalf("set legacy URL: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := store.Settings.Set(ctx, "ai_model", "legacy-model"); err != nil {
		t.Fatalf("set legacy model: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := store.Settings.Set(ctx, "ai_api_key", "legacy-secret"); err != nil {
		t.Fatalf("set legacy key: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := store.MigrateLegacyBrainSettings(ctx); err != nil {
		t.Fatalf("migrate legacy settings: %v", err)
	}
	// migratedURL、migratedModel、provider 是迁移后公开的非秘密设置。
	migratedURL, _ := store.Settings.Get(ctx, "brain_base_url")
	// migratedModel 保存当前步骤的中间结果。
	migratedModel, _ := store.Settings.Get(ctx, "brain_model")
	// provider 保存当前步骤的中间结果。
	provider, _ := store.Settings.Get(ctx, "brain_provider")
	if migratedURL != "https://legacy.example/v1" || migratedModel != "legacy-model" || provider != "openai-compatible" {
		t.Fatalf("migrated settings=%q,%q,%q", migratedURL, migratedModel, provider)
	}
	// err、key 保存当前步骤的中间结果。
	key, err := store.Settings.Get(ctx, "brain_api_key")
	if err != nil || key != "legacy-secret" {
		t.Fatalf("migrated key read err=%v value=%q", err, key)
	}
	// err 保存当前步骤的中间结果。
	if err := store.MigrateLegacyBrainSettings(ctx); err != nil {
		t.Fatalf("second migration should be idempotent: %v", err)
	}
}

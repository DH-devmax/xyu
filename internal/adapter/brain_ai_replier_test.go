package adapter

import (
	"context"
	"errors"
	"path/filepath"
	"sync"
	"testing"

	brainapp "github.com/DH-devmax/xyu/internal/application/brain"
	"github.com/DH-devmax/xyu/internal/db"
	"github.com/DH-devmax/xyu/internal/engine"
)

// brainRuntimeStub 提供可控的 Harness 草案结果，验证适配器不会重复调用 runtime。
type brainRuntimeStub struct {
	mu     sync.Mutex
	called int
	draft  brainapp.ReplyDraft
	err    error
}

// Reply 返回预设草案并记录调用次数。
func (stub *brainRuntimeStub) Reply(_ context.Context, _ brainapp.ReplyRequest) (brainapp.ReplyDraft, error) {
	stub.mu.Lock()
	defer stub.mu.Unlock()
	stub.called++
	return stub.draft, stub.err
}

// brainSenderStub 记录发送次数和文本，作为 engine.MessageSender 的最小替身。
type brainSenderStub struct {
	mu    sync.Mutex
	texts []string
}

// SendText 记录一条文本发送。
func (sender *brainSenderStub) SendText(_ context.Context, _, _, text string) error {
	sender.mu.Lock()
	sender.texts = append(sender.texts, text)
	sender.mu.Unlock()
	return nil
}

// SendImage 满足图片发送端口；Brain 测试只使用文本。
func (sender *brainSenderStub) SendImage(context.Context, string, string, string, int64, int, int) error {
	return nil
}

// newBrainAdapterStore 创建完成最新迁移的隔离数据库和一个账号。
func newBrainAdapterStore(t *testing.T) (*db.Store, int64, func()) {
	t.Helper()
	// database、dialect、err 保存当前步骤的中间结果。
	database, dialect, err := db.Open(context.Background(), filepath.Join(t.TempDir(), "brain.db"))
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	// store 保存当前步骤的中间结果。
	store := db.NewStore(database, dialect)
	// err 保存当前步骤的中间结果。
	if _, err := store.Users.Create(context.Background(), "brain-adapter-owner", "brain-adapter@example.com", "pw"); err != nil {
		database.Close()
		t.Fatalf("create user: %v", err)
	}
	// err、owner 保存当前步骤的中间结果。
	owner, err := store.Users.GetByUsername(context.Background(), "brain-adapter-owner")
	if err != nil {
		database.Close()
		t.Fatalf("get user: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := store.Cookies.Save(context.Background(), "brain-adapter-account", "unb=brain", owner.ID); err != nil {
		database.Close()
		t.Fatalf("save cookie: %v", err)
	}
	return store, owner.ID, func() { _ = database.Close() }
}

// enableBrainAccount 打开账号级 AI 开关并写入可验证的议价边界。
func enableBrainAccount(t *testing.T, store *db.Store) {
	t.Helper()
	// err 保存当前步骤的中间结果。
	if err := store.AIReply.UpsertSettings(context.Background(), "brain-adapter-account", db.AIReplySettings{
		AIEnabled: true, AutoAdjustPriceEnabled: true, MaxDiscountPercent: 10, MaxDiscountAmount: 20, MaxBargainRounds: 3,
	}); err != nil {
		t.Fatalf("upsert ai settings: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := store.Items.Upsert(context.Background(), &db.ItemInfoRow{CookieID: "brain-adapter-account", ItemID: "item-1", ItemTitle: "测试商品", ItemPrice: "100.00"}); err != nil {
		t.Fatalf("upsert item: %v", err)
	}
}

// TestBrainReplierLedgerAndSendIdempotency 验证正常草案只调用一次并只发送一次。
func TestBrainReplierLedgerAndSendIdempotency(t *testing.T) {
	// cleanup、store 保存当前步骤的中间结果。
	store, _, cleanup := newBrainAdapterStore(t)
	defer cleanup()
	enableBrainAccount(t, store)
	// runtime 保存当前步骤的中间结果。
	runtime := &brainRuntimeStub{draft: brainapp.ReplyDraft{RequestID: "msg:message-1", Status: "reply", ReplyText: "可以，90 元成交", Intent: "bargain", QuoteProposalCents: ptrInt64(9000), TraceJSON: "[]"}}
	// factory 保存当前步骤的中间结果。
	factory := NewBrainAIReplierFactory(runtime)
	// brain 保存当前步骤的中间结果。
	brain := factory("brain-adapter-account", store, nil)
	// sender 保存当前步骤的中间结果。
	sender := &brainSenderStub{}
	// service 保存当前步骤的中间结果。
	service := engine.NewReplyService("brain-adapter-account", store, sender, nil, brain, nil)
	// message 保存当前步骤的中间结果。
	message := engine.ChatMessage{AccountID: "brain-adapter-account", ChatID: "chat-1", SenderUserID: "buyer-1", ItemID: "item-1", Text: "能便宜吗", MessageID: "message-1"}
	// err 保存当前步骤的中间结果。
	if err := service.Handle(context.Background(), message); err != nil {
		t.Fatalf("first handle: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := service.Handle(context.Background(), message); err != nil {
		t.Fatalf("duplicate handle: %v", err)
	}
	runtime.mu.Lock()
	// calls 保存当前步骤的中间结果。
	calls := runtime.called
	runtime.mu.Unlock()
	sender.mu.Lock()
	// sends 保存当前步骤的中间结果。
	sends := len(sender.texts)
	sender.mu.Unlock()
	if calls != 1 || sends != 1 {
		t.Fatalf("calls=%d sends=%d want one each", calls, sends)
	}
	// err、turn 保存当前步骤的中间结果。
	turn, err := store.Brain.GetTurnByRequestID(context.Background(), "msg:message-1")
	if err != nil || turn.SendStatus != "sent" {
		t.Fatalf("turn=%+v err=%v", turn, err)
	}
}

// TestBrainReplierFailureFallsBackOnce 验证 runtime 故障触发默认回复，重复消息不再重复发送。
func TestBrainReplierFailureFallsBackOnce(t *testing.T) {
	// cleanup、store 保存当前步骤的中间结果。
	store, _, cleanup := newBrainAdapterStore(t)
	defer cleanup()
	enableBrainAccount(t, store)
	// err 保存当前步骤的中间结果。
	if err := store.DefaultReps.Upsert(context.Background(), "brain-adapter-account", db.DefaultReply{Enabled: true, ReplyContent: "默认回复"}); err != nil {
		t.Fatalf("upsert default reply: %v", err)
	}
	// runtime 保存当前步骤的中间结果。
	runtime := &brainRuntimeStub{err: errors.New("runtime timeout")}
	// brain 保存当前步骤的中间结果。
	brain := NewBrainAIReplierFactory(runtime)("brain-adapter-account", store, nil)
	// sender 保存当前步骤的中间结果。
	sender := &brainSenderStub{}
	// service 保存当前步骤的中间结果。
	service := engine.NewReplyService("brain-adapter-account", store, sender, nil, brain, nil)
	// message 保存当前步骤的中间结果。
	message := engine.ChatMessage{AccountID: "brain-adapter-account", ChatID: "chat-2", SenderUserID: "buyer-1", ItemID: "item-1", Text: "复杂问题", MessageID: "message-2"}
	// err 保存当前步骤的中间结果。
	if err := service.Handle(context.Background(), message); err != nil {
		t.Fatalf("first fallback: %v", err)
	}
	// err 保存当前步骤的中间结果。
	if err := service.Handle(context.Background(), message); err != nil {
		t.Fatalf("duplicate fallback: %v", err)
	}
	sender.mu.Lock()
	// sends 保存当前步骤的中间结果。
	sends := len(sender.texts)
	sender.mu.Unlock()
	if sends != 1 {
		t.Fatalf("fallback sends=%d want one", sends)
	}
	// err、turn 保存当前步骤的中间结果。
	turn, err := store.Brain.GetTurnByRequestID(context.Background(), "msg:message-2")
	if err != nil || turn.Status != "failed" || turn.SendStatus != "failed" {
		t.Fatalf("failure turn=%+v err=%v", turn, err)
	}
}

// TestBrainReplierDropsUnsafeQuote 验证 Go 侧最低价校验会丢弃越界报价并替换正文。
func TestBrainReplierDropsUnsafeQuote(t *testing.T) {
	// cleanup、store 保存当前步骤的中间结果。
	store, _, cleanup := newBrainAdapterStore(t)
	defer cleanup()
	enableBrainAccount(t, store)
	// runtime 保存当前步骤的中间结果。
	runtime := &brainRuntimeStub{draft: brainapp.ReplyDraft{RequestID: "msg:message-3", Status: "reply", ReplyText: "70 元可以", Intent: "bargain", QuoteProposalCents: ptrInt64(7000)}}
	// brain 保存当前步骤的中间结果。
	brain := NewBrainAIReplierFactory(runtime)("brain-adapter-account", store, nil)
	// err、result 保存当前步骤的中间结果。
	result, err := brain.Reply(context.Background(), engine.ChatMessage{AccountID: "brain-adapter-account", ChatID: "chat-3", SenderUserID: "buyer-1", ItemID: "item-1", Text: "能 70 元吗", MessageID: "message-3"})
	if err != nil || result == nil || result.AutoPriceQuote != nil || result.Text == "70 元可以" {
		t.Fatalf("unsafe result=%+v err=%v", result, err)
	}
}

// TestBrainReplierMissingRepositoriesFallsThrough 验证不完整的兼容 store 会按无 AI 结果继续默认回复。
func TestBrainReplierMissingRepositoriesFallsThrough(t *testing.T) {
	// runtime、replier 保存当前步骤的测试替身。
	runtime := &brainRuntimeStub{draft: brainapp.ReplyDraft{RequestID: "msg:missing-repositories", Status: "reply", ReplyText: "回复", Intent: "other"}}
	// replier 是缺少持久化仓储时创建的回复器。
	replier := NewBrainAIReplierFactory(runtime)("account-without-repositories", &db.Store{}, nil)
	// result、err 保存当前步骤的调用结果。
	result, err := replier.Reply(context.Background(), engine.ChatMessage{MessageID: "missing-repositories", Text: "你好"})
	if err != nil || result != nil {
		t.Fatalf("result=%+v err=%v want nil result without repositories", result, err)
	}
}

// ptrInt64 返回测试使用的可选报价指针。
func ptrInt64(value int64) *int64 {
	return &value
}

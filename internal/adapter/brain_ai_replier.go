package adapter

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	brainapp "github.com/DH-devmax/xyu/internal/application/brain"
	"github.com/DH-devmax/xyu/internal/db"
	"github.com/DH-devmax/xyu/internal/engine"
)

const (
	// brainReplyTimeout 是单轮草案的默认 Go 侧截止预算；supervisor 会再受数据库设置约束。
	brainReplyTimeout = 30 * time.Second
	// brainTurnPollInterval 是重复请求等待已有 turn 终态的轮询间隔。
	brainTurnPollInterval = 25 * time.Millisecond
	// brainTurnPollBudget 是重复请求等待首个处理者完成的最长本地预算。
	brainTurnPollBudget = 30 * time.Second
	// brainSessionPrefix 是本地稳定 session 标识的命名空间前缀。
	brainSessionPrefix = "dsh-session-"
)

// brainOfferPattern 保存当前流程所需的配置或状态。
var brainOfferPattern = regexp.MustCompile(`(?i)(\d+(?:\.\d+)?)\s*(?:元|块)`)

// BrainReplyRuntime 是 Supervisor 对账号回复适配器暴露的最小调用面。
type BrainReplyRuntime interface {
	Reply(context.Context, brainapp.ReplyRequest) (brainapp.ReplyDraft, error)
}

// brainAIReplier 把 Harness 结构化草案转换为 Go 回复结果，并维护 turn 幂等账本。
type brainAIReplier struct {
	cookieID string
	store    *db.Store
	runtime  BrainReplyRuntime
	logger   *slog.Logger
}

// NewBrainAIReplierFactory 创建账号级 Harness provider 工厂。
// 工厂不持有 Cookie 明文；每个实例只保存账号 ID、数据库 Port 和 supervisor 引用。
func NewBrainAIReplierFactory(runtime BrainReplyRuntime) engine.AIReplierFactory {
	return func(cookieID string, store *db.Store, logger *slog.Logger) engine.AIReplier {
		if runtime == nil || store == nil {
			return nil
		}
		if logger == nil {
			logger = slog.Default()
		}
		return &brainAIReplier{cookieID: strings.TrimSpace(cookieID), store: store, runtime: runtime,
			logger: logger.With("account", cookieID, "subsys", "brain")}
	}
}

// Reply 实现 engine.AIReplier：API 和关键词未命中后才进入 Harness。
func (replier *brainAIReplier) Reply(ctx context.Context, message engine.ChatMessage) (*engine.ReplyResult, error) {
	if replier == nil || replier.store == nil || replier.runtime == nil {
		return nil, nil
	}
	if !replier.brainEnabled(ctx) {
		return nil, nil
	}
	// policy 只读取账号开关和议价边界，不触碰旧 API key。
	policy, policyErr := replier.store.AIReply.GetPolicy(ctx, replier.cookieID)
	if policyErr != nil {
		if errors.Is(policyErr, db.ErrNotFound) || errors.Is(policyErr, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("读取账号 Brain 策略失败: %w", policyErr)
	}
	if policy == nil || !policy.AIEnabled {
		return nil, nil
	}
	// request、sessionID 和 now 是本轮跨进程、跨重试共享的稳定边界。
	request, sessionID, now, requestErr := replier.buildRequest(ctx, message)
	if requestErr != nil {
		return nil, requestErr
	}
	// brainSettings 保存当前步骤的中间结果。
	brainSettings := replier.readBrainSettings(ctx)
	// err 保存当前步骤的中间结果。
	if err := replier.store.Brain.UpsertSession(ctx, db.BrainSession{
		ID: sessionID, UserID: request.UserID, CookieID: replier.cookieID, ChatID: request.ChatID,
		ItemID: request.ItemID, Status: "running", Provider: brainSettings.Provider, Model: brainSettings.Model,
		CreatedAt: now, UpdatedAt: now,
	}); err != nil {
		return nil, fmt.Errorf("写入 Brain 会话摘要失败: %w", err)
	}
	// createErr、created 保存当前步骤的中间结果。
	created, createErr := replier.store.Brain.CreateTurn(ctx, db.BrainTurn{
		SessionID: sessionID, RequestID: request.RequestID, Status: "queued", TraceJSON: "[]",
		SendStatus: "pending", DeadlineAt: request.DeadlineAt, CreatedAt: now, UpdatedAt: now,
	})
	if createErr != nil {
		return nil, fmt.Errorf("创建 Brain turn 账本失败: %w", createErr)
	}
	if !created {
		return replier.reuseExistingTurn(ctx, request, message, policy)
	}

	// draft 是唯一允许从 Harness 返回到业务层的结构化结果。
	draft, runtimeErr := replier.runtime.Reply(ctx, request)
	if runtimeErr != nil {
		// status 保存当前步骤的中间结果。
		status := "failed"
		if errors.Is(runtimeErr, context.DeadlineExceeded) || errors.Is(runtimeErr, context.Canceled) {
			status = "timeout"
		}
		// errorText 保存当前步骤的中间结果。
		errorText := sanitizeBrainError(runtimeErr)
		_ = replier.store.Brain.FinishTurn(ctx, request.RequestID, status, "[]", "", errorText, time.Now().UnixMilli())
		_, _ = replier.store.Brain.MarkTurnSendStatus(ctx, request.RequestID, "failed", errorText, time.Now().UnixMilli())
		_ = replier.store.Brain.UpsertSession(ctx, db.BrainSession{ID: sessionID, UserID: request.UserID, CookieID: replier.cookieID,
			ChatID: request.ChatID, ItemID: request.ItemID, Status: "degraded", Provider: brainSettings.Provider,
			Model: brainSettings.Model, LastRequestID: request.RequestID, CreatedAt: now, UpdatedAt: time.Now().UnixMilli()})
		return nil, runtimeErr
	}
	if draft.RequestID != request.RequestID {
		// requestErr 保存当前步骤的中间结果。
		requestErr := errors.New("brain 草案 request_id 与当前消息不一致")
		_ = replier.store.Brain.FinishTurn(ctx, request.RequestID, "failed", draft.TraceJSON, "", requestErr.Error(), time.Now().UnixMilli())
		_, _ = replier.store.Brain.MarkTurnSendStatus(ctx, request.RequestID, "failed", requestErr.Error(), time.Now().UnixMilli())
		return nil, requestErr
	}

	// normalizeErr、normalized 保存当前步骤的中间结果。
	normalized, normalizeErr := replier.normalizeDraft(ctx, message, draft, policy)
	if normalizeErr != nil {
		// errorText 保存当前步骤的中间结果。
		errorText := sanitizeBrainError(normalizeErr)
		_ = replier.store.Brain.FinishTurn(ctx, request.RequestID, "failed", draft.TraceJSON, "", errorText, time.Now().UnixMilli())
		_, _ = replier.store.Brain.MarkTurnSendStatus(ctx, request.RequestID, "failed", errorText, time.Now().UnixMilli())
		return nil, normalizeErr
	}
	// marshalErr、resultJSON 保存当前步骤的中间结果。
	resultJSON, marshalErr := json.Marshal(normalized)
	if marshalErr != nil {
		return nil, fmt.Errorf("序列化 Brain 草案失败: %w", marshalErr)
	}
	// finishErr 保存当前步骤的中间结果。
	if finishErr := replier.store.Brain.FinishTurn(ctx, request.RequestID, "completed", normalized.TraceJSON, string(resultJSON), "", time.Now().UnixMilli()); finishErr != nil {
		return nil, fmt.Errorf("完成 Brain turn 账本失败: %w", finishErr)
	}
	// err 保存当前步骤的中间结果。
	if err := replier.store.Brain.UpsertSession(ctx, db.BrainSession{ID: sessionID, UserID: request.UserID, CookieID: replier.cookieID,
		ChatID: request.ChatID, ItemID: request.ItemID, Status: "idle", Provider: brainSettings.Provider, Model: brainSettings.Model,
		Summary: truncateBrainText(normalized.ReplyText, 240), LastRequestID: request.RequestID, CreatedAt: now, UpdatedAt: time.Now().UnixMilli()}); err != nil {
		return nil, fmt.Errorf("更新 Brain 会话摘要失败: %w", err)
	}
	// err 保存当前步骤的中间结果。
	if err := replier.persistConversation(ctx, message, normalized); err != nil {
		return nil, err
	}
	return resultToEngine(normalized), nil
}

// brainEnabled 读取全局开关；空值兼容尚未执行 v2 迁移的旧数据库。
func (replier *brainAIReplier) brainEnabled(ctx context.Context) bool {
	// err、value 保存当前步骤的中间结果。
	value, err := replier.store.Settings.Get(ctx, "brain_enabled")
	if err != nil || strings.TrimSpace(value) == "" {
		return true
	}
	return !strings.EqualFold(strings.TrimSpace(value), "false") && strings.TrimSpace(value) != "0"
}

// readBrainSettings 返回会话摘要所需的非敏感 provider/model；读取失败使用固定默认值。
func (replier *brainAIReplier) readBrainSettings(ctx context.Context) brainapp.Settings {
	// settings 保存当前步骤的中间结果。
	settings := brainapp.Settings{Provider: brainapp.DefaultProvider, Model: brainapp.DefaultModel}
	if replier.store != nil && replier.store.Settings != nil {
		// err、value 保存当前步骤的中间结果。
		if value, err := replier.store.Settings.Get(ctx, "brain_provider"); err == nil && strings.TrimSpace(value) != "" {
			settings.Provider = strings.TrimSpace(value)
		}
		// err、value 保存当前步骤的中间结果。
		if value, err := replier.store.Settings.Get(ctx, "brain_model"); err == nil && strings.TrimSpace(value) != "" {
			settings.Model = strings.TrimSpace(value)
		}
	}
	return settings
}

// buildRequest 计算稳定 request/session ID，并通过账号表得到会话所有者。
func (replier *brainAIReplier) buildRequest(ctx context.Context, message engine.ChatMessage) (brainapp.ReplyRequest, string, int64, error) {
	if replier.store.Cookies == nil || replier.store.Brain == nil {
		return brainapp.ReplyRequest{}, "", 0, errors.New("brain 账号仓储未初始化")
	}
	// ownerErr、ownerID 保存当前步骤的中间结果。
	ownerID, ownerErr := replier.store.Cookies.GetOwnerID(ctx, replier.cookieID)
	if ownerErr != nil {
		return brainapp.ReplyRequest{}, "", 0, fmt.Errorf("读取 Brain 会话所有者失败: %w", ownerErr)
	}
	// requestID 保存当前步骤的中间结果。
	requestID := stableRequestID(message)
	// chatID 保存当前步骤的中间结果。
	chatID := strings.TrimSpace(message.ChatID)
	if chatID == "" {
		chatID = "anonymous"
	}
	// sessionID 保存当前步骤的中间结果。
	sessionID := stableSessionID(replier.cookieID, chatID)
	// now 保存当前步骤的中间结果。
	now := time.Now().UnixMilli()
	return brainapp.ReplyRequest{ContractVersion: brainapp.ContractVersion, RequestID: requestID, SessionID: sessionID,
		UserID: ownerID, AccountID: replier.cookieID, ChatID: strings.TrimSpace(message.ChatID), BuyerID: strings.TrimSpace(message.SenderUserID),
		ItemID: strings.TrimSpace(message.ItemID), Message: strings.TrimSpace(message.Text), DeadlineAt: now + brainReplyTimeout.Milliseconds()}, sessionID, now, nil
}

// reuseExistingTurn 等待或复用同一 request_id 的已有结果，杜绝重复模型调用和重复发送。
func (replier *brainAIReplier) reuseExistingTurn(ctx context.Context, request brainapp.ReplyRequest, message engine.ChatMessage, policy *db.AIReplySettings) (*engine.ReplyResult, error) {
	// deadline 保存当前步骤的中间结果。
	deadline := time.Now().Add(brainTurnPollBudget)
	for {
		// err、turn 保存当前步骤的中间结果。
		turn, err := replier.store.Brain.GetTurnByRequestID(ctx, request.RequestID)
		if err != nil {
			return nil, fmt.Errorf("读取重复 Brain turn 失败: %w", err)
		}
		if turn.ResultJSON != "" && turn.Status == "completed" {
			// draft 保存当前流程所需的配置或状态。
			var draft brainapp.ReplyDraft
			// unmarshalErr 保存当前步骤的中间结果。
			if unmarshalErr := json.Unmarshal([]byte(turn.ResultJSON), &draft); unmarshalErr != nil {
				return nil, fmt.Errorf("解析重复 Brain 草案失败: %w", unmarshalErr)
			}
			if draft.RequestID != request.RequestID {
				return nil, errors.New("重复 Brain 草案 request_id 不一致")
			}
			// normalizeErr、normalized 保存当前步骤的中间结果。
			normalized, normalizeErr := replier.normalizeDraft(ctx, message, draft, policy)
			if normalizeErr != nil {
				return nil, normalizeErr
			}
			return resultToEngine(normalized), nil
		}
		if turn.Status == "failed" || turn.Status == "timeout" || turn.Status == "fallback" {
			return &engine.ReplyResult{Skip: true, Source: "AI", BrainRequestID: request.RequestID}, nil
		}
		switch turn.SendStatus {
		case "sent", "skipped":
			return &engine.ReplyResult{Skip: true, Source: "AI", BrainRequestID: request.RequestID}, nil
		case "failed", "expired":
			return &engine.ReplyResult{Skip: true, Source: "AI", BrainRequestID: request.RequestID}, nil
		}
		if time.Now().After(deadline) {
			return &engine.ReplyResult{Skip: true, Source: "AI", BrainRequestID: request.RequestID}, nil
		}
		// timer 保存当前步骤的中间结果。
		timer := time.NewTimer(brainTurnPollInterval)
		select {
		case <-ctx.Done():
			timer.Stop()
			return &engine.ReplyResult{Skip: true, Source: "AI", BrainRequestID: request.RequestID}, nil
		case <-timer.C:
		}
	}
}

// normalizeDraft 在 Go 侧重新执行文本、意图、轮次和价格边界校验。
func (replier *brainAIReplier) normalizeDraft(ctx context.Context, message engine.ChatMessage, draft brainapp.ReplyDraft, policy *db.AIReplySettings) (brainapp.ReplyDraft, error) {
	if draft.RequestID == "" || draft.Status == "" || draft.Intent == "" {
		return brainapp.ReplyDraft{}, errors.New("brain 草案缺少必需字段")
	}
	if draft.Status != "reply" && draft.Status != "no_reply" && draft.Status != "handoff" {
		return brainapp.ReplyDraft{}, errors.New("brain 草案状态无效")
	}
	draft.ReplyText = strings.TrimSpace(draft.ReplyText)
	if draft.Status == "reply" && (draft.ReplyText == "" || len([]rune(draft.ReplyText)) > 4000) {
		return brainapp.ReplyDraft{}, errors.New("brain 回复文本长度无效")
	}
	if draft.Status != "reply" && draft.ReplyText != "" {
		return brainapp.ReplyDraft{}, errors.New("非回复 Brain 草案不能包含文本")
	}
	if draft.QuoteProposalCents != nil && *draft.QuoteProposalCents < 0 {
		return brainapp.ReplyDraft{}, errors.New("brain 报价不能为负数")
	}
	if draft.Status != "reply" {
		draft.QuoteProposalCents = nil
		return draft, nil
	}
	// Go 读取商品事实和历史轮次，Harness 不拥有这些业务真相。
	itemPrice := 0.0
	if replier.store.Items != nil && strings.TrimSpace(message.ItemID) != "" {
		// err、item 保存当前步骤的中间结果。
		if item, err := replier.store.Items.GetByCookieItem(ctx, replier.cookieID, message.ItemID); err == nil {
			itemPrice = parseBrainPrice(item.ItemPrice)
		}
	}
	// isBargain 保存当前步骤的中间结果。
	isBargain := brainBargainPattern.MatchString(strings.ToLower(message.Text))
	// bargainCount 保存当前步骤的中间结果。
	bargainCount := 0
	if replier.store.AIReply != nil && message.ChatID != "" && message.ItemID != "" {
		// count、err 保存当前步骤的中间结果。
		if count, err := replier.store.AIReply.CurrentBargainCount(ctx, replier.cookieID, message.ChatID, message.ItemID); err == nil {
			bargainCount = count
		}
	}
	if isBargain {
		bargainCount++
	}
	// withinLimit 保存当前步骤的中间结果。
	withinLimit := !isBargain || policy.MaxBargainRounds <= 0 || bargainCount <= policy.MaxBargainRounds
	// minimum 保存当前步骤的中间结果。
	minimum := minimumBrainPrice(itemPrice, policy.MaxDiscountPercent, policy.MaxDiscountAmount, withinLimit)
	// offered、unsafe 保存当前步骤的中间结果。
	if offered, unsafe := unsafeBrainOffer(draft.ReplyText, minimum); unsafe {
		if minimum <= 0 || minimum >= itemPrice || !withinLimit {
			draft.ReplyText = "抱歉，当前价格已经是最低价，暂时不能再优惠了。"
		} else {
			draft.ReplyText = fmt.Sprintf("可以优惠的最低价格是 %.2f 元，低于这个价格暂时无法成交。", minimum)
		}
		draft.QuoteProposalCents = nil
		_ = offered
	}
	if draft.QuoteProposalCents != nil {
		if !policy.AutoAdjustPriceEnabled || itemPrice <= 0 || minimum <= 0 || !withinLimit {
			draft.QuoteProposalCents = nil
		} else {
			// quote 保存当前步骤的中间结果。
			quote := float64(*draft.QuoteProposalCents) / 100
			if quote+0.0001 < minimum || quote > itemPrice+0.0001 || !brainReplyContainsPrice(draft.ReplyText, quote) {
				draft.QuoteProposalCents = nil
			}
		}
	}
	return draft, nil
}

// persistConversation 兼容旧 ai_conversations，使首次 Harness session 能继续使用历史上下文。
func (replier *brainAIReplier) persistConversation(ctx context.Context, message engine.ChatMessage, draft brainapp.ReplyDraft) error {
	if replier.store.AIReply == nil || message.ChatID == "" || message.ItemID == "" {
		return nil
	}
	// intent 保存当前步骤的中间结果。
	intent := draft.Intent
	if intent == "" {
		intent = "other"
	}
	// err 保存当前步骤的中间结果。
	if err := replier.store.AIReply.AddConversationExchange(ctx, replier.cookieID, message.ChatID, message.SenderUserID, message.ItemID,
		db.AIConversationMessage{Role: "user", Content: message.Text, Intent: intent},
		db.AIConversationMessage{Role: "assistant", Content: draft.ReplyText, Intent: "reply"}); err != nil {
		return fmt.Errorf("保存 Brain 对话上下文失败: %w", err)
	}
	return nil
}

// resultToEngine 将已校验草案映射到原有发送链；Go 仍控制 Skip 和报价落库。
func resultToEngine(draft brainapp.ReplyDraft) *engine.ReplyResult {
	// result 保存当前步骤的中间结果。
	result := &engine.ReplyResult{Source: "AI", BrainRequestID: draft.RequestID}
	if draft.Status != "reply" {
		result.Skip = true
		return result
	}
	result.Text = draft.ReplyText
	if draft.QuoteProposalCents != nil {
		result.AutoPriceQuote = &engine.AIPriceQuoteProposal{PriceCents: *draft.QuoteProposalCents}
	}
	return result
}

// stableRequestID 生成符合内部契约且对重复消息稳定的 `msg:<id>`。
func stableRequestID(message engine.ChatMessage) string {
	// candidate 保存当前步骤的中间结果。
	candidate := strings.TrimSpace(message.MessageID)
	// valid 保存当前步骤的中间结果。
	valid := candidate != "" && len(candidate) <= 256
	if valid {
		// r 表示当前遍历项及其索引。
		for _, r := range candidate {
			if unicode.IsSpace(r) {
				valid = false
				break
			}
		}
	}
	if !valid {
		candidate = digestBrainID(message.AccountID, message.ChatID, message.SenderUserID, message.ItemID, message.Text)
	}
	return "msg:" + candidate
}

// stableSessionID 让同一账号和聊天始终串行到同一 Harness session。
func stableSessionID(cookieID, chatID string) string {
	return brainSessionPrefix + digestBrainID(cookieID, chatID)
}

// digestBrainID 只返回不可逆的标识摘要，不把聊天原文写入 session ID。
func digestBrainID(values ...string) string {
	// hash 保存当前步骤的中间结果。
	hash := sha256.New()
	// value 表示当前遍历项及其索引。
	for _, value := range values {
		_, _ = hash.Write([]byte(value))
		_, _ = hash.Write([]byte{0})
	}
	return hex.EncodeToString(hash.Sum(nil))
}

// sanitizeBrainError 裁剪错误并移除常见密钥字段，供账本和日志使用。
func sanitizeBrainError(err error) string {
	if err == nil {
		return ""
	}
	// message 保存当前步骤的中间结果。
	message := strings.TrimSpace(err.Error())
	// marker 表示当前遍历项及其索引。
	for _, marker := range []string{"api_key=", "token=", "Authorization:", "Bearer "} {
		// index 保存当前步骤的中间结果。
		if index := strings.Index(strings.ToLower(message), strings.ToLower(marker)); index >= 0 {
			message = message[:index] + "[redacted]"
		}
	}
	return truncateBrainText(message, 500)
}

// parseBrainPrice 从本地商品价格字符串读取有限十进制金额。
func parseBrainPrice(value string) float64 {
	// cleaned 保存当前步骤的中间结果。
	cleaned := strings.Map(func(r rune) rune {
		if (r >= '0' && r <= '9') || r == '.' {
			return r
		}
		return -1
	}, value)
	// err、parsed 保存当前步骤的中间结果。
	parsed, err := strconv.ParseFloat(cleaned, 64)
	if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) {
		return 0
	}
	return parsed
}

// minimumBrainPrice 复用 Go 侧两个折扣上限中更严格的最低价。
func minimumBrainPrice(price float64, maxDiscountPercent, maxDiscountAmount int, allowDiscount bool) float64 {
	if price <= 0 || !allowDiscount || maxDiscountPercent <= 0 || maxDiscountAmount <= 0 {
		return price
	}
	// byPercent 保存当前步骤的中间结果。
	byPercent := price * (1 - float64(maxDiscountPercent)/100)
	// byAmount 保存当前步骤的中间结果。
	byAmount := price - float64(maxDiscountAmount)
	// minimum 保存当前步骤的中间结果。
	minimum := math.Max(0, math.Max(byPercent, byAmount))
	return math.Ceil(minimum*100-0.0000001) / 100
}

// unsafeBrainOffer 找出正文里突破最低价的第一个显式报价。
func unsafeBrainOffer(reply string, minimum float64) (float64, bool) {
	if minimum <= 0 {
		return 0, false
	}
	// match 表示当前遍历项及其索引。
	for _, match := range brainOfferPattern.FindAllStringSubmatch(reply, -1) {
		// err、value 保存当前步骤的中间结果。
		value, err := strconv.ParseFloat(match[1], 64)
		if err == nil && value+0.0001 < minimum {
			return value, true
		}
	}
	return 0, false
}

// brainReplyContainsPrice 确认买家可见文本与结构化报价完全一致。
func brainReplyContainsPrice(reply string, target float64) bool {
	// match 表示当前遍历项及其索引。
	for _, match := range brainOfferPattern.FindAllStringSubmatch(reply, -1) {
		// err、value 保存当前步骤的中间结果。
		value, err := strconv.ParseFloat(match[1], 64)
		if err == nil && math.Abs(value-target) < 0.0001 {
			return true
		}
	}
	return false
}

// truncateBrainText 限制摘要和错误的可持久化长度。
func truncateBrainText(value string, maximum int) string {
	// runes 保存当前步骤的中间结果。
	runes := []rune(strings.TrimSpace(value))
	if len(runes) <= maximum {
		return string(runes)
	}
	return string(runes[:maximum])
}

// brainBargainPattern 保存当前流程所需的配置或状态。
var brainBargainPattern = regexp.MustCompile(`(?i)(便宜|优惠|少点|最低|砍价|降价|打折|能不能.*(?:元|块)|\d+(?:\.\d+)?\s*(?:元|块).*(?:卖|行|可以))`)

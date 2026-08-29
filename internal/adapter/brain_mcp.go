package adapter

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/DH-devmax/xyu/internal/brainruntime"
	"github.com/DH-devmax/xyu/internal/db"
)

// NewBrainMCPBackend 创建只读业务上下文回调，供 gateway 的 MCP server 调用。
// 所有数据来自 Go 仓储；回调不提供发送、改价、数据库或进程工具。
func NewBrainMCPBackend(store *db.Store) brainruntime.MCPBackend {
	return func(ctx context.Context, name string, arguments map[string]any) (any, error) {
		if store == nil {
			return nil, errors.New("brain MCP 数据存储未初始化")
		}
		switch strings.TrimSpace(name) {
		case "get_conversation_context":
			return conversationContextForBrain(ctx, store, arguments)
		case "get_item_snapshot":
			return itemSnapshotForBrain(ctx, store, arguments)
		case "get_order_snapshot":
			return orderSnapshotForBrain(ctx, store, arguments)
		case "get_bargain_policy":
			return bargainPolicyForBrain(ctx, store, arguments)
		case "search_knowledge":
			return map[string]any{"query": stringArgument(arguments, "query"), "hits": []any{}}, nil
		default:
			return nil, fmt.Errorf("brain MCP 工具不在只读白名单: %s", name)
		}
	}
}

// conversationContextForBrain 返回最近的裁剪会话历史，不包含 Cookie 或系统密钥。
func conversationContextForBrain(ctx context.Context, store *db.Store, arguments map[string]any) (any, error) {
	// cookieID、chatID、itemID 限定上下文查询的业务范围。
	cookieID := stringArgument(arguments, "account_id")
	// chatID 限定当前会话。
	chatID := stringArgument(arguments, "chat_id")
	// itemID 限定当前商品。
	itemID := stringArgument(arguments, "item_id")
	if cookieID == "" || chatID == "" || itemID == "" || store.AIReply == nil {
		return map[string]any{"messages": []any{}}, nil
	}
	// messages 保存裁剪后的历史消息；err 保存查询错误。
	messages, err := store.AIReply.ConversationHistory(ctx, cookieID, chatID, itemID, 10)
	if err != nil {
		return nil, err
	}
	// result 保存供模型读取的最小消息字段集合。
	result := make([]map[string]any, 0, len(messages))
	// message 是当前遍历到的历史消息。
	for _, message := range messages {
		result = append(result, map[string]any{"role": message.Role, "content": message.Content, "intent": message.Intent, "bargain_count": message.BargainCount})
	}
	return map[string]any{"messages": result}, nil
}

// itemSnapshotForBrain 返回商品标题、描述和价格事实，缺失商品时保持空快照。
func itemSnapshotForBrain(ctx context.Context, store *db.Store, arguments map[string]any) (any, error) {
	// cookieID、itemID 限定商品快照的业务范围。
	cookieID := stringArgument(arguments, "account_id")
	// itemID 限定当前商品。
	itemID := stringArgument(arguments, "item_id")
	if cookieID == "" || itemID == "" || store.Items == nil {
		return map[string]any{"found": false}, nil
	}
	// item 保存商品事实；err 保存查询错误。
	item, err := store.Items.GetByCookieItem(ctx, cookieID, itemID)
	if errors.Is(err, db.ErrNotFound) {
		return map[string]any{"found": false, "item_id": itemID}, nil
	}
	if err != nil {
		return nil, err
	}
	return map[string]any{"found": true, "item_id": item.ItemID, "title": item.ItemTitle, "description": item.ItemDescription, "detail": item.ItemDetail, "price": item.ItemPrice, "category": item.ItemCategory}, nil
}

// orderSnapshotForBrain 返回订单状态事实并主动排除收货人姓名、电话和地址。
func orderSnapshotForBrain(ctx context.Context, store *db.Store, arguments map[string]any) (any, error) {
	// orderID 限定订单快照查询范围。
	orderID := stringArgument(arguments, "order_id")
	if orderID == "" || store.Orders == nil {
		return map[string]any{"found": false}, nil
	}
	// order 保存订单事实；err 保存查询错误。
	order, err := store.Orders.Get(ctx, orderID)
	if errors.Is(err, db.ErrNotFound) {
		return map[string]any{"found": false, "order_id": orderID}, nil
	}
	if err != nil {
		return nil, err
	}
	return map[string]any{"found": true, "order_id": order.OrderID, "item_id": order.ItemID, "buyer_id": order.BuyerID,
		"quantity": order.Quantity, "amount": order.Amount, "status": order.OrderStatus, "is_bargain": order.IsBargain != 0, "chat_id": order.ChatID}, nil
}

// bargainPolicyForBrain 返回 Go 侧议价限制，模型只能读取不能修改。
func bargainPolicyForBrain(ctx context.Context, store *db.Store, arguments map[string]any) (any, error) {
	// cookieID 限定议价策略的账号范围。
	cookieID := stringArgument(arguments, "account_id")
	if cookieID == "" || store.AIReply == nil {
		return map[string]any{"configured": false}, nil
	}
	// policy 保存账号策略；err 保存查询错误。
	policy, err := store.AIReply.GetPolicy(ctx, cookieID)
	if errors.Is(err, db.ErrNotFound) {
		return map[string]any{"configured": false}, nil
	}
	if err != nil {
		return nil, err
	}
	return map[string]any{"configured": true, "ai_enabled": policy.AIEnabled, "auto_adjust_price_enabled": policy.AutoAdjustPriceEnabled,
		"max_discount_percent": policy.MaxDiscountPercent, "max_discount_amount": policy.MaxDiscountAmount, "max_bargain_rounds": policy.MaxBargainRounds,
		"model": strings.TrimSpace(policy.ModelName)}, nil
}

// stringArgument 读取 MCP 受控字符串字段并限制长度，避免模型参数放大下游查询。
func stringArgument(arguments map[string]any, key string) string {
	// value、ok 保存受控参数读取结果。
	value, ok := arguments[key]
	if !ok {
		return ""
	}
	// text 保存裁剪后的字符串参数。
	text := strings.TrimSpace(fmt.Sprint(value))
	if len(text) > 512 {
		return text[:512]
	}
	return text
}

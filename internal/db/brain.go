package db

import (
	"context"
	"database/sql"
	"errors"
	"strings"
)

// BrainSession 保存 Harness 会话的可查询摘要，不包含模型凭证或完整业务对象。
type BrainSession struct {
	// ID 是 gateway 复用 Harness session 的稳定标识。
	ID string
	// UserID 是本地账号所有者，用于普通用户范围隔离。
	UserID int64
	// CookieID 是业务账号标识，只用于归属和上下文关联。
	CookieID string
	// ChatID 是平台聊天会话标识。
	ChatID string
	// ItemID 是当前对话关联商品标识；未知时为空。
	ItemID string
	// Status 是 idle、running、degraded 或 closed。
	Status string
	// Provider 是本轮使用的 Harness provider route。
	Provider string
	// Model 是本轮使用的模型标识。
	Model string
	// Summary 是可重建的短上下文摘要，不包含凭证。
	Summary string
	// LastRequestID 是最近处理的消息幂等键。
	LastRequestID string
	// CreatedAt 是记录创建 Unix 毫秒时间。
	CreatedAt int64
	// UpdatedAt 是记录最近变化 Unix 毫秒时间。
	UpdatedAt int64
}

// BrainTurn 保存单条消息从排队到发送终态的幂等账本。
type BrainTurn struct {
	// ID 是数据库自增主键。
	ID int64
	// SessionID 是所属 Harness 会话标识。
	SessionID string
	// RequestID 是 `msg:<message_id>` 形式的全局幂等键。
	RequestID string
	// Status 是 queued、running、completed、fallback、timeout 或 failed。
	Status string
	// TraceJSON 是经过裁剪的类型化 session event JSON，不包含模型密钥。
	TraceJSON string
	// ResultJSON 是 gateway 返回的草案 JSON；未完成时为空。
	ResultJSON string
	// ErrorMessage 是脱敏后的失败诊断。
	ErrorMessage string
	// SendStatus 是 pending、sending、sent、skipped、failed 或 expired。
	SendStatus string
	// DeadlineAt 是 Go 不再接受迟到结果的 Unix 毫秒时间。
	DeadlineAt int64
	// CreatedAt 是账本创建 Unix 毫秒时间。
	CreatedAt int64
	// UpdatedAt 是账本最近变化 Unix 毫秒时间。
	UpdatedAt int64
}

// BrainStore 管理 Harness 会话摘要与消息幂等账本。
type BrainStore struct {
	// DB 是底层连接池；调用方不得绕过本仓储执行 brain SQL。
	DB *sql.DB
	// Dialect 决定冲突忽略和 upsert 的跨方言语法。
	Dialect Dialect
}

// UpsertSession 创建会话或更新其运行摘要，首次创建时间保持不变。
func (store *BrainStore) UpsertSession(ctx context.Context, session BrainSession) error {
	if store == nil || store.DB == nil {
		return errors.New("brain 会话存储未初始化")
	}
	// query 是按会话主键更新可变摘要字段的跨方言语句。
	query := `INSERT INTO brain_sessions
		(id,user_id,cookie_id,chat_id,item_id,status,provider,model,summary,last_request_id,created_at,updated_at)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?)` + dialectUpsert(store.Dialect, []string{"id"}, map[string]string{
		"item_id": "EXCLUDED.item_id", "last_request_id": "EXCLUDED.last_request_id",
		"model": "EXCLUDED.model", "provider": "EXCLUDED.provider", "status": "EXCLUDED.status",
		"summary": "EXCLUDED.summary", "updated_at": "EXCLUDED.updated_at",
	})
	// resultErr 是会话摘要写入失败原因。
	_, resultErr := store.DB.ExecContext(ctx, query, session.ID, session.UserID, session.CookieID, session.ChatID,
		session.ItemID, session.Status, session.Provider, session.Model, session.Summary, session.LastRequestID,
		session.CreatedAt, session.UpdatedAt)
	return resultErr
}

// CreateTurn 幂等创建消息账本；返回 false 表示同一 request_id 已存在。
func (store *BrainStore) CreateTurn(ctx context.Context, turn BrainTurn) (bool, error) {
	if store == nil || store.DB == nil {
		return false, errors.New("brain turn 存储未初始化")
	}
	// query 使用每种数据库的原生冲突忽略语义，重复消息不会覆盖先前终态。
	query := dialectInsertIgnorePrefix(store.Dialect) + ` INTO brain_turns
		(session_id,request_id,status,trace_json,result_json,error_message,send_status,deadline_at,created_at,updated_at)
		VALUES (?,?,?,?,?,?,?,?,?,?)` + dialectInsertIgnore(store.Dialect, []string{"request_id"})
	// result、insertErr 是账本插入结果及其数据库错误。
	result, insertErr := store.DB.ExecContext(ctx, query, turn.SessionID, turn.RequestID, turn.Status,
		turn.TraceJSON, turn.ResultJSON, turn.ErrorMessage, turn.SendStatus, turn.DeadlineAt, turn.CreatedAt, turn.UpdatedAt)
	if insertErr != nil {
		return false, insertErr
	}
	// affected、affectedErr 表示本次是否真正创建新账本。
	affected, affectedErr := result.RowsAffected()
	return affected == 1, affectedErr
}

// FinishTurn 只更新尚未发送的账本结果，迟到调用不能覆盖发送终态。
func (store *BrainStore) FinishTurn(ctx context.Context, requestID, status, traceJSON, resultJSON, errorMessage string, updatedAt int64) error {
	if store == nil || store.DB == nil {
		return errors.New("brain turn 存储未初始化")
	}
	// result、updateErr 是符合 pending 发送条件的账本更新结果及错误。
	result, updateErr := store.DB.ExecContext(ctx, `UPDATE brain_turns
		SET status=?,trace_json=?,result_json=?,error_message=?,updated_at=?
		WHERE request_id=? AND send_status='pending'`, status, traceJSON, resultJSON, errorMessage, updatedAt, requestID)
	if updateErr != nil {
		return updateErr
	}
	// affected、affectedErr 用于区分不存在或已有发送终态的幂等账本。
	affected, affectedErr := result.RowsAffected()
	if affectedErr != nil {
		return affectedErr
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// MarkTurnSendStatus 以 compare-and-set 方式写入唯一发送终态。
func (store *BrainStore) MarkTurnSendStatus(ctx context.Context, requestID, sendStatus, errorMessage string, updatedAt int64) (bool, error) {
	if store == nil || store.DB == nil {
		return false, errors.New("brain turn 存储未初始化")
	}
	// result、updateErr 是 pending 到终态的原子状态转换结果及错误。
	result, updateErr := store.DB.ExecContext(ctx, `UPDATE brain_turns
		SET send_status=?,error_message=?,updated_at=? WHERE request_id=? AND send_status IN ('pending','sending')`,
		sendStatus, errorMessage, updatedAt, requestID)
	if updateErr != nil {
		return false, updateErr
	}
	// affected、affectedErr 表示当前调用是否拥有本次终态转换。
	affected, affectedErr := result.RowsAffected()
	return affected == 1, affectedErr
}

// ClaimTurnSend 把已完成草案从 pending 原子领取为 sending，防止并发调用重复发送。
func (store *BrainStore) ClaimTurnSend(ctx context.Context, requestID string, updatedAt int64) (bool, error) {
	if store == nil || store.DB == nil {
		return false, errors.New("brain turn 存储未初始化")
	}
	// result、updateErr 保存当前步骤的中间结果。
	result, updateErr := store.DB.ExecContext(ctx, `UPDATE brain_turns
		SET send_status='sending',updated_at=?
		WHERE request_id=? AND status='completed' AND send_status='pending'`, updatedAt, requestID)
	if updateErr != nil {
		return false, updateErr
	}
	// affected、affectedErr 保存当前步骤的中间结果。
	affected, affectedErr := result.RowsAffected()
	return affected == 1, affectedErr
}

// GetTurnByRequestID 读取消息账本，用于重复消息复用既有结果而不再次请求模型。
func (store *BrainStore) GetTurnByRequestID(ctx context.Context, requestID string) (BrainTurn, error) {
	// turn 保存数据库返回的单条消息账本。
	var turn BrainTurn
	if store == nil || store.DB == nil {
		return turn, errors.New("brain turn 存储未初始化")
	}
	// queryErr 是账本字段扫描错误；不存在时保持 sql.ErrNoRows 语义。
	queryErr := store.DB.QueryRowContext(ctx, `SELECT id,session_id,request_id,status,trace_json,result_json,
		error_message,send_status,deadline_at,created_at,updated_at FROM brain_turns WHERE request_id=?`, requestID).Scan(
		&turn.ID, &turn.SessionID, &turn.RequestID, &turn.Status, &turn.TraceJSON, &turn.ResultJSON,
		&turn.ErrorMessage, &turn.SendStatus, &turn.DeadlineAt, &turn.CreatedAt, &turn.UpdatedAt)
	return turn, queryErr
}

// ListSessions 按更新时间倒序返回管理员全局或普通用户自己的会话摘要。
func (store *BrainStore) ListSessions(ctx context.Context, userID int64, admin bool, limit int) ([]BrainSession, error) {
	if store == nil || store.DB == nil {
		return nil, errors.New("brain 会话存储未初始化")
	}
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	// query 是管理员和普通用户共享的基础查询；普通用户追加所有者过滤。
	query := `SELECT id,user_id,cookie_id,chat_id,item_id,status,provider,model,summary,last_request_id,created_at,updated_at FROM brain_sessions`
	// args 保存普通用户过滤和分页参数。
	args := make([]any, 0, 2)
	if !admin {
		query += ` WHERE user_id=?`
		args = append(args, userID)
	}
	query += ` ORDER BY updated_at DESC,id LIMIT ?`
	args = append(args, limit)
	// rows、queryErr 是会话查询游标及其错误。
	rows, queryErr := store.DB.QueryContext(ctx, query, args...)
	if queryErr != nil {
		return nil, queryErr
	}
	defer rows.Close()
	// sessions 保存当前授权范围内的会话摘要。
	sessions := make([]BrainSession, 0)
	for rows.Next() {
		// session 保存当前扫描的会话摘要。
		var session BrainSession
		// scanErr 是当前行字段类型或数量不匹配错误。
		if scanErr := rows.Scan(&session.ID, &session.UserID, &session.CookieID, &session.ChatID, &session.ItemID,
			&session.Status, &session.Provider, &session.Model, &session.Summary, &session.LastRequestID,
			&session.CreatedAt, &session.UpdatedAt); scanErr != nil {
			return nil, scanErr
		}
		sessions = append(sessions, session)
	}
	return sessions, rows.Err()
}

// GetSession 返回授权范围内的会话及其最近 turn；普通用户不能观察其他用户轨迹。
func (store *BrainStore) GetSession(ctx context.Context, userID int64, admin bool, sessionID string, turnLimit int) (BrainSession, []BrainTurn, error) {
	// session 保存待返回的会话摘要。
	var session BrainSession
	if store == nil || store.DB == nil {
		return session, nil, errors.New("brain 会话存储未初始化")
	}
	if turnLimit <= 0 || turnLimit > 200 {
		turnLimit = 50
	}
	// query 是管理员和普通用户共享的会话读取语句。
	query := `SELECT id,user_id,cookie_id,chat_id,item_id,status,provider,model,summary,last_request_id,created_at,updated_at FROM brain_sessions WHERE id=?`
	// args 保存会话标识和可选用户范围。
	args := []any{strings.TrimSpace(sessionID)}
	if !admin {
		query += ` AND user_id=?`
		args = append(args, userID)
	}
	// sessionErr 是会话不存在、越权或字段扫描失败。
	sessionErr := store.DB.QueryRowContext(ctx, query, args...).Scan(&session.ID, &session.UserID, &session.CookieID,
		&session.ChatID, &session.ItemID, &session.Status, &session.Provider, &session.Model, &session.Summary,
		&session.LastRequestID, &session.CreatedAt, &session.UpdatedAt)
	if sessionErr != nil {
		return session, nil, sessionErr
	}
	// rows、turnErr 是最近 turn 查询游标及错误。
	rows, turnErr := store.DB.QueryContext(ctx, `SELECT id,session_id,request_id,status,trace_json,result_json,
		error_message,send_status,deadline_at,created_at,updated_at FROM brain_turns
		WHERE session_id=? ORDER BY created_at DESC,id DESC LIMIT ?`, session.ID, turnLimit)
	if turnErr != nil {
		return session, nil, turnErr
	}
	defer rows.Close()
	// turns 保存从新到旧的会话轨迹摘要。
	turns := make([]BrainTurn, 0)
	for rows.Next() {
		// turn 保存当前扫描到的消息账本。
		var turn BrainTurn
		// scanErr 是 turn 字段扫描失败原因。
		if scanErr := rows.Scan(&turn.ID, &turn.SessionID, &turn.RequestID, &turn.Status, &turn.TraceJSON,
			&turn.ResultJSON, &turn.ErrorMessage, &turn.SendStatus, &turn.DeadlineAt, &turn.CreatedAt,
			&turn.UpdatedAt); scanErr != nil {
			return session, nil, scanErr
		}
		turns = append(turns, turn)
	}
	return session, turns, rows.Err()
}

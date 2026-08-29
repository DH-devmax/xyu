/**
 * Harness 专用结果工具：它只校验并回显回复草案，不执行消息发送、改价或数据库写入。
 */

// name 是 Cordis 加载器用于诊断和去重的稳定插件名。
export const name = 'dh-xianyu-reply-draft-result';
// inject 限定插件只依赖模型工具注册能力，不获取文件系统或子进程服务。
export const inject = ['tools'];

// statuses 是 Go 产品契约允许的草案终态。
const statuses = new Set(['reply', 'no_reply', 'handoff']);
// intents 是 v2 客服轨迹中允许的稳定意图分类。
const intents = new Set(['chat', 'bargain', 'support', 'handoff', 'other']);

/** validateDraft 在工具执行边界复核模型参数，返回可安全写入轨迹的规范对象。 */
export function validateDraft(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('submit_reply_draft expects an object');
  }
  // requestId 必须与 Go 幂等账本的 `msg:<message_id>` 命名规则一致。
  const requestId = typeof input.request_id === 'string' ? input.request_id.trim() : '';
  // status 决定 Go 后续是否校验文本、无回复或人工接管原因。
  const status = typeof input.status === 'string' ? input.status : '';
  // intent 只用于审计和策略验证，不直接触发外部动作。
  const intent = typeof input.intent === 'string' ? input.intent : '';
  if (!/^msg:[^\s]{1,256}$/.test(requestId)) throw new TypeError('invalid request_id');
  if (!statuses.has(status)) throw new TypeError('invalid status');
  if (!intents.has(intent)) throw new TypeError('invalid intent');

  // replyText 是可选回复草案，最终长度和内容仍由 Go 业务策略验证。
  const replyText = typeof input.reply_text === 'string' ? input.reply_text.trim() : '';
  if (status === 'reply' && (replyText.length === 0 || replyText.length > 4000)) {
    throw new TypeError('reply status requires reply_text with at most 4000 characters');
  }
  if (status !== 'reply' && replyText.length > 0) throw new TypeError('non-reply status cannot include reply_text');

  // quoteProposalCents 是以分为单位的可选建议，不具有改价执行权。
  const quoteProposalCents = input.quote_proposal_cents;
  if (quoteProposalCents !== undefined && quoteProposalCents !== null
    && (!Number.isSafeInteger(quoteProposalCents) || quoteProposalCents < 0)) {
    throw new TypeError('invalid quote_proposal_cents');
  }
  // handoffReason 记录人工接管的简短原因，不应包含凭证或完整上下文。
  const handoffReason = typeof input.handoff_reason === 'string' ? input.handoff_reason.trim() : '';
  if (status === 'handoff' && (handoffReason.length === 0 || handoffReason.length > 500)) {
    throw new TypeError('handoff status requires handoff_reason with at most 500 characters');
  }

  return {
    request_id: requestId,
    status,
    intent,
    ...(replyText === '' ? {} : { reply_text: replyText }),
    ...(quoteProposalCents === undefined || quoteProposalCents === null ? {} : { quote_proposal_cents: quoteProposalCents }),
    ...(handoffReason === '' ? {} : { handoff_reason: handoffReason }),
  };
}

/** apply 注册唯一的草案提交工具，执行结果只作为 SDK session event 的可观测回执。 */
export function apply(ctx) {
  ctx.tools.register({
    name: 'submit_reply_draft',
    description: 'Submit exactly one structured customer-service draft for the current request. This records a proposal only and performs no external action.',
    parameters: {
      request_id: { type: 'string', required: true, description: 'Idempotency key in msg:<message_id> form.' },
      status: { type: 'string', enum: ['reply', 'no_reply', 'handoff'], required: true },
      reply_text: { type: 'string', description: 'Required only when status is reply.' },
      intent: { type: 'string', enum: ['chat', 'bargain', 'support', 'handoff', 'other'], required: true },
      quote_proposal_cents: { type: 'integer', minimum: 0, description: 'Optional price proposal in cents.' },
      handoff_reason: { type: 'string', description: 'Required only when status is handoff.' },
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify({ accepted: true, draft: value }) }],
    },
    execute: args => validateDraft(args),
  });
}

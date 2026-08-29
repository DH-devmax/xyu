import assert from 'node:assert/strict';
import test from 'node:test';
import { apply, validateDraft } from './result-tool.mjs';

test('validateDraft accepts a bounded reply proposal', () => {
  assert.deepEqual(validateDraft({
    request_id: 'msg:fixture-1',
    status: 'reply',
    reply_text: ' 可以，这已经是优惠价了。 ',
    intent: 'bargain',
    quote_proposal_cents: 9900,
  }), {
    request_id: 'msg:fixture-1',
    status: 'reply',
    reply_text: '可以，这已经是优惠价了。',
    intent: 'bargain',
    quote_proposal_cents: 9900,
  });
});

test('validateDraft rejects malformed or action-like results', () => {
  assert.throws(() => validateDraft({ request_id: 'bad', status: 'reply', reply_text: 'x', intent: 'chat' }));
  assert.throws(() => validateDraft({ request_id: 'msg:1', status: 'reply', reply_text: '', intent: 'chat' }));
  assert.throws(() => validateDraft({ request_id: 'msg:1', status: 'no_reply', reply_text: 'x', intent: 'other' }));
  assert.throws(() => validateDraft({ request_id: 'msg:1', status: 'handoff', intent: 'handoff' }));
});

test('apply registers only submit_reply_draft', async () => {
  // registered 保存测试 Context 收到的唯一工具定义。
  const registered = [];
  // ctx 是只实现 tools.register 的最小 Cordis 替身，用于证明插件不依赖其他能力。
  const ctx = { tools: { register: tool => registered.push(tool) } };
  apply(ctx);
  assert.equal(registered.length, 1);
  assert.equal(registered[0].name, 'submit_reply_draft');
  assert.deepEqual(await registered[0].execute({
    request_id: 'msg:fixture-2', status: 'no_reply', intent: 'other',
  }), { request_id: 'msg:fixture-2', status: 'no_reply', intent: 'other' });
});

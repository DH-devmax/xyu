import type { components } from './generated/schema';

/** BrainStatusTransport 表示 Brain runtime 的脱敏状态响应。 */
export type BrainStatusTransport = components['schemas']['BrainStatusResponse'];
/** BrainSettingsTransport 表示管理员可见的脱敏 provider 设置。 */
export type BrainSettingsTransport = components['schemas']['BrainSettingsResponse'];
/** BrainSettingsUpdateTransport 表示管理员提交的 provider 设置请求。 */
export type BrainSettingsUpdateTransport = components['schemas']['BrainSettingsUpdateRequest'];
/** BrainToolTransport 表示客服 profile 暴露的单个工具。 */
export type BrainToolTransport = components['schemas']['BrainTool'];
/** BrainSessionTransport 表示 Brain 会话列表中的稳定摘要。 */
export type BrainSessionTransport = components['schemas']['BrainSession'];
/** BrainSessionDetailTransport 表示会话详情及其轮次账本。 */
export type BrainSessionDetailTransport = components['schemas']['BrainSessionDetailResponse'];
/** BrainTurnTransport 表示 Brain 幂等账本中的单轮执行记录。 */
export type BrainTurnTransport = components['schemas']['BrainTurn'];
/** BrainTestTurnRequestTransport 表示隔离测试台的最小消息载荷。 */
export type BrainTestTurnRequestTransport = components['schemas']['BrainTestTurnRequest'];
/** BrainReplyDraftTransport 表示 Harness 返回的草案结果。 */
export type BrainReplyDraftTransport = components['schemas']['BrainReplyDraftResponse'];
/** BrainSessionsTransport 表示当前用户可见的 Brain 会话列表。 */
export type BrainSessionsTransport = components['schemas']['BrainSessionsResponse'];
/** BrainToolsTransport 表示客服 profile 的工具目录响应。 */
export type BrainToolsTransport = components['schemas']['BrainToolsResponse'];

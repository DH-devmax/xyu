import { contractClient, runContractRequest } from '../../../shared/api-contract/client';
import type { RequestControlOptions } from '../../../shared/http/client';
import type { components } from '../../../shared/api-contract/generated/schema';

// BrainStatus 是 Brain runtime 状态接口的前端只读模型。
export type BrainStatus = components['schemas']['BrainStatusResponse'];
// BrainSettings 是脱敏后的 Brain provider 配置模型。
export type BrainSettings = components['schemas']['BrainSettingsResponse'];
// BrainSettingsUpdate 是管理员保存 Brain provider 配置时使用的请求模型。
export type BrainSettingsUpdate = components['schemas']['BrainSettingsUpdateRequest'];
// BrainTool 是客服 profile 暴露的单个工具描述。
export type BrainTool = components['schemas']['BrainTool'];
// BrainSession 是 Brain 会话列表中的稳定摘要模型。
export type BrainSession = components['schemas']['BrainSession'];
// BrainSessionDetail 是会话详情及其轮次账本。
export type BrainSessionDetail = components['schemas']['BrainSessionDetailResponse'];
// BrainTurn 是 Brain 幂等账本中的单轮执行记录。
export type BrainTurn = components['schemas']['BrainTurn'];
// BrainTestTurnRequest 是隔离测试台提交的最小消息载荷。
export type BrainTestTurnRequest = components['schemas']['BrainTestTurnRequest'];
// BrainReplyDraft 是 Harness 返回的草案结果。
export type BrainReplyDraft = components['schemas']['BrainReplyDraftResponse'];

/** 读取 Brain runtime 状态和最近一次错误摘要。 */
export const getBrainStatus = (options?: RequestControlOptions): Promise<BrainStatus> =>
  runContractRequest(/* signal 控制 Brain 状态读取请求的取消和超时。 */ signal => contractClient.GET('/api/v1/brain/status', { signal }), options);

/** 读取管理员可见的脱敏 provider 设置。 */
export const getBrainSettings = (options?: RequestControlOptions): Promise<BrainSettings> =>
  runContractRequest(/* signal 控制 Brain 设置读取请求的取消和超时。 */ signal => contractClient.GET('/api/v1/brain/settings', { signal }), options);

/** 保存 Brain provider 设置，密钥只通过 action/value 一次性提交。 */
export const updateBrainSettings = (payload: BrainSettingsUpdate, options?: RequestControlOptions): Promise<BrainSettings> =>
  runContractRequest(/* signal 控制 Brain 设置更新请求的取消和超时。 */ signal => contractClient.PUT('/api/v1/brain/settings', { body: payload, signal }), options);

/** 读取当前用户可见的 Brain 会话摘要。 */
export const getBrainSessions = (limit = 50, options?: RequestControlOptions): Promise<{ sessions: BrainSession[] }> =>
  runContractRequest(/* signal 控制 Brain 会话列表请求的取消和超时。 */ signal => contractClient.GET('/api/v1/brain/sessions', { params: { query: { limit } }, signal }), options);

/** 读取单个 Brain 会话及其轮次账本。 */
export const getBrainSession = (id: string, limit = 50, options?: RequestControlOptions): Promise<BrainSessionDetail> =>
  runContractRequest(/* signal 控制 Brain 会话详情请求的取消和超时。 */ signal => contractClient.GET('/api/v1/brain/sessions/{id}', { params: { path: { id }, query: { limit } }, signal }), options);

/** 读取客服 profile 的工具白名单。 */
export const getBrainTools = (options?: RequestControlOptions): Promise<{ tools: BrainTool[] }> =>
  runContractRequest(/* signal 控制 Brain 工具目录请求的取消和超时。 */ signal => contractClient.GET('/api/v1/brain/tools', { signal }), options);

/** 在隔离 session 中执行一轮 Harness 草案生成。 */
export const runBrainTestTurn = (payload: BrainTestTurnRequest, options?: RequestControlOptions): Promise<BrainReplyDraft> =>
  runContractRequest(/* signal 控制 Brain 测试轮次请求的取消和超时。 */ signal => contractClient.POST('/api/v1/brain/test-turn', { body: payload, signal }), options);

/** 请求 Go supervisor 优雅重启 Brain runtime。 */
export const restartBrain = (options?: RequestControlOptions): Promise<{ success: boolean; message?: string }> =>
  runContractRequest(/* signal 控制 Brain runtime 重启请求的取消和超时。 */ signal => contractClient.POST('/api/v1/brain/restart', { signal }), options);

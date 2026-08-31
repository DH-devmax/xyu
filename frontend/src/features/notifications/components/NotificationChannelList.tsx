import { Bell,Edit2,Loader2,Send,Trash2 } from 'lucide-react';
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { NotificationChannel } from '../api';
import { notificationChannelTypes,notificationEventSummary } from '../state';
import { MinimalEmptyState, MinimalSectionCard, MinimalStatusChip } from '@/components/minimal';

// NotificationChannelListProps 描述通知渠道列表的操作边界。
export interface NotificationChannelListProps {
  // channels 是当前可展示的通知渠道。
  channels: NotificationChannel[];
  // testingId 是当前正在测试发送的渠道 ID。
  testingId: string;
  // onEdit 打开指定渠道的编辑弹窗。
  onEdit: (channel: NotificationChannel) => void;
  // onDelete 删除指定渠道。
  onDelete: (channel: NotificationChannel) => void | Promise<void>;
  // onToggleEnabled 切换指定渠道的启用状态。
  onToggleEnabled: (channel: NotificationChannel) => void | Promise<void>;
  // onTest 发送指定渠道的测试通知。
  onTest: (channel: NotificationChannel) => void | Promise<void>;
}

// NotificationChannelList 渲染渠道摘要、启用状态和操作按钮。
export const NotificationChannelList: React.FC<NotificationChannelListProps> = ({ channels, testingId, onEdit, onDelete, onToggleEnabled, onTest }) => {
  // findChannel 从按钮数据属性中查找对应渠道。
  const findChannel = (event: React.MouseEvent<HTMLButtonElement>): NotificationChannel | null => channels.find(
    // channel 是当前待匹配的渠道数据。
    channel => channel.id === event.currentTarget.dataset.channelId,
  ) || null;
  // handleToggleClick 处理渠道启用状态按钮点击。
  const handleToggleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // channel 是按钮对应的渠道数据。
    const channel = findChannel(event);
    if (channel) void onToggleEnabled(channel);
  };
  // handleTestClick 处理渠道测试按钮点击。
  const handleTestClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // channel 是按钮对应的渠道数据。
    const channel = findChannel(event);
    if (channel) void onTest(channel);
  };
  // handleEditClick 处理渠道编辑按钮点击。
  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // channel 是按钮对应的渠道数据。
    const channel = findChannel(event);
    if (channel) onEdit(channel);
  };
  // handleDeleteClick 处理渠道删除按钮点击。
  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // channel 是按钮对应的渠道数据。
    const channel = findChannel(event);
    if (channel) void onDelete(channel);
  };
  // renderChannel 渲染单个通知渠道卡片。
  const renderChannel = (channel: NotificationChannel) => {
    // meta 是当前渠道类型的静态展示配置。
    const meta = notificationChannelTypes[channel.type] || notificationChannelTypes.webhook;
    // Icon 是当前渠道类型对应的图标组件。
    const Icon = meta.icon;
    return (
      <MinimalSectionCard key={channel.id} data-layout-contract="minimal-notification-channel" contentSx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Box sx={{ width: 44, height: 44, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 1, bgcolor: 'action.hover', color: 'text.secondary' }}>
            <Icon size={20} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channel.name}</Typography>
              <MinimalStatusChip label={meta.label} color="default" />
              {!channel.enabled && <MinimalStatusChip label="已停用" color="warning" />}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meta.fields.map(
                // field 是当前渠道摘要需要读取的配置字段。
                field => channel.config?.[field.key],
              ).filter(Boolean).map(
                // value 是渠道配置中非空的摘要值。
                (value, index) => <span key={index} style={{ marginRight: 12 }}>{String(value).length > 40 ? `${String(value).slice(0, 40)}…` : String(value)}</span>,
              )}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>订阅：{notificationEventSummary(channel.event_types)}</Typography>
          </Box>
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Button data-channel-id={channel.id} onClick={handleToggleClick} size="small" color={channel.enabled ? 'success' : 'inherit'} variant="outlined">
              {channel.enabled ? '启用中' : '已停用'}
            </Button>
            <Button data-channel-id={channel.id} onClick={handleTestClick} disabled={testingId === channel.id} size="small" variant="outlined" startIcon={testingId === channel.id ? <Loader2 size={14} /> : <Send size={14} />}>
              测试
            </Button>
            <Tooltip title="编辑"><IconButton data-channel-id={channel.id} onClick={handleEditClick} aria-label="编辑" size="small"><Edit2 size={16} /></IconButton></Tooltip>
            <Tooltip title="删除"><IconButton data-channel-id={channel.id} onClick={handleDeleteClick} aria-label="删除" size="small" color="error"><Trash2 size={16} /></IconButton></Tooltip>
          </Stack>
        </Stack>
      </MinimalSectionCard>
    );
  };

  if (channels.length === 0) {
    return <MinimalEmptyState icon={<Bell size={40} />} title="还没有配置任何通知渠道" description="点击右上角「新建渠道」开始配置" />;
  }
  return <Stack data-layout-contract="minimal-notification-channels" spacing={1.5}>{channels.map(renderChannel)}</Stack>;
};

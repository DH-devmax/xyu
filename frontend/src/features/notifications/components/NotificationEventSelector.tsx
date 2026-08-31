import React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { NotificationEventType } from '../api';
import { notificationEvents } from '../state';

// NotificationEventSelectorProps 描述通知事件绑定组件的输入状态。
export interface NotificationEventSelectorProps {
  // selectedEvents 是当前已选择的通知事件。
  selectedEvents: NotificationEventType[];
  // onToggleEvent 切换指定通知事件的绑定状态。
  onToggleEvent: (event: NotificationEventType) => void;
}

// NotificationEventSelector 渲染通知渠道可订阅的事件列表。
export const NotificationEventSelector: React.FC<NotificationEventSelectorProps> = ({ selectedEvents, onToggleEvent }) => {
  // handleEventClick 将用户点击的事件传回表单状态。
  const handleEventClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // eventValue 是按钮数据属性中的后端事件类型。
    const eventValue = event.currentTarget.dataset.event as NotificationEventType | undefined;
    if (eventValue) onToggleEvent(eventValue);
  };

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>通知内容</Typography>
        <Typography variant="caption" color="text.secondary">不选择表示接收全部通知；选择后仅接收勾选类型。</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1 }}>
        {notificationEvents.map(
          // event 是当前通知事件定义。
          event => {
            // checked 表示当前事件是否已被选中。
            const checked = selectedEvents.includes(event.value);
            return (
              <ButtonBase
                key={event.value}
                data-event={event.value}
                data-selected={checked ? 'true' : 'false'}
                onClick={handleEventClick}
                sx={{
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  border: 1,
                  borderRadius: 1,
                  borderColor: checked ? 'primary.main' : 'divider',
                  bgcolor: checked ? 'action.selected' : 'background.paper',
                  p: 1.25,
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                <Checkbox checked={checked} tabIndex={-1} disableRipple size="small" sx={{ p: 0, mr: 1 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: checked ? 'primary.main' : 'text.primary' }}>{event.label}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{event.description}</Typography>
                </Box>
              </ButtonBase>
            );
          },
        )}
      </Box>
    </Stack>
  );
};

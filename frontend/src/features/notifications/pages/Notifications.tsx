import { Bell,Check,Plus,RefreshCw,X } from 'lucide-react';
import React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { NotificationChannelList } from '../components/NotificationChannelList';
import { NotificationChannelModal } from '../components/NotificationChannelModal';
import { NotificationSmtpSettings } from '../components/NotificationSmtpSettings';
import { useNotifications } from '../hooks';
import { MinimalPageFrame, MinimalSectionCard } from '@/components/minimal';

// NotificationsProps 描述通知页面接收的权限上下文。
interface NotificationsProps {
  // isAdmin 表示当前用户是否可以查看和保存系统 SMTP 配置。
  isAdmin?: boolean;
}

// Notifications 渲染通知渠道列表、SMTP 配置和渠道编辑边界。
const Notifications: React.FC<NotificationsProps> = ({ isAdmin = false }) => {
  // notificationState 统一提供通知页面的数据、表单和异步动作。
  const notificationState = useNotifications(isAdmin);
  // activePanel 控制 Minimal Tabs 当前展示的通知配置分区。
  const [activePanel, setActivePanel] = React.useState<'channels' | 'smtp'>('channels');

  // handlePanelChange 保持普通用户只能停留在渠道配置分区。
  const handlePanelChange = (_event: React.SyntheticEvent, nextValue: string) => {
    if (nextValue === 'smtp' && !isAdmin) {
      setActivePanel('channels');
      return;
    }
    setActivePanel(nextValue as 'channels' | 'smtp');
  };

  return (
    <MinimalPageFrame
      title="通知设置"
      description="配置通知渠道，账号异常时主动推送告警"
      actions={(
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshCw size={16} />} onClick={notificationState.loadChannels}>刷新</Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={notificationState.openCreate}>新建渠道</Button>
        </Stack>
      )}
    >
      <Stack spacing={{ xs: 2, md: 3 }}>
        <MinimalSectionCard data-layout-contract="minimal-notification-summary" contentSx={{ p: { xs: 2, sm: 2.5 } }}>
          <Alert severity="info" icon={<Bell size={20} />}>
            配置通知渠道并在「账号管理 → 编辑」里绑定后，以下事件会主动推送到该账号绑定的渠道：
            <Stack component="ul" spacing={0.25} sx={{ mt: 1, mb: 0, pl: 2.25 }}>
              <li><strong>账号 session 失效</strong>：系统正在尝试自动恢复（警告）</li>
              <li><strong>自动恢复失败</strong>：账号已停止，需人工处理（严重）</li>
              <li><strong>触发风控验证</strong>：可能需要扫码完成验证（警告）</li>
            </Stack>
          </Alert>
        </MinimalSectionCard>

        <Tabs
          data-layout-contract="minimal-notification-tabs"
          value={activePanel}
          onChange={handlePanelChange}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label="通知配置分区"
        >
          <Tab value="channels" label="通知渠道" />
          {isAdmin && <Tab value="smtp" label="SMTP" />}
        </Tabs>

        {activePanel === 'channels' && (
          notificationState.loading ? <Stack sx={{ minHeight: 220, alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={28} /></Stack> : <NotificationChannelList channels={notificationState.channels} testingId={notificationState.testingId} onEdit={notificationState.openEdit} onDelete={notificationState.handleDelete} onToggleEnabled={notificationState.handleToggleEnabled} onTest={notificationState.handleTest} />
        )}

        {isAdmin && <NotificationSmtpSettings smtp={notificationState.smtp} setSmtp={notificationState.setSmtp} smtpSaving={notificationState.smtpSaving} showPassword={notificationState.showSmtpPassword} setShowPassword={notificationState.setShowSmtpPassword} onSave={notificationState.handleSaveSmtp} visible={activePanel === 'smtp'} />}

        <NotificationChannelModal showModal={notificationState.showModal} editing={notificationState.editing} form={notificationState.form} setForm={notificationState.setForm} smtp={notificationState.smtp} showChannelSmtpPassword={notificationState.showChannelSmtpPassword} setShowChannelSmtpPassword={notificationState.setShowChannelSmtpPassword} saving={notificationState.saving} onClose={notificationState.closeModal} onSave={notificationState.handleSave} />

        {notificationState.toast && <Alert severity={notificationState.toast.type === 'success' ? 'success' : 'error'} icon={notificationState.toast.type === 'success' ? <Check size={18} /> : <X size={18} />} sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10000, minWidth: { xs: 'calc(100% - 32px)', sm: 360 }, boxShadow: 4 }}>{notificationState.toast.text}</Alert>}
      </Stack>
    </MinimalPageFrame>
  );
};

export default Notifications;

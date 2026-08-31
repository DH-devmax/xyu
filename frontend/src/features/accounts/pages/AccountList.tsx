import { QrCode } from 'lucide-react';
import React,{ useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { AccountDetail } from '../api';
import {
deleteAccount,
refreshAccountProfile,
updateAccountStatus,
} from '../api';
import { AccountAISettingsModal } from '../components/AccountAISettingsModal';
import AccountAutomationModal from '../components/AccountAutomationModal';
import { AccountCard } from '../components/AccountCard';
import { AccountDeleteDialog } from '../components/AccountDeleteDialog';
import { AccountEditModal } from '../components/AccountEditModal';
import { AccountQRCodeModal } from '../components/AccountQRCodeModal';
import { useAccountsData } from '../hooks';
import { useAccountQRCodeLogin } from '../qrLogin';
import { useAccountSubmodules,type AccountModalType } from '../submoduleHooks';
import type { AccountEditForm } from '../types';
import { MinimalCardGrid, MinimalEmptyState, MinimalPageFrame } from '@/components/minimal';

// AccountList 渲染账号列表组件。
const AccountList: React.FC = () => {
  // accountData 保存账号列表及其加载控制器。
  const { accounts, setAccounts, loading, loadAccounts } = useAccountsData();
  // accountSearch 保存列表过滤关键词。
  const [accountSearch, setAccountSearch] = useState('');
  // refreshingProfileId 保存正在刷新资料的账号 ID。
  const [refreshingProfileId, setRefreshingProfileId] = useState<string>('');
  // deletingAccountId 保存正在删除的账号 ID。
  const [deletingAccountId, setDeletingAccountId] = useState<string>('');
  // deleteDialogAccount 保存待确认删除的账号。
  const [deleteDialogAccount, setDeleteDialogAccount] = useState<AccountDetail | null>(null);
  // deleteError 保存删除失败提示。
  const [deleteError, setDeleteError] = useState('');
  // activeModal 保存当前打开的账号配置弹窗。
  const [activeModal, setActiveModal] = useState<AccountModalType>(null);
  // editingAccount 保存当前编辑账号。
  const [editingAccount, setEditingAccount] = useState<AccountDetail | null>(null);
  // taskAccount 保存当前打开自动化任务弹窗的账号。
  const [taskAccount, setTaskAccount] = useState<AccountDetail | null>(null);

  // 编辑表单状态。
  // editForm 保存编辑弹窗中的账号草稿。
  const [editForm, setEditForm] = useState<AccountEditForm>({
    remark: '',
    cookie: '',
    auto_confirm: false,
    pause_duration: 0,
    username: '',
    login_password: '',
    show_browser: false,
    showLoginPassword: false,
    clear_password: false,
  });

  // accountSubmodules 集中管理编辑弹窗的长登录、通知绑定、AI 和密码登录状态。
  const accountSubmodules = useAccountSubmodules({
    editingAccount,
    setEditingAccount,
    setActiveModal,
    editForm,
    setEditForm,
    loadAccounts,
  });
  // submoduleHandlers 保存编辑弹窗子模块的状态和事件处理函数。
  const {
    longLogin,
    notifChannels,
    selectedChannelIds,
    bindingsLoaded,
    bindingsLoading,
    bindingsLoadError,
    aiSettings,
    saving,
    passwordLoginView,
    setAiSettings,
    setBindingsDirty,
    openEditModal,
    closeEditModal,
    openAIModal,
    closeAIModal,
    loadNotificationBindings,
    toggleNotificationChannel,
    handleLongLoginToggle,
    handleSaveAISettings,
    handleSaveEdit,
    handleRestartPause,
    handlePasswordLogin,
    handleCancelPasswordLogin,
  } = accountSubmodules;

  // qrLogin 集中管理二维码弹窗状态、轮询、风控验证和异步资源收束。
  const qrLogin = useAccountQRCodeLogin({ onLoginSuccess: loadAccounts });
  // qrViewState 解构二维码弹窗向页面展示和触发操作所需的最小状态。
  const {
    showQRModal,
    qrCodeUrl,
    qrStatus,
    qrErrorMessage,
    verificationScreenshot,
    faceQrUrl,
    qrReauthTarget,
    startQRLogin,
    closeQRModal,
  } = qrLogin;

  // handleToggle 切换账号启用状态。
  const handleToggle = async (id: string, currentStatus: boolean) => {
    await updateAccountStatus(id, !currentStatus);
    loadAccounts();
  };

  // openDeleteDialog 打开账号删除确认框。
  const openDeleteDialog = (account: AccountDetail) => {
    if (deletingAccountId) return;
    setDeleteError('');
    setDeleteDialogAccount(account);
  };

  // closeDeleteDialog 关闭账号删除确认框。
  const closeDeleteDialog = () => {
    if (deletingAccountId) return;
    setDeleteError('');
    setDeleteDialogAccount(null);
  };

  // confirmDeleteAccount 执行账号删除并刷新列表状态。
  const confirmDeleteAccount = async () => {
    // account 保存当前确认删除的账号。
    const account = deleteDialogAccount;
    if (!account || deletingAccountId) return;
    setDeletingAccountId(account.id);
    setDeleteError('');
    try {
      await deleteAccount(account.id);
      setAccounts(/* 当前回调处理集合中的单个元素。 */ current => current.filter(/* 当前回调处理集合中的单个元素。 */ item => item.id !== account.id));
      setDeleteDialogAccount(null);
    } catch (/* error 保存账号删除请求的失败原因，仅转换为界面提示。 */ error: any) {
      console.error('删除账号失败:', error);
      setDeleteError(error?.message || '删除账号失败，请稍后重试');
    } finally {
      setDeletingAccountId('');
    }
  };

  // handleRefreshProfile 刷新账号资料并同步列表。
  const handleRefreshProfile = async (account: AccountDetail) => {
    setRefreshingProfileId(account.id);
    try {
      // res 保存资料刷新接口返回值。
      const res = await refreshAccountProfile(account.id);
      if (res?.profile_error) {
        alert('资料刷新失败：' + res.profile_error);
      }
      await loadAccounts();
    } catch (/* error 保存资料刷新请求的失败原因，仅转换为界面提示。 */ error: any) {
      console.error('刷新账号资料失败:', error);
      alert(error?.message || '刷新账号资料失败，请先重新授权该账号');
    } finally {
      setRefreshingProfileId('');
    }
  };
  if (loading) return <Stack role="status" aria-label="正在加载账号" sx={{ minHeight: 320, alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={30} /></Stack>;

  // filteredAccounts 过滤后的账号列表，负责当前功能中的对应处理。
  const filteredAccounts = accounts.filter(/* 当前回调处理集合中的单个元素。 */ account => {
    // keyword 搜索关键词。
    const keyword = accountSearch.trim().toLowerCase();
    if (!keyword) return true;
    return [
      account.id,
      account.nickname,
      account.remark,
      account.username,
      account.runtime_message,
    ].some(/* 当前回调处理用户交互或异步状态变化。 */ value => (value || '').toLowerCase().includes(keyword));
  });

  return (
    <MinimalPageFrame
      title="账号管理"
      description="管理授权账号、运行状态和自动化能力。"
      actions={(
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            value={accountSearch}
            onChange={/* accountSearchChange 更新账号列表关键词。 */ event => setAccountSearch(event.target.value)}
            placeholder="搜索昵称 / 备注 / 账号ID"
            aria-label="搜索昵称 / 备注 / 账号ID"
            size="small"
            sx={{ width: { xs: '100%', sm: 260 } }}
          />
          <Button variant="contained" startIcon={<QrCode size={17} />} onClick={/* qrLoginAction 启动扫码添加账号。 */ () => startQRLogin()}>
            扫码添加新账号
          </Button>
        </Stack>
      )}
    >
      <Stack spacing={2.5}>
        <Alert severity="info" sx={{ alignItems: 'center' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 2 }}>
            <Box component="span" sx={{ fontWeight: 700 }}>当前显示 {filteredAccounts.length} / {accounts.length} 个账号</Box>
            <Box component="span">若资料只显示 ID，可使用卡片上的刷新或重新授权。</Box>
          </Stack>
        </Alert>

        <MinimalCardGrid minItemWidth={360}>
        {filteredAccounts.map(/* 当前回调处理集合中的单个元素。 */ account => (
          <AccountCard
            key={account.id}
            account={account}
            refreshing={refreshingProfileId === account.id}
            deleting={deletingAccountId === account.id}
            onRefreshProfile={handleRefreshProfile}
            onReauthorize={startQRLogin}
            onEdit={openEditModal}
            onAI={openAIModal}
            onTasks={setTaskAccount}
            onToggle={handleToggle}
            onDelete={openDeleteDialog}
          />
        ))}

        {accounts.length === 0 && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <MinimalEmptyState title="暂无账号" description="使用右上角扫码入口添加第一个闲鱼账号。" />
          </Box>
        )}
        {accounts.length > 0 && filteredAccounts.length === 0 && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <MinimalEmptyState title="没有匹配的账号" description="换一个关键词搜索昵称、备注或账号 ID。" />
          </Box>
        )}
        </MinimalCardGrid>
      </Stack>

      {taskAccount && (
        <AccountAutomationModal
          account={taskAccount}
          onClose={/* 当前回调处理用户交互或异步状态变化。 */ () => setTaskAccount(null)}
          onSaved={/* 当前回调处理集合中的单个元素。 */ settings => {
            setAccounts(/* 当前回调处理集合中的单个元素。 */ current => current.map(/* 当前回调处理集合中的单个元素。 */ account => account.id === taskAccount.id ? {
              ...account,
              auto_rate_enabled: settings.auto_rate_enabled,
              rate_content: settings.rate_content,
              auto_polish_enabled: settings.auto_polish_enabled,
              polish_time: settings.polish_time,
              last_rate_scan_at: settings.last_rate_scan_at,
              last_polish_date: settings.last_polish_date,
              last_polish_at: settings.last_polish_at,
            } : account));
          }}
        />
      )}

      {deleteDialogAccount && (
        <AccountDeleteDialog
          account={deleteDialogAccount}
          deleting={deletingAccountId === deleteDialogAccount.id}
          error={deleteError}
          onClose={closeDeleteDialog}
          onConfirm={confirmDeleteAccount}
        />
      )}

      {showQRModal && (
        <AccountQRCodeModal
          target={qrReauthTarget}
          status={qrStatus}
          codeUrl={qrCodeUrl}
          errorMessage={qrErrorMessage}
          faceQrUrl={faceQrUrl}
          verificationScreenshot={verificationScreenshot}
          onClose={closeQRModal}
        />
      )}

      {/* 编辑账号弹窗由 accounts feature 组件负责渲染和表单交互。 */}
      {activeModal === 'edit' && editingAccount && (
        <AccountEditModal
          account={editingAccount}
          editForm={editForm}
          setEditForm={setEditForm}
          saving={saving}
          onClose={closeEditModal}
          onSave={handleSaveEdit}
          onRestartPause={handleRestartPause}
          longLogin={longLogin}
          onToggleLongLogin={handleLongLoginToggle}
          passwordLoginView={passwordLoginView}
          onPasswordLogin={handlePasswordLogin}
          onCancelPasswordLogin={handleCancelPasswordLogin}
          notifChannels={notifChannels}
          selectedChannelIds={selectedChannelIds}
          bindingsLoaded={bindingsLoaded}
          bindingsLoading={bindingsLoading}
          bindingsLoadError={bindingsLoadError}
          onRetryBindings={/* 当前回调处理用户交互或异步状态变化。 */ () => loadNotificationBindings(editingAccount.id)}
          onToggleChannel={toggleNotificationChannel}
          onSettingsDirty={/* 当前回调处理用户交互或异步状态变化。 */ () => setBindingsDirty(true)}
        />
      )}


      {activeModal === 'ai-settings' && editingAccount && (
        <AccountAISettingsModal
          account={editingAccount}
          settings={aiSettings}
          saving={saving}
          onChange={setAiSettings}
          onClose={closeAIModal}
          onSave={handleSaveAISettings}
        />
      )}
    </MinimalPageFrame>
  );
};

export default AccountList;

import React, { useState } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { YdisksBrandIcon } from '../../../../shared/ui/YdisksLogo';
import { useSession } from '../../../providers/SessionProvider';

// SessionGate 在会话校验完成前显示加载状态，并承载首次初始化和管理员登录表单。
export const SessionGate: React.FC = () => {
  // checkingAuth 与 needsInit 是 Provider 维护的会话服务端状态，页面不自行请求认证接口。
  const { checkingAuth, needsInit, signIn, initialize } = useSession();
  // username 与 password 是登录表单短暂状态，永不写入持久化存储。
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // initialPassword 与 initialPasswordConfirm 是首次初始化时一次性提交的秘密输入。
  const [initialPassword, setInitialPassword] = useState('');
  const [initialPasswordConfirm, setInitialPasswordConfirm] = useState('');
  // isSubmitting 区分当前正在提交的表单，防止重复发起认证或初始化请求。
  const [isSubmitting, setIsSubmitting] = useState(false);
  // formError 是仅用于当前界面显示的通用失败信息，不保存接口响应载荷。
  const [formError, setFormError] = useState('');

  // handleLogin 在管理员明确提交后调用 Provider 登录，并在失败时展示安全错误文本。
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    try {
      // response 是服务端登录契约，只使用其公开的成功和消息字段。
      const response = await signIn({ username, password });
      if (!response.success) setFormError(response.message || '登录失败');
    } catch (error /* error 是认证请求失败原因，不能包含或重显密码。 */) {
      setFormError(error instanceof Error ? error.message || '登录失败' : '登录失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // handleInitialize 校验两次管理员密码后提交首次初始化，并在成功后立即清空输入。
  const handleInitialize = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError('');
    if (initialPassword.length < 8) {
      setFormError('密码至少需要 8 个字符');
      return;
    }
    if (initialPassword !== initialPasswordConfirm) {
      setFormError('两次输入的密码不一致');
      return;
    }

    setIsSubmitting(true);
    try {
      // response 是首次初始化接口返回的公开认证结果。
      const response = await initialize(initialPassword);
      if (!response.success) {
        setFormError(response.message || '初始化失败，请重试');
        return;
      }
      setInitialPassword('');
      setInitialPasswordConfirm('');
    } catch (error /* error 是初始化请求失败原因，不输出用户输入的密码。 */) {
      setFormError(error instanceof Error ? error.message || '初始化失败，请重试' : '初始化失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <Box component="main" aria-label="正在校验会话" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  // heading 是当前认证流程的页面标题，保证初始化和登录表单使用一致视觉壳。
  const heading = needsInit ? '首次设置管理员密码' : '欢迎回来';
  // description 是当前认证流程的辅助说明，不泄露任何会话或账户敏感数据。
  const description = needsInit ? '设置完成后会自动进入系统，管理员账号为 admin。' : '自动发货、账号运行与客服协同工作台';

  return (
    <Box component="main" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', p: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 0.9fr) minmax(360px, 1fr)' }, gap: { xs: 2, md: 5 }, alignItems: 'center' }}>
        <Box sx={{ display: { xs: 'none', md: 'block' }, px: 3 }}>
          <Box sx={{ width: 72, height: 72, mb: 2 }}><YdisksBrandIcon sizeClass="w-full h-full" gradientId="login-brand-desktop" /></Box>
          <Typography variant="h1" sx={{ fontSize: '2.35rem', maxWidth: 380 }}>DH闲不下来</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1.25, maxWidth: 380 }}>一个工作台管理账号运行、自动化规则、订单和 Harness 智能草案。</Typography>
        </Box>
        <Paper variant="outlined" sx={{ width: '100%', maxWidth: 480, justifySelf: 'center', p: { xs: 2.5, sm: 4 }, bgcolor: 'background.paper' }}>
          <Stack spacing={2.5}>
            <Stack spacing={0.75}>
              <Box sx={{ display: { xs: 'flex', md: 'none' }, width: 50, height: 50, mb: 0.75 }}><YdisksBrandIcon sizeClass="w-full h-full" gradientId="login-brand-mobile" /></Box>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>{heading}</Typography>
              <Typography variant="body2" color="text.secondary">{description}</Typography>
            </Stack>

            {needsInit ? (
              <form onSubmit={handleInitialize}>
                <Stack spacing={2}>
                  <TextField autoFocus fullWidth label="设置管理员密码" placeholder="至少 8 个字符" type="password" value={initialPassword} onChange={/* initialPasswordChange 只更新当前初始化表单的短暂输入。 */ event => setInitialPassword(event.target.value)} />
                  <TextField fullWidth label="确认管理员密码" placeholder="再次输入密码" type="password" value={initialPasswordConfirm} onChange={/* initialPasswordConfirmChange 只更新确认输入，不写入持久化存储。 */ event => setInitialPasswordConfirm(event.target.value)} slotProps={{ input: { startAdornment: <ShieldOutlinedIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> } }} />
                  <SubmitButton submitting={isSubmitting} text="设置密码并进入系统" />
                </Stack>
              </form>
            ) : (
              <form onSubmit={handleLogin}>
                <Stack spacing={2}>
                  <TextField autoFocus fullWidth label="管理员账号" placeholder="管理员账号" type="text" value={username} onChange={/* usernameChange 保存管理员主动输入的登录名称。 */ event => setUsername(event.target.value)} slotProps={{ input: { startAdornment: <PersonOutlineIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> } }} />
                  <TextField fullWidth label="管理员密码" placeholder="密码" type="password" value={password} onChange={/* passwordChange 只在当前表单生命周期中保存管理员密码。 */ event => setPassword(event.target.value)} slotProps={{ input: { startAdornment: <LockOutlinedIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> } }} />
                  <SubmitButton submitting={isSubmitting} text="立即登录" />
                </Stack>
              </form>
            )}

            {formError ? <Alert severity="error">{formError}</Alert> : null}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

// SubmitButton 为认证表单提供固定尺寸的提交控件，避免加载状态改变布局。
const SubmitButton: React.FC<{ /** submitting 表示认证请求是否仍在执行。 */ submitting: boolean; /** text 是按钮在空闲时显示的操作名称。 */ text: string }> = ({ submitting, text }) => (
  <Button fullWidth variant="contained" size="large" disabled={submitting} type="submit" endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}>
    {submitting ? '处理中…' : text}
  </Button>
);

import React, { useState } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DHBrandIcon } from '@/components/minimal/DHBrandLogo';
import { MinimalFormHead } from '@/components/minimal';
import { AuthCenteredLayout as MinimalAuthCenteredLayout } from '@/layouts/auth-centered';
import { useSession } from '@/app/providers/SessionProvider';

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
  // showPassword 控制登录密码是否暂时以明文展示，离开页面后随组件销毁而清理。
  const [showPassword, setShowPassword] = useState(false);

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

  // brandHeader 是 Minimal centered 布局顶部复用的产品品牌插槽，加载和表单状态共用同一标识。
  const brandHeader = (
    <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, alignItems: 'center' }}>
      <Box sx={{ width: 38, height: 38, flexShrink: 0 }}>
        <DHBrandIcon size={38} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontSize: 15, fontWeight: 750, lineHeight: 1.2 }}>
          DH闲不下来
        </Typography>
        <Typography noWrap sx={{ mt: 0.3, fontSize: 10, letterSpacing: '0.14em', color: 'primary.main', textTransform: 'uppercase' }}>
          agent panel
        </Typography>
      </Box>
    </Stack>
  );

  if (checkingAuth) {
    return (
      <MinimalAuthCenteredLayout brand={brandHeader} contentSx={{ display: 'grid', minHeight: 180, placeItems: 'center' }}>
        <CircularProgress size={30} aria-label="正在校验会话" />
      </MinimalAuthCenteredLayout>
    );
  }

  // heading 是当前认证流程的页面标题，保证初始化和登录表单使用一致视觉壳。
  const heading = needsInit ? '首次设置管理员密码' : '欢迎回来';
  // description 是当前认证流程的辅助说明，不泄露任何会话或账户敏感数据。
  const description = needsInit ? '设置完成后会自动进入系统，管理员账号为 admin。' : '自动发货、账号运行与客服协同工作台';
  return (
    <MinimalAuthCenteredLayout brand={brandHeader}>
      <Stack spacing={2.5}>
        <MinimalFormHead
          icon={<DHBrandIcon size={56} />}
          title={heading}
          description={description}
        />

        {needsInit ? (
          <form onSubmit={handleInitialize}>
            <Stack spacing={2}>
              <TextField autoFocus fullWidth label="设置管理员密码" placeholder="至少 8 个字符" type="password" autoComplete="new-password" value={initialPassword} onChange={/* initialPasswordChange 只更新当前初始化表单的短暂输入。 */ event => setInitialPassword(event.target.value)} />
              <TextField fullWidth label="确认管理员密码" placeholder="再次输入密码" type="password" autoComplete="new-password" value={initialPasswordConfirm} onChange={/* initialPasswordConfirmChange 只更新确认输入，不写入持久化存储。 */ event => setInitialPasswordConfirm(event.target.value)} slotProps={{ input: { startAdornment: <ShieldOutlinedIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> } }} />
              <SubmitButton submitting={isSubmitting} text="设置密码并进入系统" />
            </Stack>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <Stack spacing={2}>
              <TextField autoFocus fullWidth label="管理员账号" placeholder="管理员账号" type="text" autoComplete="username" value={username} onChange={/* usernameChange 保存管理员主动输入的登录名称。 */ event => setUsername(event.target.value)} slotProps={{ input: { startAdornment: <PersonOutlineIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> } }} />
              <TextField fullWidth label="管理员密码" placeholder="密码" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={/* passwordChange 只在当前表单生命周期中保存管理员密码。 */ event => setPassword(event.target.value)} slotProps={{ input: { startAdornment: <LockOutlinedIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} />, endAdornment: <InputAdornment position="end"><IconButton type="button" edge="end" aria-label={showPassword ? '隐藏密码' : '显示密码'} onClick={/* passwordVisibilityAction 只切换当前登录表单的密码展示状态。 */ () => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}</IconButton></InputAdornment> } }} />
              <SubmitButton submitting={isSubmitting} text="立即登录" />
            </Stack>
          </form>
        )}

        {formError ? <Alert severity="error">{formError}</Alert> : null}
      </Stack>
    </MinimalAuthCenteredLayout>
  );
};

// SubmitButton 为认证表单提供固定尺寸的提交控件，避免加载状态改变布局。
const SubmitButton: React.FC<{ /** submitting 表示认证请求是否仍在执行。 */ submitting: boolean; /** text 是按钮在空闲时显示的操作名称。 */ text: string }> = ({ submitting, text }) => (
  <Button fullWidth variant="contained" size="large" disabled={submitting} type="submit" endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}>
    {submitting ? '处理中…' : text}
  </Button>
);

import { Check } from 'lucide-react';
import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { MinimalDialogSurface } from '@/components/minimal';
import type { AccountDetail } from '../api';
import { RiskVerificationPanel } from './RiskVerificationPanel';
import { SquareQRCode } from './SquareQRCode';

// AccountQRCodeModalProps 描述二维码登录弹窗的展示状态和关闭回调。
export interface AccountQRCodeModalProps {
  // target 是重新授权时的目标账号，新增账号时为空。
  target: AccountDetail | null;
  // status 是二维码登录当前阶段。
  status: string;
  // codeUrl 是待扫描的二维码地址。
  codeUrl: string;
  // errorMessage 是二维码生成或轮询失败提示。
  errorMessage: string;
  // faceQrUrl 是风控人脸验证二维码地址。
  faceQrUrl: string;
  // verificationScreenshot 是风控验证截图地址。
  verificationScreenshot: string;
  // onClose 关闭二维码登录弹窗并取消后台请求。
  onClose: () => void;
}

// AccountQRCodeModal 渲染二维码登录、风控验证和结果状态。
export const AccountQRCodeModal: React.FC<AccountQRCodeModalProps> = ({ target, status, codeUrl, errorMessage, faceQrUrl, verificationScreenshot, onClose }) => (
  <MinimalDialogSurface open onClose={onClose} maxWidth="xs" aria-labelledby="account-qr-title">
    <DialogTitle id="account-qr-title" sx={{ pr: 7 }}>
      {target ? '重新授权账号' : '扫码添加账号'}
      <IconButton onClick={onClose} aria-label="关闭二维码登录" sx={{ position: 'absolute', top: 12, right: 12 }}><CloseIcon /></IconButton>
    </DialogTitle>
    <DialogContent>
      <Stack spacing={2.5} sx={{ alignItems: 'center', textAlign: 'center', py: 1 }}>
          <Typography variant="body2" color="text.secondary">{target ? `请用闲鱼APP扫码，为「${target.nickname || target.remark || target.id}」刷新授权` : '请打开闲鱼APP扫描下方二维码'}</Typography>
          <Box sx={{ width: '100%', maxWidth: status === 'verification' ? 288 : 256, minHeight: status === 'verification' ? 256 : undefined, aspectRatio: status === 'verification' ? 'auto' : '1 / 1', bgcolor: 'action.hover', mx: 'auto', display: 'grid', placeItems: 'center', overflow: 'hidden', border: 1, borderColor: 'divider', borderRadius: 1, p: status === 'verification' ? 1 : 0, position: 'relative' }}>
            {status === 'loading' && <CircularProgress size={40} />}
            {status === 'waiting' && <SquareQRCode src={codeUrl} alt="闲鱼登录二维码" sx={{ p: 1 }} />}
            {status === 'success' && (
              <Stack sx={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', color: 'success.main' }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', mb: 2, bgcolor: 'success.light' }}><Check size={32} /></Box>
                <Typography variant="h3">登录成功</Typography>
              </Stack>
            )}
            {status === 'error' && <Box sx={{ px: 2.5, textAlign: 'center' }}><Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 700 }}>二维码获取失败</Typography><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{errorMessage || '请关闭窗口后重新发起扫码登录。'}</Typography></Box>}
            {status === 'verification' && <RiskVerificationPanel faceQrUrl={faceQrUrl} verificationScreenshot={verificationScreenshot} />}
          </Box>
          {status !== 'verification' && <Typography variant="caption" color="text.secondary" sx={{ width: '100%', py: 1, bgcolor: 'action.hover', borderRadius: 1 }}>二维码有效期为5分钟，请尽快扫码。</Typography>}
      </Stack>
    </DialogContent>
  </MinimalDialogSurface>
);

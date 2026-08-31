import { AlertTriangle } from 'lucide-react';
import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface RiskVerificationPanelProps {
  /** faceQrUrl 表示人脸验证二维码地址。 */ faceQrUrl?: string;
  /** verificationScreenshot 表示验证失败截图地址。 */ verificationScreenshot?: string;
}

// RiskVerificationPanel 渲染风控验证面板。
export const RiskVerificationPanel: React.FC<RiskVerificationPanelProps> = ({
  faceQrUrl,
  verificationScreenshot,
}) => (
  <Stack spacing={1.5} sx={{ width: '100%', minWidth: 0, maxHeight: 'min(64vh, 28rem)', overflowY: 'auto', px: 0.5, py: 1, textAlign: 'center', alignItems: 'center' }}>
    <Box sx={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: '50%', bgcolor: 'warning.light', color: 'warning.dark' }}>
      <AlertTriangle size={20} aria-hidden="true" />
    </Box>
    <Typography variant="subtitle1" sx={{ overflowWrap: 'anywhere', fontWeight: 750, color: 'warning.dark' }}>
      需要完成安全风控验证
    </Typography>
    <Typography variant="caption" sx={{ maxWidth: 240, overflowWrap: 'anywhere', color: 'warning.dark' }}>
      当前账号触发了闲鱼平台风控。请使用手机闲鱼 App 扫描下方二维码，并按 App 提示完成人脸识别。
    </Typography>

    <Paper variant="outlined" sx={{ display: 'grid', placeItems: 'center', minHeight: 144, width: '100%', maxWidth: 192, overflow: 'hidden', p: 1, borderColor: 'warning.light', bgcolor: 'background.paper' }}>
      {faceQrUrl ? (
        <Box component="img" src={faceQrUrl} alt="闲鱼安全风控验证二维码" sx={{ display: 'block', maxHeight: 176, width: '100%', objectFit: 'contain' }} />
      ) : verificationScreenshot ? (
        <Box component="img" src={verificationScreenshot} alt="闲鱼风控验证页面" sx={{ display: 'block', maxHeight: 176, width: '100%', objectFit: 'contain' }} />
      ) : (
        <Stack spacing={1} sx={{ alignItems: 'center', color: 'warning.dark' }}>
          <CircularProgress size={24} color="warning" aria-hidden="true" />
          <Typography variant="caption" sx={{ fontWeight: 700 }}>正在准备风控二维码…</Typography>
        </Stack>
      )}
    </Paper>

    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 240, overflowWrap: 'anywhere', fontSize: 11 }}>
      请勿在浏览器中打开验证链接。完成验证后系统会自动检测并刷新登录状态，无需手动确认。
    </Typography>
  </Stack>
);

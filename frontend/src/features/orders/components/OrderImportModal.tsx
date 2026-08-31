import { Upload } from 'lucide-react';
import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { MinimalDialogSurface } from '@/components/minimal';
import { failedOrderImportRows } from '../state';
import type { OrderImportState } from '../types';

// OrderImportModalProps 描述订单导入弹窗所需的状态和事件。
export type OrderImportModalProps = OrderImportState;

// OrderImportModal 渲染订单文件选择、结果展示和重试操作。
export const OrderImportModal: React.FC<OrderImportModalProps> = (state) => {
  // handleFileChange 保存用户选择的订单文件并清理旧错误。
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    state.setImportFile(event.target.files?.[0] || null);
  };
  // handleClose 关闭订单导入弹窗。
  const handleClose = () => state.closeImportModal();
  // handleSubmit 提交当前订单导入文件。
  const handleSubmit = () => void state.handleImportOrders();
  // handleRetry 重试最近一次失败的订单导入。
  const handleRetry = () => void state.handleRetryImport();

  if (!state.showImportModal) return null;

  return (
    <MinimalDialogSurface open onClose={handleClose} maxWidth="sm" aria-labelledby="order-import-title">
      <DialogTitle id="order-import-title" sx={{ pr: 7 }}>插入订单<IconButton onClick={handleClose} aria-label="关闭" sx={{ position: 'absolute', top: 12, right: 12 }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Box><Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>选择 Excel 文件</Typography><TextField fullWidth type="file" onChange={handleFileChange} slotProps={{ htmlInput: { accept: '.xlsx,.csv,.tsv,.json' }, input: { sx: { py: 1 } } }} helperText="支持 .xlsx、.csv、.tsv、.json 格式" /></Box>
          {state.importFile && (
            <Alert severity="info" icon={<Upload size={18} />}>已选文件：{state.importFile.name}</Alert>
          )}
          {state.importError && (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={handleRetry} disabled={state.importing || !state.importFile}>重试</Button>}>{state.importError}</Alert>
          )}
          {state.importResult && state.importResult.failed_count > 0 && (
            <Stack spacing={1.5}>
              <Alert severity="warning">导入完成：成功 {state.importResult.success_count} 条，失败 {state.importResult.failed_count} 条</Alert>
              <TableContainer sx={{ maxHeight: 256, border: 1, borderColor: 'divider' }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow><TableCell>订单 ID</TableCell><TableCell>失败原因</TableCell></TableRow></TableHead>
                  <TableBody>
                    {failedOrderImportRows(state.importResult).map(
                      // row 是需要展示失败原因的导入结果行。
                      (row, index) => (
                        <TableRow key={`${row.order_id}-${index}`}>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{row.order_id}</TableCell>
                          <TableCell sx={{ color: 'error.main' }}>{row.message || '导入失败'}</TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={handleClose}>取消</Button><Button variant="contained" onClick={handleSubmit} disabled={!state.importFile || state.importing}>{state.importing ? '正在导入…' : '导入订单'}</Button></DialogActions>
    </MinimalDialogSurface>
  );
};

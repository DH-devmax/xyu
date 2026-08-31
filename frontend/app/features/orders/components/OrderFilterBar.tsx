import { Search, User as UserIcon } from 'lucide-react';
import React from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { AccountDetail } from '../api';
import { orderStatusOptions } from '../state';
import { MinimalFilterToolbar } from '../../../../shared/ui/minimal';

// OrderFilterBarProps 描述订单状态、账号和文本筛选所需的页面状态。
export interface OrderFilterBarProps {
  // filter 是当前订单状态筛选值。
  filter: string;
  // onFilterChange 响应订单状态筛选切换。
  onFilterChange: (value: string) => void;
  // accountFilter 是当前账号筛选值。
  accountFilter: string;
  // onAccountFilterChange 响应账号筛选切换。
  onAccountFilterChange: (value: string) => void;
  // accounts 是账号下拉框的数据源。
  accounts: AccountDetail[];
  // accountName 将账号 ID 转换为展示名称。
  accountName: (cookieId: string) => string;
  // searchText 是搜索框当前输入值。
  searchText: string;
  // onSearchChange 响应订单搜索输入。
  onSearchChange: (value: string) => void;
}

// OrderFilterBar 渲染 Minimal Tabs 风格状态筛选和列表工具栏。
export const OrderFilterBar: React.FC<OrderFilterBarProps> = ({
  filter,
  onFilterChange,
  accountFilter,
  onAccountFilterChange,
  accounts,
  accountName,
  searchText,
  onSearchChange,
}) => (
  <MinimalFilterToolbar>
    <ToggleButtonGroup
      value={filter}
      exclusive
      size="small"
      aria-label="订单状态筛选"
      sx={{ maxWidth: '100%', overflowX: 'auto', '& .MuiToggleButton-root': { px: { xs: 1.1, sm: 1.5 }, whiteSpace: 'nowrap', fontSize: 12 } }}
    >
      {orderStatusOptions.map(/* statusOptionRenderer 渲染单个订单状态筛选项。 */ option => (
        <ToggleButton
          key={option.key}
          value={option.key}
          data-status={option.key}
          onClick={/* statusAction 将状态筛选传回订单页面。 */ () => onFilterChange(option.key)}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' }, flexShrink: 0 }}>
      <Select
        native
        size="small"
        value={accountFilter}
        onChange={/* accountAction 将账号筛选传回订单页面。 */ event => onAccountFilterChange(String(event.target.value))}
        inputProps={{ 'aria-label': '按账号筛选订单' }}
        startAdornment={<InputAdornment position="start"><UserIcon size={15} /></InputAdornment>}
        sx={{ minWidth: { xs: '100%', sm: 190 }, bgcolor: 'background.paper' }}
      >
        <option value="">全部账号</option>
        {accounts.map(/* accountOptionRenderer 渲染单个账号筛选项。 */ account => <option key={account.id} value={account.id}>{accountName(account.id)}</option>)}
      </Select>
      <TextField
        size="small"
        value={searchText}
        onChange={/* searchAction 将订单关键词传回订单页面。 */ event => onSearchChange(event.target.value)}
        placeholder="搜索订单号/商品/买家..."
        sx={{ width: { xs: '100%', sm: 240 }, bgcolor: 'background.paper' }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={15} /></InputAdornment> }, htmlInput: { 'aria-label': '搜索订单号/商品/买家...' } }}
      />
    </Stack>
  </MinimalFilterToolbar>
);

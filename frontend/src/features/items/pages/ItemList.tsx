import MuiBox from '@mui/material/Box';
import { ArrowRight,Box,CheckCircle2,CircleDashed,Edit,Filter,Link2,LocateFixed,PackagePlus,Plus,RefreshCw,Save,Search,ShoppingBag,Trash2,UploadCloud,User,X } from 'lucide-react';
import React,{ useCallback,useEffect,useMemo,useRef,useState } from 'react';
import type { AccountDetail,Item,ShippingRule } from '../api';
import {
getAccountDetails,
getItemPublishBatches,
getItems,
getShippingRules,
} from '../api';
import { batchStatusText,batchStatusTone } from '../batchState';
import { BatchPhaseIndicator } from '../components/BatchPhaseIndicator';
import { consumeSelectedFile } from '../fileInput';
import { useItemPublishBatch } from '../hooks';
import { useItemActions } from '../itemActions';
import type { ItemListProps } from '../types';
import { MinimalCardGrid, MinimalDialogSurface, MinimalEmptyState, MinimalFilterToolbar, MinimalPageFrame } from '@/components/minimal';

// batchToneSx 将批量任务语义色调映射到 MUI 主题颜色，不在业务状态中保存样式字符串。
const batchToneSx = (status?: string) => {
  // tone 是后端任务状态对应的稳定语义色。
  const tone = batchStatusTone(status);
  if (tone === 'success') return { bgcolor: 'success.main', borderColor: 'success.main', color: 'success.contrastText' };
  if (tone === 'error') return { bgcolor: 'error.main', borderColor: 'error.main', color: 'error.contrastText' };
  if (tone === 'info') return { bgcolor: 'info.main', borderColor: 'info.main', color: 'info.contrastText' };
  if (tone === 'warning') return { bgcolor: 'warning.main', borderColor: 'warning.main', color: 'warning.contrastText' };
  return { bgcolor: 'action.hover', borderColor: 'divider', color: 'text.secondary' };
};

// formatItemPrice 将商品价格转换为本地化展示文本。
const formatItemPrice = (price?: string) => {
  // value 值。
  const value = String(price || '').trim();
  if (!value) return '-';
  return /^[¥￥]/.test(value) ? value : `¥${value}`;
};

// ItemList 渲染商品列表组件。
const ItemList: React.FC<ItemListProps> = ({ onConfigureDelivery }) => {
  // [items, 解构得到当前 Hook 返回的状态和操作函数。
  const [items, setItems] = useState<Item[]>([]);
  // [shippingRules, 解构得到当前 Hook 返回的状态和操作函数。
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  // [accounts, 解构得到当前 Hook 返回的状态和操作函数。
  const [accounts, setAccounts] = useState<AccountDetail[]>([]);
  // [selectedAccount, 解构得到当前 Hook 返回的状态和操作函数。
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  // [accountFilter, 解构得到当前 Hook 返回的状态和操作函数。
  const [accountFilter, setAccountFilter] = useState<string>('');
  // itemsRequestGeneration 标识商品列表最新一次读取，旧响应不得覆盖较新的同步或刷新结果。
  const itemsRequestGeneration = useRef(0);
  // shippingRulesRequestGeneration 标识发货规则最新一次读取，旧响应不得覆盖较新的规则配置。
  const shippingRulesRequestGeneration = useRef(0);
  // loadItems 刷新商品列表，供普通操作和批量任务完成后复用。
  const loadItems = useCallback(/* 当前回调封装可复用的交互处理逻辑。 */ async () => {
    // requestGeneration 是本次商品刷新请求的单调递增代次。
    const requestGeneration = ++itemsRequestGeneration.current;
    // itemsList 商品列表列表，负责当前功能中的对应处理。
    const itemsList = await getItems();
    if (requestGeneration === itemsRequestGeneration.current) setItems(itemsList);
  }, []);

  // loadShippingRules 刷新商品关联的自动化规则。
  const loadShippingRules = useCallback(/* 当前回调封装可复用的交互处理逻辑。 */ async () => {
    // requestGeneration 是本次规则刷新请求的单调递增代次。
    const requestGeneration = ++shippingRulesRequestGeneration.current;
    // rules 是当前规则读取返回的非敏感自动化规则集合。
    const rules = await getShippingRules();
    if (requestGeneration === shippingRulesRequestGeneration.current) setShippingRules(rules);
  }, []);

  // batchState 是 ItemList feature 提供的批量铺货状态和动作边界。
  const batchState = useItemPublishBatch({ selectedAccount, loadItems, loadShippingRules });
  // 解构数据 解构得到当前 Hook 返回的状态和操作函数。
  const {
    showBatchModal,
    batchLoading,
    batchPhase,
    batchFile,
    setBatchFile,
    batchImagesZip,
    setBatchImagesZip,
    batchCategoryKeyword,
    setBatchCategoryKeyword,
    batchCategoryLoading,
    batchFallbackCategory,
    setBatchFallbackCategory,
    batchPreview,
    batchDetail,
    recentBatch,
    setRecentBatch,
    batchLocations,
    batchLocation,
    batchPublishIntervalSeconds,
    setBatchPublishIntervalSeconds,
    setBatchLocations,
    setBatchLocation,
    openBatchModal,
    handleRecommendBatchCategory,
    openRecentBatchResult,
    handlePreviewBatch,
    handleStartBatch,
    handleCancelBatch,
    abandonBatchPreview,
    closeBatchModal,
    handleRetryBatchFailed,
  } = batchState;

  // itemActions 商品 feature 提供普通商品操作、发布表单和定位动作。
  const itemActions = useItemActions({
    selectedAccount,
    setSelectedAccount,
    setItems,
    loadItems,
    loadShippingRules,
    onConfigureDelivery,
    setBatchLocations,
    setBatchLocation,
  });
  // 解构商品动作，保持页面 JSX 只负责布局和表单字段组合。
  const {
    loading,
    publishing,
    showEditModal,
    setShowEditModal,
    showAddModal,
    setShowAddModal,
    showPublishModal,
    setShowPublishModal,
    locationLoading,
    publishLocations,
    setPublishLocations,
    publishLocation,
    setPublishLocation,
    selectedItem,
    editForm,
    setEditForm,
    addForm,
    setAddForm,
    publishForm,
    setPublishForm,
    publishImagePreviews,
    handleSync,
    handleEdit,
    handleSaveEdit,
    handleDelete,
    handleAddItem,
    handlePublishItem,
    downloadPublishTemplate,
    openAddModal,
    openPublishModal,
    locateForPublish,
  } = itemActions;

  useEffect(/* 当前回调同步 React 副作用和资源生命周期。 */ () => {
    // controller 取消组件卸载前仍在执行的首屏并行请求。
    const controller = new AbortController();
    // initialItemsGeneration、initialRulesGeneration 分别记录首屏请求对应的列表与规则代次。
    const initialItemsGeneration = ++itemsRequestGeneration.current;
    const initialRulesGeneration = ++shippingRulesRequestGeneration.current;
    // active 标识当前组件实例是否仍接受首屏响应。
    let active = true;
    Promise.all([getAccountDetails({ signal: controller.signal }), getItems(undefined, { signal: controller.signal }), getShippingRules({ signal: controller.signal }), getItemPublishBatches(20, { signal: controller.signal })])
      .then(/* 当前回调处理异步操作结果。 */ ([accountList, itemList, ruleList, batches]) => {
        if (!active || controller.signal.aborted || initialItemsGeneration !== itemsRequestGeneration.current || initialRulesGeneration !== shippingRulesRequestGeneration.current) return;
        setAccounts(accountList);
        setItems(itemList);
        setShippingRules(ruleList);
        // recoverable 可恢复任务。
        const recoverable = batches.find(/* 当前回调处理集合中的单个元素。 */ batch => ['running', 'canceling'].includes(batch.status))
          || batches.find(/* 当前回调处理集合中的单个元素。 */ batch => batch.status !== 'preview');
        setRecentBatch(recoverable || null);
      })
      .catch(/* 当前回调处理异步操作结果。 */ (e) => {
        if (!controller.signal.aborted) console.error('加载商品配置失败:', e);
      });
    return /* 首屏请求清理回调在卸载时取消请求并阻止状态回写。 */ () => {
      active = false;
      controller.abort();
    };
  }, []);

  // rulesForItem 规则列表For商品，负责当前功能中的对应处理。
  const rulesForItem = (item: Item) => shippingRules.filter(/* 当前回调处理集合中的单个元素。 */ rule =>
    rule.cookie_id === item.cookie_id && rule.item_id === item.item_id
  ).length > 0
    ? shippingRules.filter(/* 当前回调处理集合中的单个元素。 */ rule => rule.cookie_id === item.cookie_id && rule.item_id === item.item_id)
    : shippingRules.filter(/* 当前回调处理集合中的单个元素。 */ rule => rule.cookie_id === item.cookie_id && !rule.item_id);

  // accountMap 账号索引。
  const accountMap = useMemo(
    /* 当前回调处理集合中的单个元素。 */ () => new Map(accounts.map(/* 当前回调处理集合中的单个元素。 */ account => [account.id, account])),
    [accounts],
  );
  // visibleItems 可见商品列表。
  const visibleItems = useMemo(
    /* 当前回调处理集合中的单个元素。 */ () => accountFilter ? items.filter(/* 当前回调处理集合中的单个元素。 */ item => item.cookie_id === accountFilter) : items,
    [accountFilter, items],
  );
  // accountName 账号名称。
  const accountName = (cookieId: string) => {
    // account 账号。
    const account = accountMap.get(cookieId);
    // name 名称。
    const name = account?.remark || account?.nickname;
    return name ? `${name} · ${cookieId.slice(0, 6)}` : `账号 ${cookieId.slice(0, 8)}`;
  };
  // accountNickname 账号昵称。
  const accountNickname = (cookieId: string) => {
    // account 账号。
    const account = accountMap.get(cookieId);
    return account?.remark || account?.nickname || '未命名账号';
  };

  return (
    <MinimalPageFrame title="商品管理" description="监控并管理所有账号下的闲鱼商品。">
      <MinimalFilterToolbar>
        <MuiBox component='div' sx={{ 'display': 'flex', 'flexWrap': 'wrap', 'alignItems': 'flex-end', 'gap': '.75rem' }}>
            <MuiBox component='div' sx={{ 'display': 'flex', 'minWidth': '200px', 'flexDirection': 'column', 'gap': '.375rem' }}>
              <MuiBox component='label' htmlFor="item-account-filter" sx={{
  'paddingLeft': '.25rem',
  'paddingRight': '.25rem',
  'fontSize': '11px',
  'fontWeight': '800',
  'letterSpacing': '.025em',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>
                商品列表筛选
              </MuiBox>
              <MuiBox component='div' sx={{ 'position': 'relative' }}>
                <MuiBox component={Filter} sx={{
  'width': '1rem',
  'height': '1rem',
  'position': 'absolute',
  'left': '1rem',
  'top': '50%',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'pointerEvents': 'none',
}} />
                <MuiBox component='select'
                  id="item-account-filter"
                  aria-label="按账号筛选商品列表"
                  sx={{
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'width': '100%',
  'paddingLeft': '2.5rem',
  'paddingRight': '2.25rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                  value={accountFilter}
                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setAccountFilter(event.target.value)}
                >
                  <option value="">全部账号</option>
                  {accounts.map(/* 当前回调处理集合中的单个元素。 */ account => (
                    <option key={account.id} value={account.id}>{accountName(account.id)}</option>
                  ))}
                </MuiBox>
              </MuiBox>
            </MuiBox>
            <MuiBox component='div' sx={{ 'display': 'flex', 'minWidth': '200px', 'flexDirection': 'column', 'gap': '.375rem' }}>
              <MuiBox component='label' htmlFor="item-sync-account" sx={{
  'paddingLeft': '.25rem',
  'paddingRight': '.25rem',
  'fontSize': '11px',
  'fontWeight': '800',
  'letterSpacing': '.025em',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>
                同步商品账号
              </MuiBox>
              <MuiBox component='div' sx={{ 'position': 'relative' }}>
                <MuiBox component={User} sx={{
  'width': '1rem',
  'height': '1rem',
  'position': 'absolute',
  'left': '1rem',
  'top': '50%',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'pointerEvents': 'none',
}} />
                <MuiBox component='select'
                  id="item-sync-account"
                  aria-label="选择要同步商品的账号"
                  sx={{
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'width': '100%',
  'paddingLeft': '2.5rem',
  'paddingRight': '2.25rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                  value={selectedAccount}
                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setSelectedAccount(e.target.value)}
                >
                  <option value="">请选择账号</option>
                  {accounts.map(/* 当前回调处理集合中的单个元素。 */ acc => (
                      <option key={acc.id} value={acc.id}>{accountName(acc.id)}</option>
                  ))}
                </MuiBox>
              </MuiBox>
            </MuiBox>
            <MuiBox component='button'
                onClick={handleSync}
                disabled={loading || !selectedAccount}
                sx={{
  'background': 'rgb(var(--minimal-color-brand))',
  'color': 'rgb(var(--minimal-color-white))',
  'fontWeight': '700',
  'border': 'none',
  'transition': 'all .2s cubic-bezier(.25,.8,.25,1)',
  'cursor': 'pointer',
  '&:hover:not(:disabled)': {
    'background': 'rgb(var(--minimal-color-brand-highlight))',
    'transform': 'translateY(-1px)',
    'boxShadow': 'var(--minimal-shadow-brand-strong)',
  },
  '&:active:not(:disabled)': { 'transform': 'translateY(1px)', 'boxShadow': 'var(--minimal-shadow-brand-soft)' },
  '&:disabled': {
    'background': 'rgb(var(--minimal-color-neutral-100))',
    'color': 'rgb(var(--minimal-color-neutral-400))',
    'boxShadow': 'none',
    'transform': 'none',
    'cursor': 'not-allowed',
    'opacity': '.5',
  },
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '10px',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '--minimal-shadow': 'var(--minimal-shadow-colored)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-lg)',
  '--minimal-shadow-color': 'rgb(var(--minimal-color-brand-200)/1)',
}}
            >
                <MuiBox component={RefreshCw} sx={[{ 'width': '1rem', 'height': '1rem' }, loading ? { 'animation': 'spin 1s linear infinite' } : {}]} />
                同步商品
            </MuiBox>
            <MuiBox component='button'
              onClick={openAddModal}
              sx={{
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '10px',
  'fontWeight': '700',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '--minimal-shadow': 'var(--minimal-shadow-lg)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-lg)',
}}
            >
              <MuiBox component={Plus} sx={{ 'width': '1rem', 'height': '1rem' }} />
              添加商品
            </MuiBox>
            <MuiBox component='button'
              onClick={openPublishModal}
              sx={{
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '10px',
  'fontWeight': '700',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-500)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-success-600)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '--minimal-shadow': 'var(--minimal-shadow-colored)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-lg)',
  '--minimal-shadow-color': 'rgb(var(--minimal-color-success-100)/1)',
}}
            >
              <MuiBox component={PackagePlus} sx={{ 'width': '1rem', 'height': '1rem' }} />
              发布商品
            </MuiBox>
            <MuiBox component='button'
              onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void openBatchModal()}
              sx={{
  'paddingLeft': '1.25rem',
  'paddingRight': '1.25rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '10px',
  'fontWeight': '700',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-highlight)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '--minimal-shadow': 'var(--minimal-shadow-colored)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-lg)',
  '--minimal-shadow-color': 'rgb(var(--minimal-color-brand-100)/1)',
}}
            >
              <MuiBox component={UploadCloud} sx={{ 'width': '1rem', 'height': '1rem' }} />
              {recentBatch && ['running', 'canceling'].includes(recentBatch.status) ? '继续批量任务' : '批量铺货'}
            </MuiBox>
            {recentBatch && !['running', 'canceling'].includes(recentBatch.status) && (
              <MuiBox component='button'
                onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void openRecentBatchResult()}
                sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '10px',
  'fontWeight': '700',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
              >
                最近批次结果
              </MuiBox>
            )}
        </MuiBox>
      </MinimalFilterToolbar>

      <MinimalCardGrid minItemWidth={205}>
          {visibleItems.map(/* 当前回调处理集合中的单个元素。 */ item => {
            // linkedRules 关联规则列表。
            const linkedRules = rulesForItem(item);
            // hasRule 是否存在规则。
            const hasRule = linkedRules.length > 0;
            return (
              <MuiBox component='div' key={`${item.cookie_id}-${item.item_id}`} data-layout-contract="minimal-product-card" sx={{
  'background': 'rgb(var(--minimal-color-surface))',
  'borderRadius': '7px',
  'border': '1px solid rgb(var(--minimal-color-black)/.02)',
  'boxShadow': 'var(--minimal-shadow-card)',
  'transition': 'transform .2s ease,box-shadow .2s ease',
  '&:hover': {
    'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
    '--minimal-shadow': 'var(--minimal-shadow-lg)',
    '--minimal-shadow-colored': 'var(--minimal-shadow-lg)',
  },
  '@media (max-width:768px)': { 'borderRadius': '6px' },
  'padding': '.75rem',
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  'position': 'relative',
  'display': 'flex',
  'flexDirection': 'column',
  '&:hover [data-product-card-actions]': { opacity: 1 },
  '&:hover [data-product-card-image]': { transform: 'scale(1.05)' },
}}>
                  <MuiBox component='div' data-product-card-actions sx={{
  'position': 'absolute',
  'top': '.5rem',
  'right': '.5rem',
  'display': 'flex',
  'gap': '.25rem',
  'opacity': '0',
  'transitionProperty': 'opacity',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  'zIndex': '10',
}}>
                      <MuiBox component='button'
                        onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleEdit(item)}
                        sx={{
  'padding': '.375rem',
  'backgroundColor': 'rgb(var(--minimal-color-white)/.9)',
  '--minimal-backdrop-blur': 'blur(8px)',
  'backdropFilter': 'var(--minimal-backdrop-blur) var(--minimal-backdrop-brightness) var(--minimal-backdrop-contrast) var(--minimal-backdrop-grayscale) var(--minimal-backdrop-hue-rotate) var(--minimal-backdrop-invert) var(--minimal-backdrop-opacity) var(--minimal-backdrop-saturate) var(--minimal-backdrop-sepia)',
  'borderRadius': '7px',
  '--minimal-shadow': 'var(--minimal-shadow-md)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-md)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                        title="编辑"
                      >
                        <MuiBox component={Edit} sx={{ 'width': '.875rem', 'height': '.875rem' }} />
                      </MuiBox>
                      <MuiBox component='button'
                        onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleDelete(item)}
                        sx={{
  'padding': '.375rem',
  'backgroundColor': 'rgb(var(--minimal-color-white)/.9)',
  '--minimal-backdrop-blur': 'blur(8px)',
  'backdropFilter': 'var(--minimal-backdrop-blur) var(--minimal-backdrop-brightness) var(--minimal-backdrop-contrast) var(--minimal-backdrop-grayscale) var(--minimal-backdrop-hue-rotate) var(--minimal-backdrop-invert) var(--minimal-backdrop-opacity) var(--minimal-backdrop-saturate) var(--minimal-backdrop-sepia)',
  'borderRadius': '7px',
  '--minimal-shadow': 'var(--minimal-shadow-md)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-md)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-danger-100)/var(--minimal-bg-opacity,1))',
  },
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-500)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                        title="删除"
                      >
                        <MuiBox component={Trash2} sx={{ 'width': '.875rem', 'height': '.875rem' }} />
                      </MuiBox>
                  </MuiBox>
                  <MuiBox component='div' sx={{
  'aspectRatio': '1/1',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'borderRadius': '8px',
  'marginBottom': '.625rem',
  'overflow': 'hidden',
  'position': 'relative',
}}>
                      {item.item_image ? (
                          <MuiBox component='img' data-product-card-image src={item.item_image} alt="" sx={{
  'width': '100%',
  'height': '100%',
  'objectFit': 'cover',
  'transitionProperty': 'transform',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.5s',
}} />
                      ) : (
                          <MuiBox component='div' sx={{
  'width': '100%',
  'height': '100%',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-text-opacity,1))',
}}>
                              <MuiBox component={Box} sx={{ 'width': '2rem', 'height': '2rem' }} />
                          </MuiBox>
                      )}
                      <MuiBox component='div' sx={{
  'position': 'absolute',
  'top': '.375rem',
  'left': '.375rem',
  'backgroundColor': 'rgb(var(--minimal-color-black)/.5)',
  'backdropFilter': 'var(--minimal-backdrop-blur) var(--minimal-backdrop-brightness) var(--minimal-backdrop-contrast) var(--minimal-backdrop-grayscale) var(--minimal-backdrop-hue-rotate) var(--minimal-backdrop-invert) var(--minimal-backdrop-opacity) var(--minimal-backdrop-saturate) var(--minimal-backdrop-sepia)',
  '--minimal-backdrop-blur': 'blur(12px)',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  'fontSize': '10px',
  'fontWeight': '700',
  'paddingLeft': '.375rem',
  'paddingRight': '.375rem',
  'paddingTop': '.125rem',
  'paddingBottom': '.125rem',
  'borderRadius': '6px',
}}>
                          {formatItemPrice(item.item_price)}
                      </MuiBox>
                  </MuiBox>
                  <MuiBox component='h3' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'overflow': 'hidden',
  'display': '-webkit-box',
  'WebkitBoxOrient': 'vertical',
  'WebkitLineClamp': '2',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'marginBottom': '.375rem',
  'height': '2rem',
}}>{item.item_title}</MuiBox>
                  <MuiBox component='div' sx={{
  'marginBottom': '.5rem',
  'display': 'inline-flex',
  'minWidth': '0',
  'maxWidth': '100%',
  'alignItems': 'center',
  'gap': '.25rem',
  'alignSelf': 'flex-start',
  'borderRadius': '6px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  'fontSize': '10px',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
}} title={accountNickname(item.cookie_id)}>
                    <MuiBox component={User} sx={{ 'height': '.75rem', 'width': '.75rem', 'flexShrink': '0' }} />
                    <MuiBox component='span' sx={{ 'minWidth': '0', 'overflow': 'hidden', 'textOverflow': 'ellipsis', 'whiteSpace': 'nowrap' }}>{accountNickname(item.cookie_id)}</MuiBox>
                  </MuiBox>
                  <MuiBox component='div' sx={{
  'display': 'flex',
  'justifyContent': 'space-between',
  'alignItems': 'center',
  'fontSize': '10px',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>
                      <MuiBox component='span' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.375rem',
  'paddingRight': '.375rem',
  'paddingTop': '.125rem',
  'paddingBottom': '.125rem',
  'borderRadius': '6px',
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
  'maxWidth': '80px',
}}>ID: {item.item_id}</MuiBox>
                      <MuiBox component='span' sx={[{ 'display': 'inline-flex', 'alignItems': 'center', 'gap': '.25rem', 'fontWeight': '700' }, hasRule ? {
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-600)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-600)/var(--minimal-text-opacity,1))',
}]}>
                        {hasRule ? <MuiBox component={CheckCircle2} sx={{ 'width': '.75rem', 'height': '.75rem' }} /> : <MuiBox component={CircleDashed} sx={{ 'width': '.75rem', 'height': '.75rem' }} />}
                        {hasRule ? `${linkedRules.length} 规则` : '未配置'}
                      </MuiBox>
                  </MuiBox>
                  <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
  'marginTop': 'auto',
}}>
                      <MuiBox component='button'
                        onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => onConfigureDelivery(item)}
                        sx={[{
  'width': '100%',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'gap': '.25rem',
  'paddingLeft': '.625rem',
  'paddingRight': '.625rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'borderRadius': '7px',
  'fontSize': '11px',
  'fontWeight': '800',
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, hasRule ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-black)/var(--minimal-bg-opacity,1))',
  },
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-highlight)/var(--minimal-bg-opacity,1))',
  },
  '--minimal-shadow': 'var(--minimal-shadow-colored)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-md)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '--minimal-shadow-color': 'rgb(var(--minimal-color-brand-100)/1)',
}]}
                      >
                        <MuiBox component='span' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.375rem' }}><MuiBox component={Link2} sx={{ 'width': '.875rem', 'height': '.875rem' }} />{hasRule ? '查看发货规则' : '关联发货规则'}</MuiBox>
                        <MuiBox component={ArrowRight} sx={{ 'width': '.875rem', 'height': '.875rem' }} />
                      </MuiBox>
                  </MuiBox>
              </MuiBox>
            );
          })}
          {visibleItems.length === 0 && (
            <MinimalEmptyState
              icon={<ShoppingBag size={30} />}
              title={accountFilter ? '该账号暂无商品数据' : '暂无商品数据'}
              description={accountFilter ? '切换账号或清除筛选后重试。' : '选择账号并同步商品后，商品会显示在这里。'}
            />
          )}
      </MinimalCardGrid>

      {showEditModal && selectedItem && (
        <MinimalDialogSurface open onClose={/* closeEditItemDialog 关闭商品编辑弹窗。 */ () => setShowEditModal(false)} maxWidth="sm" aria-labelledby="edit-item-title">
          <MuiBox component='div' sx={{ 'width': '100%' }}>
            <MuiBox component='div' sx={{
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'flexShrink': '0',
  'padding': '2rem 2rem 1.5rem',
  'borderBottom': '1px solid rgb(var(--minimal-color-neutral-100))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
}}>
              <div>
                <MuiBox component='h3' id="edit-item-title" sx={{
  'fontSize': '1.25rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>编辑商品</MuiBox>
                <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>ID: {selectedItem.item_id}</MuiBox>
              </div>
              <MuiBox component='button' onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowEditModal(false)} sx={{
  'padding': '.5rem',
  'borderRadius': '8px',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>
                <MuiBox component={X} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}} />
              </MuiBox>
            </MuiBox>
            <MuiBox component='div' sx={{
  'flex': '1 1 auto',
  'overflowY': 'auto',
  'overflowX': 'hidden',
  'padding': '2rem',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
              <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} placeholder="商品标题" value={editForm.item_title || ''} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setEditForm({...editForm, item_title: e.target.value})} />
              <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} placeholder="价格" value={editForm.item_price || ''} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setEditForm({...editForm, item_price: e.target.value})} />
              <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} placeholder="分类" value={editForm.item_category || ''} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setEditForm({...editForm, item_category: e.target.value})} />
              <MuiBox component='textarea' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'height': '7rem',
  'resize': 'none',
}} placeholder="描述" value={editForm.item_description || ''} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setEditForm({...editForm, item_description: e.target.value})} />
            </MuiBox>
            <MuiBox component='div' sx={{
  'flexShrink': '0',
  'padding': '1.5rem 2rem 2rem',
  'borderTop': '1px solid rgb(var(--minimal-color-neutral-100))',
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='button' onClick={handleSaveEdit} sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-brand))',
  'color': 'rgb(var(--minimal-color-white))',
  'fontWeight': '700',
  'border': 'none',
  'transition': 'all .2s cubic-bezier(.25,.8,.25,1)',
  'cursor': 'pointer',
  '&:hover:not(:disabled)': {
    'background': 'rgb(var(--minimal-color-brand-highlight))',
    'transform': 'translateY(-1px)',
    'boxShadow': 'var(--minimal-shadow-brand-strong)',
  },
  '&:active:not(:disabled)': { 'transform': 'translateY(1px)', 'boxShadow': 'var(--minimal-shadow-brand-soft)' },
  '&:disabled': {
    'background': 'rgb(var(--minimal-color-neutral-100))',
    'color': 'rgb(var(--minimal-color-neutral-400))',
    'boxShadow': 'none',
    'transform': 'none',
    'cursor': 'not-allowed',
  },
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
}}>
                <MuiBox component={Save} sx={{ 'width': '1rem', 'height': '1rem' }} />
                保存
              </MuiBox>
            </MuiBox>
          </MuiBox>
        </MinimalDialogSurface>
      )}

      {showAddModal && (
        <MinimalDialogSurface open onClose={/* closeAddItemDialog 关闭新增商品弹窗。 */ () => setShowAddModal(false)} maxWidth="md" aria-labelledby="add-item-title">
          <MuiBox component='div' sx={{ 'width': '100%' }}>
            <MuiBox component='div' sx={{
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'flexShrink': '0',
  'padding': '2rem 2rem 1.5rem',
  'borderBottom': '1px solid rgb(var(--minimal-color-neutral-100))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
}}>
              <div>
                <MuiBox component='h3' id="add-item-title" sx={{
  'fontSize': '1.25rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>添加商品</MuiBox>
                <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>手动建立商品与自动发货规则的关联</MuiBox>
              </div>
              <MuiBox component='button' onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowAddModal(false)} sx={{
  'padding': '.5rem',
  'borderRadius': '8px',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}} title="关闭">
                <MuiBox component={X} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}} />
              </MuiBox>
            </MuiBox>
            <MuiBox component='div' sx={{
  'flex': '1 1 auto',
  'overflowY': 'auto',
  'overflowX': 'hidden',
  'padding': '2rem',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
}}>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>所属账号</MuiBox>
                <MuiBox component='select' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} value={addForm.cookie_id} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setAddForm({...addForm, cookie_id: e.target.value})}>
                  <option value="">选择账号</option>
                  {accounts.map(/* 当前回调处理集合中的单个元素。 */ acc => <option key={acc.id} value={acc.id}>{accountName(acc.id)}</option>)}
                </MuiBox>
              </MuiBox>
              <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:640px)': { 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))' },
  'gap': '1rem',
}}>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>商品 ID</MuiBox>
                  <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} placeholder="输入闲鱼商品 ID" value={addForm.item_id} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setAddForm({...addForm, item_id: e.target.value})} />
                </MuiBox>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>商品价格</MuiBox>
                  <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} placeholder="例如 99.00" value={addForm.item_price} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setAddForm({...addForm, item_price: e.target.value})} />
                </MuiBox>
              </MuiBox>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>商品标题</MuiBox>
                <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} placeholder="输入商品标题" value={addForm.item_title} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setAddForm({...addForm, item_title: e.target.value})} />
              </MuiBox>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>图片 URL</MuiBox>
                <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} placeholder="https://..." value={addForm.item_image} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setAddForm({...addForm, item_image: e.target.value})} />
              </MuiBox>
            </MuiBox>
            <MuiBox component='div' sx={{
  'flexShrink': '0',
  'padding': '1.5rem 2rem 2rem',
  'borderTop': '1px solid rgb(var(--minimal-color-neutral-100))',
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='button' onClick={handleAddItem} sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-brand))',
  'color': 'rgb(var(--minimal-color-white))',
  'fontWeight': '700',
  'border': 'none',
  'transition': 'all .2s cubic-bezier(.25,.8,.25,1)',
  'cursor': 'pointer',
  '&:hover:not(:disabled)': {
    'background': 'rgb(var(--minimal-color-brand-highlight))',
    'transform': 'translateY(-1px)',
    'boxShadow': 'var(--minimal-shadow-brand-strong)',
  },
  '&:active:not(:disabled)': { 'transform': 'translateY(1px)', 'boxShadow': 'var(--minimal-shadow-brand-soft)' },
  '&:disabled': {
    'background': 'rgb(var(--minimal-color-neutral-100))',
    'color': 'rgb(var(--minimal-color-neutral-400))',
    'boxShadow': 'none',
    'transform': 'none',
    'cursor': 'not-allowed',
  },
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.875rem',
  'paddingBottom': '.875rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
}}>
                <MuiBox component={Plus} sx={{ 'width': '1rem', 'height': '1rem' }} />
                添加商品
              </MuiBox>
            </MuiBox>
          </MuiBox>
        </MinimalDialogSurface>
      )}

      {showPublishModal && (
        <MinimalDialogSurface open onClose={/* closePublishDialog 关闭商品发布弹窗。 */ () => setShowPublishModal(false)} maxWidth="lg" aria-labelledby="publish-item-title">
          <MuiBox component='div' sx={{ 'width': '100%' }}>
            <MuiBox component='div' sx={{
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'flexShrink': '0',
  'padding': '2rem 2rem 1.5rem',
  'borderBottom': '1px solid rgb(var(--minimal-color-neutral-100))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
}}>
              <div>
                <MuiBox component='h3' id="publish-item-title" sx={{
  'fontSize': '1.25rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>发布商品到闲鱼</MuiBox>
                <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>普通单规格发布；库存数量会写入闲鱼发布参数，用于判断账号库存能力。</MuiBox>
              </div>
              <MuiBox component='button' onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowPublishModal(false)} sx={{
  'padding': '.5rem',
  'borderRadius': '8px',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}} title="关闭">
                <MuiBox component={X} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}} />
              </MuiBox>
            </MuiBox>
            <MuiBox component='div' sx={{
  'flex': '1 1 auto',
  'overflowY': 'auto',
  'overflowX': 'hidden',
  'padding': '2rem',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
}}>
              <MuiBox component='div' sx={{
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-warning-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-warning-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'fontSize': '.875rem',
  'lineHeight': '1.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-800)/var(--minimal-text-opacity,1))',
}}>
                发布时必须填写库存。若账号没有库存发布能力，后端会返回明确的“库存权限不足”错误，不会误报为普通发布失败。
              </MuiBox>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>发布账号</MuiBox>
                <MuiBox component='select' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} value={publishForm.cookie_id} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => {
				  setPublishForm({...publishForm, cookie_id: e.target.value});
				  setPublishLocations([]);
				  setPublishLocation(null);
				}}>
                  <option value="">选择账号</option>
                  {accounts.map(/* 当前回调处理集合中的单个元素。 */ acc => <option key={acc.id} value={acc.id}>{accountName(acc.id)}</option>)}
                </MuiBox>
              </MuiBox>
              <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:640px)': { 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))' },
  'gap': '1rem',
}}>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>商品标题</MuiBox>
                  <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} placeholder="例如：会员月卡自动发货" value={publishForm.title} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setPublishForm({...publishForm, title: e.target.value})} />
                </MuiBox>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>库存数量</MuiBox>
                  <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} type="number" min="1" placeholder="必须大于 0" value={publishForm.quantity} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setPublishForm({...publishForm, quantity: e.target.value})} />
                </MuiBox>
              </MuiBox>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>商品描述</MuiBox>
                <MuiBox component='textarea' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'height': '7rem',
  'resize': 'none',
}} placeholder="描述会用于自动识别类目；留空时使用标题" value={publishForm.description} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setPublishForm({...publishForm, description: e.target.value})} />
              </MuiBox>
              <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:640px)': { 'gridTemplateColumns': 'repeat(3,minmax(0,1fr))' },
  'gap': '1rem',
}}>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>售价</MuiBox>
                  <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} placeholder="99.00" value={publishForm.price} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setPublishForm({...publishForm, price: e.target.value})} />
                </MuiBox>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>原价（可选）</MuiBox>
                  <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} placeholder="129.00" value={publishForm.original_price} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setPublishForm({...publishForm, original_price: e.target.value})} />
                </MuiBox>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>运费方式</MuiBox>
                  <MuiBox component='select' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} value={publishForm.postage_mode} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setPublishForm({...publishForm, postage_mode: e.target.value})}>
                    <option value="free">包邮</option>
                    <option value="distance">按距离计费</option>
                    <option value="fixed">一口价邮费</option>
                    <option value="none">无需邮寄</option>
                  </MuiBox>
                </MuiBox>
              </MuiBox>
              {publishForm.postage_mode === 'fixed' && (
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>一口价邮费</MuiBox>
                  <MuiBox component='input' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}} placeholder="例如 8.00" value={publishForm.postage} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setPublishForm({...publishForm, postage: e.target.value})} />
                </MuiBox>
              )}
			  <MuiBox component='div' sx={{
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-brand-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
				<MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between', 'gap': '.75rem' }}>
				  <div><MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>发货地（可选）</MuiBox><MuiBox component='p' sx={{
  'marginTop': '.25rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-800)/var(--minimal-text-opacity,1))',
}}>虚拟商品无需发货地；发布失败时可再定位并作为补充信息提交。</MuiBox></div>
				  <MuiBox component='button' type="button" disabled={locationLoading || !publishForm.cookie_id} onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void locateForPublish(false)} sx={{
  'background': 'rgb(var(--minimal-color-brand))',
  'color': 'rgb(var(--minimal-color-white))',
  'fontWeight': '700',
  'border': 'none',
  'transition': 'all .2s cubic-bezier(.25,.8,.25,1)',
  'cursor': 'pointer',
  '&:hover:not(:disabled)': {
    'background': 'rgb(var(--minimal-color-brand-highlight))',
    'transform': 'translateY(-1px)',
    'boxShadow': 'var(--minimal-shadow-brand-strong)',
  },
  '&:active:not(:disabled)': { 'transform': 'translateY(1px)', 'boxShadow': 'var(--minimal-shadow-brand-soft)' },
  '&:disabled': {
    'background': 'rgb(var(--minimal-color-neutral-100))',
    'color': 'rgb(var(--minimal-color-neutral-400))',
    'boxShadow': 'none',
    'transform': 'none',
    'cursor': 'not-allowed',
    'opacity': '.5',
  },
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'borderRadius': '8px',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}>
					<MuiBox component={LocateFixed} sx={{ 'height': '1rem', 'width': '1rem' }} />{locationLoading ? '定位中...' : '获取当前位置'}
				  </MuiBox>
				</MuiBox>
				{publishLocations.length > 0 && <MuiBox component='select' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
}} value={String(Math.max(0, publishLocations.indexOf(publishLocation!)))} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setPublishLocation(publishLocations[Number(e.target.value)] || null)}>
				  {publishLocations.map(/* 当前回调处理集合中的单个元素。 */ (item, index) => <option key={`${item.division_id}-${item.poi_id}-${index}`} value={String(index)}>{[item.province, item.city, item.area, item.poi_name].filter(Boolean).join(' ')}</option>)}
				</MuiBox>}
			  </MuiBox>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>商品图片（1-9 张）</MuiBox>
                <MuiBox component='label' sx={{
  'display': 'flex',
  'minHeight': '120px',
  'cursor': 'pointer',
  'flexDirection': 'column',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '10px',
  'borderWidth': '2px',
  'borderStyle': 'dashed',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '1.5rem',
  'paddingBottom': '1.5rem',
  'textAlign': 'center',
  '&:hover': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-success-300)/var(--minimal-border-opacity,1))',
    'backgroundColor': 'rgb(var(--minimal-color-success-50)/.5)',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>
                  <MuiBox component={UploadCloud} sx={{
  'width': '2rem',
  'height': '2rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-600)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}} />
                  <MuiBox component='span' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>选择图片</MuiBox>
                  <MuiBox component='span' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>{publishForm.images.length ? '已选择 ' + publishForm.images.length + ' 张' : '支持 JPG / PNG / GIF'}</MuiBox>
                  <MuiBox component='input'
                    sx={{ 'display': 'none' }}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setPublishForm({...publishForm, images: Array.from(e.target.files || []).slice(0, 9)})}
                  />
                </MuiBox>
                {publishImagePreviews.length > 0 && (
                  <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(4,minmax(0,1fr))',
  '@media (min-width:640px)': { 'gridTemplateColumns': 'repeat(6,minmax(0,1fr))' },
  'gap': '.75rem',
}}>
                    {publishImagePreviews.map(/* 当前回调处理集合中的单个元素。 */ (preview) => (
                      <MuiBox component='div' key={preview.key} sx={{
  'aspectRatio': '1/1',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'overflow': 'hidden',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
}}>
                        <MuiBox component='img' src={preview.url} alt="" sx={{ 'width': '100%', 'height': '100%', 'objectFit': 'cover' }} />
                      </MuiBox>
                    ))}
                  </MuiBox>
                )}
              </MuiBox>
            </MuiBox>
            <MuiBox component='div' sx={{
  'flexShrink': '0',
  'padding': '1.5rem 2rem 2rem',
  'borderTop': '1px solid rgb(var(--minimal-color-neutral-100))',
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='button' disabled={publishing} onClick={handlePublishItem} sx={{
  'width': '100%',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-500)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-success-600)/var(--minimal-bg-opacity,1))',
  },
  '&:disabled': { 'opacity': '.6' },
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.875rem',
  'paddingBottom': '.875rem',
  'borderRadius': '8px',
  'fontWeight': '700',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
}}>
                <MuiBox component={PackagePlus} sx={{ 'width': '1rem', 'height': '1rem' }} />
                {publishing ? '正在发布...' : '发布到闲鱼'}
              </MuiBox>
            </MuiBox>
          </MuiBox>
        </MinimalDialogSurface>
      )}

      {showBatchModal && (
        <MinimalDialogSurface open onClose={/* closeBatchDialog 关闭批量铺货弹窗。 */ () => void closeBatchModal()} maxWidth="xl" aria-labelledby="batch-item-title">
          <MuiBox component='div' sx={{ 'width': '100%' }}>
            <MuiBox component='div' sx={{
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'flexShrink': '0',
  'padding': '2rem 2rem 1.5rem',
  'borderBottom': '1px solid rgb(var(--minimal-color-neutral-100))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
}}>
              <div>
                <MuiBox component='h3' id="batch-item-title" sx={{
  'fontSize': '1.25rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>批量铺货</MuiBox>
                <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>上传商品表格和图片 zip，先预检，再逐条发布到闲鱼。</MuiBox>
              </div>
              <MuiBox component='button' onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void closeBatchModal()} sx={{
  'padding': '.5rem',
  'borderRadius': '8px',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}} title="关闭">
                <MuiBox component={X} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}} />
              </MuiBox>
            </MuiBox>

            <MuiBox component='div' sx={{
  'flex': '1 1 auto',
  'overflowY': 'auto',
  'overflowX': 'hidden',
  'padding': '2rem',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
}}>
              <BatchPhaseIndicator phase={batchPhase} />

              {batchPhase === 'upload' && (
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='div' sx={{
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'fontSize': '.875rem',
  'lineHeight': '1.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-900)/var(--minimal-text-opacity,1))',
}}>
                    <MuiBox component='div' sx={{
  'display': 'flex',
  'flexDirection': 'column',
  '@media (min-width:768px)': { 'flexDirection': 'row', 'alignItems': 'center', 'justifyContent': 'space-between' },
  'gap': '.75rem',
}}>
                      <div>
                        <MuiBox component='div' sx={{ 'fontWeight': '800' }}>先下载模板，再按字段填写。</MuiBox>
                        <div>图片字段写 zip 内相对路径，多个图片用英文分号分隔，例如 <MuiBox component='span' sx={{
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontWeight': '700',
}}>images/a.jpg;images/b.jpg</MuiBox>。也支持直接填写图片 URL。</div>
                      </div>
                      <MuiBox component='button'
                        type="button"
                        onClick={downloadPublishTemplate}
                        sx={{
  'flexShrink': '0',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-600)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-700)/var(--minimal-bg-opacity,1))',
  },
}}
                      >
                        下载CSV模板
                      </MuiBox>
                    </MuiBox>
                  </MuiBox>

                  <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
                    <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>默认发布账号</MuiBox>
                    <MuiBox component='select'
                      sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
}}
                      value={selectedAccount}
                      onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => {
						setSelectedAccount(e.target.value);
						setBatchLocations([]);
						setBatchLocation(null);
					  }}
                    >
                      <option value="">选择账号</option>
                      {accounts.map(/* 当前回调处理集合中的单个元素。 */ acc => <option key={acc.id} value={acc.id}>{accountName(acc.id)}</option>)}
                    </MuiBox>
                    <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>表格中“账号ID”为空时，会使用这里选择的账号。</MuiBox>
                  </MuiBox>

                  <MuiBox component='div' sx={{
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-warning-200)/var(--minimal-border-opacity,1))',
  'backgroundColor': 'rgb(var(--minimal-color-warning-50)/.7)',
  'padding': '1rem',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                    <div>
                      <MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>默认类目 <MuiBox component='span' sx={{
  'fontWeight': '500',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>（可为空）</MuiBox></MuiBox>
                      <MuiBox component='p' sx={{
  'marginTop': '.25rem',
  'fontSize': '.75rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-800)/var(--minimal-text-opacity,1))',
}}>填写后优先使用该类目；留空时由闲鱼根据每件商品自动识别。仍无法识别时，系统最终使用“电子资料”兜底。</MuiBox>
                    </div>
                    <MuiBox component='div' sx={{
  'display': 'flex',
  'flexDirection': 'column',
  'gap': '.5rem',
  '@media (min-width:640px)': { 'flexDirection': 'row' },
}}>
                      <MuiBox component='label' sx={{ 'position': 'relative', 'flex': '1 1 0%' }}>
                        <MuiBox component='span' sx={{
  'position': 'absolute',
  'width': '1px',
  'height': '1px',
  'padding': '0',
  'margin': '-1px',
  'overflow': 'hidden',
  'clip': 'rect(0,0,0,0)',
  'whiteSpace': 'nowrap',
  'borderWidth': '0',
}}>类目关键词</MuiBox>
                        <MuiBox component={Search} sx={{
  'pointerEvents': 'none',
  'position': 'absolute',
  'left': '.75rem',
  'top': '50%',
  'height': '1rem',
  'width': '1rem',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}} />
                        <MuiBox component='input'
                          sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'paddingLeft': '2.5rem',
  'paddingRight': '.75rem',
}}
                          placeholder="输入关键词，例如：课程资料、设计素材"
                          value={batchCategoryKeyword}
                          onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setBatchCategoryKeyword(e.target.value)}
                          onKeyDown={/* 当前回调处理用户交互或异步状态变化。 */ e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              void handleRecommendBatchCategory();
                            }
                          }}
                        />
                      </MuiBox>
                      <MuiBox component='button'
                        type="button"
                        disabled={!selectedAccount || !batchCategoryKeyword.trim() || batchCategoryLoading}
                        onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void handleRecommendBatchCategory()}
                        sx={{
  'background': 'rgb(var(--minimal-color-brand))',
  'color': 'rgb(var(--minimal-color-white))',
  'fontWeight': '700',
  'border': 'none',
  'transition': 'all .2s cubic-bezier(.25,.8,.25,1)',
  'cursor': 'pointer',
  '&:hover:not(:disabled)': {
    'background': 'rgb(var(--minimal-color-brand-highlight))',
    'transform': 'translateY(-1px)',
    'boxShadow': 'var(--minimal-shadow-brand-strong)',
  },
  '&:active:not(:disabled)': { 'transform': 'translateY(1px)', 'boxShadow': 'var(--minimal-shadow-brand-soft)' },
  '&:disabled': {
    'background': 'rgb(var(--minimal-color-neutral-100))',
    'color': 'rgb(var(--minimal-color-neutral-400))',
    'boxShadow': 'none',
    'transform': 'none',
    'cursor': 'not-allowed',
    'opacity': '.5',
  },
  'display': 'flex',
  'minHeight': '42px',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
  'borderRadius': '8px',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
                      >
                        <MuiBox component={Search} sx={{ 'height': '1rem', 'width': '1rem' }} />
                        {batchCategoryLoading ? '匹配中...' : '获取类目'}
                      </MuiBox>
                    </MuiBox>
                    {batchFallbackCategory.catId ? (
                      <MuiBox component='div' sx={{
  'display': 'flex',
  'minHeight': '46px',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'gap': '.75rem',
  'borderTopWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-warning-200)/var(--minimal-border-opacity,1))',
  'paddingTop': '.75rem',
}}>
                        <MuiBox component='div' sx={{ 'minWidth': '0' }}>
                          <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>
                            <MuiBox component={CheckCircle2} sx={{
  'height': '1rem',
  'width': '1rem',
  'flexShrink': '0',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-600)/var(--minimal-text-opacity,1))',
}} />
                            <MuiBox component='span' sx={{ 'overflow': 'hidden', 'textOverflow': 'ellipsis', 'whiteSpace': 'nowrap' }}>{batchFallbackCategory.catName}</MuiBox>
                          </MuiBox>
                          <MuiBox component='div' sx={{
  'marginTop': '.25rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>类目 {batchFallbackCategory.catId} · 频道 {batchFallbackCategory.channelCatId}</MuiBox>
                        </MuiBox>
                        <MuiBox component='button'
                          type="button"
                          title="清除默认类目"
                          onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setBatchFallbackCategory({ catId: '', catName: '', channelCatId: '', tbCatId: '' })}
                          sx={{
  'display': 'flex',
  'height': '2.25rem',
  'width': '2.25rem',
  'flexShrink': '0',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '7px',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  },
}}
                        >
                          <MuiBox component={X} sx={{ 'height': '1rem', 'width': '1rem' }} />
                        </MuiBox>
                      </MuiBox>
                    ) : null}
                  </MuiBox>

				  <MuiBox component='div' sx={{
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-brand-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
					<MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between', 'gap': '.75rem' }}>
					  <div><MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>批次发货地（可选）</MuiBox><MuiBox component='p' sx={{
  'marginTop': '.25rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-800)/var(--minimal-text-opacity,1))',
}}>虚拟商品可留空；填写后整个批次使用同一个发货地，并随任务保存用于恢复和重试。</MuiBox></div>
					  <MuiBox component='button' type="button" disabled={locationLoading || !selectedAccount} onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void locateForPublish(true)} sx={{
  'background': 'rgb(var(--minimal-color-brand))',
  'color': 'rgb(var(--minimal-color-white))',
  'fontWeight': '700',
  'border': 'none',
  'transition': 'all .2s cubic-bezier(.25,.8,.25,1)',
  'cursor': 'pointer',
  '&:hover:not(:disabled)': {
    'background': 'rgb(var(--minimal-color-brand-highlight))',
    'transform': 'translateY(-1px)',
    'boxShadow': 'var(--minimal-shadow-brand-strong)',
  },
  '&:active:not(:disabled)': { 'transform': 'translateY(1px)', 'boxShadow': 'var(--minimal-shadow-brand-soft)' },
  '&:disabled': {
    'background': 'rgb(var(--minimal-color-neutral-100))',
    'color': 'rgb(var(--minimal-color-neutral-400))',
    'boxShadow': 'none',
    'transform': 'none',
    'cursor': 'not-allowed',
    'opacity': '.5',
  },
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'borderRadius': '8px',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}>
						<MuiBox component={LocateFixed} sx={{ 'height': '1rem', 'width': '1rem' }} />{locationLoading ? '定位中...' : '获取当前位置'}
					  </MuiBox>
					</MuiBox>
					{batchLocations.length > 0 && <MuiBox component='select' sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
}} value={String(Math.max(0, batchLocations.indexOf(batchLocation!)))} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setBatchLocation(batchLocations[Number(e.target.value)] || null)}>
					  {batchLocations.map(/* 当前回调处理集合中的单个元素。 */ (item, index) => <option key={`${item.division_id}-${item.poi_id}-${index}`} value={String(index)}>{[item.province, item.city, item.area, item.poi_name].filter(Boolean).join(' ')}</option>)}
					</MuiBox>}
					  </MuiBox>

					  <MuiBox component='div' sx={{
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-accent-100)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-accent-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
						<MuiBox component='label' sx={{ 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between', 'gap': '1rem' }} htmlFor="batch-publish-interval">
						  <MuiBox component='span' sx={{ 'minWidth': '0' }}><MuiBox component='span' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>商品发布强制间隔</MuiBox><MuiBox component='span' sx={{
  'marginTop': '.25rem',
  'display': 'block',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-accent-700)/var(--minimal-text-opacity,1))',
}}>图片会提前上传，只有最终发布请求之间至少等待该时间。</MuiBox></MuiBox>
						  <MuiBox component='span' sx={{ 'display': 'flex', 'flexShrink': '0', 'alignItems': 'center', 'gap': '.5rem' }}><MuiBox component='input' id="batch-publish-interval" type="number" min={1} max={3600} step={1} inputMode="numeric" sx={{
  'background': 'rgb(var(--minimal-color-surface-subtle))',
  'border': '1px solid var(--minimal-color-transparent)',
  'transition': 'all .3s cubic-bezier(.25,.8,.25,1)',
  'color': 'rgb(var(--minimal-color-ink))',
  'fontWeight': '500',
  '&:focus': {
    'background': 'rgb(var(--minimal-color-surface))',
    'borderColor': 'rgb(var(--minimal-color-brand))',
    'boxShadow': '0 0 0 4px rgb(var(--minimal-color-brand)/.3)',
    'outline': 'none',
  },
  '&::-moz-placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '&::placeholder': { 'color': 'rgb(var(--minimal-color-neutral-400))', 'fontWeight': '400' },
  '@media (max-width:768px)': { 'fontSize': '16px' },
  'width': '6rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'textAlign': 'right',
}} value={batchPublishIntervalSeconds} onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setBatchPublishIntervalSeconds(Math.min(3600, Math.max(1, Number(e.target.value) || 1)))} /><MuiBox component='span' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-accent-700)/var(--minimal-text-opacity,1))',
}}>秒</MuiBox></MuiBox>
						</MuiBox>
					  </MuiBox>

	                  <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:768px)': { 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))' },
  'gap': '1rem',
}}>
                    <MuiBox component='label' sx={{
  'display': 'flex',
  'minHeight': '150px',
  'cursor': 'pointer',
  'flexDirection': 'column',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '10px',
  'borderWidth': '2px',
  'borderStyle': 'dashed',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '1.5rem',
  'paddingBottom': '1.5rem',
  'textAlign': 'center',
  '&:hover': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-brand-300)/var(--minimal-border-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>
                      <MuiBox component={UploadCloud} sx={{
  'width': '2.25rem',
  'height': '2.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
  'marginBottom': '.75rem',
}} />
                      <MuiBox component='span' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>上传商品表格</MuiBox>
                      <MuiBox component='span' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>{batchFile ? batchFile.name : '支持 .xlsx / .csv / .tsv'}</MuiBox>
                      <MuiBox component='input'
                        sx={{ 'display': 'none' }}
                        type="file"
                        accept=".xlsx,.csv,.tsv"
                        onChange={/* 当前回调读取本次文件快照并重置原生控件，以便同一路径文件修改后可再次选择。 */ event => setBatchFile(consumeSelectedFile(event.currentTarget))}
                      />
                    </MuiBox>
                    <MuiBox component='label' sx={{
  'display': 'flex',
  'minHeight': '150px',
  'cursor': 'pointer',
  'flexDirection': 'column',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '10px',
  'borderWidth': '2px',
  'borderStyle': 'dashed',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '1.5rem',
  'paddingBottom': '1.5rem',
  'textAlign': 'center',
  '&:hover': {
    '--minimal-border-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-success-300)/var(--minimal-border-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>
                      <MuiBox component={UploadCloud} sx={{
  'width': '2.25rem',
  'height': '2.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-600)/var(--minimal-text-opacity,1))',
  'marginBottom': '.75rem',
}} />
                      <MuiBox component='span' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>上传图片 zip（可选）</MuiBox>
                      <MuiBox component='span' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>{batchImagesZip ? batchImagesZip.name : '表格图片字段使用 zip 内相对路径'}</MuiBox>
                      <MuiBox component='input'
                        sx={{ 'display': 'none' }}
                        type="file"
                        accept=".zip"
                        onChange={/* 当前回调处理用户交互或异步状态变化。 */ e => setBatchImagesZip(e.target.files?.[0] || null)}
                      />
                    </MuiBox>
                  </MuiBox>

                  <MuiBox component='div' sx={{
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'padding': '1rem',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                    <div>
                      <MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>字段说明</MuiBox>
                      <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>照着下面的“什么时候填写”处理即可。预检发现问题时，会指出具体哪一行需要修改。</MuiBox>
                    </div>

                    <MuiBox component='div' sx={{
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-950)/var(--minimal-text-opacity,1))',
}}>
                      <MuiBox component='div' sx={{ 'fontSize': '.875rem', 'lineHeight': '1.25rem', 'fontWeight': '800' }}>“付款后发送的卡密”怎么填</MuiBox>
                      <MuiBox component='div' sx={{
  'marginTop': '.75rem',
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  'gap': '.75rem',
  '@media (min-width:1024px)': { 'gridTemplateColumns': 'repeat(3,minmax(0,1fr))' },
}}>
                        <MuiBox component='div' sx={{ 'borderRadius': '7px', 'backgroundColor': 'rgb(var(--minimal-color-white)/.8)', 'padding': '.75rem' }}>
                          <MuiBox component='code' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
}}>101</MuiBox>
                          <MuiBox component='p' sx={{ 'marginTop': '.25rem', 'lineHeight': '1.25rem' }}>从卡密组 101 立即发送 1 份。卡密组 ID 可以在“卡密库存”页面查看。</MuiBox>
                        </MuiBox>
                        <MuiBox component='div' sx={{ 'borderRadius': '7px', 'backgroundColor': 'rgb(var(--minimal-color-white)/.8)', 'padding': '.75rem' }}>
                          <MuiBox component='code' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
}}>101:2</MuiBox>
                          <MuiBox component='p' sx={{ 'marginTop': '.25rem', 'lineHeight': '1.25rem' }}>每购买 1 件，就从卡密组 101 发送 2 份。买家购买 3 件时会发送 6 份。</MuiBox>
                        </MuiBox>
                        <MuiBox component='div' sx={{ 'borderRadius': '7px', 'backgroundColor': 'rgb(var(--minimal-color-white)/.8)', 'padding': '.75rem' }}>
                          <MuiBox component='code' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
}}>101:1:0;102:2:3</MuiBox>
                          <MuiBox component='p' sx={{ 'marginTop': '.25rem', 'lineHeight': '1.25rem' }}>先立即发送卡密组 101 的 1 份，再等待 3 秒发送卡密组 102 的 2 份。</MuiBox>
                        </MuiBox>
                      </MuiBox>
                      <MuiBox component='p' sx={{
  'marginTop': '.75rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-800)/var(--minimal-text-opacity,1))',
}}>
                        每一组依次写“卡密组 ID : 每件发送几份 : 等待几秒”。份数不写时按 1 份处理，等待时间不写时立即发送。需要发送多种卡密时，用英文分号 <MuiBox component='code' sx={{ 'fontWeight': '700' }}>;</MuiBox> 隔开。
                      </MuiBox>
                    </MuiBox>
                    <MuiBox component='div' sx={{
  'overflowX': 'auto',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
}}>
                      <MuiBox component='table' sx={{ 'width': '100%', 'textAlign': 'left', 'fontSize': '.75rem', 'lineHeight': '1rem' }}>
                        <MuiBox component='thead' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>
                          <tr>
                            <MuiBox component='th' sx={{ 'paddingLeft': '.75rem', 'paddingRight': '.75rem', 'paddingTop': '.5rem', 'paddingBottom': '.5rem' }}>字段</MuiBox>
                            <MuiBox component='th' sx={{ 'paddingLeft': '.75rem', 'paddingRight': '.75rem', 'paddingTop': '.5rem', 'paddingBottom': '.5rem' }}>什么时候填写</MuiBox>
                            <MuiBox component='th' sx={{ 'paddingLeft': '.75rem', 'paddingRight': '.75rem', 'paddingTop': '.5rem', 'paddingBottom': '.5rem' }}>填写方法</MuiBox>
                          </tr>
                        </MuiBox>
                        <MuiBox component='tbody' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-divide-y-reverse': '0',
    'borderTopWidth': 'calc(1px*(1 - var(--minimal-divide-y-reverse)))',
    'borderBottomWidth': 'calc(1px*var(--minimal-divide-y-reverse))',
    '--minimal-divide-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-divide-opacity,1))',
  },
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>
                          {[
                            ['账号ID', '需要覆盖默认账号时填写', '上方默认发布账号为必选；本列留空时使用默认账号，填写后仅覆盖当前行'],
                            ['标题', '每个商品都要填', '填写买家能看到的商品标题'],
                            ['描述', '可以留空', '留空时会使用商品标题作为描述'],
                            ['价格', '每个商品都要填', '只填数字，例如 19.90'],
                            ['原价', '可以留空', '需要展示划线原价时填写，例如 29.90'],
                            ['库存', '可以留空', '留空按 1 件处理；填写时必须大于 0'],
                            ['邮费模式', '可以留空', '留空表示包邮；包邮填 free，固定邮费填 fixed'],
                            ['邮费', '邮费模式填 fixed 时填写', '只填数字，例如 8.00'],
                            ['图片', '每个商品都要填', '填写 zip 内图片路径或图片网址；多张图片用英文分号隔开'],
                            ['类目ID', '需要指定当前行默认类目时填写', '必须和“类目名称、频道类目ID”同时填写；优先于自动识别'],
                            ['类目名称', '填写了“类目ID”时必填', '填写该 ID 对应的准确类目名称'],
                            ['频道类目ID', '覆盖类目时必填', '必须填写闲鱼返回的准确频道类目 ID'],
                            ['淘宝类目ID', '按闲鱼返回填写', '“电子资料”无淘宝类目 ID，保持为空'],
                            ['付款发货启用', '需要付款后自动发货时填写', '填“是”表示开启；不需要时填“否”或留空'],
                            ['付款发货内容', '“付款发货启用”填“是”时填写', '从“卡密库存”页面取得卡密组 ID，按上方示例填写'],
                            ['评价赠品启用', '需要评价赠品时填写', '填“是”表示开启；不需要时填“否”或留空'],
                            ['评价赠品内容', '“评价赠品启用”填“是”时填写', '格式和付款发货内容相同，也可以同时发送多个卡密组'],
                            ['求评价启用', '需要自动求评价时填写', '填“是”表示开启；不需要时填“否”或留空'],
                            ['求评价等待小时', '“求评价启用”填“是”时填写', '填写等待小时数；留空按 72 小时处理'],
                            ['求评价文案', '“求评价启用”填“是”时填写', '填写要发送给买家的求评价消息'],
                            ['求评价最多次数', '可以留空', '留空只提醒 1 次'],
                          ].map(/* 当前回调处理用户交互或异步状态变化。 */ ([name, when, desc]) => (
                            <tr key={name}>
                              <MuiBox component='td' sx={{
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'whiteSpace': 'nowrap',
}}>{name}</MuiBox>
                              <MuiBox component='td' sx={[{
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'minWidth': '210px',
  'fontWeight': '700',
}, when === '每个商品都要填' ? {
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-600)/var(--minimal-text-opacity,1))',
} : when === '可以留空' ? {
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-700)/var(--minimal-text-opacity,1))',
}]}>{when}</MuiBox>
                              <MuiBox component='td' sx={{
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'minWidth': '260px',
}}>{desc}</MuiBox>
                            </tr>
                          ))}
                        </MuiBox>
                      </MuiBox>
                    </MuiBox>
                  </MuiBox>
                </MuiBox>
              )}

              {batchPhase === 'preview' && batchPreview && (
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='div' sx={{ 'display': 'grid', 'gridTemplateColumns': 'repeat(3,minmax(0,1fr))', 'gap': '.75rem' }}>
                    <MuiBox component='div' sx={{
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
}}>
                      <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>总行数</MuiBox>
                      <MuiBox component='div' sx={{
  'fontSize': '1.5rem',
  'lineHeight': '2rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>{batchPreview.total}</MuiBox>
                    </MuiBox>
                    <MuiBox component='div' sx={{
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-success-100)/var(--minimal-border-opacity,1))',
}}>
                      <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
}}>可发布</MuiBox>
                      <MuiBox component='div' sx={{
  'fontSize': '1.5rem',
  'lineHeight': '2rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>{batchPreview.valid}</MuiBox>
                    </MuiBox>
                    <MuiBox component='div' sx={{
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-danger-100)/var(--minimal-border-opacity,1))',
}}>
                      <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
}}>有问题</MuiBox>
                      <MuiBox component='div' sx={{
  'fontSize': '1.5rem',
  'lineHeight': '2rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>{batchPreview.invalid}</MuiBox>
                    </MuiBox>
                  </MuiBox>

                  <MuiBox component='div' sx={{
  'maxHeight': '380px',
  'overflowY': 'auto',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
}}>
                    <MuiBox component='table' sx={{ 'width': '100%', 'textAlign': 'left', 'fontSize': '.875rem', 'lineHeight': '1.25rem' }}>
                      <MuiBox component='thead' sx={{
  'position': 'sticky',
  'top': '0',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
}}>
                        <tr>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>行号</MuiBox>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>状态</MuiBox>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>标题</MuiBox>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>价格/库存</MuiBox>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>类目策略</MuiBox>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>图片</MuiBox>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>问题</MuiBox>
                        </tr>
                      </MuiBox>
                      <MuiBox component='tbody' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-divide-y-reverse': '0',
    'borderTopWidth': 'calc(1px*(1 - var(--minimal-divide-y-reverse)))',
    'borderBottomWidth': 'calc(1px*var(--minimal-divide-y-reverse))',
    '--minimal-divide-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-divide-opacity,1))',
  },
}}>
                        {batchPreview.rows.map(/* 当前回调处理集合中的单个元素。 */ row => (
                          <MuiBox component='tr' key={row.row_no} sx={{
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  },
}}>
                            <MuiBox component='td' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
}}>{row.row_no}</MuiBox>
                            <MuiBox component='td' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>
                              <MuiBox component='span' sx={[{
  'display': 'inline-flex',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  'borderRadius': '7px',
  'borderWidth': '1px',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '800',
}, row.valid ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-success-100)/var(--minimal-border-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-danger-100)/var(--minimal-border-opacity,1))',
}]}>
                                {row.valid ? '可发布' : '需修正'}
                              </MuiBox>
                            </MuiBox>
                            <MuiBox component='td' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'maxWidth': '240px',
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
}}>{row.title || '-'}</MuiBox>
                            <MuiBox component='td' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}}>¥{row.price || '-'} / {row.quantity || 1}</MuiBox>
                            <MuiBox component='td' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'minWidth': '150px',
}}>
                              <MuiBox component='div' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>{row.category?.cat_name || '自动识别'}</MuiBox>
                              <MuiBox component='div' sx={{
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>{row.category?.cat_id || '失败后使用电子资料'}</MuiBox>
                            </MuiBox>
                            <MuiBox component='td' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}}>{row.images?.length || 0} 张</MuiBox>
                            <MuiBox component='td' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-600)/var(--minimal-text-opacity,1))',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'maxWidth': '280px',
}}>{row.errors?.join('；') || '-'}</MuiBox>
                          </MuiBox>
                        ))}
                      </MuiBox>
                    </MuiBox>
                  </MuiBox>
                </MuiBox>
              )}

              {(batchPhase === 'running' || batchPhase === 'done') && batchDetail && (
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(2,minmax(0,1fr))',
  '@media (min-width:768px)': { 'gridTemplateColumns': 'repeat(5,minmax(0,1fr))' },
  'gap': '.75rem',
}}>
                    <MuiBox component='div' sx={[{ border: 1, borderRadius: 2, p: 2 }, batchToneSx(batchDetail.status)]}>
                      <MuiBox component='div' sx={{ 'fontSize': '.75rem', 'lineHeight': '1rem', 'fontWeight': '700', 'opacity': '.7' }}>任务状态</MuiBox>
                      <MuiBox component='div' sx={{ 'fontSize': '1.25rem', 'lineHeight': '1.75rem', 'fontWeight': '800', 'marginTop': '.25rem' }}>{batchStatusText(batchDetail.status)}</MuiBox>
                    </MuiBox>
                    <MuiBox component='div' sx={{
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
}}>
                      <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>总数</MuiBox>
                      <MuiBox component='div' sx={{
  'fontSize': '1.25rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>{batchDetail.total}</MuiBox>
                    </MuiBox>
                    <MuiBox component='div' sx={{
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-success-100)/var(--minimal-border-opacity,1))',
}}>
                      <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
}}>成功</MuiBox>
                      <MuiBox component='div' sx={{
  'fontSize': '1.25rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>{batchDetail.success}</MuiBox>
                    </MuiBox>
                    <MuiBox component='div' sx={{
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-danger-100)/var(--minimal-border-opacity,1))',
}}>
                      <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
}}>失败</MuiBox>
                      <MuiBox component='div' sx={{
  'fontSize': '1.25rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-700)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>{batchDetail.failed}</MuiBox>
                    </MuiBox>
                    <MuiBox component='div' sx={{
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-border-opacity,1))',
}}>
                      <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
}}>等待</MuiBox>
                      <MuiBox component='div' sx={{
  'fontSize': '1.25rem',
  'lineHeight': '1.75rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>{batchDetail.pending}</MuiBox>
                    </MuiBox>
                  </MuiBox>

                  <MuiBox component='div' sx={{
  'maxHeight': '420px',
  'overflowY': 'auto',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
}}>
                    <MuiBox component='table' sx={{ 'width': '100%', 'textAlign': 'left', 'fontSize': '.875rem', 'lineHeight': '1.25rem' }}>
                      <MuiBox component='thead' sx={{
  'position': 'sticky',
  'top': '0',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
}}>
                        <tr>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>行号</MuiBox>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>状态</MuiBox>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>标题</MuiBox>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>类目策略</MuiBox>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>商品ID</MuiBox>
                          <MuiBox component='th' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>错误原因</MuiBox>
                        </tr>
                      </MuiBox>
                      <MuiBox component='tbody' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-divide-y-reverse': '0',
    'borderTopWidth': 'calc(1px*(1 - var(--minimal-divide-y-reverse)))',
    'borderBottomWidth': 'calc(1px*var(--minimal-divide-y-reverse))',
    '--minimal-divide-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-divide-opacity,1))',
  },
}}>
                        {batchDetail.rows.map(/* 当前回调处理集合中的单个元素。 */ row => (
                          <MuiBox component='tr' key={row.id} sx={{
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  },
}}>
                            <MuiBox component='td' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
}}>{row.row_no}</MuiBox>
                            <MuiBox component='td' sx={{ 'paddingLeft': '1rem', 'paddingRight': '1rem', 'paddingTop': '.75rem', 'paddingBottom': '.75rem' }}>
                              <MuiBox component='span' sx={[{ display: 'inline-flex', border: 1, borderRadius: 1, px: 1, py: 0.5, fontSize: 12, fontWeight: 800 }, batchToneSx(row.status)]}>
                                {batchStatusText(row.status)}
                              </MuiBox>
                            </MuiBox>
                            <MuiBox component='td' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'maxWidth': '260px',
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
}}>{row.title}</MuiBox>
                            <MuiBox component='td' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'minWidth': '150px',
}}>
                              <MuiBox component='div' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>{row.category?.cat_name || '自动识别'}</MuiBox>
                              <MuiBox component='div' sx={{
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>{row.category?.cat_id || '失败后使用电子资料'}</MuiBox>
                            </MuiBox>
                            <MuiBox component='td' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
}}>
                              {row.item_url ? <MuiBox component='a' href={row.item_url} target="_blank" rel="noreferrer" sx={{
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
  '&:hover': { 'textDecorationLine': 'underline' },
}}>{row.item_id}</MuiBox> : (row.item_id || '-')}
                            </MuiBox>
                            <MuiBox component='td' sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-600)/var(--minimal-text-opacity,1))',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'maxWidth': '340px',
}}>{row.error_message || '-'}</MuiBox>
                          </MuiBox>
                        ))}
                      </MuiBox>
                    </MuiBox>
                  </MuiBox>
                </MuiBox>
              )}
            </MuiBox>

            <MuiBox component='div' sx={{
  'flexShrink': '0',
  'padding': '1.5rem 2rem 2rem',
  'borderTop': '1px solid rgb(var(--minimal-color-neutral-100))',
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              {batchPhase === 'upload' && (
                <MuiBox component='button' disabled={batchLoading || !batchFile || !selectedAccount} onClick={handlePreviewBatch} sx={{
  'width': '100%',
  'background': 'rgb(var(--minimal-color-brand))',
  'color': 'rgb(var(--minimal-color-white))',
  'fontWeight': '700',
  'border': 'none',
  'transition': 'all .2s cubic-bezier(.25,.8,.25,1)',
  'cursor': 'pointer',
  '&:hover:not(:disabled)': {
    'background': 'rgb(var(--minimal-color-brand-highlight))',
    'transform': 'translateY(-1px)',
    'boxShadow': 'var(--minimal-shadow-brand-strong)',
  },
  '&:active:not(:disabled)': { 'transform': 'translateY(1px)', 'boxShadow': 'var(--minimal-shadow-brand-soft)' },
  '&:disabled': {
    'background': 'rgb(var(--minimal-color-neutral-100))',
    'color': 'rgb(var(--minimal-color-neutral-400))',
    'boxShadow': 'none',
    'transform': 'none',
    'cursor': 'not-allowed',
    'opacity': '.5',
  },
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.875rem',
  'paddingBottom': '.875rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
}}>
                  <MuiBox component={RefreshCw} sx={[{ 'width': '1rem', 'height': '1rem' }, batchLoading ? { 'animation': 'spin 1s linear infinite' } : {}]} />
                  {batchLoading ? '正在预检...' : '开始预检'}
                </MuiBox>
              )}
              {batchPhase === 'preview' && batchPreview && (
                <MuiBox component='div' sx={{ 'display': 'flex', 'gap': '.75rem', 'width': '100%' }}>
                  <MuiBox component='button' disabled={batchLoading} onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void abandonBatchPreview()} sx={{
  'flex': '1 1 0%',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.875rem',
  'paddingBottom': '.875rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
  'fontWeight': '700',
}}>
                    返回修改
                  </MuiBox>
                  <MuiBox component='button' disabled={batchLoading || batchPreview.valid <= 0} onClick={handleStartBatch} sx={{
  'flex': '1 1 0%',
  'background': 'rgb(var(--minimal-color-brand))',
  'color': 'rgb(var(--minimal-color-white))',
  'fontWeight': '700',
  'border': 'none',
  'transition': 'all .2s cubic-bezier(.25,.8,.25,1)',
  'cursor': 'pointer',
  '&:hover:not(:disabled)': {
    'background': 'rgb(var(--minimal-color-brand-highlight))',
    'transform': 'translateY(-1px)',
    'boxShadow': 'var(--minimal-shadow-brand-strong)',
  },
  '&:active:not(:disabled)': { 'transform': 'translateY(1px)', 'boxShadow': 'var(--minimal-shadow-brand-soft)' },
  '&:disabled': {
    'background': 'rgb(var(--minimal-color-neutral-100))',
    'color': 'rgb(var(--minimal-color-neutral-400))',
    'boxShadow': 'none',
    'transform': 'none',
    'cursor': 'not-allowed',
    'opacity': '.5',
  },
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.875rem',
  'paddingBottom': '.875rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
}}>
                    <MuiBox component={PackagePlus} sx={{ 'width': '1rem', 'height': '1rem' }} />
                    {batchLoading ? '启动中...' : `确认发布 ${batchPreview.valid} 个商品`}
                  </MuiBox>
                </MuiBox>
              )}
              {(batchPhase === 'running' || batchPhase === 'done') && batchDetail && (
                <MuiBox component='div' sx={{ 'display': 'flex', 'gap': '.75rem', 'width': '100%' }}>
                  {batchDetail.status === 'running' ? (
                    <MuiBox component='button' disabled={batchLoading} onClick={handleCancelBatch} sx={{
  'flex': '1 1 0%',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.875rem',
  'paddingBottom': '.875rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-black)/var(--minimal-bg-opacity,1))',
  },
  'fontWeight': '700',
}}>
                      取消任务
                    </MuiBox>
                  ) : batchDetail.status === 'canceling' ? (
                    <MuiBox component='button' disabled sx={{
  'flex': '1 1 0%',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.875rem',
  'paddingBottom': '.875rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-warning-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-800)/var(--minimal-text-opacity,1))',
  'fontWeight': '700',
}}>
                      正在保存远端结果并安全取消…
                    </MuiBox>
                  ) : (
                    <MuiBox component='button' onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => window.open(`/api/v1/items/publish-batches/${batchDetail.id}/result.csv`, '_blank')} sx={{
  'flex': '1 1 0%',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.875rem',
  'paddingBottom': '.875rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-black)/var(--minimal-bg-opacity,1))',
  },
  'fontWeight': '700',
}}>
                      下载结果
                    </MuiBox>
                  )}
                  {batchDetail.retryable > 0 && !['running', 'canceling'].includes(batchDetail.status) && (
                    <MuiBox component='button' disabled={batchLoading} onClick={handleRetryBatchFailed} sx={{
  'flex': '1 1 0%',
  'background': 'rgb(var(--minimal-color-brand))',
  'color': 'rgb(var(--minimal-color-white))',
  'fontWeight': '700',
  'border': 'none',
  'transition': 'all .2s cubic-bezier(.25,.8,.25,1)',
  'cursor': 'pointer',
  '&:hover:not(:disabled)': {
    'background': 'rgb(var(--minimal-color-brand-highlight))',
    'transform': 'translateY(-1px)',
    'boxShadow': 'var(--minimal-shadow-brand-strong)',
  },
  '&:active:not(:disabled)': { 'transform': 'translateY(1px)', 'boxShadow': 'var(--minimal-shadow-brand-soft)' },
  '&:disabled': {
    'background': 'rgb(var(--minimal-color-neutral-100))',
    'color': 'rgb(var(--minimal-color-neutral-400))',
    'boxShadow': 'none',
    'transform': 'none',
    'cursor': 'not-allowed',
  },
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.875rem',
  'paddingBottom': '.875rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
}}>
                      <MuiBox component={RefreshCw} sx={[{ 'width': '1rem', 'height': '1rem' }, batchLoading ? { 'animation': 'spin 1s linear infinite' } : {}]} />
                      重试失败项
                    </MuiBox>
                  )}
                  {!['running', 'canceling'].includes(batchDetail.status) && (
                    <MuiBox component='button' onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => { void closeBatchModal(); void loadItems(); void loadShippingRules(); }} sx={{
  'flex': '1 1 0%',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.875rem',
  'paddingBottom': '.875rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
  'fontWeight': '700',
}}>
                      完成
                    </MuiBox>
                  )}
                </MuiBox>
              )}
            </MuiBox>
          </MuiBox>
        </MinimalDialogSurface>
      )}
    </MinimalPageFrame>
  );
};

export default ItemList;

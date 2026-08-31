import MuiBox from '@mui/material/Box';
import {
AlertCircle,
Bot,
CheckCircle2,
ChevronLeft,
ChevronRight,
CircleDollarSign,
Clock3,
Edit,
Layers3,
MessageCircle,
Plus,
RefreshCw,
Save,
Search,
Send,
SlidersHorizontal,
Trash2,
X,
Zap,
} from 'lucide-react';
import React,{ useEffect,useMemo,useState } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { alpha, type Theme } from '@mui/material/styles';
import { AutomationIssuePanel } from '../components/AutomationIssuePanel';
import { useRulesData } from '../hooks';
import { filterAutomationIssues } from '../issueState';
import { useRuleActions } from '../ruleActions';
import type { AutomationTriggerType,RulesProps,RulesTab,TriggerMeta } from '../types';
import { accountLabel,actionSummary,adjustPriceTarget,buildReviewConfig,cardActionsForTrigger,triggerMeta,triggerOrder } from '../utils';
import { MinimalDialogSurface, MinimalPageFrame, MinimalSectionCard, MinimalSegmentedDialog } from '@/components/minimal';

// ruleAccentSx 将规则元数据色调映射到 MUI 主题色，避免业务工具层返回样式字符串。
const ruleAccentSx = (accent: TriggerMeta['accent'], selected = false) => (theme: Theme) => {
  // paletteKey 是每类触发器对应的 MUI 调色板键。
  const paletteKey = ({ blue: 'info', emerald: 'success', amber: 'warning', violet: 'secondary' } as const)[accent] || 'info';
  // color 是当前色调对应的主色。
  const color = theme.palette[paletteKey].main;
  return {
    borderColor: selected ? color : alpha(color, 0.22),
    bgcolor: alpha(color, selected ? 0.14 : 0.08),
    color,
    '&:hover': selected ? undefined : { borderColor: alpha(color, 0.48), bgcolor: alpha(color, 0.12) },
  };
};

// ruleStatusSx 为规则启停状态提供稳定的语义色。
const ruleStatusSx = (enabled: boolean) => ({
  bgcolor: enabled ? 'success.main' : 'action.selected',
  color: enabled ? 'success.contrastText' : 'text.secondary',
});

// AutomationDialogSegment 定义自动化规则编辑器的 Minimal 分段导航值。
type AutomationDialogSegment = 'trigger' | 'delivery' | 'advanced';

// Rules 是规则 feature 在旧页面目录下保留的兼容入口组件。
const Rules: React.FC<RulesProps> = ({ initialDeliveryTarget, onDeliveryTargetHandled }) => {
  // [activeTab, 解构得到当前 Hook 返回的状态和操作函数。
  const [activeTab, setActiveTab] = useState<RulesTab>('automation');
  // [selectedAccountId, 解构得到当前 Hook 返回的状态和操作函数。
  const [selectedAccountId, setSelectedAccountId] = useState('');
  // [automationSearch, 解构得到当前 Hook 返回的状态和操作函数。
  const [automationSearch, setAutomationSearch] = useState('');
  // [debouncedAutomationSearch, 解构得到当前 Hook 返回的状态和操作函数。
  const [debouncedAutomationSearch, setDebouncedAutomationSearch] = useState('');
  // [automationTriggerFilter, 解构得到当前 Hook 返回的状态和操作函数。
  const [automationTriggerFilter, setAutomationTriggerFilter] = useState<AutomationTriggerType | ''>('');
  // [automationStatusFilter, 解构得到当前 Hook 返回的状态和操作函数。
  const [automationStatusFilter, setAutomationStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  // [automationPage, 解构得到当前 Hook 返回的状态和操作函数。
  const [automationPage, setAutomationPage] = useState(1);
  // [automationPageSize, 解构得到当前 Hook 返回的状态和操作函数。
  const [automationPageSize, setAutomationPageSize] = useState(10);
  // [automationDialogSegment, 解构得到当前 Hook 返回的状态和操作函数。
  const [automationDialogSegment, setAutomationDialogSegment] = useState<AutomationDialogSegment>('trigger');

  // rulesData 规则列表数据，负责当前功能中的对应处理。
  const rulesData = useRulesData({
    activeTab,
    selectedAccountId,
    automationTriggerFilter,
    automationStatusFilter,
    debouncedAutomationSearch,
    automationPage,
    automationPageSize,
    setSelectedAccountId,
    onAutomationPageChange: setAutomationPage,
  });
  // 解构数据 解构得到当前 Hook 返回的状态和操作函数。
  const {
    automationRules,
    automationIssues,
    replyRules,
    defaultReplies,
    accounts,
    cards,
    items,
    loading,
    setLoading,
    automationTotal,
    automationTotalPages,
    automationTriggerCounts,
    setAutomationRules,
    setCards,
    setItems,
    loadReferenceData,
    loadAutomationRules,
    loadReplyRules,
    loadDefaultReplies,
    refresh,
  } = rulesData;

  // ruleActions 规则 feature 提供弹窗状态、编辑草稿和所有保存删除动作。
  const ruleActions = useRuleActions({
    selectedAccountId,
    setSelectedAccountId,
    setActiveTab,
    items,
    setAutomationRules,
    setCards,
    setItems,
    setLoading,
    loadAutomationRules,
    loadReferenceData,
    loadReplyRules,
    loadDefaultReplies,
    initialDeliveryTarget,
    onDeliveryTargetHandled,
  });
  // 解构规则动作，保持旧页面 JSX 的字段名称和行为不变。
  const {
    showAutomationModal, setShowAutomationModal, showReplyModal, setShowReplyModal, showDefaultModal, setShowDefaultModal,
    editingAutomationRule, setEditingAutomationRule,
    editingReplyRule, setEditingReplyRule, defaultForm, setDefaultForm, selectedRuleItem, isMultiSpecRule, currentTrigger,
    currentMeta, reviewConfig, displayVariants, openAutomationRule, openNewAutomationRule, handleTriggerChange,
    handleAutomationItemChange, updateVariant, updateAdjustPriceTarget, updateAdjustPriceNotifyText, appendDeliveryContent, handleSaveAutomationRule, handleDeleteAutomation,
    handleToggleAutomation, handleResolveRunIssue, handleResolveDeferredIssue, handleAddReplyRule, handleSaveReplyRule,
    handleDeleteReply, openDefaultReplyModal, handleSaveDefaultReply, handleDeleteDefaultReply, handleClearDefaultReplyRecords,
  } = ruleActions;

  useEffect(/* 当前回调同步 React 副作用和资源生命周期。 */ () => {
	// timer 定时器。
	const timer = window.setTimeout(/* 当前回调处理用户交互或异步状态变化。 */ () => {
	  setAutomationPage(1);
	  setDebouncedAutomationSearch(automationSearch.trim());
	}, 300);
	return /* 当前回调处理用户交互或异步状态变化。 */ () => window.clearTimeout(timer);
  }, [automationSearch]);

  useEffect(/* 当前回调处理异步操作结果。 */ () => {
	void loadReferenceData().catch(/* 当前回调处理异步操作结果。 */ error => console.error('加载规则参考数据失败', error));
  }, [loadReferenceData]);

  useEffect(/* 当前回调处理异步操作结果。 */ () => {
	void refresh().catch(/* 当前回调处理异步操作结果。 */ error => console.error('刷新规则页面失败', error));
  }, [refresh]);

  useEffect(/* 当前回调同步 React 副作用和资源生命周期。 */ () => {
    if (showAutomationModal) setAutomationDialogSegment('trigger');
  }, [showAutomationModal]);

  // visibleAutomationRules 可见数据自动化规则列表，负责当前功能中的对应处理。
  const visibleAutomationRules = useMemo(
    /* 当前回调处理集合中的单个元素。 */ () => automationRules.filter(/* 当前回调处理集合中的单个元素。 */ rule => !selectedAccountId || rule.cookie_id === selectedAccountId),
    [automationRules, selectedAccountId],
  );

  // visibleAutomationIssues 可见数据自动化Issues，负责当前功能中的对应处理。
  const visibleAutomationIssues = useMemo(
	/* 当前回调计算并缓存派生数据。 */ () => filterAutomationIssues(automationIssues, selectedAccountId),
	[automationIssues, selectedAccountId],
  );

  // visibleDefaultAccounts 可见数据默认账号列表，负责当前功能中的对应处理。
  const visibleDefaultAccounts = useMemo(
    /* 当前回调处理集合中的单个元素。 */ () => accounts.filter(/* 当前回调处理集合中的单个元素。 */ account => !selectedAccountId || account.id === selectedAccountId),
    [accounts, selectedAccountId],
  );

  // automationPageNumbers 自动化页码Numbers，负责当前功能中的对应处理。
  const automationPageNumbers = useMemo(/* 当前回调计算并缓存派生数据。 */ () => {
	if (automationTotalPages <= 1) return [];
	// first 首项。
	const first = Math.max(1, Math.min(automationPage - 2, automationTotalPages - 4));
	// last last，负责当前功能中的对应处理。
	const last = Math.min(automationTotalPages, first + 4);
	return Array.from({ length: last - first + 1 }, /* 当前回调处理用户交互或异步状态变化。 */ (_, index) => first + index);
  }, [automationPage, automationTotalPages]);

  // hasAutomationListFilters has自动化列表Filters，负责当前功能中的对应处理。
  const hasAutomationListFilters = Boolean(
	automationSearch.trim() || automationTriggerFilter || automationStatusFilter !== 'all',
  );

  // clearAutomationListFilters 清理自动化列表Filters，负责当前功能中的对应处理。
  const clearAutomationListFilters = () => {
	setAutomationSearch('');
	setDebouncedAutomationSearch('');
	setAutomationTriggerFilter('');
	setAutomationStatusFilter('all');
	setAutomationPage(1);
  };

  // modalAccountItems modal账号商品列表，负责当前功能中的对应处理。
  const modalAccountItems = useMemo(/* 当前回调计算并缓存派生数据。 */ () => {
    // cookieID 账号凭证标识。
    const cookieID = editingAutomationRule?.cookie_id || selectedAccountId;
    return items.filter(/* 当前回调处理集合中的单个元素。 */ item => item.cookie_id === cookieID);
  }, [editingAutomationRule?.cookie_id, items, selectedAccountId]);

  // primaryActionLabel 主操作按钮文案。
  const primaryActionLabel = activeTab === 'automation'
    ? '新建自动化'
    : activeTab === 'reply'
      ? '新增关键词'
      : '编辑默认回复';

  return (
    <MinimalPageFrame
      title="自动化规则"
      description="系统通知卡片只进入自动化判断；买家消息进入关键词、默认或 AI 回复。"
      actions={(
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <MuiBox component='select'
            value={selectedAccountId}
            onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => {
			  setSelectedAccountId(event.target.value);
			  setAutomationPage(1);
			}}
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
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '10px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '@media (min-width:640px)': { 'width': '16rem' },
}}
          >
            <option value="">全部账号</option>
            {accounts.map(/* 当前回调处理集合中的单个元素。 */ account => (
              <option key={account.id} value={account.id}>{accountLabel(account)}</option>
            ))}
          </MuiBox>
          <Button variant="outlined" startIcon={<MuiBox component={RefreshCw} size={16} sx={loading ? { 'animation': 'spin 1s linear infinite' } : undefined} />} onClick={refresh}>刷新</Button>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={activeTab === 'automation' ? /* 当前回调处理用户交互或异步状态变化。 */ () => openNewAutomationRule('order_paid') : activeTab === 'reply' ? handleAddReplyRule : /* 当前回调处理用户交互或异步状态变化。 */ () => void openDefaultReplyModal()}
            disabled={!selectedAccountId}
          >
            {primaryActionLabel}
          </Button>
        </Stack>
      )}
    >

      <Tabs
        data-layout-contract="minimal-rule-tabs"
        value={activeTab}
        onChange={/* ruleTabChange 切换规则页面模式并保留当前筛选上下文。 */ (_event, nextTab: RulesTab) => setActiveTab(nextTab)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="规则类型"
        sx={{ minHeight: 48, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Tab value="automation" icon={<Zap size={17} />} iconPosition="start" label="交易自动化" />
        <Tab value="reply" icon={<MessageCircle size={17} />} iconPosition="start" label="关键词回复" />
        <Tab value="default" icon={<Bot size={17} />} iconPosition="start" label="账号默认回复" />
      </Tabs>

	  {activeTab === 'automation' && (visibleAutomationIssues.runs.length > 0 || visibleAutomationIssues.pending_tasks.length > 0) && (
	    <AutomationIssuePanel
	      runs={visibleAutomationIssues.runs}
	      pendingTasks={visibleAutomationIssues.pending_tasks}
	      onResolveRun={/* 当前回调处理用户交互或异步状态变化。 */ (id, resolution) => void handleResolveRunIssue(id, resolution)}
	      onResolveDeferredTask={/* 当前回调处理用户交互或异步状态变化。 */ (id, resolution) => void handleResolveDeferredIssue(id, resolution)}
	    />
	  )}

      {activeTab === 'automation' && (
        <MuiBox component='div' sx={{
  'display': 'grid',
  'minWidth': '0',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  'gap': '1.5rem',
  '@media (min-width:1280px)': { 'gridTemplateColumns': 'minmax(270px,.72fr) minmax(0,1.28fr)' },
}}>
          <MuiBox component='aside' sx={{
  'minWidth': '0',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
            <MinimalSectionCard data-layout-contract="minimal-rule-summary-card" title="新建规则" contentSx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
              <MuiBox component='p' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginBottom': '1rem',
}}>先选自动化类型，再配置对应动作。</MuiBox>
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                {triggerOrder.map(/* 当前回调处理集合中的单个元素。 */ trigger => {
                  // meta 元数据。
                  const meta = triggerMeta[trigger];
                  // Icon 渲染Icon React 组件。
                  const Icon = meta.icon;
                  return (
                    <MuiBox component='button'
                      key={trigger}
                      type="button"
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => openNewAutomationRule(trigger)}
                      sx={[{ width: '100%', textAlign: 'left', border: 1, borderRadius: 2, p: 2, transition: /* ruleTransition 根据 MUI 主题生成规则按钮过渡。 */ theme => theme.transitions.create(['border-color', 'background-color']) }, ruleAccentSx(meta.accent)]}
                    >
                      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'flex-start', 'gap': '.75rem' }}>
                        <MuiBox component='div' sx={{
  'width': '2.5rem',
  'height': '2.5rem',
  'borderRadius': '8px',
  'backgroundColor': 'rgb(var(--minimal-color-white)/.8)',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'flexShrink': '0',
}}>
                          <MuiBox component={Icon} sx={{ 'width': '1.25rem', 'height': '1.25rem' }} />
                        </MuiBox>
                        <div>
                          <MuiBox component='div' sx={{ 'fontWeight': '800' }}>{meta.label}</MuiBox>
                          <MuiBox component='div' sx={{ 'fontSize': '.75rem', 'lineHeight': '1.25rem', 'opacity': '.75', 'marginTop': '.25rem' }}>{meta.description}</MuiBox>
                        </div>
                      </MuiBox>
                    </MuiBox>
                  );
                })}
              </MuiBox>
            </MinimalSectionCard>

            <MinimalSectionCard
              data-layout-contract="minimal-rule-summary-card"
              title="筛选结果构成"
              action={<MuiBox component='span' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>共 {automationTotal} 条</MuiBox>}
              contentSx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}
            >
              <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                {triggerOrder.map(/* 当前回调处理集合中的单个元素。 */ trigger => {
                  // meta 元数据。
                  const meta = triggerMeta[trigger];
                  // Icon 渲染Icon React 组件。
                  const Icon = meta.icon;
                  return (
                    <MuiBox component='div' key={trigger} sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'padding': '.75rem',
}}>
                      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.75rem' }}>
                        <MuiBox component={Icon} sx={{
  'width': '1rem',
  'height': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}} />
                        <MuiBox component='span' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>{meta.shortLabel}</MuiBox>
                      </MuiBox>
                      <MuiBox component='span' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>{automationTriggerCounts[trigger] || 0}</MuiBox>
                    </MuiBox>
                  );
                })}
              </MuiBox>
            </MinimalSectionCard>
          </MuiBox>

		  <MuiBox component='section' sx={{
  'minWidth': '0',
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1rem*var(--minimal-space-y-reverse))',
  },
}}>
			<MuiBox component='div' sx={{
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-surface-muted)/var(--minimal-bg-opacity,1))',
  'padding': '1rem',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}}>
			  <MuiBox component='div' sx={{
  'display': 'flex',
  'flexDirection': 'column',
  'gap': '.75rem',
  '@media (min-width:1280px)': { 'flexDirection': 'row', 'alignItems': 'center' },
}}>
				<MuiBox component='div' sx={{ 'position': 'relative', 'minWidth': '0', 'flex': '1 1 0%' }}>
				  <MuiBox component={Search} sx={{
  'pointerEvents': 'none',
  'position': 'absolute',
  'left': '1rem',
  'top': '50%',
  'height': '1rem',
  'width': '1rem',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}} />
				  <MuiBox component='input'
					type="search"
					aria-label="搜索自动化规则"
					placeholder="搜索规则名、商品名或商品 ID..."
					value={automationSearch}
					onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => {
					  setAutomationSearch(event.target.value);
					  setAutomationPage(1);
					}}
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
  'borderRadius': '8px',
  'borderStyle': 'none',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'paddingLeft': '2.5rem',
  'paddingRight': '1rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}}
				  />
				</MuiBox>
				<MuiBox component='div' sx={{
  'position': 'relative',
  '@media (min-width:1280px)': { 'width': '13rem' },
}}>
				  <MuiBox component={SlidersHorizontal} sx={{
  'pointerEvents': 'none',
  'position': 'absolute',
  'left': '1rem',
  'top': '50%',
  'height': '1rem',
  'width': '1rem',
  '--minimal-translate-y': '-50%',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}} />
				  <MuiBox component='select'
					aria-label="按自动化类型筛选"
					value={automationTriggerFilter}
					onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => {
					  setAutomationTriggerFilter(event.target.value as AutomationTriggerType | '');
					  setAutomationPage(1);
					}}
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
  'borderRadius': '8px',
  'borderStyle': 'none',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'paddingLeft': '2.5rem',
  'paddingRight': '2.25rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}}
				  >
					<option value="">全部自动化类型</option>
					{triggerOrder.map(/* 当前回调处理集合中的单个元素。 */ trigger => <option key={trigger} value={trigger}>{triggerMeta[trigger].shortLabel}</option>)}
				  </MuiBox>
				</MuiBox>
				<MuiBox component='select'
				  aria-label="按启用状态筛选"
				  value={automationStatusFilter}
				  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => {
					setAutomationStatusFilter(event.target.value as 'all' | 'enabled' | 'disabled');
					setAutomationPage(1);
				  }}
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
  'borderRadius': '8px',
  'borderStyle': 'none',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '@media (min-width:1280px)': { 'width': '9rem' },
}}
				>
				  <option value="all">全部状态</option>
				  <option value="enabled">已启用</option>
				  <option value="disabled">已禁用</option>
				</MuiBox>
				{hasAutomationListFilters && (
				  <MuiBox component='button'
					type="button"
					onClick={clearAutomationListFilters}
					sx={{
  'display': 'flex',
  'height': '2.5rem',
  'width': '2.5rem',
  'flexShrink': '0',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  },
}}
					title="清除筛选"
					aria-label="清除筛选"
				  >
					<MuiBox component={X} sx={{ 'height': '1rem', 'width': '1rem' }} />
				  </MuiBox>
				)}
			  </MuiBox>
			  <MuiBox component='div' sx={{
  'marginTop': '.75rem',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>
				<span>找到 {automationTotal} 条规则</span>
				{loading && <MuiBox component='span' sx={{ 'display': 'inline-flex', 'alignItems': 'center', 'gap': '.375rem' }}><MuiBox component={RefreshCw} sx={{ 'height': '.875rem', 'width': '.875rem', 'animation': 'spin 1s linear infinite' }} />正在更新</MuiBox>}
			  </MuiBox>
			</MuiBox>

			{loading && visibleAutomationRules.length === 0 ? (
			  <MuiBox component='div' sx={{
  'display': 'flex',
  'minHeight': '14rem',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>
				<MuiBox component={RefreshCw} sx={{ 'marginRight': '.5rem', 'height': '1rem', 'width': '1rem', 'animation': 'spin 1s linear infinite' }} />
				正在加载规则
			  </MuiBox>
			) : visibleAutomationRules.length === 0 ? (
			  <MuiBox component='div' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '8px',
  'borderWidth': '1px',
  'borderStyle': 'dashed',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  'padding': '4rem',
  'textAlign': 'center',
}}>
				<MuiBox component={Zap} sx={{
  'width': '3rem',
  'height': '3rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-text-opacity,1))',
  'marginLeft': 'auto',
  'marginRight': 'auto',
  'marginBottom': '1rem',
}} />
				<MuiBox component='h3' sx={{
  'fontSize': '1.25rem',
  'lineHeight': '1.75rem',
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>{hasAutomationListFilters ? '没有匹配的自动化规则' : '还没有自动化规则'}</MuiBox>
				<MuiBox component='p' sx={{
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.5rem',
}}>{hasAutomationListFilters ? '调整或清除筛选条件后再试。' : '从左侧选择一个模板开始配置。'}</MuiBox>
			  </MuiBox>
			) : (
			  visibleAutomationRules.map(/* 当前回调处理集合中的单个元素。 */ rule => {
                // meta 元数据。
                const meta = triggerMeta[rule.trigger_type];
                // Icon 渲染Icon React 组件。
                const Icon = meta.icon;
                return (
                  <MuiBox component='article' key={rule.id} sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'padding': '1.25rem',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  '&:hover': {
    '--minimal-shadow': 'var(--minimal-shadow-lg)',
    '--minimal-shadow-colored': 'var(--minimal-shadow-lg)',
    'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  },
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}>
                    <MuiBox component='div' sx={{
  'display': 'flex',
  'flexDirection': 'column',
  '@media (min-width:1024px)': { 'flexDirection': 'row', 'alignItems': 'center' },
  'justifyContent': 'space-between',
  'gap': '1rem',
}}>
                      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'flex-start', 'gap': '1rem', 'minWidth': '0' }}>
                        <MuiBox component='div' sx={[{ width: 48, height: 48, border: 1, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }, ruleAccentSx(meta.accent, true)]}>
                          <MuiBox component={Icon} sx={{ 'width': '1.25rem', 'height': '1.25rem' }} />
                        </MuiBox>
                        <MuiBox component='div' sx={{ 'minWidth': '0' }}>
                          <MuiBox component='div' sx={{ 'display': 'flex', 'flexWrap': 'wrap', 'alignItems': 'center', 'gap': '.5rem', 'marginBottom': '.5rem' }}>
                            <MuiBox component='h3' sx={{
  'fontSize': '1.125rem',
  'lineHeight': '1.75rem',
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
}}>{rule.name}</MuiBox>
                            <MuiBox component='span' sx={[{ px: 1.25, py: 0.5, borderRadius: '999px', fontSize: 12, fontWeight: 700 }, ruleStatusSx(rule.enabled)]}>
                              {rule.enabled ? '已启用' : '已禁用'}
                            </MuiBox>
                          </MuiBox>
                          <MuiBox component='div' sx={{
  'display': 'flex',
  'flexWrap': 'wrap',
  'gap': '.5rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
}}>
                            <MuiBox component='span' sx={{
  'paddingLeft': '.625rem',
  'paddingRight': '.625rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}}>{meta.label}</MuiBox>
                            <MuiBox component='span' sx={{
  'paddingLeft': '.625rem',
  'paddingRight': '.625rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}}>{rule.item_title || rule.item_id || '账号级规则'}</MuiBox>
                            <MuiBox component='span' sx={{
  'paddingLeft': '.625rem',
  'paddingRight': '.625rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
}}>{actionSummary(rule)}</MuiBox>
                          </MuiBox>
                        </MuiBox>
                      </MuiBox>

                      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.5rem', 'flexShrink': '0' }}>
                        <MuiBox component='button'
                          onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => openAutomationRule(rule)}
                          sx={{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
}}
                        >
                          <MuiBox component={Edit} sx={{ 'width': '1rem', 'height': '1rem' }} />
                          编辑
                        </MuiBox>
                        <MuiBox component='button'
                          onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleToggleAutomation(rule)}
                          sx={[{
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
}, rule.enabled ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-warning-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-700)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-warning-100)/var(--minimal-bg-opacity,1))',
  },
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-success-100)/var(--minimal-bg-opacity,1))',
  },
}]}
                        >
                          {rule.enabled ? '禁用' : '启用'}
                        </MuiBox>
                        <MuiBox component='button'
                          onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleDeleteAutomation(rule.id)}
                          sx={{
  'padding': '.625rem',
  'borderRadius': '8px',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-500)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  },
}}
                          title="删除"
                        >
                          <MuiBox component={Trash2} sx={{ 'width': '1rem', 'height': '1rem' }} />
                        </MuiBox>
                      </MuiBox>
                    </MuiBox>
                  </MuiBox>
                );
              })
			)}

			{automationTotal > 0 && (
			  <MuiBox component='div' sx={{
  'display': 'flex',
  'flexDirection': 'column',
  'gap': '.75rem',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  '@media (min-width:640px)': { 'flexDirection': 'row', 'alignItems': 'center', 'justifyContent': 'space-between' },
}}>
				<MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.75rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '500',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>
				  <span>第 {automationPage} / {Math.max(automationTotalPages, 1)} 页</span>
				  <MuiBox component='span' sx={{
  'height': '1rem',
  'width': '1px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
}} />
				  <MuiBox component='label' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.5rem' }}>
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
}}>每页显示数量</MuiBox>
					<MuiBox component='select'
					  value={automationPageSize}
					  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => {
						setAutomationPageSize(Number(event.target.value));
						setAutomationPage(1);
					  }}
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
  'borderRadius': '7px',
  'borderStyle': 'none',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.625rem',
  'paddingRight': '.625rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
					>
					  {[10, 20, 50].map(/* 当前回调处理集合中的单个元素。 */ size => <option key={size} value={size}>{size} 条/页</option>)}
					</MuiBox>
				  </MuiBox>
				</MuiBox>
				<MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.375rem' }}>
				  <MuiBox component='button'
					type="button"
					disabled={automationPage <= 1 || loading}
					onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setAutomationPage(/* 当前回调处理用户交互或异步状态变化。 */ page => Math.max(1, page - 1))}
					sx={{
  'display': 'flex',
  'height': '2.25rem',
  'width': '2.25rem',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
  '&:disabled': { 'cursor': 'not-allowed', 'opacity': '.4' },
}}
					aria-label="上一页"
					title="上一页"
				  >
					<MuiBox component={ChevronLeft} sx={{ 'height': '1rem', 'width': '1rem' }} />
				  </MuiBox>
				  {automationPageNumbers.map(/* 当前回调处理集合中的单个元素。 */ pageNumber => (
					<MuiBox component='button'
					  key={pageNumber}
					  type="button"
					  disabled={loading}
					  onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setAutomationPage(pageNumber)}
					  sx={[{
  'height': '2.25rem',
  'minWidth': '2.25rem',
  'borderRadius': '7px',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, pageNumber === automationPage ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
}, { '&:disabled': { 'cursor': 'not-allowed', 'opacity': '.6' } }]}
					  aria-label={`第 ${pageNumber} 页`}
					  aria-current={pageNumber === automationPage ? 'page' : undefined}
					>
					  {pageNumber}
					</MuiBox>
				  ))}
				  <MuiBox component='button'
					type="button"
					disabled={automationPage >= automationTotalPages || loading}
					onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setAutomationPage(/* 当前回调处理用户交互或异步状态变化。 */ page => Math.min(automationTotalPages, page + 1))}
					sx={{
  'display': 'flex',
  'height': '2.25rem',
  'width': '2.25rem',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
  '&:disabled': { 'cursor': 'not-allowed', 'opacity': '.4' },
}}
					aria-label="下一页"
					title="下一页"
				  >
					<MuiBox component={ChevronRight} sx={{ 'height': '1rem', 'width': '1rem' }} />
				  </MuiBox>
				</MuiBox>
			  </MuiBox>
			)}
		  </MuiBox>
        </MuiBox>
      )}

      {activeTab === 'reply' && (
        <MuiBox component='section' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'padding': '1.5rem',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}}>
          <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'borderRadius': '8px',
  'marginBottom': '1.25rem',
  'width': 'fit-content',
}}>
            <MuiBox component={AlertCircle} sx={{ 'width': '1rem', 'height': '1rem' }} />
            这里只处理买家用户消息；系统通知不会进入关键词或 AI 回复。
          </MuiBox>
          <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
            {replyRules.map(/* 当前回调处理集合中的单个元素。 */ rule => (
              <MuiBox component='div' key={rule.id} sx={{
  'display': 'flex',
  'flexDirection': 'column',
  '@media (min-width:768px)': { 'flexDirection': 'row', 'alignItems': 'center' },
  'justifyContent': 'space-between',
  'padding': '1.25rem',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-surface-subtle)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
    '--minimal-shadow': 'var(--minimal-shadow-lg)',
    '--minimal-shadow-colored': 'var(--minimal-shadow-lg)',
    'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  },
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  'gap': '1rem',
}}>
                <MuiBox component='div' sx={{ 'flex': '1 1 0%', 'minWidth': '0' }}>
                  <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.75rem', 'marginBottom': '.5rem' }}>
                    <MuiBox component='span' sx={{
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-black)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  'borderRadius': '7px',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
}}>包含匹配</MuiBox>
                    <MuiBox component='h3' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>“{rule.keyword}”</MuiBox>
                  </MuiBox>
                  <MuiBox component='div' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'padding': '.75rem',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'fontSize': '.875rem',
  'lineHeight': '1.625',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}}>
                    {rule.type === 'image' && rule.image_url ? rule.image_url : rule.reply_content}
                  </MuiBox>
                </MuiBox>
                <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.75rem',
  'borderTopWidth': '1px',
  '@media (min-width:768px)': { 'borderTopWidth': '0', 'borderLeftWidth': '1px', 'paddingTop': '0', 'paddingLeft': '1.5rem' },
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  'paddingTop': '1rem',
}}>
                  <MuiBox component='button'
                    onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => {
                      setEditingReplyRule({ ...rule });
                      setShowReplyModal(true);
                    }}
                    sx={{
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-black)/var(--minimal-text-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
  'borderRadius': '8px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                    title="编辑"
                  >
                    <MuiBox component={Edit} sx={{ 'width': '1rem', 'height': '1rem' }} />
                  </MuiBox>
                  <MuiBox component='button' onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleDeleteReply(rule.id)} sx={{
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-danger-500)/var(--minimal-text-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  },
  'borderRadius': '8px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}} title="删除">
                    <MuiBox component={Trash2} sx={{ 'width': '1.25rem', 'height': '1.25rem' }} />
                  </MuiBox>
                </MuiBox>
              </MuiBox>
            ))}
            {replyRules.length === 0 && <MuiBox component='div' sx={{
  'textAlign': 'center',
  'paddingTop': '5rem',
  'paddingBottom': '5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>暂无关键词回复规则</MuiBox>}
          </MuiBox>
        </MuiBox>
      )}

      {activeTab === 'default' && (
        <MuiBox component='section' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'padding': '1.5rem',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}}>
          <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'borderRadius': '8px',
  'marginBottom': '1.25rem',
  'width': 'fit-content',
}}>
            <MuiBox component={AlertCircle} sx={{ 'width': '1rem', 'height': '1rem' }} />
            默认回复只处理买家用户消息；关键词未命中且 AI 未接管时才会使用。
          </MuiBox>
          <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
            {visibleDefaultAccounts.map(/* 当前回调处理集合中的单个元素。 */ account => {
              // defaultReply 默认Reply，负责当前功能中的对应处理。
              const defaultReply = defaultReplies[account.id];
              // enabled 启用状态。
              const enabled = Boolean(defaultReply?.enabled);
              return (
                <MuiBox component='div' key={account.id} sx={[{
  'display': 'flex',
  'flexDirection': 'column',
  '@media (min-width:768px)': { 'flexDirection': 'row', 'alignItems': 'center' },
  'justifyContent': 'space-between',
  'padding': '1.25rem',
  'borderRadius': '10px',
  'borderWidth': '1px',
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  'gap': '1rem',
}, enabled ? {
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-accent-100)/var(--minimal-border-opacity,1))',
  'backgroundColor': 'rgb(var(--minimal-color-accent-50)/.5)',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
    '--minimal-shadow': 'var(--minimal-shadow-lg)',
    '--minimal-shadow-colored': 'var(--minimal-shadow-lg)',
    'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  },
} : {
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-surface-subtle)/var(--minimal-bg-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
    '--minimal-shadow': 'var(--minimal-shadow-lg)',
    '--minimal-shadow-colored': 'var(--minimal-shadow-lg)',
    'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  },
}]}>
                  <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '1rem', 'minWidth': '0' }}>
                    <MuiBox component='div' sx={[{
  'width': '3rem',
  'height': '3rem',
  'borderRadius': '10px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
}, enabled ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-accent-600)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}]}>
                      <MuiBox component={Bot} sx={{ 'width': '1.25rem', 'height': '1.25rem' }} />
                    </MuiBox>
                    <MuiBox component='div' sx={{ 'minWidth': '0' }}>
                      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.5rem', 'marginBottom': '.5rem' }}>
                        <MuiBox component='h3' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
  'fontSize': '1.125rem',
  'lineHeight': '1.75rem',
  'overflow': 'hidden',
  'textOverflow': 'ellipsis',
  'whiteSpace': 'nowrap',
}}>{accountLabel(account)}</MuiBox>
                        <MuiBox component='span' sx={[{
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.125rem',
  'paddingBottom': '.125rem',
  'borderRadius': '7px',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
}, enabled ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}]}>
                          {enabled ? '已启用' : '未启用'}
                        </MuiBox>
                        {defaultReply?.reply_once && (
                          <MuiBox component='span' sx={{
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.125rem',
  'paddingBottom': '.125rem',
  'borderRadius': '7px',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-accent-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-accent-700)/var(--minimal-text-opacity,1))',
}}>只回复一次</MuiBox>
                        )}
                      </MuiBox>
                      <MuiBox component='div' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'overflow': 'hidden',
  'display': '-webkit-box',
  'WebkitBoxOrient': 'vertical',
  'WebkitLineClamp': '2',
}}>
                        {enabled ? (defaultReply.reply_content || defaultReply.reply_image_url || '已配置默认回复') : '未配置默认回复'}
                      </MuiBox>
                    </MuiBox>
                  </MuiBox>
                  <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.75rem',
  'borderTopWidth': '1px',
  '@media (min-width:768px)': { 'borderTopWidth': '0', 'borderLeftWidth': '1px', 'paddingTop': '0', 'paddingLeft': '1.5rem' },
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  'paddingTop': '1rem',
}}>
                    <MuiBox component='button'
                      onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void openDefaultReplyModal(account.id)}
                      sx={{
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-black)/var(--minimal-text-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  },
  'borderRadius': '8px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                      title="编辑"
                    >
                      <MuiBox component={Edit} sx={{ 'width': '1rem', 'height': '1rem' }} />
                    </MuiBox>
                    {enabled && (
                      <>
                        <MuiBox component='button'
                          onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void handleClearDefaultReplyRecords(account.id)}
                          sx={{
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  },
  'borderRadius': '8px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                        >
                          清空记录
                        </MuiBox>
                        <MuiBox component='button' onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => void handleDeleteDefaultReply(account.id)} sx={{
  'padding': '.5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-danger-500)/var(--minimal-text-opacity,1))',
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  },
  'borderRadius': '8px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}} title="删除">
                          <MuiBox component={Trash2} sx={{ 'width': '1.25rem', 'height': '1.25rem' }} />
                        </MuiBox>
                      </>
                    )}
                  </MuiBox>
                </MuiBox>
              );
            })}
            {visibleDefaultAccounts.length === 0 && <MuiBox component='div' sx={{
  'textAlign': 'center',
  'paddingTop': '5rem',
  'paddingBottom': '5rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>暂无账号</MuiBox>}
          </MuiBox>
        </MuiBox>
      )}

      {showAutomationModal && editingAutomationRule && (
        <MinimalSegmentedDialog
          open
          maxWidth="xl"
          title={editingAutomationRule.id ? '编辑自动化规则' : '新建自动化规则'}
          description={currentMeta.description}
          segments={[
            { value: 'trigger', label: '触发类型' },
            { value: 'delivery', label: '发货与价格' },
            { value: 'advanced', label: '高级设置' },
          ]}
          value={automationDialogSegment}
          onSegmentChange={/* automationSegmentChange 切换自动化编辑器分段。 */ nextValue => setAutomationDialogSegment(nextValue as AutomationDialogSegment)}
          onClose={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowAutomationModal(false)}
          sx={{ '& .MuiDialog-paper': { maxHeight: '92vh' } }}
          actions={(
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} sx={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowAutomationModal(false)}>取消</Button>
              <Button variant="contained" startIcon={<Save size={16} />} onClick={handleSaveAutomationRule}>保存自动化规则</Button>
            </Stack>
          )}
        >
            <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:1024px)': { 'gridTemplateColumns': '320px 1fr' },
  'minHeight': '0',
}}>
              <MuiBox component='aside' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-slate-900)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  'padding': '1.25rem',
  'overflowY': 'auto',
}}>
                <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
  'marginBottom': '.75rem',
}}>选择自动化类型</MuiBox>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                  {triggerOrder.map(/* 当前回调处理集合中的单个元素。 */ trigger => {
                    // meta 元数据。
                    const meta = triggerMeta[trigger];
                    // Icon 渲染Icon React 组件。
                    const Icon = meta.icon;
                    // selected 处理当前选择（ed）。
                    const selected = currentTrigger === trigger;
                    return (
                      <MuiBox component='button'
                        key={trigger}
                        type="button"
                        onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => handleTriggerChange(trigger)}
                        sx={[{
  'width': '100%',
  'borderRadius': '10px',
  'padding': '1rem',
  'textAlign': 'left',
  'borderWidth': '1px',
  'transitionProperty': 'all',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}, selected ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-950)/var(--minimal-text-opacity,1))',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-white)/var(--minimal-border-opacity,1))',
} : {
  'backgroundColor': 'rgb(var(--minimal-color-white)/.05)',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  'borderColor': 'rgb(var(--minimal-color-white)/.1)',
  '&:hover': { 'backgroundColor': 'rgb(var(--minimal-color-white)/.1)' },
}]}
                      >
                        <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'flex-start', 'gap': '.75rem' }}>
                          <MuiBox component={Icon} sx={[{ 'width': '1.25rem', 'height': '1.25rem', 'marginTop': '.125rem' }, selected ? { '--minimal-text-opacity': '1', 'color': 'rgb(var(--minimal-color-brand))' } : { '--minimal-text-opacity': '1', 'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))' }]} />
                          <div>
                            <MuiBox component='div' sx={{ 'fontWeight': '900' }}>{meta.label}</MuiBox>
                            <MuiBox component='div' sx={[{ 'fontSize': '.75rem', 'lineHeight': '1.25rem', 'marginTop': '.25rem' }, selected ? {
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}]}>{meta.description}</MuiBox>
                          </div>
                        </MuiBox>
                      </MuiBox>
                    );
                  })}
                </MuiBox>

                <MuiBox component='div' sx={{
  'marginTop': '1.5rem',
  'borderRadius': '10px',
  'backgroundColor': 'rgb(var(--minimal-color-white)/.05)',
  'borderWidth': '1px',
  'borderColor': 'rgb(var(--minimal-color-white)/.1)',
  'padding': '1rem',
}}>
                  <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-400)/var(--minimal-text-opacity,1))',
  'marginBottom': '.75rem',
}}>执行流程</MuiBox>
                  <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                    {currentMeta.flow.map(/* 当前回调处理集合中的单个元素。 */ (step, index) => (
                      <MuiBox component='div' key={step} sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.75rem' }}>
                        <MuiBox component='div' sx={{
  'width': '1.5rem',
  'height': '1.5rem',
  'borderRadius': '9999px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-slate-950)/var(--minimal-text-opacity,1))',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '900',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
}}>{index + 1}</MuiBox>
                        <MuiBox component='span' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-text-opacity,1))',
}}>{step}</MuiBox>
                      </MuiBox>
                    ))}
                  </MuiBox>
                </MuiBox>
              </MuiBox>

              <MuiBox component='div' sx={{
  'padding': '1.5rem',
  'overflowY': 'auto',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-surface-subtle)/var(--minimal-bg-opacity,1))',
}}>
                <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
}}>
                  <MuiBox component='section' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'padding': '1.25rem',
}}>
                    <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.5rem', 'marginBottom': '1rem' }}>
                      <MuiBox component={CheckCircle2} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand))',
}} />
                      <MuiBox component='h4' sx={{
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>生效范围</MuiBox>
                    </MuiBox>
                    <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:768px)': { 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))' },
  'gap': '1rem',
}}>
                      <MuiBox component='div' sx={{
  '@media (min-width:768px)': { 'gridColumn': 'span 2/span 2' },
}}>
                        <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>规则名称</MuiBox>
                        <MuiBox component='input'
                          type="text"
                          value={editingAutomationRule.name || ''}
                          onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingAutomationRule({ ...editingAutomationRule, name: event.target.value })}
                          placeholder="不填时按类型和商品自动生成"
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
                        />
                      </MuiBox>
                      <div>
                        <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>闲鱼账号</MuiBox>
                        <MuiBox component='select'
                          value={editingAutomationRule.cookie_id || ''}
                          onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingAutomationRule({
                            ...editingAutomationRule,
                            cookie_id: event.target.value,
                            item_id: '',
                            item_title: '',
                            item_keyword: '',
                          })}
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
                        >
                          <option value="">选择账号</option>
                          {accounts.map(/* 当前回调处理集合中的单个元素。 */ account => (
                            <option key={account.id} value={account.id}>{accountLabel(account)}</option>
                          ))}
                        </MuiBox>
                      </div>
                      <div>
                        <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>关联商品</MuiBox>
                        <MuiBox component='select'
                          value={editingAutomationRule.item_id || ''}
                          onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => handleAutomationItemChange(event.target.value)}
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
                        >
                          <option value="">账号级规则（不限定商品）</option>
                          {modalAccountItems.map(/* 当前回调处理集合中的单个元素。 */ item => (
                            <option key={`${item.cookie_id}-${item.item_id}`} value={item.item_id}>{item.item_title || item.item_id}</option>
                          ))}
                        </MuiBox>
                      </div>
                    </MuiBox>

                    {selectedRuleItem && currentTrigger !== 'review_missing_timeout' && currentTrigger !== 'order_created' && (
                      <MuiBox component='div' sx={{
  'marginTop': '1rem',
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'padding': '1rem',
}}>
                        <MuiBox component='div' sx={{ 'display': 'flex', 'flexWrap': 'wrap', 'alignItems': 'center', 'gap': '.5rem', 'marginBottom': '.5rem' }}>
                          <MuiBox component='span' sx={{
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.375rem',
  'paddingBottom': '.375rem',
  'borderRadius': '7px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
}}>{selectedRuleItem.item_title || selectedRuleItem.item_id}</MuiBox>
                          <MuiBox component='span' sx={[{
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.375rem',
  'paddingBottom': '.375rem',
  'borderRadius': '7px',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
}, isMultiSpecRule ? {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-700)/var(--minimal-text-opacity,1))',
} : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}]}>
                            {isMultiSpecRule ? '多规格商品' : '普通商品'}
                          </MuiBox>
                          <MuiBox component='span' sx={{
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.375rem',
  'paddingBottom': '.375rem',
  'borderRadius': '7px',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-success-700)/var(--minimal-text-opacity,1))',
}}>按订单购买数量自动发货</MuiBox>
                        </MuiBox>
                        <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>
                          多规格状态来自闲鱼商品本身，发布后不能在这里修改；系统会在买家付款后读取订单详情，按实际购买规格和数量匹配下面的发货规则。
                        </MuiBox>
                      </MuiBox>
                    )}
                  </MuiBox>

                  {currentTrigger === 'order_created' ? (
                    <MuiBox component='section' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'padding': '1.25rem',
}}>
                      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.5rem', 'marginBottom': '1rem' }}>
                        <MuiBox component={CircleDollarSign} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(124 58 237/var(--minimal-text-opacity,1))',
}} />
                        <MuiBox component='h4' sx={{
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>改价设置</MuiBox>
                      </MuiBox>
                      <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:768px)': { 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))' },
  'gap': '1rem',
}}>
                        <div>
                          <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>目标价格（元）</MuiBox>
                          <MuiBox component='input'
                            type="text"
                            inputMode="decimal"
                            value={adjustPriceTarget(editingAutomationRule.actions)}
                            onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => updateAdjustPriceTarget(event.target.value)}
                            placeholder="例如：9.9"
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
                          />
                          <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.5rem',
}}>买家拍下未付款后，系统会把该笔订单价格修改为此金额（0.01 - 1000000 元，最多两位小数）。</MuiBox>
                        </div>
                        <div>
                          <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>改价后提醒买家（可选）</MuiBox>
                          <MuiBox component='textarea'
                            value={editingAutomationRule.actions?.find(/* 当前回调处理集合中的单个元素。 */ action => action.action_type === 'send_text')?.message_template || ''}
                            onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => updateAdjustPriceNotifyText(event.target.value)}
                            placeholder="例如：已为您改好价格，请尽快支付哦～"
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
  'height': '6rem',
  'resize': 'none',
}}
                          />
                          <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.5rem',
}}>留空则只改价不发送消息。</MuiBox>
                        </div>
                      </MuiBox>
                      <MuiBox component='div' sx={{
  'marginTop': '1rem',
  'borderRadius': '10px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(245 243 255/var(--minimal-bg-opacity,1))',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(237 233 254/var(--minimal-border-opacity,1))',
  'padding': '1rem',
}}>
                        <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(109 40 217/var(--minimal-text-opacity,1))',
}}>
                          改价仅对买家尚未付款的订单生效；订单已付款、已关闭或平台限制改价时任务会记录失败原因。建议配合商品说明引导买家「先拍下再等改价」。
                        </MuiBox>
                      </MuiBox>
                    </MuiBox>
                  ) : currentTrigger !== 'review_missing_timeout' ? (
                    <MuiBox component='section' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'padding': '1.25rem',
}}>
                      <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'flex-start',
  'justifyContent': 'space-between',
  'gap': '1rem',
  'marginBottom': '1rem',
}}>
                        <div>
                          <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.5rem' }}>
                            <MuiBox component={Layers3} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand))',
}} />
                            <MuiBox component='h4' sx={{
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>{currentTrigger === 'buyer_reviewed' ? '赠品库存' : '发货库存'}</MuiBox>
                          </MuiBox>
                          <MuiBox component='p' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>
                            {isMultiSpecRule
                              ? '每条发货内容绑定一个订单规格；同一规格可添加多条内容并全部发送。'
                              : '可添加多条发货内容，买家付款后会按顺序全部发送。'}
                          </MuiBox>
                        </div>
                        <MuiBox component='button'
                          type="button"
                          onClick={appendDeliveryContent}
                          sx={{
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-bg-opacity,1))',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-black)/var(--minimal-bg-opacity,1))',
  },
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.375rem',
}}
                        >
                          <MuiBox component={Plus} sx={{ 'width': '.875rem', 'height': '.875rem' }} />
                          添加发货内容
                        </MuiBox>
                      </MuiBox>

                      <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.75rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.75rem*var(--minimal-space-y-reverse))',
  },
}}>
                        {displayVariants.map((variant, index) => (/* 当前回调处理集合中的单个元素。 */
                          <MuiBox component='div'
                            key={variant.id || index}
                            sx={[{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  'gap': '.75rem',
  'alignItems': 'flex-end',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  'padding': '1rem',
}, isMultiSpecRule ? {
  '@media (min-width:768px)': { 'gridTemplateColumns': '1fr 1fr 1.4fr 110px 40px' },
} : {
  '@media (min-width:768px)': { 'gridTemplateColumns': '1.4fr 110px 40px' },
}]}
                          >
                            {isMultiSpecRule && (
                              <>
                                <div>
                                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>规格名称</MuiBox>
                                  <MuiBox component='input'
                                    value={variant.spec_name}
                                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => updateVariant(index, { spec_name: event.target.value })}
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
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'borderRadius': '7px',
}}
                                    placeholder="例如：套餐"
                                  />
                                </div>
                                <div>
                                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>规格值</MuiBox>
                                  <MuiBox component='input'
                                    value={variant.spec_value}
                                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => updateVariant(index, { spec_value: event.target.value })}
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
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'borderRadius': '7px',
}}
                                    placeholder="例如：30天"
                                  />
                                </div>
                              </>
                            )}
                            <div>
                              <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>卡密库存</MuiBox>
                              <MuiBox component='select'
                                value={variant.card_id || ''}
                                onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => updateVariant(index, { card_id: Number(event.target.value) })}
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
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'borderRadius': '7px',
}}
                              >
                                <option value="">请选择卡密库存</option>
                                {cards.filter(/* 当前回调处理集合中的单个元素。 */ card => card.enabled && (card.type !== 'api' || card.api_config?.ready === true)).map(/* 当前回调处理集合中的单个元素。 */ card => (
                                  <option key={card.id} value={card.id}>{card.name}</option>
                                ))}
                              </MuiBox>
                            </div>
                            <div>
                              <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>每件份数</MuiBox>
                              <MuiBox component='input'
                                type="number"
                                min="1"
                                max="100"
                                value={variant.delivery_count}
                                onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => updateVariant(index, { delivery_count: Math.max(1, Number(event.target.value) || 1) })}
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
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'borderRadius': '7px',
}}
                              />
                            </div>
                            <MuiBox component='div' sx={{
  '@media (min-width:768px)': { 'gridColumn': '1/-1' },
  'display': 'flex',
  'flexWrap': 'wrap',
  'alignItems': 'center',
  'gap': '.75rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
}}>
                              <MuiBox component='label' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
  'cursor': 'pointer',
}}>
                                <MuiBox component='input'
                                  type="checkbox"
                                  checked={variant.delay_override === true}
                                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => updateVariant(index, { delay_override: event.target.checked })}
                                  sx={{ 'accentColor': 'rgb(var(--minimal-color-brand)/1)' }}
                                />
                                覆盖卡密默认延时
                              </MuiBox>
                              {variant.delay_override && (
                                <MuiBox component='input'
                                  type="number"
                                  min="0"
                                  max="3600"
                                  value={variant.delay_seconds || 0}
                                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => updateVariant(index, { delay_seconds: Math.max(0, Number(event.target.value) || 0) })}
                                  sx={{
  'width': '7rem',
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
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.375rem',
  'paddingBottom': '.375rem',
  'borderRadius': '7px',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
}}
                                  aria-label="动作延时秒数"
                                />
                              )}
                              <MuiBox component='span' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>{variant.delay_override ? `本动作延时 ${variant.delay_seconds || 0} 秒` : '使用卡密默认延时'}</MuiBox>
                            </MuiBox>
                            <MuiBox component='button'
                              type="button"
                              disabled={displayVariants.length === 1}
                              onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setEditingAutomationRule({
                                ...editingAutomationRule,
                                variants: displayVariants.filter(/* 当前回调处理集合中的单个元素。 */ (_, variantIndex) => variantIndex !== index),
                              })}
                              sx={{
  'width': '2.5rem',
  'height': '2.5rem',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '7px',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-500)/var(--minimal-text-opacity,1))',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
  },
  '&:disabled': { 'opacity': '.25' },
}}
                              title="删除发货内容"
                            >
                              <MuiBox component={Trash2} sx={{ 'width': '1rem', 'height': '1rem' }} />
                            </MuiBox>
                          </MuiBox>
                        ))}
                      </MuiBox>
                    </MuiBox>
                  ) : (
                    <MuiBox component='section' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'padding': '1.25rem',
}}>
                      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'gap': '.5rem', 'marginBottom': '1rem' }}>
                        <MuiBox component={Clock3} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-warning-600)/var(--minimal-text-opacity,1))',
}} />
                        <MuiBox component='h4' sx={{
  'fontWeight': '900',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>求评价计划</MuiBox>
                      </MuiBox>
                      <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:768px)': { 'gridTemplateColumns': 'repeat(3,minmax(0,1fr))' },
  'gap': '1rem',
}}>
                        <div>
                          <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>发货后等待小时</MuiBox>
                          <MuiBox component='input'
                            type="number"
                            min="1"
                            value={Number(reviewConfig.after_shipped_hours || 72)}
                            onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingAutomationRule({
                              ...editingAutomationRule,
                              config_json: buildReviewConfig(editingAutomationRule.config_json, {
                                after_shipped_hours: Math.max(1, Number(event.target.value) || 72),
                              }),
                            })}
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
                          />
                        </div>
                        <div>
                          <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>再次求评间隔小时</MuiBox>
                          <MuiBox component='input'
                            type="number"
                            min="1"
                            value={Number(reviewConfig.repeat_interval_hours || 24)}
                            onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingAutomationRule({
                              ...editingAutomationRule,
                              config_json: buildReviewConfig(editingAutomationRule.config_json, {
                                repeat_interval_hours: Math.max(1, Number(event.target.value) || 24),
                              }),
                            })}
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
                          />
                        </div>
                        <div>
                          <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>最多求评次数</MuiBox>
                          <MuiBox component='input'
                            type="number"
                            min="1"
                            value={Number(reviewConfig.max_attempts || 1)}
                            onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingAutomationRule({
                              ...editingAutomationRule,
                              config_json: buildReviewConfig(editingAutomationRule.config_json, {
                                max_attempts: Math.max(1, Number(event.target.value) || 1),
                              }),
                            })}
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
                          />
                        </div>
                        <MuiBox component='div' sx={{
  '@media (min-width:768px)': { 'gridColumn': 'span 3/span 3' },
}}>
                          <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>求评价文案</MuiBox>
                          <MuiBox component='textarea'
                            value={editingAutomationRule.actions?.find(/* 当前回调处理集合中的单个元素。 */ action => action.action_type === 'send_text')?.message_template || ''}
                            onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingAutomationRule({
                              ...editingAutomationRule,
                              actions: (editingAutomationRule.actions?.length ? editingAutomationRule.actions : cardActionsForTrigger('review_missing_timeout')).map(/* 当前回调处理用户交互或异步状态变化。 */ action =>
                                action.action_type === 'send_text' ? { ...action, message_template: event.target.value } : action
                              ),
                            })}
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
  'height': '7rem',
  'resize': 'none',
}}
                          />
                        </MuiBox>
                      </MuiBox>
                    </MuiBox>
                  )}

                  <MuiBox component='section' sx={{
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  'padding': '1.25rem',
}}>
                    <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:768px)': { 'gridTemplateColumns': '180px 1fr' },
  'gap': '1rem',
  'alignItems': 'flex-end',
}}>
                      <div>
						<MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>优先级</MuiBox>
						<MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>数字越小优先级越高；同一账号、商品和触发条件只执行优先级最高的一条规则。</MuiBox>
                        <MuiBox component='input'
                          type="number"
                          value={editingAutomationRule.priority || 100}
                          onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingAutomationRule({ ...editingAutomationRule, priority: Number(event.target.value) || 100 })}
                          min="1"
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
                        />
                      </div>
                      <MuiBox component='label' sx={{
  'height': '48px',
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.75rem',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>
                        <MuiBox component='input'
                          type="checkbox"
                          checked={editingAutomationRule.enabled !== false}
                          onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingAutomationRule({ ...editingAutomationRule, enabled: event.target.checked })}
                          sx={{ 'width': '1rem', 'height': '1rem', 'borderRadius': '6px' }}
                        />
                        启用规则
                      </MuiBox>
                    </MuiBox>
                  </MuiBox>
                </MuiBox>
              </MuiBox>
            </MuiBox>

        </MinimalSegmentedDialog>
      )}

      {showReplyModal && editingReplyRule && (
        <MinimalDialogSurface open onClose={/* closeReplyDialog 关闭关键词回复编辑弹窗。 */ () => setShowReplyModal(false)} maxWidth="sm" aria-labelledby="reply-rule-title">
          <MuiBox component='div' sx={{ 'width': '100%' }}>
            <MuiBox component='div' sx={{
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'flexShrink': '0',
  'padding': '2rem 2rem 1.5rem',
  'borderBottom': '1px solid rgb(var(--minimal-color-neutral-100))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between', 'width': '100%' }}>
                <MuiBox component='h3' id="reply-rule-title" sx={{
  'fontSize': '1.5rem',
  'lineHeight': '2rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>
                  {editingReplyRule.id ? '编辑回复规则' : '新增回复规则'}
                </MuiBox>
                <MuiBox component='button'
                  onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowReplyModal(false)}
                  sx={{
  'padding': '.5rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'borderRadius': '9999px',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                >
                  <MuiBox component={X} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}} />
                </MuiBox>
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
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  '@media (min-width:768px)': { 'gridTemplateColumns': 'repeat(2,minmax(0,1fr))' },
  'gap': '1rem',
}}>
                <div>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>关联商品</MuiBox>
                  <MuiBox component='select'
                    value={editingReplyRule.item_id || ''}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingReplyRule({ ...editingReplyRule, item_id: event.target.value })}
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
                  >
                    <option value="">账号级回复</option>
                    {items.filter(/* 当前回调处理集合中的单个元素。 */ item => !selectedAccountId || item.cookie_id === selectedAccountId).map(/* 当前回调处理集合中的单个元素。 */ item => (
                      <option key={`${item.cookie_id}-${item.item_id}`} value={item.item_id}>{item.item_title || item.item_id}</option>
                    ))}
                  </MuiBox>
                </div>
                <div>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>回复类型</MuiBox>
                  <MuiBox component='select'
                    value={editingReplyRule.type || 'text'}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => {
                      // type 类型。
                      const type = event.target.value as 'text' | 'image';
                      setEditingReplyRule({
                        ...editingReplyRule,
                        type,
                        reply_content: type === 'text' ? editingReplyRule.reply_content : '',
                        image_url: type === 'image' ? editingReplyRule.image_url : '',
                      });
                    }}
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
                  >
                    <option value="text">文字</option>
                    <option value="image">图片</option>
                  </MuiBox>
                </div>
              </MuiBox>
              <div>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>关键词</MuiBox>
                <MuiBox component='input'
                  type="text"
                  value={editingReplyRule.keyword || ''}
                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingReplyRule({ ...editingReplyRule, keyword: event.target.value })}
                  placeholder="买家发送的关键词"
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
                />
              </div>

              {editingReplyRule.type === 'image' ? (
                <div>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>图片 URL</MuiBox>
                  <MuiBox component='input'
                    value={editingReplyRule.image_url || ''}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingReplyRule({ ...editingReplyRule, image_url: event.target.value })}
                    placeholder="https://..."
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
                  />
                </div>
              ) : (
                <div>
                  <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>回复内容</MuiBox>
                  <MuiBox component='textarea'
                    value={editingReplyRule.reply_content || ''}
                    onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setEditingReplyRule({ ...editingReplyRule, reply_content: event.target.value })}
                    placeholder="自动回复的内容"
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
  'height': '8rem',
  'resize': 'none',
}}
                  />
                </div>
              )}

              <MuiBox component='div' sx={{ 'display': 'flex', 'gap': '.75rem', 'paddingTop': '1rem' }}>
                <MuiBox component='button'
                  onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowReplyModal(false)}
                  sx={{
  'flex': '1 1 0%',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
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
                  取消
                </MuiBox>
                <MuiBox component='button'
                  onClick={handleSaveReplyRule}
                  sx={{
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
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
}}
                >
                  <MuiBox component={Send} sx={{ 'width': '1rem', 'height': '1rem' }} />
                  保存规则
                </MuiBox>
              </MuiBox>
            </MuiBox>
          </MuiBox>
        </MinimalDialogSurface>
      )}

      {showDefaultModal && (
        <MinimalDialogSurface open onClose={/* closeDefaultDialog 关闭账号默认回复弹窗。 */ () => setShowDefaultModal(false)} maxWidth="sm" aria-labelledby="default-reply-title">
          <MuiBox component='div' sx={{ 'width': '100%' }}>
            <MuiBox component='div' sx={{
  'backgroundColor': 'rgb(var(--minimal-color-white))',
  'flexShrink': '0',
  'padding': '2rem 2rem 1.5rem',
  'borderBottom': '1px solid rgb(var(--minimal-color-neutral-100))',
  'zIndex': '10',
  '@media (max-width:768px)': { 'paddingLeft': '1.5rem', 'paddingRight': '1.5rem' },
}}>
              <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between', 'width': '100%' }}>
                <div>
                  <MuiBox component='h3' id="default-reply-title" sx={{
  'fontSize': '1.5rem',
  'lineHeight': '2rem',
  'fontWeight': '800',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>账号默认回复</MuiBox>
                  <MuiBox component='p' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>关键词和 AI 都未处理时，才会使用默认回复。</MuiBox>
                </div>
                <MuiBox component='button'
                  onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowDefaultModal(false)}
                  sx={{
  'padding': '.5rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-bg-opacity,1))',
  'borderRadius': '9999px',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-bg-opacity,1))',
  },
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
}}
                  title="关闭"
                >
                  <MuiBox component={X} sx={{
  'width': '1.25rem',
  'height': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}} />
                </MuiBox>
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
              <div>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>闲鱼账号</MuiBox>
                <MuiBox component='select'
                  value={defaultForm.cookie_id}
                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setDefaultForm({ ...defaultForm, cookie_id: event.target.value })}
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
                >
                  <option value="">选择账号</option>
                  {accounts.map(/* 当前回调处理集合中的单个元素。 */ account => (
                    <option key={account.id} value={account.id}>{accountLabel(account)}</option>
                  ))}
                </MuiBox>
              </div>

              <MuiBox component='div' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'padding': '1rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'borderRadius': '8px',
}}>
                <div>
                  <MuiBox component='div' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>启用默认回复</MuiBox>
                  <MuiBox component='div' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'marginTop': '.25rem',
}}>启用后，未命中关键词时自动发送</MuiBox>
                </div>
                <MuiBox component='button'
                  type="button"
                  onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setDefaultForm({ ...defaultForm, enabled: !defaultForm.enabled })}
                  sx={[{
  'width': '3.5rem',
  'height': '2rem',
  'borderRadius': '9999px',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.3s',
  'position': 'relative',
}, defaultForm.enabled ? { '--minimal-bg-opacity': '1', 'backgroundColor': 'rgb(var(--minimal-color-brand))' } : {
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-bg-opacity,1))',
}]}
                >
                  <MuiBox component='span' sx={[{
  'position': 'absolute',
  'top': '.25rem',
  'width': '1.5rem',
  'height': '1.5rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'borderRadius': '9999px',
  '--minimal-shadow': 'var(--minimal-shadow-md)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-md)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
  'transitionProperty': 'transform',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.3s',
  'display': 'block',
}, defaultForm.enabled ? {
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
  '--minimal-translate-x': '1.75rem',
} : {
  '--minimal-translate-x': '0.25rem',
  'transform': 'translate(var(--minimal-translate-x),var(--minimal-translate-y)) rotate(var(--minimal-rotate)) skewX(var(--minimal-skew-x)) skewY(var(--minimal-skew-y)) scaleX(var(--minimal-scale-x)) scaleY(var(--minimal-scale-y))',
}]} />
                </MuiBox>
              </MuiBox>

              <div>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>回复内容</MuiBox>
                <MuiBox component='textarea'
                  value={defaultForm.reply_content}
                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setDefaultForm({ ...defaultForm, reply_content: event.target.value })}
                  placeholder="输入默认回复内容"
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
  'height': '8rem',
  'resize': 'none',
}}
                />
              </div>

              <div>
                <MuiBox component='label' sx={{
  'display': 'block',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
  'marginBottom': '.5rem',
}}>回复图片 URL（可选）</MuiBox>
                <MuiBox component='input'
                  type="text"
                  value={defaultForm.reply_image_url}
                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setDefaultForm({ ...defaultForm, reply_image_url: event.target.value })}
                  placeholder="https://example.com/image.jpg"
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
                />
              </div>

              <MuiBox component='label' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'space-between',
  'padding': '1rem',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'borderRadius': '8px',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>
                <span>
                  只回复一次
                  <MuiBox component='span' sx={{
  'display': 'block',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
  'fontWeight': '500',
  'marginTop': '.25rem',
}}>同一会话只发送一次默认回复</MuiBox>
                </span>
                <MuiBox component='input'
                  type="checkbox"
                  checked={defaultForm.reply_once}
                  onChange={/* 当前回调处理用户交互或异步状态变化。 */ event => setDefaultForm({ ...defaultForm, reply_once: event.target.checked })}
                  sx={{ 'width': '1rem', 'height': '1rem', 'borderRadius': '6px' }}
                />
              </MuiBox>

              <MuiBox component='div' sx={{ 'display': 'flex', 'gap': '.75rem', 'paddingTop': '1rem' }}>
                <MuiBox component='button'
                  onClick={/* 当前回调处理用户交互或异步状态变化。 */ () => setShowDefaultModal(false)}
                  sx={{
  'flex': '1 1 0%',
  'paddingLeft': '1.5rem',
  'paddingRight': '1.5rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
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
                  取消
                </MuiBox>
                <MuiBox component='button'
                  onClick={handleSaveDefaultReply}
                  sx={{
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
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'borderRadius': '8px',
  'display': 'flex',
  'alignItems': 'center',
  'justifyContent': 'center',
  'gap': '.5rem',
}}
                >
                  <MuiBox component={Save} sx={{ 'width': '1rem', 'height': '1rem' }} />
                  保存默认回复
                </MuiBox>
              </MuiBox>
            </MuiBox>
          </MuiBox>
        </MinimalDialogSurface>
      )}
    </MinimalPageFrame>
  );
};

export default Rules;

import MuiBox from '@mui/material/Box';
import { Loader2, Play, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { CardAPITestResult } from '../models';

// APIRequestMethod 是 API 发货请求支持的 HTTP 方法。
export type APIRequestMethod = 'GET' | 'POST';

// APISecretAction 描述编辑敏感模板时对服务端已保存值的处理方式。
export type APISecretAction = 'retain' | 'replace' | 'clear';

// APIKeyValueRow 是 Postman 风格键值编辑器中的一行表单数据。
export interface APIKeyValueRow {
  // key 是请求头、查询参数或表单字段名称。
  key: string;
  // value 是字段值；动态变量会以文本形式保留到服务端替换。
  value: string;
}

// APIRequestBuilderProps 描述 API 请求编辑器的受控字段和保存动作。
export interface APIRequestBuilderProps {
  // url 是远端 API 地址。
  url: string;
  // method 是远端 API 请求方法。
  method: APIRequestMethod;
  // timeout 是单次远端请求的超时秒数。
  timeout: number;
  // headers 是请求头 JSON 文本，组件以键值行展示。
  headers: string;
  // params 是 URL 查询参数 JSON 文本，组件以键值行展示。
  params: string;
  // contentType 是 POST 请求正文的 Content-Type。
  contentType: string;
  // body 是 JSON 正文或非 JSON 正文的键值 JSON 文本。
  body: string;
  // responsePath 是成功响应中的卡密提取路径。
  responsePath: string;
  // retryEnabled 表示是否启用带幂等键的重试。
  retryEnabled: boolean;
  // headersAction 是编辑时请求头敏感模板的三态处理方式。
  headersAction?: APISecretAction;
  // paramsAction 是编辑时查询参数敏感模板的三态处理方式。
  paramsAction?: APISecretAction;
  // onChange 更新指定 API 配置字段。
	onChange: (field: APIRequestField, value: string | number | boolean) => void;
	// onTest 使用当前配置执行临时测试请求。
	onTest?: () => Promise<CardAPITestResult>;
}

// APIRequestField 是 APIRequestBuilder 可更新字段的联合类型。
export type APIRequestField =
  | 'url'
  | 'method'
  | 'timeout'
  | 'headers'
  | 'params'
  | 'contentType'
  | 'body'
  | 'responsePath'
  | 'retryEnabled'
  | 'headersAction'
  | 'paramsAction';

// APITestState 保存 API 测试请求的加载状态、非敏感诊断结果与请求错误。
interface APITestState {
  // loading 表示当前是否正在等待远端测试响应。
  loading: boolean;
  // result 是远端完成请求后返回的状态和响应结构诊断。
  result?: CardAPITestResult;
  // error 是本地请求、超时或配置错误的用户可见提示。
  error?: string;
}

// contentTypes 保存常用且不依赖文件上传的请求正文类型。
const contentTypes = [
  { value: 'application/json', label: 'JSON（application/json）' },
  { value: 'application/x-www-form-urlencoded', label: '表单键值（x-www-form-urlencoded）' },
  { value: 'text/plain', label: '纯文本（text/plain）' },
  { value: 'application/xml', label: 'XML（application/xml）' },
];

// isJSONContentType 判断正文类型是否应该使用 JSON 编辑器。
const isJSONContentType = (contentType: string): boolean => contentType.toLowerCase().includes('json');

// rowsFromJSON 将已保存的 JSON 对象转成适合键值编辑器展示的行。
const rowsFromJSON = (value: string): APIKeyValueRow[] => {
  if (!value.trim()) return [{ key: '', value: '' }];
  try {
    // parsed 是配置模板解析后的未知 JSON 值。
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [{ key: '', value: '' }];
    // entries 是对象中每个字段的键和值。
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.length === 0) return [{ key: '', value: '' }];
    return entries.map(/* entry 保存当前对象字段的键和值。 */ entry => {
      // key、entryValue 分别是当前模板字段名称和字段值。
      const [key, entryValue] = entry;
      return { key, value: typeof entryValue === 'string' ? entryValue : JSON.stringify(entryValue) };
    });
  } catch {
    return [{ key: '', value: value.trim() }];
  }
};

// rowsToJSON 将键值行序列化为服务端使用的 JSON 对象文本。
const rowsToJSON = (rows: APIKeyValueRow[]): string => {
  // object 是过滤空键后待提交的键值对象。
  const object = rows.reduce<Record<string, string>>(/* reduceCallback 汇总非空键名的模板字段。 */ (result, row) => {
    // key 是当前行清理空白后的字段名称。
    const key = row.key.trim();
    if (key) result[key] = row.value;
    return result;
  }, {});
  return JSON.stringify(object);
};

// KeyValueEditorProps 描述一组 Postman 风格键值行编辑器。
interface KeyValueEditorProps {
  // label 是当前键值区块的可见标题。
  label: string;
  // value 是当前键值对象的 JSON 文本。
  value: string;
  // placeholder 是第一行输入的示例文本。
  placeholder: string;
  // onChange 接收序列化后的键值对象。
  onChange: (value: string) => void;
}

// KeyValueEditor 渲染可增删的键值对输入行。
const KeyValueEditor = ({ label, value, placeholder, onChange }: KeyValueEditorProps) => {
  // rows 保存当前键值编辑行；空行也必须保留在本地状态中，才能支持连续添加。
  const [rows, setRows] = useState<APIKeyValueRow[]>(() => rowsFromJSON(value));
  // lastEmittedValue 记录本组件最近一次提交的 JSON，避免空行序列化为 {} 后被外部同步立即抹掉。
  const lastEmittedValue = useRef(value);

  // syncRows 在父表单从外部载入新模板时重置编辑行；本组件自己的更新不重复覆盖空行。
  useEffect(/* syncRowsEffect 同步外部模板变更并保留本地新增空行。 */ () => {
    if (value !== lastEmittedValue.current) {
      setRows(rowsFromJSON(value));
      lastEmittedValue.current = value;
    }
  }, [value]);

  // emitRows 保存本地键值行并通知父表单更新敏感模板 JSON。
  const emitRows = (nextRows: APIKeyValueRow[]) => {
    // serialized 是当前键值行转成的服务端 JSON 对象文本。
    const serialized = rowsToJSON(nextRows);
    setRows(nextRows);
    lastEmittedValue.current = serialized;
    onChange(serialized);
  };

  // updateRow 修改某一行并把完整对象交回父表单。
  const updateRow = (index: number, field: keyof APIKeyValueRow, nextValue: string) => {
    // nextRows 是修改当前字段后的完整键值行列表。
    const nextRows = rows.map(/* rowUpdater 更新当前键值编辑行。 */ (row, rowIndex) => rowIndex === index ? { ...row, [field]: nextValue } : row);
    emitRows(nextRows);
  };

  // addRow 在末尾追加一行空键值输入。
  const addRow = () => emitRows([...rows, { key: '', value: '' }]);

  // removeRow 删除指定键值行，并确保编辑器始终保留一行可输入内容。
  const removeRow = (index: number) => emitRows(rows.filter(/* rowFilter 保留未被删除的键值行。 */ (_, rowIndex) => rowIndex !== index));

  return (
    <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'center', 'justifyContent': 'space-between', 'gap': '.75rem' }}>
        <MuiBox component='label' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>{label}</MuiBox>
        <MuiBox component='button'
          type="button"
          onClick={addRow}
          sx={{
  'display': 'inline-flex',
  'alignItems': 'center',
  'gap': '.25rem',
  'borderRadius': '7px',
  'paddingLeft': '.5rem',
  'paddingRight': '.5rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-brand-50)/var(--minimal-bg-opacity,1))',
  },
}}
          title={`添加${label}字段`}
        >
          <MuiBox component={Plus} sx={{ 'height': '.875rem', 'width': '.875rem' }} />
          添加字段
        </MuiBox>
      </MuiBox>
      <MuiBox component='div' sx={{
  'overflow': 'hidden',
  'borderRadius': '8px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
}}>
        <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'minmax(0,.8fr) minmax(0,1.2fr) 40px',
  'gap': '.5rem',
  'borderBottomWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-50)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '11px',
  'fontWeight': '700',
  'textTransform': 'uppercase',
  'letterSpacing': '.025em',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
}}>
          <span>KEY</span>
          <span>VALUE</span>
          <span aria-hidden="true" />
        </MuiBox>
        <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-divide-y-reverse': '0',
    'borderTopWidth': 'calc(1px*(1 - var(--minimal-divide-y-reverse)))',
    'borderBottomWidth': 'calc(1px*var(--minimal-divide-y-reverse))',
    '--minimal-divide-opacity': '1',
    'borderColor': 'rgb(var(--minimal-color-neutral-100)/var(--minimal-divide-opacity,1))',
  },
}}>
          {rows.map(/* rowRenderer 渲染当前键值编辑行。 */ (row, index) => (
            <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'minmax(0,.8fr) minmax(0,1.2fr) 40px',
  'alignItems': 'center',
  'gap': '.5rem',
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
}} key={`${label}-${index}`}>
              <MuiBox component='input'
                aria-label={`${label}第${index + 1}行键名`}
                value={row.key}
                onChange={/* 当前回调更新键值行的字段名称。 */ (event: ChangeEvent<HTMLInputElement>) => updateRow(index, 'key', event.target.value)}
                placeholder={index === 0 ? placeholder : '键名'}
                sx={{
  'minWidth': '0',
  'borderWidth': '0',
  'backgroundColor': 'var(--minimal-color-transparent)',
  'paddingLeft': '.25rem',
  'paddingRight': '.25rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
  'outline': '2px solid transparent',
  'outlineOffset': '2px',
  '--minimal-ring-offset-shadow': 'var(--minimal-ring-inset) 0 0 0 var(--minimal-ring-offset-width) var(--minimal-ring-offset-color)',
  '--minimal-ring-shadow': 'var(--minimal-ring-inset) 0 0 0 calc(var(--minimal-ring-offset-width)) var(--minimal-ring-color)',
  'boxShadow': 'var(--minimal-ring-offset-shadow),var(--minimal-ring-shadow),var(--minimal-shadow,0 0 transparent)',
  '&::-moz-placeholder': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-text-opacity,1))',
  },
  '&::placeholder': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-text-opacity,1))',
  },
}}
              />
              <MuiBox component='input'
                aria-label={`${label}第${index + 1}行值`}
                value={row.value}
                onChange={/* 当前回调更新键值行的字段值。 */ (event: ChangeEvent<HTMLInputElement>) => updateRow(index, 'value', event.target.value)}
                placeholder={index === 0 ? '输入值或动态变量，例如 {order_id}' : '值'}
                sx={{
  'minWidth': '0',
  'borderWidth': '0',
  'backgroundColor': 'var(--minimal-color-transparent)',
  'paddingLeft': '.25rem',
  'paddingRight': '.25rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
  'outline': '2px solid transparent',
  'outlineOffset': '2px',
  '--minimal-ring-offset-shadow': 'var(--minimal-ring-inset) 0 0 0 var(--minimal-ring-offset-width) var(--minimal-ring-offset-color)',
  '--minimal-ring-shadow': 'var(--minimal-ring-inset) 0 0 0 calc(var(--minimal-ring-offset-width)) var(--minimal-ring-color)',
  'boxShadow': 'var(--minimal-ring-offset-shadow),var(--minimal-ring-shadow),var(--minimal-shadow,0 0 transparent)',
  '&::-moz-placeholder': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-text-opacity,1))',
  },
  '&::placeholder': {
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-neutral-300)/var(--minimal-text-opacity,1))',
  },
}}
              />
              <MuiBox component='button'
                type="button"
                onClick={/* 当前回调删除指定键值编辑行。 */ () => removeRow(index)}
                sx={{
  'display': 'inline-flex',
  'height': '2rem',
  'width': '2rem',
  'alignItems': 'center',
  'justifyContent': 'center',
  'borderRadius': '7px',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-400)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
    '--minimal-text-opacity': '1',
    'color': 'rgb(var(--minimal-color-danger-500)/var(--minimal-text-opacity,1))',
  },
}}
                title={`删除${label}第${index + 1}行`}
                aria-label={`删除${label}第${index + 1}行`}
              >
                <MuiBox component={Trash2} sx={{ 'height': '1rem', 'width': '1rem' }} />
              </MuiBox>
            </MuiBox>
          ))}
        </MuiBox>
      </MuiBox>
    </MuiBox>
  );
};

// APIRequestBuilder 渲染 API 地址、元数据以及 Headers / Params / Body 三个请求区块。
export const APIRequestBuilder = ({
  url,
  method,
  timeout,
  headers,
  params,
  contentType,
  body,
  responsePath,
  retryEnabled,
  headersAction,
  paramsAction,
	onChange,
	onTest,
}: APIRequestBuilderProps) => {
  // jsonBody 表示当前正文类型是否使用 JSON 文本编辑器。
	const jsonBody = isJSONContentType(contentType);
	// testState 保存最近一次 API 测试的加载、结果和错误状态。
		const [testState, setTestState] = useState<APITestState>({ loading: false });
	// runTest 触发临时请求并保留结果在当前弹窗中。
	const runTest = async () => {
		if (!onTest) return;
		setTestState({ loading: true });
		try {
			setTestState({ loading: false, result: await onTest() });
		} catch (/* error 表示测试请求的本地错误或共享 HTTP 客户端返回的异常。 */ error) {
			setTestState({ loading: false, error: error instanceof Error ? error.message : 'API 测试请求失败' });
		}
	};

  return (
    <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
  'borderRadius': '10px',
  'borderWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-border-opacity,1))',
  'backgroundColor': 'rgb(var(--minimal-color-brand-50)/.4)',
  'padding': '1rem',
  '@media (min-width:640px)': { 'padding': '1.25rem' },
}}>
      <MuiBox component='div' sx={{ 'display': 'flex', 'alignItems': 'flex-start', 'justifyContent': 'space-between', 'gap': '.75rem' }}>
        <div>
          <MuiBox component='h3' sx={{
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-text-opacity,1))',
}}>API 请求配置</MuiBox>
          <MuiBox component='p' sx={{
  'marginTop': '.25rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>按 Postman 的请求结构填写，敏感模板只会加密保存在服务端。</MuiBox>
        </div>
		<MuiBox component='span' sx={{
  'borderRadius': '9999px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-white)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '.625rem',
  'paddingRight': '.625rem',
  'paddingTop': '.25rem',
  'paddingBottom': '.25rem',
  'fontSize': '11px',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-brand-600)/var(--minimal-text-opacity,1))',
  '--minimal-shadow': 'var(--minimal-shadow-sm)',
  '--minimal-shadow-colored': 'var(--minimal-shadow-sm)',
  'boxShadow': 'var(--minimal-ring-offset-shadow,0 0 transparent),var(--minimal-ring-shadow,0 0 transparent),var(--minimal-shadow)',
}}>API</MuiBox>
	      </MuiBox>
	      {onTest && (
		<MuiBox component='div' sx={{ 'display': 'flex', 'flexWrap': 'wrap', 'alignItems': 'center', 'gap': '.75rem' }}>
		  <MuiBox component='button' type="button" onClick={runTest} disabled={testState.loading} sx={{
  'display': 'inline-flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'borderRadius': '8px',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-neutral-900)/var(--minimal-bg-opacity,1))',
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.625rem',
  'paddingBottom': '.625rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-white)/var(--minimal-text-opacity,1))',
  'transitionProperty': 'color,background-color,border-color,text-decoration-color,fill,stroke',
  'transitionTimingFunction': 'cubic-bezier(.4,0,.2,1)',
  'transitionDuration': '.15s',
  '&:hover': {
    '--minimal-bg-opacity': '1',
    'backgroundColor': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-bg-opacity,1))',
  },
  '&:disabled': { 'cursor': 'wait', 'opacity': '.6' },
}}>
			{testState.loading ? <MuiBox component={Loader2} sx={{ 'height': '1rem', 'width': '1rem', 'animation': 'spin 1s linear infinite' }} /> : <MuiBox component={Play} sx={{ 'height': '1rem', 'width': '1rem' }} />}
			测试请求
		  </MuiBox>
		  {testState.error && <MuiBox component='span' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '600',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-danger-600)/var(--minimal-text-opacity,1))',
}}>{testState.error}</MuiBox>}
		  {testState.result && (
			<MuiBox component='div' sx={[{
  'width': '100%',
  'borderRadius': '8px',
  'borderWidth': '1px',
  'padding': '.75rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}, testState.result.status === 'success' ? {
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-success-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-success-50)/var(--minimal-bg-opacity,1))',
} : {
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-danger-200)/var(--minimal-border-opacity,1))',
  '--minimal-bg-opacity': '1',
  'backgroundColor': 'rgb(var(--minimal-color-danger-50)/var(--minimal-bg-opacity,1))',
}]}>
			  <MuiBox component='div' sx={{
  'display': 'flex',
  'flexWrap': 'wrap',
  'MozColumnGap': '1.25rem',
  'columnGap': '1.25rem',
  'rowGap': '.25rem',
  'fontWeight': '600',
}}>
				<span>{testState.result.status === 'success' ? '测试成功' : '测试失败'}</span>
				<span>HTTP 状态：{testState.result.status_code || '网络错误'}</span>
				<span>响应类型：{testState.result.response_content_type || '未知'}</span>
			  </MuiBox>
			  <MuiBox component='div' sx={{
  'marginTop': '.5rem',
  'display': 'grid',
  'gap': '.25rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}><span>响应字段：{testState.result.response_fields.length ? testState.result.response_fields.join('、') : '未识别 JSON 字段'}</span><span>提取结果：{testState.result.extracted_value || '未提取到内容'}</span></MuiBox>
			  {testState.result.response_preview && <MuiBox component='pre' sx={{
  'marginTop': '.5rem',
  'maxHeight': '8rem',
  'overflow': 'auto',
  'whiteSpace': 'pre-wrap',
  'borderRadius': '7px',
  'backgroundColor': 'rgb(var(--minimal-color-white)/.7)',
  'padding': '.5rem',
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-600)/var(--minimal-text-opacity,1))',
}}>{testState.result.response_preview}</MuiBox>}
			</MuiBox>
		  )}
		</MuiBox>
	      )}

      <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  'gap': '1rem',
  '@media (min-width:640px)': { 'gridTemplateColumns': 'minmax(0,1fr) 130px 130px' },
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
}}>API 地址</MuiBox>
          <MuiBox component='input'
            type="url"
            value={url}
            onChange={/* 当前回调更新远端 API 地址。 */ (event: ChangeEvent<HTMLInputElement>) => onChange('url', event.target.value)}
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
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
            placeholder="https://api.example.com/get-code"
          />
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
}}>请求方法</MuiBox>
          <MuiBox component='select' value={method} onChange={/* 当前回调切换 API 请求方法。 */ (event: ChangeEvent<HTMLSelectElement>) => onChange('method', event.target.value)} sx={{
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
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
}}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
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
}}>超时（秒）</MuiBox>
          <MuiBox component='input' type="number" min="1" max="60" value={timeout} onChange={/* 当前回调更新 API 请求超时秒数。 */ (event: ChangeEvent<HTMLInputElement>) => onChange('timeout', Number(event.target.value) || 10)} sx={{
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
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
}} />
        </MuiBox>
      </MuiBox>

      <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(1.25rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(1.25rem*var(--minimal-space-y-reverse))',
  },
  'borderTopWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-border-opacity,1))',
  'paddingTop': '1.25rem',
}}>
        <KeyValueEditor label="Headers / 请求头" value={headers} onChange={/* 当前回调保存请求头键值对象。 */ nextValue => onChange('headers', nextValue)} placeholder="Authorization" />
        {headersAction && (
          <MuiBox component='select' aria-label="请求头处理方式" value={headersAction} onChange={/* 当前回调选择请求头敏感模板处理方式。 */ (event: ChangeEvent<HTMLSelectElement>) => onChange('headersAction', event.target.value)} sx={{
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
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '@media (min-width:640px)': { 'width': 'auto' },
}}>
            <option value="retain">保留已保存请求头</option>
            <option value="replace">替换为上方字段</option>
            <option value="clear">清除已保存请求头</option>
          </MuiBox>
        )}

        <KeyValueEditor label="Params / 查询参数" value={params} onChange={/* 当前回调保存查询参数键值对象。 */ nextValue => onChange('params', nextValue)} placeholder="order_id" />
        {paramsAction && (
          <MuiBox component='select' aria-label="查询参数处理方式" value={paramsAction} onChange={/* 当前回调选择查询参数敏感模板处理方式。 */ (event: ChangeEvent<HTMLSelectElement>) => onChange('paramsAction', event.target.value)} sx={{
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
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '@media (min-width:640px)': { 'width': 'auto' },
}}>
            <option value="retain">保留已保存查询参数</option>
            <option value="replace">替换为上方字段</option>
            <option value="clear">清除已保存查询参数</option>
          </MuiBox>
        )}

        <MuiBox component='div' sx={{
  '&>:not([hidden])~:not([hidden])': {
    '--minimal-space-y-reverse': '0',
    'marginTop': 'calc(.5rem*(1 - var(--minimal-space-y-reverse)))',
    'marginBottom': 'calc(.5rem*var(--minimal-space-y-reverse))',
  },
}}>
          <MuiBox component='div' sx={{
  'display': 'flex',
  'flexDirection': 'column',
  'gap': '.5rem',
  '@media (min-width:640px)': { 'flexDirection': 'row', 'alignItems': 'center', 'justifyContent': 'space-between' },
}}>
            <MuiBox component='label' sx={{
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-800)/var(--minimal-text-opacity,1))',
}}>Body / 请求正文</MuiBox>
            <MuiBox component='select' aria-label="请求正文 Content-Type" value={contentType} onChange={/* 当前回调切换请求正文类型。 */ (event: ChangeEvent<HTMLSelectElement>) => onChange('contentType', event.target.value)} sx={{
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
  'paddingLeft': '.75rem',
  'paddingRight': '.75rem',
  'paddingTop': '.5rem',
  'paddingBottom': '.5rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  '@media (min-width:640px)': { 'width': '290px' },
}}>
              {contentTypes.map(/* 当前回调渲染一个常用 Content-Type 选项。 */ contentTypeOption => <option key={contentTypeOption.value} value={contentTypeOption.value}>{contentTypeOption.label}</option>)}
            </MuiBox>
          </MuiBox>
          {jsonBody ? (
            <MuiBox component='textarea'
              aria-label="JSON 请求正文"
              value={body}
              onChange={/* 当前回调更新 JSON 请求正文。 */ (event: ChangeEvent<HTMLTextAreaElement>) => onChange('body', event.target.value)}
              sx={{
  'height': '9rem',
  'width': '100%',
  'resize': 'vertical',
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
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}}
              placeholder={'{\n  "order_id": "{order_id}"\n}'}
            />
          ) : (
            <KeyValueEditor label="Body 字段" value={body} onChange={/* 当前回调保存非 JSON 正文键值对象。 */ nextValue => onChange('body', nextValue)} placeholder="field" />
          )}
          <MuiBox component='p' sx={{
  'fontSize': '.75rem',
  'lineHeight': '1rem',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-500)/var(--minimal-text-opacity,1))',
}}>GET 请求通常只使用 Params；POST 请求会按所选 Content-Type 发送 Body。</MuiBox>
        </MuiBox>
      </MuiBox>

      <MuiBox component='div' sx={{
  'display': 'grid',
  'gridTemplateColumns': 'repeat(1,minmax(0,1fr))',
  'gap': '1rem',
  'borderTopWidth': '1px',
  '--minimal-border-opacity': '1',
  'borderColor': 'rgb(var(--minimal-color-brand-100)/var(--minimal-border-opacity,1))',
  'paddingTop': '1.25rem',
  '@media (min-width:640px)': { 'gridTemplateColumns': 'minmax(0,1fr) minmax(0,1fr)' },
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
}}>响应提取路径（可选）</MuiBox>
          <MuiBox component='input' value={responsePath} onChange={/* 当前回调更新响应提取路径。 */ (event: ChangeEvent<HTMLInputElement>) => onChange('responsePath', event.target.value)} sx={{
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
  'paddingLeft': '1rem',
  'paddingRight': '1rem',
  'paddingTop': '.75rem',
  'paddingBottom': '.75rem',
  'fontFamily': 'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
}} placeholder="data.cards[0].code" />
        </MuiBox>
        <MuiBox component='label' sx={{
  'display': 'flex',
  'alignItems': 'center',
  'gap': '.5rem',
  'alignSelf': 'flex-end',
  'paddingBottom': '.75rem',
  'fontSize': '.875rem',
  'lineHeight': '1.25rem',
  'fontWeight': '700',
  '--minimal-text-opacity': '1',
  'color': 'rgb(var(--minimal-color-neutral-700)/var(--minimal-text-opacity,1))',
}}>
          <input type="checkbox" checked={retryEnabled} onChange={/* 当前回调切换 API 幂等重试。 */ (event: ChangeEvent<HTMLInputElement>) => onChange('retryEnabled', event.target.checked)} />
          启用幂等重试（需配置 {'{idempotency_key}'}）
        </MuiBox>
      </MuiBox>
    </MuiBox>
  );
};

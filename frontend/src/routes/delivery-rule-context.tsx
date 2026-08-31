import React, { createContext, useContext, useState } from 'react';

// DeliveryRuleTarget 描述商品页跳转规则页时携带的最小业务载荷。
export interface DeliveryRuleTarget {
  // cookieId 是目标账号标识。
  cookieId: string;
  // itemId 是目标商品标识。
  itemId: string;
  // requestId 区分连续发起的跳转请求。
  requestId: number;
}

// DeliveryRuleContextValue 描述跨页面规则配置载荷的读写能力。
interface DeliveryRuleContextValue {
  // target 是当前待消费的商品规则目标。
  target?: DeliveryRuleTarget;
  // setTarget 写入新的规则目标。
  setTarget: (target: DeliveryRuleTarget) => void;
  // clearTarget 在规则页消费后清理载荷。
  clearTarget: () => void;
}

const DeliveryRuleContext = createContext<DeliveryRuleContextValue | undefined>(undefined);

// DeliveryRuleProvider 在应用壳范围内保留商品到规则页的一次性联动。
export const DeliveryRuleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // targetState 保存当前尚未由规则页消费的一次性目标。
  const [target, setTargetState] = useState<DeliveryRuleTarget>();
  // setTarget 写入商品页发起的规则配置目标。
  const setTarget = (nextTarget: DeliveryRuleTarget): void => setTargetState(nextTarget);
  // clearTarget 清除已被规则页接收的目标。
  const clearTarget = (): void => setTargetState(undefined);
  return <DeliveryRuleContext.Provider value={{ target, setTarget, clearTarget }}>{children}</DeliveryRuleContext.Provider>;
};

// useDeliveryRuleTarget 读取商品规则联动上下文。
export const useDeliveryRuleTarget = (): DeliveryRuleContextValue => {
  // context 保存当前 Provider 的跨页联动状态。
  const context = useContext(DeliveryRuleContext);
  if (!context) throw new Error('useDeliveryRuleTarget 必须在 DeliveryRuleProvider 内使用');
  return context;
};

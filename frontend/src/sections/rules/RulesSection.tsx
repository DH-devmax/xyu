import React from 'react';
import Rules from '@/features/rules/pages/Rules';
import type { RulesProps } from '@/features/rules/types';

// RulesSection 将一次性商品目标和消费回调传入规则 feature。
const RulesSection: React.FC<RulesProps> = props => <Rules {...props} />;

export default RulesSection;

import React from 'react';
import type { Item } from '@/features/items/api';
import ItemList from '@/features/items/pages/ItemList';

// ItemsSectionProps 描述商品页触发规则配置时需要的回调。
export interface ItemsSectionProps {
  // onConfigureDelivery 保存商品规则目标并由路由层导航。
  onConfigureDelivery: (item: Item) => void;
}

// ItemsSection 只把路由联动回调传给现有商品 feature。
const ItemsSection: React.FC<ItemsSectionProps> = ({ onConfigureDelivery }) => <ItemList onConfigureDelivery={onConfigureDelivery} />;

export default ItemsSection;

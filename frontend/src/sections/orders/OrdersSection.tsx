import React from 'react';
import OrderList from '@/features/orders/pages/OrderList';

// OrdersSection 保留订单查询与详情动作，仅替换页面组合边界。
const OrdersSection: React.FC = () => <OrderList />;

export default OrdersSection;

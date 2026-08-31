import { Code,CreditCard,FileText,Image as ImageIcon } from 'lucide-react';
import React from 'react';
import Box from '@mui/material/Box';
import type { Card } from '../api';

// CardIconProps 描述库存图标所需的卡密类型参数。
interface CardIconProps {
  // type 是当前卡密组的交付类型。
  type: Card['type'];
}

// CardIcon 根据卡密类型渲染稳定的库存图标，避免在列表组件内声明子组件。
export const CardIcon: React.FC<CardIconProps> = ({ type }) => {
  // icon 是与卡密类型对应的 Lucide 图标。
  let icon: React.ReactNode;
  // color 是与交付类型对应的主题色。
  let color: string;
  switch (type) {
    case 'text':
      icon = <FileText size={20} />;
      color = 'info.main';
      break;
    case 'image':
      icon = <ImageIcon size={20} />;
      color = 'secondary.main';
      break;
    case 'api':
      icon = <Code size={20} />;
      color = 'primary.main';
      break;
    default:
      icon = <CreditCard size={20} />;
      color = 'text.secondary';
  }
  return <Box component="span" sx={{ display: 'inline-flex', color }}>{icon}</Box>;
};

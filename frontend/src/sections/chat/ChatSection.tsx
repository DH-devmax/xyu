import React from 'react';
import Chat from '@/features/chat/pages/Chat';

// ChatSection 只负责视图组合，唯一 WebSocket owner 仍由应用壳维护。
const ChatSection: React.FC = () => <Chat />;

export default ChatSection;

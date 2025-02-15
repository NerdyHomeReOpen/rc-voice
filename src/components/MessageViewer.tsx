import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

// Types
import type { Message, Server, User, UserList } from '@/types';

// Util
import { formatTimestamp } from '@/utils/formatters';

interface MessageGroup {
  id: string;
  type: 'general' | 'info';
  contents: string[];
  senderId: string;
  timestamp: string;
  sender: User | null;
}

const getGroupMessages = (messages: Message[]): MessageGroup[] => {
  const sorted = [...messages].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp),
  );
  const grouped = sorted.reduce<MessageGroup[]>((acc, message) => {
    const lastGroup = acc[acc.length - 1];
    const currentTime = Number(message.timestamp);
    const lastTime = lastGroup ? Number(lastGroup.timestamp) : 0;
    const timeDiff = currentTime - lastTime;
    const nearTime = lastGroup && timeDiff <= 5 * 60 * 1000;
    const sameSender = lastGroup && message.senderId === lastGroup.senderId;
    const isInfoMsg = message.type == 'info';

    if (sameSender && nearTime && !isInfoMsg) {
      lastGroup.contents.push(message.content);
    } else {
      acc.push({
        id: message.id,
        senderId: message.senderId,
        sender: message.sender ?? null,
        timestamp: message.timestamp.toString(),
        contents: [message.content],
        type: message.type,
      });
    }
    return acc;
  }, []);
  return grouped;
};

interface MessageBoxProps {
  messageGroup: MessageGroup;
}

const MessageBox: React.FC<MessageBoxProps> = React.memo(({ messageGroup }) => {
  // Redux
  const server = useSelector((state: { server: Server }) => state.server);

  const senderGender = messageGroup.sender?.gender ?? 'Male';
  const senderName = messageGroup.sender?.name ?? 'Unknown';
  const senderPermission =
    server.members?.[messageGroup.senderId].permissionLevel ?? 1;
  const messageTimestamp = formatTimestamp(parseInt(messageGroup.timestamp));

  return (
    <div key={messageGroup.id} className="flex items-start space-x-1 mb-1">
      {messageGroup.type === 'info' ? (
        <>
          <img
            src={'/channel/NT_NOTIFY.png'}
            alt={'NT_NOTIFY'}
            className="select-none flex-shrink-0 mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="text-gray-700">
              {messageGroup.contents.map((content, index) => (
                <div key={index} className="break-words">
                  <MarkdownViewer markdownText={content} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <img
            src={`/channel/${senderGender}_${senderPermission}.png`}
            alt={`image`}
            className="select-none flex-shrink-0 mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className="font-bold text-gray-900">{senderName}</span>
              <span className="text-xs text-gray-500 ml-2">
                {messageTimestamp}
              </span>
            </div>

            <div className="text-gray-700">
              {messageGroup.contents.map((content, index) => (
                <div key={index} className="break-words">
                  <MarkdownViewer markdownText={content} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

interface MessageViewerProps {
  messages: Message[] | null;
}

const MessageViewer: React.FC<MessageViewerProps> = React.memo(
  ({ messages }) => {
    if (!messages) return null;

    const groupMessages = getGroupMessages(messages);

    // Auto Scroll Control
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'auto',
        block: 'end',
      });
    }, [groupMessages]);

    return (
      <div
        className="flex flex-1 flex-col overflow-y-auto min-w-0 max-w-full 
        [&::-webkit-scrollbar]:w-2 
        [&::-webkit-scrollbar]:h-2 
        [&::-webkit-scrollbar-thumb]:bg-gray-300 
        [&::-webkit-scrollbar-thumb]:rounded-lg 
        [&::-webkit-scrollbar-thumb]:hover:bg-gray-400"
      >
        {groupMessages.map((groupMessage) => (
          <MessageBox key={groupMessage.id} messageGroup={groupMessage} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  },
);

MessageViewer.displayName = 'MessageViewer';

export default MessageViewer;

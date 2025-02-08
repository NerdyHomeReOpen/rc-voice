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
  senderId: string;
  sender: User;
  timestamp: string;
  messages: Message[];
  type: 'general' | 'info';
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
      lastGroup.messages.push(message);
    } else {
      acc.push({
        id: message.id,
        senderId: message.senderId,
        sender: message.sender,
        timestamp: message.timestamp.toString(),
        messages: [message],
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
  const user = useSelector((state: { user: User }) => state.user);

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
              {messageGroup.messages.map((message) => (
                <div key={message.id} className="break-words">
                  <MarkdownViewer markdownText={message.content} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <img
            src={`/channel/${messageGroup.sender.gender}_${
              server.members[messageGroup.senderId].permissionLevel
            }.png`}
            alt={`image`}
            className="select-none flex-shrink-0 mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className="font-bold text-gray-900">
                {messageGroup.sender.name}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {formatTimestamp(parseInt(messageGroup.timestamp))}
              </span>
            </div>

            <div className="text-gray-700">
              {messageGroup.messages.map((message) => (
                <div key={message.id} className="break-words">
                  <MarkdownViewer markdownText={message.content} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

interface MessageViewerProps {}

const MessageViewer: React.FC<MessageViewerProps> = React.memo(() => {
  // Redux
  const server = useSelector((state: { server: Server }) => state.server);
  const user = useSelector((state: { user: User }) => state.user);

  const [groupMessages, setGroupMessages] = useState<MessageGroup[]>([]);

  useEffect(() => {
    if (!server || !user) {
      setGroupMessages([]);
      return;
    }
    setGroupMessages(
      getGroupMessages(
        server.channels.find(
          (channel) => channel.id === user.presence?.currentChannelId,
        )?.messages ?? [],
      ),
    );
  }, [server, user]);

  // Auto Scroll Control
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'end',
    });
  }, [groupMessages]);

  return (
    <div className="flex flex-[5] flex-col overflow-y-auto p-3 min-w-0 max-w-full">
      {groupMessages.map((groupMessage) => (
        <MessageBox key={groupMessage.id} messageGroup={groupMessage} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageViewer.displayName = 'MessageViewer';

export default MessageViewer;

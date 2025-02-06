import { memo, useLayoutEffect, useMemo, useRef, useEffect } from 'react';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';

// Types
import type { Message, MessageType, Server, User, UserList } from '@/types';

// Util
import { formatTimestamp } from '@/utils/formatters';

interface MessageGroup {
  id: string;
  senderId: string;
  timestamp: string;
  messages: Message[];
  type: MessageType;
}

interface MessageViewerProps {
  user: User;
  server: Server;
  messages: Message[];
  users: UserList;
  notification: boolean;
}

const MessageViewer = memo(
  ({ user, server, messages, users, notification }: MessageViewerProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousMessagesLength = useRef<number>(0);

    useEffect(() => {
      audioRef.current = new Audio('/sounds/message.mp3');
      audioRef.current.volume = 0.5;
    }, []);

    useEffect(() => {
      if (messages.length > previousMessagesLength.current) {
        const lastMessage = messages[messages.length - 1];
        if (
          lastMessage.senderId !== user.id &&
          lastMessage.type !== 'info' &&
          notification
        ) {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((error) => {
              console.log('音效播放失敗:', error);
            });
          }
        }
      }
      previousMessagesLength.current = messages.length;
    }, [messages, user.id]);

    useLayoutEffect(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'auto',
        block: 'end',
      });
    }, [messages]);

    const groupMessages = (messages: Message[]): MessageGroup[] => {
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
            timestamp: message.timestamp.toString(),
            messages: [message],
            type: message.type,
          });
        }
        return acc;
      }, []);
      return grouped;
    };
    const renderMessage = (group: MessageGroup): React.ReactElement => {
      return (
        <div key={group.id} className="flex items-start space-x-1 mb-1">
          {group.type === 'info' ? (
            <>
              <img
                src={'/channel/NT_NOTIFY.png'}
                alt={'NT_NOTIFY'}
                className="select-none flex-shrink-0 mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="text-gray-700">
                  {group.messages.map((message) => (
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
                src={`/channel/${users[group.senderId].gender}_${
                  server.permissions[group.senderId]
                }.png`}
                alt={`${users[group.senderId].gender}_${
                  server.permissions[group.senderId]
                }`}
                className="select-none flex-shrink-0 mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="font-bold text-gray-900">
                    {users[group.senderId].name}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatTimestamp(parseInt(group.timestamp))}
                  </span>
                </div>

                <div className="text-gray-700">
                  {group.messages.map((message) => (
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
    };

    const groupedMessages = useMemo(() => groupMessages(messages), [messages]);

    return (
      <>
        {groupedMessages.map((group) => renderMessage(group))}
        <div ref={messagesEndRef} />
      </>
    );
  },
);

MessageViewer.displayName = 'MessageViewer';

export default MessageViewer;

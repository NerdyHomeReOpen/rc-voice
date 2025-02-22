/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/display-name */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useLayoutEffect, useRef } from 'react';

// CSS
import styles from '@/styles/messageViewer.module.css';
import permission from '@/styles/common/permission.module.css';

// Components
import MarkdownViewer from '@/components/viewers/MarkdownViewer';

// Types
import type { DirectMessage, Message, User } from '@/types';

// Util
import { formatTimestamp } from '@/utils/formatters';

interface MessageGroup {
  id: string;
  type: 'general' | 'info';
  contents: string[];
  permissionLevel: number | null;
  senderId: string;
  timestamp: number;
  sender?: User | null;
}

const getGroupMessages = (
  messages: Message[] | DirectMessage[],
): MessageGroup[] => {
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
        type: message.type,
        contents: [message.content],
        permissionLevel:
          'permissionLevel' in message ? message.permissionLevel : null,
        senderId: message.senderId,
        timestamp: message.timestamp,
        sender: message.sender,
      });
    }
    return acc;
  }, []);
  return grouped;
};

interface MessageViewerProps {
  messages: Message[] | DirectMessage[] | null;
}

const MessageViewer: React.FC<MessageViewerProps> = React.memo(
  ({ messages }) => {
    if (!messages) return null;

    const messageGroups = getGroupMessages(messages);

    // Auto Scroll Control
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'auto',
        block: 'end',
      });
    }, [messageGroups]);

    return (
      <div className={styles['messageViewerWrapper']}>
        {messageGroups.map((messageGroup) => {
          const senderGender = messageGroup.sender?.gender ?? 'Male';
          const senderName = messageGroup.sender?.name ?? 'Unknown';
          const messagePermission = messageGroup.permissionLevel ?? 0;
          const messageTimestamp = formatTimestamp(messageGroup.timestamp);

          return (
            <div key={messageGroup.id} className={styles['messageWrapper']}>
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
                  <div
                    className={`${styles['senderIcon']} ${
                      permission[senderGender]
                    } ${permission[`lv-${messagePermission}`]}`}
                  />
                  <div className={styles['messageBox']}>
                    <div className={styles['header']}>
                      <span className={styles['name']}>{senderName}</span>
                      <span className={styles['timestamp']}>
                        {messageTimestamp}
                      </span>
                    </div>
                    {messageGroup.contents.map((content, index) => (
                      <div key={index} className={styles['content']}>
                        <MarkdownViewer markdownText={content} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  },
);

MessageViewer.displayName = 'MessageViewer';

export default MessageViewer;

import React, { useLayoutEffect, useRef } from 'react';

// CSS
import styles from '@/styles/messageViewer.module.css';
import permission from '@/styles/common/permission.module.css';

// Components
import MarkdownViewer from '@/components/viewers/Markdown';

// Types
import type { ChannelMessage, DirectMessage, InfoMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

interface DirectMessageTabProps {
  messageGroup: DirectMessage & {
    contents: string[];
  };
}

const DirectMessageTab: React.FC<DirectMessageTabProps> = React.memo(
  ({ messageGroup }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      name: senderName,
      contents: messageContents,
      timestamp: messageTimestamp,
    } = messageGroup;
    const timestamp = lang.getFormatTimestamp(messageTimestamp);

    return (
      <div className={styles['messageBox']}>
        <div className={styles['header']}>
          <span className={styles['name']}>{senderName}</span>
          <span className={styles['timestamp']}>{timestamp}</span>
        </div>
        {messageContents.map((content, index) => (
          <div key={index} className={styles['content']}>
            <MarkdownViewer markdownText={content} />
          </div>
        ))}
      </div>
    );
  },
);

DirectMessageTab.displayName = 'DirectMessageTab';

interface ChannelMessageTabProps {
  messageGroup: ChannelMessage & {
    contents: string[];
  };
  isGuest?: boolean;
  forbidGuestUrl?: boolean;
}

const ChannelMessageTab: React.FC<ChannelMessageTabProps> = React.memo(
  ({ messageGroup, isGuest = false, forbidGuestUrl = false }) => {
    // Hooks
    const lang = useLanguage();

    // Variables
    const {
      gender: senderGender,
      name: senderName,
      nickname: senderNickname,
      permissionLevel: messagePermission,
      contents: messageContents,
      timestamp: messageTimestamp,
    } = messageGroup;
    const timestamp = lang.getFormatTimestamp(messageTimestamp);

    return (
      <>
        <div
          className={`${styles['senderIcon']} ${permission[senderGender]} ${
            permission[`lv-${messagePermission}`]
          }`}
        />
        <div className={styles['messageBox']}>
          <div className={styles['header']}>
            <span className={styles['name']}>
              {senderNickname || senderName}
            </span>
            <span className={styles['timestamp']}>{timestamp}</span>
          </div>
          {messageContents.map((content, index) => (
            <div key={index} className={styles['content']}>
              <MarkdownViewer
                markdownText={content}
                isGuest={isGuest}
                forbidGuestUrl={forbidGuestUrl}
              />
            </div>
          ))}
        </div>
      </>
    );
  },
);

ChannelMessageTab.displayName = 'ChannelMessageTab';

interface InfoMessageTabProps {
  messageGroup: InfoMessage & {
    contents: string[];
  };
  isGuest?: boolean;
  forbidGuestUrl?: boolean;
}

const InfoMessageTab: React.FC<InfoMessageTabProps> = React.memo(
  ({ messageGroup }) => {
    const lang = useLanguage();
    const { contents: messageContents } = messageGroup;

    const getTranslatedContent = (content: string) => {
      if (content.includes(' ')) {
        const [key, ...params] = content.split(' ');
        if (Object.prototype.hasOwnProperty.call(lang.tr, key)) {
          let translatedText = lang.tr[key as keyof typeof lang.tr];
          params.forEach((param, index) => {
            translatedText = translatedText.replace(`{${index}}`, param);
          });
          return translatedText;
        }
      }
      return Object.prototype.hasOwnProperty.call(lang.tr, content)
        ? lang.tr[content as keyof typeof lang.tr]
        : content;
    };

    return (
      <>
        <div className={styles['infoIcon']} />
        <div className={styles['messageBox']}>
          {messageContents.map((content, index) => (
            <div key={index}>
              <MarkdownViewer markdownText={getTranslatedContent(content)} />
            </div>
          ))}
        </div>
      </>
    );
  },
);

InfoMessageTab.displayName = 'InfoMessageTab';

type MessageGroup = (DirectMessage | ChannelMessage | InfoMessage) & {
  contents: string[];
};

interface MessageViewerProps {
  messages: DirectMessage[] | ChannelMessage[] | InfoMessage[];
  isGuest?: boolean;
  forbidGuestUrl?: boolean;
}

const MessageViewer: React.FC<MessageViewerProps> = React.memo(
  ({ messages, isGuest = false, forbidGuestUrl = false }) => {
    // Variables
    const sortedMessages = [...messages].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    const messageGroups = sortedMessages.reduce<MessageGroup[]>(
      (acc, message) => {
        const lastGroup = acc[acc.length - 1];
        const timeDiff = lastGroup && message.timestamp - lastGroup.timestamp;
        const nearTime = lastGroup && timeDiff <= 5 * 60 * 1000;
        const sameSender = lastGroup && message.senderId === lastGroup.senderId;
        const sameType = lastGroup && message.type === lastGroup.type;
        const isInfo = message.type === 'info';

        if (sameSender && nearTime && sameType && !isInfo) {
          lastGroup.contents.push(message.content);
        } else {
          acc.push({
            ...message,
            contents: [message.content],
          });
        }
        return acc;
      },
      [],
    );

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Effects
    useLayoutEffect(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'auto',
        block: 'end',
      });
    }, [messageGroups]);

    return (
      <div className={styles['messageViewerWrapper']}>
        {messageGroups.map((messageGroup) => {
          return (
            <div key={messageGroup.id} className={styles['messageWrapper']}>
              {messageGroup.type === 'info' ? (
                <InfoMessageTab
                  messageGroup={messageGroup}
                  isGuest={isGuest}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'general' ? (
                <ChannelMessageTab
                  messageGroup={messageGroup}
                  isGuest={isGuest}
                  forbidGuestUrl={forbidGuestUrl}
                />
              ) : messageGroup.type === 'dm' ? (
                <DirectMessageTab messageGroup={messageGroup} />
              ) : null}
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

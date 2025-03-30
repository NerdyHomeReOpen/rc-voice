import React, { useState } from 'react';

// CSS
import messageInputBox from '@/styles/messageInputBox.module.css';

// Providers
import { useLanguage } from '@/providers/Language';

// Components
import emojis, { Emoji } from './emojis';

interface EmojiGridProps {
  onEmojiSelect?: (emoji: string) => void;
}

const EmojiGrid: React.FC<EmojiGridProps> = ({ onEmojiSelect }) => {
  return (
    <div className={messageInputBox['emojiGrid']}>
      {emojis.map((emoji: Emoji) => (
        <div
          key={emoji.id}
          className={messageInputBox['emoji']}
          data-id={emoji.id + 1}
          onClick={() => {
            onEmojiSelect?.(`[emoji_${emoji.id}]`);
          }}
        />
      ))}
    </div>
  );
};

EmojiGrid.displayName = 'EmojiGrid';

interface MessageInputBoxProps {
  onSendMessage?: (message: string) => void;
  // locked?: boolean;
  // isGuest?: boolean;
  // forbidGuestText?: boolean;
  // forbidGuestUrl?: boolean;
  // guestTextMaxLength?: number;
  // guestTextWaitTime?: number;
  // guestTextInterval?: number;
  // lastMessageTime?: number;
  // joinTime?: number;
  disabled?: boolean;
  warning?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const MessageInputBox: React.FC<MessageInputBoxProps> = React.memo(
  ({
    onSendMessage,
    // locked = false,
    // isGuest = false,
    // forbidGuestText = false,
    // forbidGuestUrl = false,
    // guestTextMaxLength = 2000,
    // guestTextWaitTime = 0,
    // guestTextInterval = 0,
    // lastMessageTime = 0,
    // joinTime = Date.now(),
    disabled = false,
    warning = false,
    placeholder = '',
    maxLength = 2000,
  }) => {
    // Language
    const lang = useLanguage();

    // States
    const [messageInput, setMessageInput] = useState<string>('');
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
    const [isComposing, setIsComposing] = useState<boolean>(false);
    // const [errorMessage, setErrorMessage] = useState<string>('');
    // const [hasSentMessage, setHasSentMessage] = useState<boolean>(false);
    // const [currentTime, setCurrentTime] = useState<number>(Date.now());

    // Variables
    const isDisabled = disabled;
    const isWarning = warning || messageInput.length >= maxLength;
    // const isLocked = locked;
    // const timeSinceJoin = currentTime - joinTime;
    // const timeSinceLastMessage = currentTime - lastMessageTime;
    // const isWaiting =
    //   guestTextWaitTime > 0 &&
    //   isGuest &&
    //   !hasSentMessage &&
    //   timeSinceJoin < guestTextWaitTime * 1000;
    // const isInInterval =
    //   isGuest &&
    //   hasSentMessage &&
    //   guestTextInterval > 0 &&
    //   !isWaiting &&
    //   timeSinceLastMessage < guestTextInterval * 1000;
    // const isOverLength = isGuest && messageInput.length > guestTextMaxLength;

    // useEffect(() => {
    //   setHasSentMessage(false);
    //   setMessageInput('');
    //   setErrorMessage('');
    //   setCurrentTime(Date.now());
    // }, [joinTime]);

    // useEffect(() => {
    //   if (!isGuest || (!isWaiting && !isInInterval)) return;

    //   setCurrentTime(Date.now());

    //   const interval = setInterval(() => {
    //     setCurrentTime(Date.now());
    //   }, 1000);

    //   return () => clearInterval(interval);
    // }, [isGuest, isWaiting, isInInterval]);

    // const getPlaceholder = () => {
    //   if (isLocked) return lang.tr.textChangeToForbiddenSpeech;
    //   if (isGuest && forbidGuestText) return lang.tr.forbidGuestText;
    //   if (isGuest && isWaiting) {
    //     const remainingTime = Math.max(
    //       0,
    //       Math.floor((guestTextWaitTime * 1000 - timeSinceJoin) / 1000),
    //     );
    //     return `${lang.tr.guestTextWaitTime} ${remainingTime} ${lang.tr.seconds}`;
    //   }
    //   if (isGuest && isInInterval && guestTextInterval > 0) {
    //     const remainingTime = Math.max(
    //       0,
    //       Math.floor((guestTextInterval * 1000 - timeSinceLastMessage) / 1000),
    //     );
    //     return `${lang.tr.guestTextInterval} ${remainingTime} ${lang.tr.seconds}`;
    //   }
    //   if (isGuest && isOverLength)
    //     return `${lang.tr.guestTextMaxLength} ${guestTextMaxLength} ${lang.tr.characters}`;
    //   return lang.tr.inputMessage;
    // };

    // const validateMessage = (message: string): boolean => {
    //   if (isGuest && forbidGuestText) {
    //     setErrorMessage(lang.tr.forbidGuestText);
    //     return false;
    //   }
    //   if (isGuest && isWaiting) {
    //     const remainingTime = Math.max(
    //       0,
    //       Math.floor((guestTextWaitTime * 1000 - timeSinceJoin) / 1000),
    //     );
    //     setErrorMessage(
    //       `${lang.tr.guestTextWaitTime} ${remainingTime} ${lang.tr.seconds}`,
    //     );
    //     return false;
    //   }
    //   if (isGuest && isInInterval && guestTextInterval > 0) {
    //     const remainingTime = Math.max(
    //       0,
    //       Math.floor((guestTextInterval * 1000 - timeSinceLastMessage) / 1000),
    //     );
    //     setErrorMessage(
    //       `${lang.tr.guestTextInterval} ${remainingTime} ${lang.tr.seconds}`,
    //     );
    //     return false;
    //   }
    //   if (isGuest && message.length > guestTextMaxLength) {
    //     setErrorMessage(
    //       `${lang.tr.guestTextMaxLength} ${guestTextMaxLength} ${lang.tr.characters}`,
    //     );
    //     return false;
    //   }
    //   if (isGuest && forbidGuestUrl && message.includes('http')) {
    //     setErrorMessage(lang.tr.forbidGuestUrl);
    //     return false;
    //   }
    //   return true;
    // };

    // const handleSendMessage = () => {
    //   if (validateMessage(messageInput)) {
    //     onSendMessage?.(messageInput);
    //     setMessageInput('');
    //     setErrorMessage('');
    //     setHasSentMessage(true);
    //   }
    // };

    return (
      <div
        className={`${messageInputBox['messageInputBox']} 
        ${isWarning ? messageInputBox['warning'] : ''} 
        ${isDisabled ? messageInputBox['disabled'] : ''}`}
      >
        <div
          className={messageInputBox['emojiIcon']}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          {showEmojiPicker && (
            <EmojiGrid
              onEmojiSelect={(emojiTag) =>
                setMessageInput((prev) => prev + emojiTag)
              }
            />
          )}
        </div>

        <textarea
          className={`${messageInputBox['textarea']} 
          ${isDisabled ? 'bg-transparent' : ''}`}
          rows={2}
          placeholder={placeholder}
          value={messageInput}
          onChange={(e) => {
            if (isDisabled) return;
            e.preventDefault();
            setMessageInput(e.target.value);
          }}
          onPaste={(e) => {
            if (isDisabled) return;
            e.preventDefault();
            setMessageInput((prev) => prev + e.clipboardData.getData('text'));
          }}
          onKeyDown={(e) => {
            if (
              e.shiftKey ||
              e.key !== 'Enter' ||
              !messageInput.trim() ||
              messageInput.length > maxLength ||
              isComposing ||
              isDisabled ||
              isWarning
            )
              return;
            e.preventDefault();
            onSendMessage?.(messageInput);
            setMessageInput('');
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          maxLength={maxLength}
          aria-label={lang.tr.messageInputBox}
        />
        <div className={messageInputBox['messageInputLength']}>
          {messageInput.length}/{maxLength}
        </div>
        {/* {errorMessage && (
          <div className={messageInputBox['errorMessage']}>{errorMessage}</div>
        )} */}
      </div>
    );
  },
);

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;

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
  locked?: boolean;
}

const MessageInputBox: React.FC<MessageInputBoxProps> = React.memo(
  ({ onSendMessage, locked = false }) => {
    // Language
    const lang = useLanguage();

    // Constants
    const MAXLENGTH = 2000;

    // States
    const [messageInput, setMessageInput] = useState<string>('');
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
    const [isComposing, setIsComposing] = useState<boolean>(false);

    // Variables
    const isWarning = messageInput.length >= MAXLENGTH;
    const isLocked = locked;

    return (
      <div
        className={`${messageInputBox['messageInputBox']} 
        ${isWarning ? messageInputBox['warning'] : ''} 
        ${isLocked ? messageInputBox['locked'] : ''}`}
      >
        <div
          className={messageInputBox['emojiIcon']}
          onClick={() => !isLocked && setShowEmojiPicker(!showEmojiPicker)}
        >
          {showEmojiPicker && (
            <EmojiGrid
              onEmojiSelect={(emojiTag) => {
                if (isLocked) return;
                setMessageInput((prev) => prev + emojiTag);
              }}
            />
          )}
        </div>

        <textarea
          disabled={isLocked}
          className={`${messageInputBox['textarea']} 
          ${isLocked ? 'bg-transparent' : ''}`}
          rows={2}
          placeholder={
            isLocked
              ? lang.tr.textChangeToForbiddenSpeech
              : lang.tr.inputMessage
          }
          value={messageInput}
          onChange={(e) => {
            if (isLocked) return;
            e.preventDefault();
            setMessageInput(e.target.value);
          }}
          onPaste={(e) => {
            if (isLocked) return;
            e.preventDefault();
            setMessageInput((prev) => prev + e.clipboardData.getData('text'));
          }}
          onKeyDown={(e) => {
            if (
              e.shiftKey ||
              e.key !== 'Enter' ||
              !messageInput.trim() ||
              messageInput.length > MAXLENGTH ||
              isLocked ||
              isWarning ||
              isComposing
            )
              return;
            e.preventDefault();
            onSendMessage?.(messageInput);
            setMessageInput('');
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          maxLength={MAXLENGTH}
          aria-label={lang.tr.messageInputBox}
        />
        <div className={messageInputBox['messageInputLength']}>
          {messageInput.length}/{MAXLENGTH}
        </div>
      </div>
    );
  },
);

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;

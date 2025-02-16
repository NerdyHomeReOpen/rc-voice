/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';

// Components
import EmojiGrid from './EmojiGrid';

interface MessageInputBoxProps {
  onSendMessage?: (message: string) => void;
}

const MessageInputBox: React.FC<MessageInputBoxProps> = React.memo(
  ({ onSendMessage }) => {
    // Input Control
    const [messageInput, setMessageInput] = useState<string>('');
    const MAXLENGTH = 2000;

    // Emoji Picker Control
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

    return (
      <div
        className={`flex flex-1 flex-row justify-flex-start p-1 border rounded-lg ${
          messageInput.length >= MAXLENGTH ? 'border-red-500' : ''
        }`}
      >
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="w-7 h-7 p-1 hover:bg-gray-100 rounded transition-colors z-10"
        >
          <img src="/channel/FaceButton_5_18x18.png" alt="Emoji" />
          {showEmojiPicker && (
            <EmojiGrid
              onEmojiSelect={(emojiTag) => {
                const content = messageInput + emojiTag;
                if (content.length > MAXLENGTH) return;
                setMessageInput(content);
                setShowEmojiPicker(false);
                const input = document.querySelector('textarea');
                if (input) input.focus();
              }}
            />
          )}
        </button>
        <textarea
          className="w-full p-1 resize-none focus:outline-none 
                [&::-webkit-scrollbar]:w-2 
                [&::-webkit-scrollbar]:h-2 
                [&::-webkit-scrollbar-thumb]:bg-gray-300 
                [&::-webkit-scrollbar-thumb]:rounded-lg 
                [&::-webkit-scrollbar-thumb]:hover:bg-gray-400"
          rows={2}
          placeholder={'輸入訊息...'}
          value={messageInput}
          onChange={(e) => {
            const input = e.target.value;
            setMessageInput(input);
          }}
          onKeyDown={(e) => {
            if (e.key != 'Enter' || e.shiftKey) return;
            if (messageInput.trim() && messageInput.length <= MAXLENGTH) {
              e.preventDefault();
              onSendMessage?.(messageInput);
              setMessageInput('');
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text');
            setMessageInput((prev) => prev + text);
          }}
          maxLength={MAXLENGTH}
          aria-label="訊息輸入框"
        />
        <div className="text-xs text-gray-400 self-end ml-2">
          {messageInput.length}/{MAXLENGTH}
        </div>
      </div>
    );
  },
);

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;

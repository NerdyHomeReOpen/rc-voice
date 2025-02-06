import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2,
  Volume1,
  Volume,
  VolumeX,
  Mic,
  MicOff,
  Settings,
  ArrowBigDown,
  BellOff,
  BellRing,
} from 'lucide-react';

// Components
import EmojiGrid from '@/components/EmojiGrid';
import MarkdownViewer from '@/components/MarkdownViewer';
import MessageViewer from '@/components/MessageViewer';
import ChannelViewer from '@/components/ChannelViewer';

// Types
import type { User, Server, Channel, Message, UserList } from '@/types';

interface ServerPageProps {
  user: User;
  server: Server;
  channels: Channel[];
  messages: Message[];
  users: UserList;
  onAddChannel: (serverId: string, channel: Channel) => void;
  onEditChannel: (
    serverId: string,
    channelId: string,
    channel: Channel,
  ) => void;
  onDeleteChannel: (serverId: string, channelId: string) => void;
  onJoinChannel: (serverId: string, userId: string, channelId: string) => void;
  onSendMessage: (
    serverId: string,
    channelId: string,
    message: Message,
  ) => void;
  onOpenServerSetting: () => void;
  onOpenUserSetting: () => void;
}

const getStoredBoolean = (key: string, defaultValue: boolean): boolean => {
  const stored = localStorage.getItem(key);
  if (stored === null) return defaultValue;
  return stored === 'true';
};

const ServerPage: React.FC<ServerPageProps> = ({
  user,
  server,
  channels,
  messages,
  users,
  onAddChannel,
  onEditChannel,
  onDeleteChannel,
  onJoinChannel,
  onSendMessage,
  onOpenServerSetting,
  onOpenUserSetting,
}) => {
  // Volume Control
  const [volume, setVolume] = useState<number>(100);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCloseVolumeSlider = (event: MouseEvent) => {
      if (
        volumeRef.current &&
        !volumeRef.current.contains(event.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleCloseVolumeSlider);
    return () =>
      document.removeEventListener('mousedown', handleCloseVolumeSlider);
  }, []);

  // Sidebar Control
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const maxWidth = window.innerWidth * 0.3;
        const newWidth = Math.max(
          220,
          Math.min(mouseMoveEvent.clientX, maxWidth),
        );
        setSidebarWidth(newWidth);
      }
    },
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // Input Control
  const [messageInput, setMessageInput] = useState<string>('');
  const maxContentLength = 2000;

  // Notification Control
  const [notification, setNotification] = useState<boolean>(() =>
    getStoredBoolean('notification', true),
  );

  // Mic Control
  const [isMicOn, setIsMicOn] = useState<boolean>(() =>
    getStoredBoolean('mic', false),
  );

  // Emoji Picker Control
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('notification', notification.toString());
  }, [notification]);

  useEffect(() => {
    localStorage.setItem('mic', isMicOn.toString());
  }, [isMicOn]);

  const toggleNotification = useCallback(() => {
    setNotification((prev) => !prev);
  }, []);

  const toggleMic = useCallback(() => {
    setIsMicOn((prev) => !prev);
  }, []);

  return (
    <>
      {/* Left Sidebar */}
      <div
        className="flex flex-col min-h-0 min-w-0 w-64 bg-white border-r text-sm"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Profile image and info */}
        <div className="flex items-center justify-between p-2 border-b mb-4">
          <div className="flex items-center space-x-3">
            <img
              src={server?.icon ?? '/im/IMLogo.png'}
              alt="User Profile"
              className="w-14 h-14 shadow border-2 border-[#A2A2A2] select-none"
            />
            <div>
              <div className="text-gray-700">{server?.name ?? ''} </div>
              <div className="flex flex-row items-center gap-1">
                <img
                  src="/channel/ID.png"
                  alt="User Profile"
                  className="w-3.5 h-3.5 select-none"
                />
                <div className="text-xs text-gray-500">{server?.id ?? ''}</div>
                <img
                  src="/channel/member.png"
                  alt="User Profile"
                  className="w-3.5 h-3.5 select-none"
                />
                <div className="text-xs text-gray-500 select-none">
                  {Object.keys(users).length ?? ''}
                </div>

                {server.permissions?.[user.id] >= 5 && (
                  <button
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={onOpenServerSetting}
                  >
                    <Settings size={16} className="text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Channel List */}
        {channels && (
          <ChannelViewer
            user={user}
            server={server}
            channels={channels}
            users={users}
            onAddChannel={onAddChannel}
            onEditChannel={onEditChannel}
            onDeleteChannel={onDeleteChannel}
            onJoinChannel={onJoinChannel}
          />
        )}
      </div>
      {/* Resize Handle */}
      <div
        className="w-0.5 cursor-col-resize bg-gray-200 transition-colors"
        onMouseDown={startResizing}
      />
      {/* Right Content */}
      <div className="flex flex-1 flex-col min-h-0 min-w-0">
        {/* Announcement Area */}
        {server.announcement && (
          <div className="flex flex-[2] overflow-y-auto border-b bg-gray-50 p-3 mb-1">
            <MarkdownViewer markdownText={server.announcement} />
          </div>
        )}
        {/* Messages Area */}
        <div className="flex flex-[5] flex-col overflow-y-auto p-3 min-w-0 max-w-full">
          {messages && (
            <MessageViewer
              messages={messages}
              users={users}
              server={server}
              user={user}
              notification={notification}
            />
          )}
        </div>
        {/* Input Area */}
        <div className="flex flex-[1] p-3">
          <div className="flex flex-1 flex-row justify-flex-start p-1 border rounded-lg">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-7 h-7 p-1 hover:bg-gray-100 rounded transition-colors z-10"
            >
              <img src="/channel/FaceButton_5_18x18.png" alt="Emoji" />
              <EmojiGrid
                isOpen={showEmojiPicker}
                onEmojiSelect={(emojiTag) => {
                  const content = messageInput + emojiTag;
                  if (content.length > maxContentLength) return;
                  setMessageInput(content);
                  setShowEmojiPicker(false);
                  const input = document.querySelector('textarea');
                  if (input) input.focus();
                }}
              />
            </button>
            <textarea
              className={`w-full p-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500
                
                ${
                  messageInput.length >= maxContentLength
                    ? 'border-red-500'
                    : ''
                }`}
              rows={2}
              // placeholder={isConnected ? "輸入訊息..." : "連接中..."}
              value={messageInput}
              onChange={(e) => {
                const input = e.target.value;
                if (input.length > maxContentLength) return;
                setMessageInput(input);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!messageInput.trim() || !user.currentChannelId) return;
                  onSendMessage(server.id, user.currentChannelId, {
                    id: '',
                    senderId: user.id,
                    content: messageInput,
                    timestamp: 0,
                    type: 'general',
                  });
                  setMessageInput('');
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData('text');
                if (text.length + messageInput.length > maxContentLength)
                  return;
                setMessageInput((prev) => prev + text);
              }}
              maxLength={maxContentLength}
              // disabled={!isConnected}
              aria-label="訊息輸入框"
            />{' '}
            <div className="text-xs text-gray-400 self-end ml-2">
              {messageInput.length}/{maxContentLength}
            </div>
          </div>
        </div>
        {/* Bottom Controls */}
        <div className="flex-none bg-background border-t text-sm border-foreground/10 bg-linear-to-b from-violet-500 to-fuchsia-500">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1 p-5">
              <span>自由發言</span>
              <button className="p-1 hover:bg-gray-100 rounded">
                <ArrowBigDown size={16} className="text-foreground" />
              </button>
            </div>
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`outline outline-2 outline-gray-300 rounded flex items-center justify-between p-2 hover:bg-foreground/10 transition-colors w-32`}
            >
              <img
                src={
                  isMicOn
                    ? '/channel/icon_speaking_vol_5_24x30.png'
                    : '/channel/icon_mic_state_1_24x30.png'
                }
                alt="Mic"
              />
              <span
                className={`text-lg font-bold ${
                  isMicOn ? 'text-[#B9CEB7]' : 'text-[#6CB0DF]'
                }`}
              >
                {isMicOn ? '已拿麥' : '拿麥發言'}
              </span>
            </button>
            <div className="flex items-center space-x-2 p-5">
              <button
                onClick={toggleNotification}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {notification ? (
                  <BellRing size={16} className="text-foreground" />
                ) : (
                  <BellOff size={16} className="text-foreground" />
                )}
              </button>{' '}
              <div className="relative" ref={volumeRef}>
                <button
                  className="p-1 hover:bg-gray-100 rounded"
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                >
                  {volume === 0 && (
                    <VolumeX size={16} className="text-foreground" />
                  )}
                  {volume > 0 && volume <= 33 && (
                    <Volume size={16} className="text-foreground" />
                  )}
                  {volume > 33 && volume <= 66 && (
                    <Volume1 size={16} className="text-foreground" />
                  )}
                  {volume > 66 && (
                    <Volume2 size={16} className="text-foreground" />
                  )}
                </button>
                {showVolumeSlider && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg p-2 w-[40px]">
                    <div className="h-32 flex items-center justify-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(parseInt(e.target.value))}
                        className="h-24 -rotate-90 transform origin-center
        appearance-none bg-transparent cursor-pointer
        [&::-webkit-slider-runnable-track]:rounded-full
        [&::-webkit-slider-runnable-track]:bg-gray-200
        [&::-webkit-slider-runnable-track]:h-3
        [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:h-3
        [&::-webkit-slider-thumb]:w-3
        [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:bg-blue-600
        [&::-webkit-slider-thumb]:border-0
        [&::-webkit-slider-thumb]:transition-all
        [&::-webkit-slider-thumb]:hover:bg-blue-700"
                      />
                    </div>
                    <div className="text-center text-xs text-gray-500">
                      {volume}%
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={toggleMic}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {isMicOn ? (
                  <Mic size={16} className="text-foreground" />
                ) : (
                  <MicOff size={16} className="text-foreground" />
                )}
              </button>
              <button
                onClick={onOpenUserSetting}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Settings size={16} className="text-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

ServerPage.displayName = 'ServerPage';

export default ServerPage;

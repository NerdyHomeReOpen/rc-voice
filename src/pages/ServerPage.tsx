/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
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

// Modals
import ServerSettingModal from '@/modals/ServerSettingModal';
import UserSettingModal from '@/modals/UserSettingModal';

// Types
import type { User, Server, Message } from '@/types';

// Socket
import { useSocket } from '@/hooks/SocketProvider';

// Services
import { API_URL } from '@/services/api.service';
import MessageInputBox from '@/components/MessageInputBox';

const getStoredBoolean = (key: string, defaultValue: boolean): boolean => {
  const stored = localStorage.getItem(key);
  if (stored === null) return defaultValue;
  return stored === 'true';
};

const ServerPage: React.FC = () => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const server = useSelector((state: { server: Server }) => state.server);
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );

  // Socket
  const socket = useSocket();

  const handleSendMessage = (message: Message): void => {
    socket?.emit('sendMessage', { sessionId, message });
  };

  // Volume Control
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(100);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  const handleCloseVolumeSlider = (event: MouseEvent) => {
    if (volumeSliderRef.current?.contains(event.target as Node))
      toggleVolumeSlider(false);
  };

  const toggleVolumeSlider = (state?: boolean) =>
    setShowVolumeSlider(state ?? !showVolumeSlider);

  useEffect(() => {
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

  // Notification Control
  const [notification, setNotification] = useState<boolean>(() =>
    getStoredBoolean('notification', true),
  );

  const toggleNotification = (state?: boolean) =>
    setNotification(state ?? !notification);

  useEffect(() => {
    localStorage.setItem('notification', notification.toString());
  }, [notification]);

  // Mic Control
  const [isMicOn, setIsMicOn] = useState<boolean>(() =>
    getStoredBoolean('mic', false),
  );

  const toggleMic = (state?: boolean) => setIsMicOn(state ?? !isMicOn);

  useEffect(() => {
    localStorage.setItem('mic', isMicOn.toString());
  }, [isMicOn]);

  // User Setting Control
  const [showUserSetting, setShowUserSetting] = useState<boolean>(false);

  const toggleUserSetting = (state?: boolean) =>
    setShowUserSetting(state ?? !showUserSetting);

  // Server Setting Control
  const [showServerSetting, setShowServerSetting] = useState<boolean>(false);

  const toggleServerSetting = (state?: boolean) =>
    setShowServerSetting(state ?? !showServerSetting);

  const userPermission = server.members?.[user.id].permissionLevel ?? 1;
  const userCurrentChannelId = user.presence?.currentChannelId ?? '';
  const userCurrentChannel = server.channels?.find(
    (channel) => channel.id === userCurrentChannelId,
  );
  const serverChannels = server.channels ?? [];
  const serverIcon = server.iconUrl
    ? API_URL + server.iconUrl
    : '/logo_server_def.png';
  const serverName = server.name ?? '';
  const serverDisplayId = server.displayId ?? '';
  const serverAnnouncement = server.announcement ?? '';
  const messages = userCurrentChannel?.messages ?? [];

  return (
    <>
      {showUserSetting && (
        <UserSettingModal onClose={() => toggleUserSetting(false)} />
      )}
      {showServerSetting && (
        <ServerSettingModal onClose={() => toggleServerSetting(false)} />
      )}
      {/* Left Sidebar */}
      <div
        className="flex flex-col min-h-0 min-w-0 w-64 bg-white border-r text-sm"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Server image and info */}
        <div className="flex items-center justify-between p-2 border-b mb-4">
          <div className="flex items-center space-x-3">
            <img src={serverIcon} alt="Server Icon" className="w-14 h-14" />
            <div>
              <div className="text-gray-700">{serverName} </div>
              <div className="flex flex-row items-center gap-1">
                <img
                  src="/channel/ID.png"
                  alt="User Profile"
                  className="w-3.5 h-3.5 select-none"
                />
                <div className="text-xs text-gray-500">{serverDisplayId}</div>
                <img
                  src="/channel/member.png"
                  alt="User Profile"
                  className="w-3.5 h-3.5 select-none"
                />
                <div className="text-xs text-gray-500 select-none">
                  {serverChannels.reduce((acc, channel) => {
                    return acc + channel.userIds.length;
                  }, 0)}
                </div>

                {userPermission >= 5 && (
                  <button
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    onClick={() => toggleServerSetting()}
                  >
                    <Settings size={16} className="text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Channel List */}
        <ChannelViewer channels={serverChannels} />
      </div>
      {/* Resize Handle */}
      <div
        className="w-0.5 cursor-col-resize bg-gray-200 transition-colors"
        onMouseDown={startResizing}
      />
      {/* Right Content */}
      <div className="flex flex-1 flex-col min-h-0 min-w-0">
        {/* Announcement Area */}
        <div className="flex flex-[2] overflow-y-auto border-b bg-gray-50 p-3 mb-1">
          <MarkdownViewer markdownText={serverAnnouncement} />
        </div>
        {/* Messages Area */}
        <div className="flex flex-[5] p-3">
          <MessageViewer messages={messages} />
        </div>
        {/* Input Area */}
        <div className="flex flex-[1] p-3">
          <MessageInputBox
            onSendMessage={(msg) => {
              handleSendMessage({
                id: '',
                type: 'general',
                content: msg,
                senderId: user.id,
                timestamp: 0,
              });
            }}
          />
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
              onClick={() => toggleMic()}
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
                onClick={() => toggleNotification()}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {notification ? (
                  <BellRing size={16} className="text-foreground" />
                ) : (
                  <BellOff size={16} className="text-foreground" />
                )}
              </button>
              <div className="relative" ref={volumeSliderRef}>
                <button
                  className="p-1 hover:bg-gray-100 rounded"
                  onClick={() => toggleVolumeSlider()}
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
                onClick={() => toggleMic()}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {isMicOn ? (
                  <Mic size={16} className="text-foreground" />
                ) : (
                  <MicOff size={16} className="text-foreground" />
                )}
              </button>
              <button
                onClick={() => toggleUserSetting()}
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

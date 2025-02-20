/* eslint-disable @typescript-eslint/no-unused-vars */
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';

// CSS
import styles from '@/styles/serverPage.module.css';

// Components
import MarkdownViewer from '@/components/viewers/MarkdownViewer';
import MessageViewer from '@/components/viewers/MessageViewer';
import ChannelViewer from '@/components/viewers/ChannelViewer';

// Modals
import ServerSettingModal from '@/components/modals/ServerSettingModal';
import UserSettingModal from '@/components/modals/UserSettingModal';

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

const ServerPageComponent: React.FC = () => {
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
      setShowVolumeSlider(false);
  };

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

  useEffect(() => {
    localStorage.setItem('notification', notification.toString());
  }, [notification]);

  // Mic Control
  const [isMicOn, setIsMicOn] = useState<boolean>(() =>
    getStoredBoolean('mic', false),
  );

  useEffect(() => {
    localStorage.setItem('mic', isMicOn.toString());
  }, [isMicOn]);

  // User Setting Control
  const [showUserSetting, setShowUserSetting] = useState<boolean>(false);

  // Server Setting Control
  const [showServerSetting, setShowServerSetting] = useState<boolean>(false);

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
    <div className={styles['serverWrapper']}>
      <div className={styles['serverContent']}>
        {showUserSetting && (
          <UserSettingModal onClose={() => setShowUserSetting(false)} />
        )}
        {showServerSetting && (
          <ServerSettingModal onClose={() => setShowServerSetting(false)} />
        )}
        {/* Left Sidebar */}
        <div
          className={styles['sidebar']}
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Server image and info */}
          <div className={styles['sidebarHeader']}>
            <div className={styles['avatarPicture']} />

            <div className={styles['baseInfoBox']}>
              <div className={styles['container']}>
                <div className={styles['name']}>{serverName} </div>
              </div>
              <div className={styles['container']}>
                <div className={styles['idIcon']} />
                <div className={styles['idText']}>{serverDisplayId}</div>
                <div className={styles['memberIcon']} />
                <div className={styles['memberText']}>
                  {serverChannels.reduce((acc, channel) => {
                    return acc + channel.userIds.length;
                  }, 0)}
                </div>
              </div>
            </div>
            <div className={styles['optionBox']}>
              <div className={styles['invitation']} />
              <div className={styles['saperator']} />
              <div
                className={styles['setting']}
                onClick={() => setShowServerSetting(true)}
              />
            </div>
          </div>
          {/* Channel List */}
          <ChannelViewer channels={serverChannels} />
        </div>
        {/* Resize Handle */}
        <div className="resizeHandle" onMouseDown={startResizing} />
        {/* Right Content */}
        <div className={styles['mainContent']}>
          {/* Announcement Area */}
          <div className={styles['announcementArea']}>
            <MarkdownViewer markdownText={serverAnnouncement} />
          </div>
          {/* Messages Area */}
          <div className={styles['messageArea']}>
            <MessageViewer messages={messages} server={server} />
          </div>
          {/* Input Area */}
          <div className={styles['inputArea']}>
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
          <div className={styles['buttonArea']}>
            <div className={styles['buttons']}>
              <div className={styles['voiceModeButton']}>自由發言</div>
            </div>
            <div
              className={`${styles['micButton']} ${
                isMicOn ? styles['active'] : ''
              }`}
              onClick={() => setIsMicOn(!isMicOn)}
            >
              <div className={styles['micIcon']} />
              <div className={styles['micText']}>
                {isMicOn ? '已拿麥' : '拿麥發言'}
              </div>
            </div>
            <div className={styles['buttons']}>
              <div className={styles['bkgModeButton']}>混音</div>
              <div className={styles['saperator']} />
              <div
                className={`${styles['micModeButton']} ${
                  isMicOn ? styles['active'] : ''
                }`}
                onClick={() => setIsMicOn(!isMicOn)}
              />
              <div className={styles['speakerButton']} />
              <div className={styles['recordModeButton']} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ServerPageComponent.displayName = 'ServerPageComponent';

// use dynamic import to disable SSR
const ServerPage = dynamic(() => Promise.resolve(ServerPageComponent), {
  ssr: false,
});

export default ServerPage;

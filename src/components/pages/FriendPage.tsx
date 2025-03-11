/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/display-name */
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

// CSS
import friendPage from '@/styles/friendPage.module.css';
import grade from '@/styles/common/grade.module.css';

// Components
import FriendListViewer from '@/components/viewers/FriendListViewer';
import BadgeViewer from '@/components/viewers/BadgeViewer';

// Types
import type { User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';

const FriendPageComponent: React.FC = React.memo(() => {
  // Redux
  const user = useSelector((state: { user: User | null }) => state.user);

  // Socket
  const socket = useSocket();

  const handleChangeSignature = (signature: User['signature']) => {
    const editedUser = { signature };
    socket?.send.updateUser({ user: editedUser });
  };

  // Variables
  const MAXLENGTH = 300;
  const userLevel = user?.level ?? 1;
  const userGrade = Math.min(56, Math.ceil(userLevel / 5)); // 56 is max level
  const userAvatarUrl = user?.avatarUrl ?? null;
  const userBadges = user?.badges ?? [];
  const userSignature = user?.signature ?? '';
  const userFriends = user?.friends ?? [];
  const userFriendGroups = user?.friendGroups ?? [];

  // Input Control
  const [signatureInput, setSignatureInput] = useState<string>(userSignature);
  const [isComposing, setIsComposing] = useState<boolean>(false);

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
          250,
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

  useEffect(() => {
    socket?.send.refreshUser(null);
  }, []);

  return (
    <div className={friendPage['friendWrapper']}>
      {/* Header */}
      <div className={friendPage['friendHeader']}>
        <div
          className={friendPage['avatarPicture']}
          style={
            userAvatarUrl ? { backgroundImage: `url(${userAvatarUrl})` } : {}
          }
        />
        <div className={friendPage['baseInfoBox']}>
          <div className={friendPage['container']}>
            <div className={friendPage['levelIcon']} />
            <div
              className={`
                ${friendPage['userGrade']} 
                ${grade[`lv-${userGrade}`]}
              `}
            />
            <div className={friendPage['wealthIcon']} />
            <label className={friendPage['wealthValue']}>0</label>
            <div className={friendPage['vipIcon']} />
          </div>
          <div className={friendPage['container']}>
            <BadgeViewer badges={userBadges} />
          </div>
        </div>
        <div className={friendPage['signatureBox']}>
          <textarea
            className={friendPage['signatureInput']}
            value={signatureInput}
            placeholder="點擊更改簽名"
            data-placeholder="30018"
            onChange={(e) => {
              if (signatureInput.length > MAXLENGTH) return;
              const input = e.target.value;
              setSignatureInput(input);
            }}
            onKeyDown={(e) => {
              if (e.shiftKey) return;
              if (e.key !== 'Enter') return;
              if (isComposing) return;
              e.currentTarget.blur();
            }}
            onBlur={(e) => {
              if (signatureInput == userSignature) return;
              if (signatureInput.length > MAXLENGTH) return;
              handleChangeSignature(signatureInput);
            }}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
          />
        </div>
      </div>
      {/* Content */}
      <div className={friendPage['friendContent']}>
        {/* Left Sidebar */}
        <div
          className={friendPage['sidebar']}
          style={{ width: `${sidebarWidth}px` }}
        >
          <FriendListViewer
            friends={userFriends}
            friendGroups={userFriendGroups}
          />
        </div>
        {/* Resize Handle */}
        <div className="resizeHandle" onMouseDown={startResizing} />
        {/* Right Content */}
        <div className={friendPage['mainContent']}>
          <div className={friendPage['header']}>{'好友動態'}</div>
        </div>
      </div>
    </div>
  );
});

FriendPageComponent.displayName = 'FriendPageComponent';

// use dynamic import to disable SSR
const FriendPage = dynamic(() => Promise.resolve(FriendPageComponent), {
  ssr: false,
});

export default FriendPage;

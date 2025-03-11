/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/display-name */
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

// CSS
import styles from '@/styles/friendPage.module.css';
import grade from '@/styles/common/grade.module.css';

// Components
import FriendListViewer from '@/components/viewers/FriendListViewer';
import BadgeViewer from '@/components/viewers/BadgeViewer';

// Types
import type { User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = React.memo(({ user }) => {
  // Socket
  const socket = useSocket();

  const handleChangeSignature = (signature: string) => {
    socket?.send.updateUser({ user: { signature } });
  };

  // Input Control
  const [signatureInput, setSignatureInput] = useState<string>(
    user.signature ?? '',
  );
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const MAXLENGTH = 300;

  const userLevel = Math.min(56, Math.ceil(user.level / 5)); // 56 is max level
  const userAvatarUrl = user.avatarUrl;
  const userBadges = user.badges ?? [];
  const userSignature = user.signature ?? '';

  return (
    <div className={styles['friendHeader']}>
      <div
        className={styles['avatarPicture']}
        style={
          userAvatarUrl ? { backgroundImage: `url(${userAvatarUrl})` } : {}
        }
      />

      <div className={styles['baseInfoBox']}>
        <div className={styles['container']}>
          <div className={styles['levelIcon']} />
          <div
            className={`${styles['userGrade']} ${grade[`lv-${userLevel}`]}`}
          />
          <div className={styles['wealthIcon']} />
          <label className={styles['wealthValue']}>0</label>
          <div className={styles['vipIcon']} />
        </div>
        <div className={styles['container']}>
          <BadgeViewer badges={userBadges} />
        </div>
      </div>

      <div className={styles['signatureBox']}>
        <textarea
          className={styles['signatureInput']}
          value={signatureInput}
          placeholder="點擊更改簽名"
          data-placeholder="30018"
          onChange={(e) => {
            if (signatureInput.length > MAXLENGTH) return;
            e.preventDefault();
            const input = e.target.value;
            setSignatureInput(input);
          }}
          onKeyDown={(e) => {
            if (e.shiftKey) return;
            if (e.key !== 'Enter') return;
            e.currentTarget.blur();
            if (signatureInput == user.signature) return;
            if (signatureInput.length > MAXLENGTH) return;
            if (isComposing) return;
            e.preventDefault();
            handleChangeSignature(signatureInput);
          }}
          onBlur={(e) => {
            if (signatureInput == user.signature) return;
            if (signatureInput.length > MAXLENGTH) return;
            e.preventDefault();
            handleChangeSignature(signatureInput);
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
        />
      </div>
    </div>
  );
});

const FriendPageComponent: React.FC = React.memo(() => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);

  // Socket
  const socket = useSocket();

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

  const userFriends = user.friends ?? [];
  const userFriendGroups = user.friendGroups ?? [];

  useEffect(() => {
    if (!socket) return;
    socket?.send.refreshUser(null);
  }, [socket]);

  return (
    <div className={styles['friendWrapper']}>
      <Header user={user} />
      <main className={styles['friendContent']}>
        {/* Left Sidebar */}
        <aside
          className={styles['sidebar']}
          style={{ width: `${sidebarWidth}px` }}
        >
          <FriendListViewer
            friends={userFriends}
            friendGroups={userFriendGroups}
          />
        </aside>

        {/* Resize Handle */}
        <div className="resizeHandle" onMouseDown={startResizing} />

        {/* Main Content Area */}
        <section className={styles['mainContent']}>
          <div className={styles['header']}>好友動態</div>
        </section>
      </main>
    </div>
  );
});

FriendPageComponent.displayName = 'FriendPageComponent';

// use dynamic import to disable SSR
const FriendPage = dynamic(() => Promise.resolve(FriendPageComponent), {
  ssr: false,
});

export default FriendPage;

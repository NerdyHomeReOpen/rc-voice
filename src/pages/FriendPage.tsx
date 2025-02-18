/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';

// CSS
import styles from '@/styles/friendPage.module.css';
import grade from '@/styles/common/grade.module.css';

// Components
import FriendListViewer from '@/components/FriendListViewer';
import BadgeViewer from '@/components/BadgeViewer';

// Types
import type { User, FriendCategory } from '@/types';

// Redux
import { useSelector } from 'react-redux';

// Services
import { apiService } from '@/services/api.service';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = React.memo(({ user }) => {
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
          value={userSignature}
          placeholder="點擊更改簽名"
          data-placeholder="30018"
          onChange={() => {}} // TODO: Implement signature change
        />
      </div>
    </div>
  );
});

const FriendPageComponent: React.FC = React.memo(() => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );

  // API
  const [friendCategories, setFriendCategories] = useState<FriendCategory[]>(
    [],
  );

  useEffect(() => {
    if (!sessionId) return;

    const fetchFriendDatas = async () => {
      try {
        const data = await apiService.post('/user/friends', { sessionId });
        console.log('Friend data fetch:', data);
        setFriendCategories(data?.friendCategories ?? []);
      } catch (error: Error | any) {
        console.error(error);
      }
    };
    fetchFriendDatas();
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

  return (
    <div className={styles['friendWrapper']}>
      <Header user={user} />
      <main className={styles['friendMain']}>
        {/* Left Sidebar */}
        <aside
          className={styles['sidebar']}
          style={{ width: `${sidebarWidth}px` }}
        >
          <FriendListViewer friendCategories={friendCategories} />
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

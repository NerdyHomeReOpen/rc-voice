/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback } from 'react';

// Components
import FriendListViewer from '@/components/FriendListViewer';
import BadgeViewer from '@/components/BadgeViewer';

// Types
import type { User, FriendCategory } from '@/types';

// Redux
import { useSelector } from 'react-redux';

// Services
import { apiService } from '@/services/api.service';

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

  const userLevel = Math.min(56, Math.ceil(user.level / 5)); // 56 is max level
  const userBadges = user.badges ?? [];
  const userName = user.name;
  const userSignature = user.signature ?? '';
  const userAvatarUrl = user.avatarUrl ?? '/pfp/default.png';
  const userGradeUrl = `/UserGrade_${userLevel}.png`;

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between space-x-16 p-2 pr-[40%]">
          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <div className="w-14 h-14 bg-gray-200">
              <img src={userAvatarUrl} className="select-none" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <img src="/im/LV.png" className="select-none" />
                <img src={userGradeUrl} className="select-none" />
              </div>
              <div className="flex items-center space-x-1 mt-2 gap-1">
                {userBadges.length > 0 && <BadgeViewer badges={userBadges} />}
              </div>
            </div>
          </div>

          {/* User Status */}
          <div className="flex-1 text-center">點擊更改簽名</div>
        </div>
      </header>
      <main className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <div
          className="flex flex-col min-h-0 min-w-0 w-64 bg-white border-r text-sm"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Friend List */}
          <FriendListViewer friendCategories={friendCategories} />
        </div>
        {/* Resize Handle */}
        <div
          className="w-0.5 cursor-col-resize bg-gray-200 transition-colors"
          onMouseDown={startResizing}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 flex justify-center items-start"></div>
          <div className="p-2 text-center">
            <button className="text-blue-500 hover:underline">
              {'查看更多 >'}
            </button>
          </div>
        </div>
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

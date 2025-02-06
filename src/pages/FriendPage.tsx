import React, { useState, useEffect, useCallback } from 'react';
import { Users, History, Search, UserPlus, FolderPlus } from 'lucide-react';

// Components
import FriendListViewer from '@/components/FriendListViewer';

// Types
import { User } from '../types';

interface FriendPageProps {
  user: User;
}

const FriendPage = ({ user }: FriendPageProps) => {
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

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between space-x-16 p-2 pr-[40%]">
          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <div className="w-14 h-14 bg-gray-200"></div>
            <div>
              <div className="flex items-center space-x-1">
                <img src="/im/LV.png" alt="LV" />
                <img
                  src={`/usergrade_${userLevel}.png`}
                  alt={`/usergrade_${userLevel}`}
                  className="select-none"
                />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-lg font-bold">{user.name}</span>
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
          {/* Navigation Tabs */}
          <div className="flex border-b">
            <button className="flex-1 p-2 hover:bg-gray-100">
              <Users className="w-5 h-5 mx-auto text-gray-600" />
            </button>
            <button className="flex-1 p-2 hover:bg-gray-100">
              <History className="w-5 h-5 mx-auto text-gray-600" />
            </button>
          </div>
          {/* Search Bar */}
          <div className="w-full pl-8 pr-3 py-1 border-b relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋好友"
              className="w-full rounded focus:outline-none"
            />
          </div>
          {/* Friend List */}
          <FriendListViewer user={user} />
          {/* Bottom Buttons */}
          <div className="flex border-t">
            <button className="flex-1 p-2 text-blue-500 hover:bg-gray-100 flex items-center justify-center">
              <FolderPlus className="w-4 h-4 mr-1" />
              添加分组
            </button>
            <button className="flex-1 p-2 text-blue-500 hover:bg-gray-100 flex items-center justify-center">
              <UserPlus className="w-4 h-4 mr-1" />
              添加好友
            </button>
          </div>
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
              查看更多 ›
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FriendPage;

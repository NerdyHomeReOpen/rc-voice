import React, { useState } from 'react';
import { useSelector } from 'react-redux';

// Types
import { User, Presence } from '@/types';

// Components
import UserSettingModal from '@/modals/UserSettingModal';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

const STATE_ICON = {
  online: '/online.png',
  dnd: '/dnd.png',
  idle: '/idle.png',
  gn: '/gn.png',
};

interface UserStatusDisplayProps {
  user: User | null;
}

const UserStatusDisplay: React.FC<UserStatusDisplayProps> = ({ user }) => {
  // Redux
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );

  // Socket
  const socket = useSocket();

  // User Setting Control
  const [showUserSetting, setShowUserSetting] = useState<boolean>(false);

  const handleUpdateStatus = (status: Presence['status']) => {
    socket?.emit('updatePresence', { sessionId, presence: { status } });
  };

  const userName = user?.name ?? 'RiceCall';
  const userPresenceStatus = user?.presence?.status ?? 'online';

  if (user)
    return (
      <div className="flex items-center space-x-2 min-w-max m-2">
        {showUserSetting && (
          <UserSettingModal onClose={() => setShowUserSetting(false)} />
        )}
        <button
          onClick={() => setShowUserSetting(true)}
          className="p-1 hover:bg-blue-700 rounded"
        >
          <img
            src="/rc_logo_small.png"
            alt="RiceCall"
            className="w-6 h-6 select-none"
          />
        </button>
        <span className="text-xs font-bold select-none">{userName}</span>
        <div className="flex items-center">
          <img
            src={STATE_ICON[userPresenceStatus]}
            alt="User State"
            className="w-5 h-5 p-1 select-none"
          />
          <select
            value={userPresenceStatus}
            onChange={(e) => {
              handleUpdateStatus(e.target.value as Presence['status']);
            }}
            className="bg-transparent text-white text-xs appearance-none hover:bg-blue-700 p-1 rounded cursor-pointer focus:outline-none select-none"
          >
            <option value="online" className="bg-blue-600">
              線上
            </option>
            <option value="dnd" className="bg-blue-600">
              勿擾
            </option>
            <option value="idle" className="bg-blue-600">
              暫離
            </option>
            <option value="gn" className="bg-blue-600">
              離線
            </option>
          </select>
        </div>
      </div>
    );
  else
    return (
      <div className="flex items-center space-x-2 min-w-max m-2">
        <div className="p-1">
          <img
            src="/rc_logo_small.png"
            alt="RiceCall"
            className="w-6 h-6 select-none"
          />
        </div>
        <span className="text-xs font-bold select-none">RiceCall</span>
      </div>
    );
};

UserStatusDisplay.displayName = 'UserStatusDisplay';

export default UserStatusDisplay;

/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

// CSS
import styles from '@/styles/home.module.css';

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

const UserStatusDisplay: React.FC<UserStatusDisplayProps> = ({
  user = null,
}) => {
  // Redux
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );

  // Socket
  const socket = useSocket();

  // User Setting Control
  const [showUserSetting, setShowUserSetting] = useState<boolean>(false);

  // Status Dropdown Control
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);

  const handleUpdateStatus = (status: Presence['status']) => {
    socket?.emit('updatePresence', { sessionId, presence: { status } });
  };

  const userName = user?.name ?? 'RiceCall';
  const userPresenceStatus = user?.presence?.status ?? 'online';

  if (user)
    return (
      <div className={styles['userStatus']}>
        {showUserSetting && (
          <UserSettingModal onClose={() => setShowUserSetting(false)} />
        )}
        <div className={styles['nameDisplay']}>{userName}</div>
        <div
          className={styles['statusBox']}
          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
        >
          <div
            className={styles['statusDisplay']}
            datatype={userPresenceStatus}
          />
          <div className={styles['statusTriangle']} />
          <div
            className={`${styles['statusDropdown']} ${
              showStatusDropdown ? '' : styles['hidden']
            }`}
          >
            <div
              className={styles['statusOption']}
              datatype="online"
              onClick={() => {
                handleUpdateStatus('online');
                setShowStatusDropdown(false);
              }}
            />
            <div
              className={styles['statusOption']}
              datatype="dnd"
              onClick={() => {
                handleUpdateStatus('dnd');
                setShowStatusDropdown(false);
              }}
            />
            <div
              className={styles['statusOption']}
              datatype="idle"
              onClick={() => {
                handleUpdateStatus('idle');
                setShowStatusDropdown(false);
              }}
            />
            <div
              className={styles['statusOption']}
              datatype="gn"
              onClick={() => {
                handleUpdateStatus('gn');
                setShowStatusDropdown(false);
              }}
            />
          </div>
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

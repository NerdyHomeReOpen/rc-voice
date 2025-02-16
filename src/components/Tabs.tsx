/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react/display-name */
import React from 'react';
import { CircleX } from 'lucide-react';
import { useSelector } from 'react-redux';

// CSS
import styles from '@/styles/home.module.css';

// Types
import type { Server, User } from '@/types';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

interface TabsProps {
  disabled?: boolean;
  selectedId?: number;
  onSelect?: (tabId: number) => void;
}

const Tabs: React.FC<TabsProps> = React.memo(
  ({ disabled, selectedId, onSelect }) => {
    // Redux
    const user = useSelector((state: { user: User }) => state.user);
    const server = useSelector((state: { server: Server }) => state.server);
    const sessionId = useSelector(
      (state: { sessionToken: string }) => state.sessionToken,
    );

    // Socket Control
    const socket = useSocket();

    const handleLeaveServer = () => {
      const serverId = user.presence?.currentServerId;
      socket?.emit('disconnectServer', { serverId, sessionId });
    };

    const handleRequestUserUpdate = () => {
      socket?.emit('requestUserUpdate', { sessionId });
    };

    const TABS = [
      { id: 1, label: '發現', onClick: handleRequestUserUpdate },
      { id: 2, label: '好友' },
      server && { id: 3, label: server.name },
    ].filter((_) => _);

    if (disabled) return null;
    return (
      <div className={styles['mainTab']}>
        {TABS.map((Tab) => {
          const TabId = Tab.id;
          const TabLable = Tab.label;

          return (
            <div
              key={`Tabs-${TabId}`}
              className={`${styles['tabItem']} ${
                TabId === selectedId ? styles['selected'] : ''
              }`}
              onClick={() => {
                onSelect?.(TabId);
                Tab.onClick && Tab.onClick();
              }}
            >
              <div className={styles['tabItemLable']}>{TabLable}</div>
              <div className={styles['tabBg']}></div>
            </div>
          );
        })}
        {TABS.length > 2 && (
          <CircleX
            onClick={() => handleLeaveServer()}
            size={16}
            className={styles['tabClose']}
          />
        )}
      </div>
    );
  },
);

export default Tabs;

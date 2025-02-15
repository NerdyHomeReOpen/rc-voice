import React from 'react';
import { CircleX } from 'lucide-react';
import { useSelector } from 'react-redux';

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
    ];

    if (disabled) return null;
    return (
      <div className="flex min-w-[50%] h-full space-x-4 items-end">
        {TABS.filter((_) => _).map((Tab, index) => {
          const TabId = Tab.id;
          const TabLable = Tab.label;

          return (
            <div
              key={`Tabs-${TabId}`}
              className="min-w-32 text-center select-none"
            >
              <div
                className={`p-2 h-8 cursor-pointer font-medium justify-center ${
                  TabId === selectedId
                    ? 'bg-white text-blue-500 rounded-t-xl  text-based'
                    : 'bg-blue-600 hover:bg-blue-700 text-white rounded-t-xl text-center'
                }`}
                onClick={() => {
                  onSelect?.(TabId);
                  Tab.onClick && Tab.onClick();
                }}
              >
                <div className="flex flex-row items-center justify-center">
                  <span className="truncate">{TabLable}</span>
                  {index === 2 && (
                    <CircleX
                      onClick={() => handleLeaveServer()}
                      size={16}
                      className="ml-2 cursor-pointer right-0 bg-none"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

export default Tabs;

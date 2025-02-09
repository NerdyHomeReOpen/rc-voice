import React from 'react';
import { CircleX } from 'lucide-react';
import { useSelector } from 'react-redux';

// Types
import type { Server, User } from '@/types';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

interface TabsProps {
  selectedId: number;
  onSelect: (tabId: number) => void;
}

const Tabs: React.FC<TabsProps> = React.memo(({ selectedId, onSelect }) => {
  // Redux
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );
  const server = useSelector((state: { server: Server }) => state.server);
  const user = useSelector((state: { user: User }) => state.user);

  // Socket Control
  const socket = useSocket();

  const handleLeaveServer = () => {
    const serverId = user.presence?.currentServerId;
    socket?.emit('disconnectServer', { serverId, sessionId });
  };

  const TABS = [
    { id: 1, label: '發現' },
    { id: 2, label: '好友' },
    server && { id: 3, label: server.name },
  ];

  return (
    <div className="flex min-w-[50%] space-x-4">
      {TABS.map((TAB) => {
        if (TAB)
          return (
            <div
              key={`Tabs-${TAB?.id}`}
              className="min-w-32 text-center -mb-2 select-none"
            >
              <div
                className={`p-2 h-8 cursor-pointer font-medium ${
                  TAB.id === selectedId
                    ? 'bg-white text-blue-500 rounded-t-xl  text-based'
                    : 'bg-blue-600 hover:bg-blue-700 text-white rounded-t-xl text-center'
                }`}
                onClick={() => onSelect(TAB.id)}
              >
                <div className="flex flex-row items-center justify-center">
                  <span className="truncate">{TAB.label}</span>
                  {TAB.id === 3 && (
                    <CircleX
                      onClick={() => handleLeaveServer()}
                      size={16}
                      className="ml-2 -mr-2 cursor-pointer"
                    />
                  )}
                </div>
              </div>
              <div
                className={`h-2 ${
                  TAB.id === selectedId ? 'bg-white' : 'bg-blue-600'
                }`}
              />
            </div>
          );
      })}
    </div>
  );
});

export default Tabs;

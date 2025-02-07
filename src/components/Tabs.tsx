import React from 'react';
import { CircleX } from 'lucide-react';
import { useSelector } from 'react-redux';

// Types
import type { Server, User } from '@/types';

interface TabsProps {
  selectedId: number;
  onSelect: (tabId: number) => void;
  onLeaveServer: (serverId: string, userId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ selectedId, onSelect, onLeaveServer }) => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const server = useSelector((state: { server: Server }) => state.server);

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
            <div key={`Tabs-${TAB?.id}`} className="min-w-32 text-center -mb-2">
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
                      onClick={(e) => {
                        e.stopPropagation();
                        if (server && user) onLeaveServer(server.id, user.id);
                      }}
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
};

export default Tabs;

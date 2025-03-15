import React from 'react';
import { useSelector } from 'react-redux';

// CSS
import homePage from '@/styles/homePage.module.css';

// Type
import { Server, User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';

interface ServerCardProps {
  server: Server;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(({ server }) => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);

  // Hooks
  const socket = useSocket();

  // Handlers
  const handleServerSelect = (serverId: string) => {
    if (!socket) return;
    if (user.currentServerId === serverId) return;
    socket.send.connectServer({ serverId });
  };

  // Variables
  const serverName = server.name;
  const serverAvatar = server.avatar;
  const serverDisplayId = server.displayId;
  const serverSlogan = server.slogan;

  return (
    <>
      <div
        className={homePage['myGroupsRoomItemBox']}
        onClick={() => {
          handleServerSelect(server.id);
        }}
      >
        <div
          className={homePage['myGroupsRoomAvatarPicture']}
          style={
            serverAvatar ? { backgroundImage: `url(${serverAvatar})` } : {}
          }
        ></div>
        <div className={homePage['myGroupsRoomInfo']}>
          <div className={homePage['myGroupsRoomName']}>{serverName}</div>
          <div className={homePage['myGroupsRoomIDBox']}>
            <div
              className={`${homePage['myGroupsRoomIDTitle']} ${
                server.ownerId === user?.id ? homePage['IsOwner'] : ''
              }`}
              data-key="10063"
            >
              ID:
            </div>
            <div className={homePage['myGroupsRoomID']}>{serverDisplayId}</div>
          </div>
          <div className={homePage['myGroupsRoomSlogen']}>{serverSlogan}</div>
        </div>
      </div>
    </>
  );
});

ServerCard.displayName = 'ServerCard';

// ServerGrid Component
interface ServerListViewerProps {
  servers: Server[];
}

const ServerListViewer: React.FC<ServerListViewerProps> = React.memo(
  ({ servers }) => {
    return (
      <div className={homePage['myGroupsRoomItems']}>
        {servers.map((server) => (
          <ServerCard key={server.id} server={server} />
        ))}
      </div>
    );
  },
);

ServerListViewer.displayName = 'ServerListViewer';

export default ServerListViewer;

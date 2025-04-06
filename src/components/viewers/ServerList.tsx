import React from 'react';

// CSS
import homePage from '@/styles/homePage.module.css';

// Type
import { Server, User } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';

interface ServerCardProps {
  user: User;
  server: Server;
  onClick?: () => void;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(
  ({ user, server, onClick }) => {
    // Hooks
    const socket = useSocket();

    // Variables
    const { id: userId } = user;
    const {
      id: serverId,
      name: serverName,
      avatarUrl: serverAvatarUrl,
      displayId: serverDisplayId,
      slogan: serverSlogan,
      ownerId: serverOwnerId,
    } = server;
    const isOwner = serverOwnerId === userId;

    // Handlers
    const handleServerSelect = (userId: User['id'], serverId: Server['id']) => {
      if (!socket || user.currentServerId === serverId) return;
      socket.send.connectServer({ userId, serverId });
      onClick?.();
    };

    return (
      <div
        className={homePage['myGroupsRoomItemBox']}
        onClick={() => handleServerSelect(userId, serverId)}
      >
        <div
          className={homePage['myGroupsRoomAvatarPicture']}
          style={{ backgroundImage: `url(${serverAvatarUrl})` }}
        ></div>
        <div className={homePage['myGroupsRoomInfo']}>
          <div className={homePage['myGroupsRoomName']}>{serverName}</div>
          <div className={homePage['myGroupsRoomIDBox']}>
            <div
              className={`${homePage['myGroupsRoomIDTitle']} ${
                isOwner ? homePage['IsOwner'] : ''
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
    );
  },
);

ServerCard.displayName = 'ServerCard';

// ServerGrid Component
interface ServerListViewerProps {
  user: User;
  servers: Server[];
  onServerClick?: (server: Server) => void;
}

const ServerListViewer: React.FC<ServerListViewerProps> = React.memo(
  ({ user, servers, onServerClick }) => {
    return (
      <div className={homePage['myGroupsRoomItems']}>
        {servers.map((server) => (
          <ServerCard
            key={server.id}
            user={user}
            server={server}
            onClick={() => onServerClick?.(server)}
          />
        ))}
      </div>
    );
  },
);

ServerListViewer.displayName = 'ServerListViewer';

export default ServerListViewer;

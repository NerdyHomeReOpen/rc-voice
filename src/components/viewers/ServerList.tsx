import React from 'react';

// CSS
import homePage from '@/styles/homePage.module.css';

// Type
import { Server, User } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';

interface ServerCardProps {
  userId: User['id'];
  server: Server;
  onClick?: () => void;
}

const ServerCard: React.FC<ServerCardProps> = React.memo(
  ({ userId, server, onClick }) => {
    // Hooks
    const socket = useSocket();

    // Variables
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
      if (!socket) return;
      socket.send.connectServer({ userId, serverId });
      onClick?.();
    };

    return (
      <div
        className={homePage['serverCard']}
        onClick={() => handleServerSelect(userId, serverId)}
      >
        <div
          className={homePage['serverAvatarPicture']}
          style={{ backgroundImage: `url(${serverAvatarUrl})` }}
        ></div>
        <div className={homePage['serverInfoText']}>
          <div className={homePage['serverNameText']}>{serverName}</div>
          <div className={homePage['serverIdBox']}>
            <div
              className={`
                ${homePage['serverIdText']} 
                ${isOwner ? homePage['IsOwner'] : ''}
              `}
            >
              ID:
            </div>
            <div className={homePage['serverIdText']}>{serverDisplayId}</div>
          </div>
          <div className={homePage['serverSlogen']}>{serverSlogan}</div>
        </div>
      </div>
    );
  },
);

ServerCard.displayName = 'ServerCard';

// ServerGrid Component
interface ServerListViewerProps {
  userId: User['id'];
  servers: Server[];
  onServerClick?: (server: Server) => void;
}

const ServerListViewer: React.FC<ServerListViewerProps> = React.memo(
  ({ userId, servers, onServerClick }) => {
    return (
      <div className={homePage['serverCards']}>
        {servers.map((server) => (
          <ServerCard
            key={server.id}
            userId={userId}
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

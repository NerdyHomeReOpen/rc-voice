import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Dot,
  Edit,
  House,
  Minus,
  MoreVertical,
  Plus,
  Trash,
} from 'lucide-react';

// Types
import type { Channel, Server, User, Visibility } from '@/types';

// Redux
import store from '@/redux/store';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Components
import BadgeViewer from '@/components/BadgeViewer';
import ContextMenu from '@/components/ContextMenu';
import UserInfoBlock from '@/components/UserInfoBlock';

// Modals
import AddChannelModal from '@/modals/AddChannelModal';
import EditChannelModal from '@/modals/EditChannelModal';
import DeleteChannelModal from '@/modals/DeleteChannelModal';

const getVisibilityStyle = (visibility: Visibility): string => {
  switch (visibility) {
    case 'private':
      return 'bg-blue-100';
    case 'readonly':
      return 'bg-gray-300';
    default:
      return 'bg-white';
  }
};

interface ContextMenuPosState {
  x: number;
  y: number;
}

interface CategoryTabProps {
  category: Channel;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ category }) => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const server = useSelector((state: { server: Server }) => state.server);

  // Expanded Control
  const [expanded, setExpanded] = useState<boolean>(true);

  // Context Menu Control
  const [contentMenuPos, setContentMenuPos] = useState<ContextMenuPosState>({
    x: 0,
    y: 0,
  });
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);

  // Modal Control
  const [showAddChannelModal, setShowAddChannelModal] =
    useState<boolean>(false);
  const [showEditChannelModal, setShowEditChannelModal] =
    useState<boolean>(false);
  const [showDeleteChannelModal, setShowDeleteChannelModal] =
    useState<boolean>(false);

  const categoryVisibility = category.settings.visibility ?? 'public';
  const categoryName = category.name ?? '';
  const userPermission = server.members?.[user.id].permissionLevel ?? 1;
  const canEdit = userPermission >= 5;
  const serverChannels = server.channels ?? [];

  return (
    <div key={category.id} className="mb">
      {/* Category View */}
      <div
        className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
        onClick={() =>
          setExpanded(categoryVisibility != 'readonly' ? !expanded : false)
        }
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          setShowContextMenu(true);
        }}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center outline outline-1 outline-gray-200 mr-1 
              ${getVisibilityStyle(categoryVisibility)}`}
          >
            {categoryVisibility === 'readonly' ? (
              <Dot size={12} />
            ) : expanded ? (
              <Minus size={12} />
            ) : (
              <Plus size={12} />
            )}
          </div>
          <span className="truncate">{categoryName}</span>
        </div>
        {canEdit && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAddChannelModal(true);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded"
          >
            <Plus size={14} />
          </div>
        )}
      </div>

      {/* Expanded Sections */}
      {expanded && serverChannels.length > 0 && (
        <div className="ml-6">
          {serverChannels
            .filter((c) => c.parentId === category.id)
            .map((subChannel) =>
              subChannel.isCategory ? (
                <CategoryTab key={subChannel.id} category={subChannel} />
              ) : (
                <ChannelTab key={subChannel.id} channel={subChannel} />
              ),
            )}
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          onClose={() => setShowContextMenu(false)}
          x={contentMenuPos.x}
          y={contentMenuPos.y}
          items={[
            {
              id: 'edit',
              icon: <Edit size={14} className="w-5 h-5 mr-2" />,
              label: '編輯',
              disabled: !canEdit,
              onClick: () => {
                setShowContextMenu(false);
                setShowEditChannelModal(true);
              },
            },
            {
              id: 'delete',
              icon: <Trash size={14} className="w-5 h-5 mr-2" />,
              label: '刪除',
              disabled: !canEdit,
              onClick: () => {
                setShowContextMenu(false);
                setShowDeleteChannelModal(true);
              },
            },
          ]}
        />
      )}

      {/* Add Channel Modal */}
      {showAddChannelModal && (
        <AddChannelModal
          onClose={() => setShowAddChannelModal(false)}
          parentChannel={category}
        />
      )}

      {/* Edit Channel Modal */}
      {showEditChannelModal && (
        <EditChannelModal
          onClose={() => setShowEditChannelModal(false)}
          channel={category}
        />
      )}

      {/* Delete Channel Modal */}
      {showDeleteChannelModal && (
        <DeleteChannelModal
          onClose={() => setShowDeleteChannelModal(false)}
          channel={category}
        />
      )}
    </div>
  );
});

interface ChannelTabProps {
  channel: Channel;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel }) => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const server = useSelector((state: { server: Server }) => state.server);
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );

  // Socket Control
  const socket = useSocket();

  // Expanded Control
  const [expanded, setExpanded] = useState<boolean>(true);

  // Context Menu Control
  const [contentMenuPos, setContentMenuPos] = useState<ContextMenuPosState>({
    x: 0,
    y: 0,
  });
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);

  // Modal Control
  const [showEditChannelModal, setShowEditChannelModal] =
    useState<boolean>(false);
  const [showDeleteChannelModal, setShowDeleteChannelModal] =
    useState<boolean>(false);

  const handleJoinChannel = (channelId: string) => {
    if (user.presence?.currentChannelId !== channelId) {
      socket?.emit('connectChannel', { sessionId, channelId });
    }
  };

  const channelVisibility = channel.settings.visibility ?? 'public';
  const channelName = channel.name ?? '';
  const channelUsers = channel.users ?? [];
  const userPermission = server.members?.[user.id].permissionLevel ?? 1;
  const canEdit = userPermission >= 5;

  return (
    <div key={channel.id}>
      {/* Channel View */}
      <div
        className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
        onDoubleClick={() => {
          channelVisibility !== 'readonly' && handleJoinChannel(channel.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          setShowContextMenu(true);
        }}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center outline outline-1 outline-gray-200 mr-1 cursor-pointer 
                ${getVisibilityStyle(channelVisibility)}`}
            onClick={() =>
              setExpanded(channelVisibility != 'readonly' ? !expanded : false)
            }
          >
            {channel.isLobby ? (
              <House size={12} />
            ) : channelVisibility === 'readonly' ? (
              <Dot size={12} />
            ) : expanded ? (
              <Minus size={12} />
            ) : (
              <Plus size={12} />
            )}
          </div>
          <span className={`truncate`}>{channelName}</span>
          <span className="ml-1 text-gray-500 text-sm">
            {channelVisibility !== 'readonly' && `(${channelUsers.length})`}
          </span>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContentMenuPos({ x: e.pageX, y: e.pageY });
            setShowContextMenu(true);
          }}
        >
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Expanded Sections */}
      {(channel.isLobby || expanded) && channelUsers.length > 0 && (
        <div className="ml-6">
          {channelUsers.map((user: User) => (
            <UserTab key={user.id} user={user} />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          onClose={() => setShowContextMenu(false)}
          x={contentMenuPos.x}
          y={contentMenuPos.y}
          items={[
            {
              id: 'edit',
              icon: <Edit size={14} className="w-5 h-5 mr-2" />,
              label: '編輯',
              disabled: !canEdit,
              onClick: () => {
                setShowContextMenu(false);
                setShowEditChannelModal(true);
              },
            },
            {
              id: 'delete',
              icon: <Trash size={14} className="w-5 h-5 mr-2" />,
              label: '刪除',
              disabled: channel.isLobby || !canEdit,
              onClick: () => {
                setShowContextMenu(false);
                setShowDeleteChannelModal(true);
              },
            },
          ]}
        />
      )}

      {/* Edit Channel Modal */}
      {showEditChannelModal && (
        <EditChannelModal
          onClose={() => setShowEditChannelModal(false)}
          channel={channel}
        />
      )}

      {/* Delete Channel Modal */}
      {showDeleteChannelModal && (
        <DeleteChannelModal
          onClose={() => setShowDeleteChannelModal(false)}
          channel={channel}
        />
      )}
    </div>
  );
});

interface UserTabProps {
  user: User;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ user }) => {
  // Redux
  const server = useSelector((state: { server: Server }) => state.server);

  // Context Menu Control
  const [contentMenuPos, setContentMenuPos] = useState<ContextMenuPosState>({
    x: 0,
    y: 0,
  });
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);

  const [showInfoBlock, setShowInfoBlock] = useState<boolean>(false);
  const floatingBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (floatingBlockRef.current?.contains(event.target as Node))
        setShowInfoBlock(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userPermission = server.members?.[user.id].permissionLevel ?? 1;
  const userNickname = server.members?.[user.id].nickname ?? user.name;
  const userLevel = Math.min(56, Math.ceil(user.level / 5)); // 56 is max level
  const userGender = user.gender;
  const userBadges = user.badges ?? [];

  return (
    <div key={user.id}>
      {/* User View */}
      <div
        className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
        data-user-block
        data-user-id={user.id}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          setShowInfoBlock(true);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          setShowContextMenu(true);
        }}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center mr-1`}
          >
            <img
              src={`/channel/${userGender}_${userPermission}.png`}
              alt={`${userGender}_${userPermission}`}
              className="select-none"
            />
          </div>
          <span className="truncate">{userNickname}</span>

          {user.level > 1 && (
            <div
              className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center ml-1`}
            >
              <img
                src={`/usergrade_${userLevel}.png`}
                alt={`/usergrade_${userLevel}`}
                className="select-none"
              />
            </div>
          )}
          <div className="flex items-center space-x-1 ml-2 gap-1">
            {userBadges.length > 0 && (
              <BadgeViewer badges={userBadges} maxDisplay={3} />
            )}
          </div>
        </div>
        {user.id == store.getState().user?.id && (
          <div
            className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center ml-1`}
          >
            <img
              src={`/mylocation.png`}
              alt={`mylocation`}
              className="p-1 select-none"
            />
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          onClose={() => setShowContextMenu(false)}
          x={contentMenuPos.x}
          y={contentMenuPos.y}
          items={[
            {
              id: 'kick',
              icon: <Trash size={14} className="w-5 h-5 mr-2" />,
              label: '踢出',
              onClick: () => {
                setShowContextMenu(false);
                // Open Kick User Modal
              },
            },
          ]}
        />
      )}

      {/* User Info Block */}
      {showInfoBlock && (
        <UserInfoBlock
          onClose={() => setShowInfoBlock(false)}
          x={contentMenuPos.x}
          y={contentMenuPos.y}
          user={user}
        />
      )}

      {/* Kick User Modal */}
    </div>
  );
});

interface ChannelViewerProps {
  channels: Channel[];
}

const ChannelViewer: React.FC<ChannelViewerProps> = ({ channels }) => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const server = useSelector((state: { server: Server }) => state.server);

  const [contentMenuPos, setContentMenuPos] = useState<ContextMenuPosState>({
    x: 0,
    y: 0,
  });
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);

  // Modal Control
  const [showAddChannelModal, setShowAddChannelModal] =
    useState<boolean>(false);

  const userCurrentChannel = channels.find(
    (_) => _.id == user.presence?.currentChannelId,
  );
  const userCurrentChannelName = userCurrentChannel?.name ?? '';
  const userPermission = server.members?.[user.id].permissionLevel ?? 1;
  const canEdit = userPermission >= 5;

  return (
    <>
      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          onClose={() => setShowContextMenu(false)}
          x={contentMenuPos.x}
          y={contentMenuPos.y}
          items={[
            {
              id: 'addChannel',
              icon: <Plus size={14} className="w-5 h-5 mr-2" />,
              label: '新增',
              disabled: !canEdit,
              onClick: () => {
                setShowContextMenu(false);
                setShowAddChannelModal(true);
              },
            },
          ]}
        />
      )}

      {/* Add Channel Modal */}
      {showAddChannelModal && (
        <AddChannelModal
          onClose={() => setShowAddChannelModal(false)}
          parentChannel={null}
        />
      )}

      {/* Current Channel */}
      <div className="flex flex-row p-2 items-center gap-1">
        <img
          src="/channel/NetworkStatus_5.png" // TODO: Change base on connection status
          alt="User Profile"
          className="w-6 h-6 select-none"
        />
        <div className="text-gray-500">{userCurrentChannelName}</div>
      </div>

      <div
        className="p-2 flex items-center justify-between text-gray-400 text-xs select-none"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          setShowContextMenu(true);
        }}
      >
        所有頻道
      </div>
      <div className="flex flex-col overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar-thumb]:bg-transparent scrollbar-none">
        {[...channels]
          .filter((c) => !c.parentId)
          .map((channel) =>
            channel.isCategory ? (
              <CategoryTab key={channel.id} category={channel} />
            ) : (
              <ChannelTab key={channel.id} channel={channel} />
            ),
          )}
      </div>
    </>
  );
};

ChannelViewer.displayName = 'ChannelViewer';

export default ChannelViewer;

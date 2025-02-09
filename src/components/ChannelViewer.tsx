import {
  Dot,
  Edit,
  House,
  Minus,
  MoreVertical,
  Plus,
  Trash,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Types
import type { Channel, Server, User } from '@/types';

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

const getPermissionStyle = (permission: Channel['permission']): string => {
  switch (permission) {
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

interface FloatingBlockState {
  visible: boolean;
  x: number;
  y: number;
  userId: string;
}

interface CategoryTabProps {
  category: Channel;
}
const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ category }) => {
  // Redux
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

  return (
    <div key={category.id} className="mb">
      {/* Category View */}
      <div
        className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
        onClick={() =>
          setExpanded((prevExpanded) => {
            return category.permission != 'readonly' ? !prevExpanded : false;
          })
        }
        onContextMenu={(e) => {
          e.preventDefault();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          setShowContextMenu(true);
        }}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center outline outline-1 outline-gray-200 mr-1 ${getPermissionStyle(
              category.permission,
            )}`}
          >
            {category.permission === 'readonly' ? (
              <Dot size={12} />
            ) : expanded ? (
              <Minus size={12} />
            ) : (
              <Plus size={12} />
            )}
          </div>
          <span className="truncate">{category.name}</span>
        </div>
        {category.permission !== 'readonly' && (
          <div
            onClick={(e) => {
              e.preventDefault();
              setShowAddChannelModal(true);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded"
          >
            <Plus size={14} />
          </div>
        )}
      </div>

      {/* Expanded Sections */}
      {expanded && (
        <div className="ml-6">
          {[...server?.channels]
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
              onClick: () => {
                setShowContextMenu(false);
                setShowEditChannelModal(true);
                // Open Edit Channel Modal
              },
            },
            {
              id: 'delete',
              icon: <Trash size={14} className="w-5 h-5 mr-2" />,
              label: '刪除',
              onClick: () => {
                setShowContextMenu(false);

                // Open Delete Channel Modal
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
    </div>
  );
});

interface ChannelTabProps {
  channel: Channel;
}
const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel }) => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );

  // Expanded Control
  const [expanded, setExpanded] = useState<boolean>(true);

  // Socket Control
  const socket = useSocket();

  // Context Menu Control
  const [contentMenuPos, setContentMenuPos] = useState<ContextMenuPosState>({
    x: 0,
    y: 0,
  });
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);

  // Modal Control
  const [showEditChannelModal, setShowEditChannelModal] =
    useState<boolean>(false);

  const handleJoinChannel = useCallback(
    (channelId: string) => {
      if (user.presence?.currentChannelId !== channelId) {
        socket?.emit('connectChannel', { sessionId, channelId });
      }
    },
    [socket, user],
  );

  return (
    <div key={channel.id}>
      {/* Channel View */}
      {channel.isLobby ? (
        <div
          className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
          onDoubleClick={() => {
            channel.permission !== 'readonly' && handleJoinChannel(channel.id);
          }}
        >
          <div className="flex items-center flex-1 min-w-0">
            <div className="min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center outline outline-1 outline-gray-200 mr-1">
              <House size={12} />
            </div>
            <span className={'text-[#ff0000]'}>{channel.name}</span>
            <span className="ml-1 text-gray-500 text-sm">
              {`(${channel.users.length})`}
            </span>
          </div>
        </div>
      ) : (
        <div
          className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
          onDoubleClick={() => {
            channel.permission !== 'readonly' && handleJoinChannel(channel.id);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContentMenuPos({ x: e.pageX, y: e.pageY });
            setShowContextMenu(true);
          }}
        >
          <div className="flex items-center flex-1 min-w-0">
            <div
              className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center outline outline-1 outline-gray-200 mr-1 ${getPermissionStyle(
                channel.permission,
              )} cursor-pointer`}
              onClick={() =>
                setExpanded((prevExpanded) =>
                  channel.permission != 'readonly' ? !prevExpanded : false,
                )
              }
            >
              {channel.permission === 'readonly' ? (
                <Dot size={12} />
              ) : expanded ? (
                <Minus size={12} />
              ) : (
                <Plus size={12} />
              )}
            </div>
            <span className={`truncate`}>{channel.name}</span>
            <span className="ml-1 text-gray-500 text-sm">
              {channel.permission !== 'readonly' && `(${channel.users.length})`}
            </span>
          </div>
          <button
            className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded"
            onClick={(e) => {
              e.preventDefault();
              setContentMenuPos({ x: e.pageX, y: e.pageY });
              setShowContextMenu(true);
            }}
          >
            <MoreVertical size={14} />
          </button>
        </div>
      )}

      {/* Expanded Sections */}
      {(channel.isLobby || expanded) && channel.users.length > 0 && (
        <div className="ml-6">
          {[...channel?.users].map((_user: User) => (
            <UserTab key={_user.id} user={_user} />
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
              onClick: () => {
                setShowContextMenu(false);
                setShowEditChannelModal(true);
              },
            },
            {
              id: 'delete',
              icon: <Trash size={14} className="w-5 h-5 mr-2" />,
              label: '刪除',
              onClick: () => {
                setShowContextMenu(false);

                // Open Delete Channel Modal
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

  const toggleContextMenu = (state?: boolean) =>
    setShowContextMenu(state ?? !showInfoBlock);

  const [showInfoBlock, setShowInfoBlock] = useState<boolean>(false);
  const floatingBlockRef = useRef<HTMLDivElement>(null);

  const toggleFloatingBlock = (state?: boolean) =>
    setShowInfoBlock(state ?? !showInfoBlock);

  const userPermission = server.members[user.id].permissionLevel;
  const userLevel = Math.min(56, Math.ceil(user.level / 5)); // 56 is max level

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (floatingBlockRef.current?.contains(event.target as Node))
        toggleFloatingBlock(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div key={user.id}>
      {/* User View */}
      <div
        className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
        data-user-block
        data-user-id={user.id}
        onDoubleClick={(e) => {
          e.preventDefault();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          toggleFloatingBlock();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          toggleContextMenu();
        }}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center mr-1`}
          >
            <img
              src={`/channel/${user.gender}_${userPermission}.png`}
              alt={`${user.gender}_${userPermission}`}
              className="select-none"
            />
          </div>
          <span className="truncate">{user.name}</span>

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
            {user.badges?.length > 0 && (
              <BadgeViewer badges={user.badges} maxDisplay={3} />
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
          onClose={() => toggleContextMenu(false)}
          x={contentMenuPos.x}
          y={contentMenuPos.y}
          items={[
            {
              id: 'kick',
              icon: <Trash size={14} className="w-5 h-5 mr-2" />,
              label: '踢出',
              onClick: () => {
                toggleContextMenu(false);

                // Open Kick User Modal
              },
            },
          ]}
        />
      )}

      {/* 使用者資訊 block */}
      {showInfoBlock && (
        <UserInfoBlock
          onClose={() => toggleFloatingBlock()}
          x={contentMenuPos.x}
          y={contentMenuPos.y}
          user={user}
        />
      )}
    </div>
  );
});

interface ChannelViewerProps {}
const ChannelViewer: React.FC<ChannelViewerProps> = () => {
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
              label: '新增頻道',
              onClick: () => {
                setShowContextMenu(false);
                setShowAddChannelModal(true);
              },
            },
            {
              id: 'addCategory',
              icon: <Plus size={14} className="w-5 h-5 mr-2" />,
              label: '新增類別',
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
          src="/channel/NetworkStatus_5.png"
          alt="User Profile"
          className="w-6 h-6 select-none"
        />
        <div className="text-gray-500">
          {server?.channels.find((_) => _.id == user.presence?.currentChannelId)
            ?.name ?? ''}
        </div>
      </div>

      <div
        className="p-2 flex items-center justify-between text-gray-400 text-xs select-none"
        onContextMenu={(e) => {
          e.preventDefault();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          setShowContextMenu(true);
        }}
      >
        所有頻道
      </div>
      <div className="flex flex-col overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar-thumb]:bg-transparent scrollbar-none">
        {[...server?.channels]
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

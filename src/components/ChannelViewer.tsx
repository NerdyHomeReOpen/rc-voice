import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Plus,
  Minus,
  Dot,
  House,
  MoreVertical,
  Edit,
  Trash,
} from 'lucide-react';
import { Dialog } from 'radix-ui';

// Types
import type { Channel, Server, User, UserList } from '@/types';

// Redux
import store from '@/redux/store';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Components
import ContextMenu from '@/components/ContextMenu';
import UserInfoFloatingBlock from './UserInfoFloatingBlock';

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
  const channels = useSelector(
    (state: { channels: Channel[] }) => state.channels,
  );

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
        className="p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
        onClick={() =>
          setExpanded((prevExpanded) => {
            return category.permission != 'readonly' ? !prevExpanded : false;
          })
        }
        onContextMenu={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          setShowContextMenu(true);
        }}
      >
        <div className="items-center flex-1 min-w-0">
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
              e.stopPropagation();
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
          {channels
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
  const server = useSelector((state: { server: Server }) => state.server);
  const serverUserList = useSelector(
    (state: { serverUserList: UserList }) => state.serverUserList,
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
    (serverId: string, userId: string, channelId: string) => {
      socket?.emit('joinChannel', {
        serverId: serverId,
        userId: userId,
        channelId: channelId,
      });
    },
    [],
  );

  return (
    <div key={channel.id}>
      {/* Channel View */}
      {channel.isLobby ? (
        <div
          className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
          onDoubleClick={() => {
            channel.permission !== 'readonly' &&
              handleJoinChannel(server.id, user.id, channel.id);
          }}
        >
          <div className="flex items-center flex-1 min-w-0">
            <div className="min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center outline outline-1 outline-gray-200 mr-1">
              <House size={12} />
            </div>
            <span className={'text-[#ff0000]'}>{channel.name}</span>
            <span className="ml-1 text-gray-500 text-sm">
              {`(${channel.userIds.length})`}
            </span>
          </div>
        </div>
      ) : (
        <div
          className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
          onDoubleClick={() => {
            channel.permission !== 'readonly' &&
              handleJoinChannel(server.id, user.id, channel.id);
          }}
          onContextMenu={(e) => {
            e.stopPropagation();
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
              {channel.permission !== 'readonly' &&
                `(${channel.userIds.length})`}
            </span>
          </div>
          <button
            className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded"
            onClick={(e) => {
              e.stopPropagation();
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
      {(channel.isLobby || expanded) && channel.userIds.length > 0 && (
        <div className="ml-6">
          {channel.userIds.map((userId) => (
            <UserTab key={userId} user={serverUserList[userId]} />
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

  const userPermission = server.permissions[user.id] ?? 1; // ERROR: Sometime _user is undefined and it will throw an error
  const userLevel = Math.min(56, Math.ceil(user.level / 5)); // 56 is max level

  const [floatingBlock, setFloatingBlock] = useState<FloatingBlockState>({
    visible: false,
    x: 0,
    y: 0,
    userId: '',
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (floatingBlock.visible) {
        const target = event.target as HTMLElement;
        const clickedUserBlock = target.closest('[data-user-block]');

        if (clickedUserBlock) {
          const userId = clickedUserBlock.getAttribute('data-user-id');
          if (userId !== floatingBlock.userId) {
            setFloatingBlock({
              visible: false,
              x: 0,
              y: 0,
              userId: '',
            });
          }
        } else {
          setFloatingBlock({
            visible: false,
            x: 0,
            y: 0,
            userId: '',
          });
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [floatingBlock.visible, floatingBlock.userId]);

  return (
    <div key={user.id}>
      {/* User View */}
      {/* 使用者資訊 block */}
      {floatingBlock.visible && (
        <UserInfoFloatingBlock
          user={user}
          server={server}
          style={{
            left: floatingBlock.x,
            top: floatingBlock.y,
          }}

        />
      )}

      <div
        className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
        data-user-block
        data-user-id={user.id}
        onDoubleClick={(e) => {
          if (!floatingBlock.visible || floatingBlock.userId !== user.id) {
            setFloatingBlock({
              visible: true,
              x: e.clientX,
              y: e.clientY,
              userId: user.id,
            });
          }
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          setShowContextMenu(true);
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
    </div>
  );
});

interface ChannelViewerProps {}
const ChannelViewer: React.FC<ChannelViewerProps> = () => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const channels = useSelector(
    (state: { channels: Channel[] }) => state.channels,
  );

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
      {user.currentChannelId && (
        <div className="flex flex-row p-2 items-center gap-1">
          <img
            src="/channel/NetworkStatus_5.png"
            alt="User Profile"
            className="w-6 h-6 select-none"
          />
          <div className="text-gray-500">
            {channels.find((_) => _.id == user.currentChannelId)?.name ?? ''}
          </div>
        </div>
      )}

      <div
        className="p-2 flex items-center justify-between text-gray-400 text-xs select-none"
        onContextMenu={(e) => {
          e.stopPropagation();
          e.preventDefault();
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
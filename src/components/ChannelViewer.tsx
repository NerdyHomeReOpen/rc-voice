import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Minus,
  Dot,
  House,
  MoreVertical,
  Edit,
  Trash,
} from 'lucide-react';

// Types
import type {
  Channel,
  ChannelPermission,
  Server,
  User,
  UserList,
} from '@/types';

interface ContextMenuPosState {
  x: number;
  y: number;
}

interface ChannelViewerProps {
  user: User;
  server: Server;
  channels: Channel[];
  users: UserList;
  onAddChannel: (serverId: string, channel: Channel) => void;
  onEditChannel: (
    serverId: string,
    channelId: string,
    channel: Channel,
  ) => void;
  onDeleteChannel: (serverId: string, channelId: string) => void;
  onJoinChannel: (serverId: string, userId: string, channelId: string) => void;
}

const ChannelViewer: React.FC<ChannelViewerProps> = ({
  user,
  server,
  channels,
  users,
  onAddChannel,
  onEditChannel,
  onDeleteChannel,
  onJoinChannel,
}) => {
  const prevChannelsRef = useRef<Channel[]>([]);

  const joinSoundRef = useRef<HTMLAudioElement | null>(null);
  const leaveSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    joinSoundRef.current = new Audio('/sounds/join.mp3');
    leaveSoundRef.current = new Audio('/sounds/leave.mp3');
  }, []);

  useEffect(() => {
    const currentUserChannel = channels.find(
      (channel) => channel.id === user.currentChannelId,
    );

    if (!currentUserChannel) return;

    const prevChannel = prevChannelsRef.current.find(
      (channel) => channel.id === currentUserChannel.id,
    );

    if (prevChannel) {
      const newUsers = currentUserChannel.userIds.filter(
        (id) => !prevChannel.userIds.includes(id),
      );

      const leftUsers = prevChannel.userIds.filter(
        (id) => !currentUserChannel.userIds.includes(id),
      );

      if (currentUserChannel.userIds.includes(user.id)) {
        if (newUsers.length > 0 && !newUsers.includes(user.id)) {
          joinSoundRef.current?.play().catch(console.error);
        }
        if (leftUsers.length > 0) {
          leaveSoundRef.current?.play().catch(console.error);
        }
      }
    }

    prevChannelsRef.current = channels;
  }, [channels, user.id, user.currentChannelId]);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(
    channels.reduce((acc, channel) => {
      if (channel.id) {
        acc[channel.id] = channel.isLobby ? false : true;
      }
      return acc;
    }, {} as Record<string, boolean>),
  );

  const [contentMenuPos, setContentMenuPos] = useState<ContextMenuPosState>({
    x: 0,
    y: 0,
  });
  const [showContextMenu, setShowContextMenu] = useState<Boolean>(false);
  const [showContextMenu2, setShowContextMenu2] = useState<Boolean>(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const contextMenu2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCloseContextMenu = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      )
        setShowContextMenu(false);
      if (
        contextMenu2Ref.current &&
        !contextMenu2Ref.current.contains(event.target as Node)
      )
        setShowContextMenu2(false);
    };

    document.addEventListener('mousedown', handleCloseContextMenu);
    return () =>
      document.removeEventListener('mousedown', handleCloseContextMenu);
  }, []);

  const [selectedChannel, setSelectedChannel] = useState<Channel>({
    id: '',
    name: '',
    permission: 'public',
    isCategory: false,
    isLobby: false,
    userIds: [],
    messageIds: [],
    parentId: null,
  });
  const [showAddChannelModal, setShowAddChannelModal] =
    useState<Boolean>(false);
  const [showEditChannelModal, setShowEditChannelModal] =
    useState<Boolean>(false);

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

  const renderCategory = (category: Channel): React.ReactElement => {
    return (
      <div key={category.id} className="mb">
        {/* Category View */}
        <div
          className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
          onClick={() =>
            setExpandedSections((prev) => ({
              ...prev,
              [category.id]: !prev[category.id],
            }))
          }
          onContextMenu={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setContentMenuPos({ x: e.pageX, y: e.pageY });
            setShowContextMenu(true);
            setSelectedChannel(category);
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
              ) : !expandedSections[category.id] ? (
                <Minus size={12} />
              ) : (
                <Plus size={12} />
              )}
            </div>
            <span className="truncate">{category.name}</span>
          </div>
          {category.permission !== 'readonly' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddChannelModal(true);
                setSelectedChannel((prev) => ({
                  ...prev,
                  parentId: category.id,
                }));
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {/* Expanded Sections */}
        {!expandedSections[category.id] && (
          <div className="ml-6">
            {channels
              .filter((c) => c.parentId === category.id)
              .map((subChannel) =>
                subChannel.isCategory
                  ? renderCategory(subChannel)
                  : renderChannel(subChannel),
              )}
          </div>
        )}
      </div>
    );
  };
  const renderChannel = (channel: Channel): React.ReactElement => {
    return (
      <div key={channel.id}>
        {/* Channel View */}
        {channel.isLobby ? (
          <div
            className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
            onDoubleClick={() => {
              channel.permission !== 'readonly' &&
                onJoinChannel(server.id, user.id, channel.id);
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
                onJoinChannel(server.id, user.id, channel.id);
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setContentMenuPos({ x: e.pageX, y: e.pageY });
              setShowContextMenu(true);
              setSelectedChannel(channel);
            }}
          >
            <div className="flex items-center flex-1 min-w-0">
              <div
                className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center outline outline-1 outline-gray-200 mr-1 ${getPermissionStyle(
                  channel.permission,
                )} cursor-pointer`}
                onClick={() =>
                  setExpandedSections((prev) => ({
                    ...prev,
                    [channel.id]: !prev[channel.id],
                  }))
                }
              >
                {channel.permission === 'readonly' ? (
                  <Dot size={12} />
                ) : !expandedSections[channel.id] ? (
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
                setSelectedChannel(channel);
              }}
            >
              <MoreVertical size={14} />
            </button>
          </div>
        )}

        {/* Expanded Sections */}
        {(channel.isLobby || !expandedSections[channel.id]) &&
          channel.userIds.length > 0 && (
            <div className="ml-6">
              {Object.values(users)
                .filter((user) => channel.userIds.includes(user.id))
                .map((user) => renderUser(user))}
            </div>
          )}
      </div>
    );
  };
  const renderUser = (_user: User): React.ReactElement => {
    const userPermission = server.permissions[_user.id] || 1;
    const userLevel = Math.min(56, Math.ceil(_user.level / 5)); // 56 is max level
    return (
      <div key={_user.id}>
        {/* User View */}
        <div className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none">
          <div className="flex items-center flex-1 min-w-0">
            <div
              className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center mr-1`}
            >
              <img
                src={`/channel/${_user.gender}_${userPermission}.png`}
                alt={`${_user.gender}_${userPermission}`}
                className="select-none"
              />
            </div>
            <span className="truncate">{_user.name}</span>
            {_user.level > 1 && (
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
          {_user.id == user.id && (
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
      </div>
    );
  };

  return (
    <>
      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white shadow-lg rounded border py-1 z-50"
          style={{ top: contentMenuPos.y, left: contentMenuPos.x }}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
            onClick={() => {
              setShowContextMenu(false);
              setShowEditChannelModal(true);
              setSelectedChannel(selectedChannel);
              // setEditChannel(selectedChannel);
            }}
          >
            <Edit size={14} className="mr-2" />
            編輯頻道
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-600"
            onClick={() => {
              setShowContextMenu(false);
              onDeleteChannel(server.id, selectedChannel.id);
            }}
          >
            <Trash size={14} className="mr-2" />
            刪除頻道
          </button>
        </div>
      )}

      {/* Context Menu2 */}
      {showContextMenu2 && (
        <div
          ref={contextMenu2Ref}
          className="fixed bg-white shadow-lg rounded border py-1 z-50"
          style={{ top: contentMenuPos.y, left: contentMenuPos.x }}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
            onClick={() => {
              setShowContextMenu2(false);
              setSelectedChannel((prev) => ({ ...prev, isCategory: false }));
              setShowAddChannelModal(true);
            }}
          >
            <Plus size={14} className="mr-2" />
            新增頻道
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
            onClick={() => {
              setShowContextMenu2(false);
              setSelectedChannel((prev) => ({ ...prev, isCategory: true }));
              setShowAddChannelModal(true);
            }}
          >
            <Plus size={14} className="mr-2" />
            新增類別
          </button>
        </div>
      )}

      {/* Add Channel Modal */}
      {showAddChannelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-80">
            <h3 className="text-lg font-bold mb-4">{`新增${
              selectedChannel.isCategory ? '類別' : '頻道'
            }`}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowAddChannelModal(false);
                onAddChannel(server.id, {
                  ...selectedChannel,
                  parentId: selectedChannel.parentId,
                  isCategory: selectedChannel.isCategory,
                });
                setSelectedChannel({
                  id: '',
                  name: '',
                  permission: 'public',
                  isCategory: false,
                  isLobby: false,
                  userIds: [],
                  messageIds: [],
                  parentId: null,
                });
              }}
            >
              <input
                type="text"
                value={selectedChannel.name}
                onChange={(e) =>
                  setSelectedChannel((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded mb-4"
                placeholder={`${
                  selectedChannel.isCategory ? '類別' : '頻道'
                }名稱`}
                required
              />
              <select
                value={selectedChannel.permission}
                onChange={(e) =>
                  setSelectedChannel((prev) => ({
                    ...prev,
                    permission: e.target.value as ChannelPermission,
                  }))
                }
                className="w-full p-2 border rounded mb-4"
              >
                <option value="public">公開</option>
                <option value="private">會員</option>
                <option value="readonly">唯讀</option>
              </select>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => {
                    setShowAddChannelModal(false);
                    setSelectedChannel({
                      id: '',
                      name: '',
                      permission: 'public',
                      isCategory: false,
                      isLobby: false,
                      userIds: [],
                      messageIds: [],
                      parentId: null,
                    });
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  確定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Channel Modal */}
      {showEditChannelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-80">
            <h3 className="text-lg font-bold mb-4">編輯頻道</h3>
            <input
              type="text"
              value={selectedChannel.name}
              onChange={(e) =>
                setSelectedChannel((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  setShowEditChannelModal(false);
                  setSelectedChannel({
                    id: '',
                    name: '',
                    permission: 'public',
                    isCategory: false,
                    isLobby: false,
                    userIds: [],
                    messageIds: [],
                    parentId: null,
                  });
                }}
              >
                取消
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  setShowEditChannelModal(false);
                  onEditChannel(server.id, selectedChannel.id, selectedChannel);
                  setSelectedChannel({
                    id: '',
                    name: '',
                    permission: 'public',
                    isCategory: false,
                    isLobby: false,
                    userIds: [],
                    messageIds: [],
                    parentId: null,
                  });
                }}
              >
                確定
              </button>
            </div>
          </div>
        </div>
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
          setShowContextMenu2(true);
        }}
      >
        所有頻道
      </div>
      <div className="flex flex-col overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar-thumb]:bg-transparent scrollbar-none">
        {[...channels]
          .filter((c) => !c.parentId)
          .map((channel) =>
            channel.isCategory
              ? renderCategory(channel)
              : renderChannel(channel),
          )}
      </div>
    </>
  );
};

ChannelViewer.displayName = 'ChannelViewer';

export default ChannelViewer;

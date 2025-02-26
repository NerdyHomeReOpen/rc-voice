/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react/display-name */
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Edit, Plus, Trash } from 'lucide-react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

// CSS
import styles from '@/styles/serverPage.module.css';
import grade from '@/styles/common/grade.module.css';
import permission from '@/styles/common/permission.module.css';

// Types
import type { Channel, Server, User } from '@/types';

// Redux
import store from '@/redux/store';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Components
import BadgeViewer from '@/components/viewers/BadgeViewer';
import ContextMenu from '@/components/ContextMenu';
import UserInfoBlock from '@/components/UserInfoBlock';

// Modals
import AddChannelModal from '@/components/modals/AddChannelModal';
import EditChannelModal from '@/components/modals/EditChannelModal';
import DeleteChannelModal from '@/components/modals/DeleteChannelModal';

interface ContextMenuPosState {
  x: number;
  y: number;
}

interface CategoryTabProps {
  category: Channel;
  server: Server;
  user: User;
  index: number;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({ category, server, user, index }) => {
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
    // const userMember = server.members?.find((m) => m.userId === user.id);
    const userMember = server.members?.[user.id];
    const userPermission = userMember?.permissionLevel ?? 1;
    const subChannels = category.subChannels ?? [];
    const canEdit = userPermission >= 5;

    return (
      <Draggable
        draggableId={category.id}
        index={index}
        isDragDisabled={!canEdit}
      >
        {(provided) => (
          <div ref={provided.innerRef} {...provided.draggableProps}>
            {/* Category View */}
            <div
              {...provided.dragHandleProps}
              className={`${styles['channelTab']} ${
                expanded ? styles['expanded'] : ''
              } ${
                category.isLobby ? styles['lobby'] : styles[categoryVisibility]
              }`}
              onClick={() =>
                setExpanded(
                  categoryVisibility != 'readonly' ? !expanded : false,
                )
              }
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContentMenuPos({ x: e.pageX, y: e.pageY });
                setShowContextMenu(true);
              }}
            >
              <div className={styles['channelTabLable']}>{categoryName}</div>
            </div>

            {/* Expanded Sections */}
            {expanded && (
              <Droppable
                droppableId={`category-${category.id}`}
                type="CHANNEL"
                isDropDisabled={!canEdit}
                isCombineEnabled={true}
                ignoreContainerClipping={true}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={styles['channelList']}
                  >
                    {subChannels
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((subChannel, index) =>
                        subChannel.isCategory ? (
                          <CategoryTab
                            key={subChannel.id}
                            category={subChannel}
                            server={server}
                            user={user}
                            index={index}
                          />
                        ) : (
                          <ChannelTab
                            key={subChannel.id}
                            channel={subChannel}
                            server={server}
                            user={user}
                            index={index}
                          />
                        ),
                      )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
            {/* Context Menu */}
            {showContextMenu && canEdit && (
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
                    id: 'add',
                    icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                    label: '新增',
                    onClick: () => {
                      setShowContextMenu(false);
                      setShowAddChannelModal(true);
                    },
                  },
                  {
                    id: 'delete',
                    icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                    label: '刪除',
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
                isRoot={false}
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
        )}
      </Draggable>
    );
  },
);

interface ChannelTabProps {
  channel: Channel;
  server: Server;
  user: User;
  index: number;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(
  ({ channel, server, user, index }) => {
    // Redux
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
    const [showAddChannelModal, setShowAddChannelModal] =
      useState<boolean>(false);
    const [showDeleteChannelModal, setShowDeleteChannelModal] =
      useState<boolean>(false);

    const handleJoinChannel = (channelId: string) => {
      if (user.currentChannelId !== channelId) {
        if (server.settings?.visibility === 'private' && userPermission === 1) {
          const targetChannel = server.channels?.find(
            (c) => c.id === channelId,
          );
          if (!targetChannel?.isLobby) {
            alert('在半公開伺服器中,普通用戶只能加入大廳頻道');
            return;
          }
        }

        socket?.connectChannel(channelId);
      }
    };

    const channelVisibility = channel.settings.visibility ?? 'public';
    const channelName = channel.name ?? '';
    const channelUsers =
      server.users?.filter((u) => u.currentChannelId === channel.id) ?? [];
    // const userMember = server.members?.find((m) => m.userId === user.id);
    const userMember = server.members?.[user.id];
    const userPermission = userMember?.permissionLevel ?? 1;
    const userInChannel = user.currentChannelId === channel.id;
    const canEdit = userPermission >= 5;

    return (
      <Draggable
        draggableId={channel.id}
        index={index}
        isDragDisabled={!canEdit}
      >
        {(provided) => (
          <div ref={provided.innerRef} {...provided.draggableProps}>
            {/* Channel View */}
            <div
              {...provided.dragHandleProps}
              className={`${styles['channelTab']} ${
                expanded ? styles['expanded'] : ''
              } ${
                channel.isLobby ? styles['lobby'] : styles[channelVisibility]
              } ${userInChannel ? styles['userCurrentLocation'] : ''} ${
                !channel.isRoot ? styles['subChannel'] : ''
              }`}
              onClick={() =>
                setExpanded(channelVisibility != 'readonly' ? !expanded : false)
              }
              onDoubleClick={() => {
                channelVisibility !== 'readonly' &&
                  handleJoinChannel(channel.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContentMenuPos({ x: e.pageX, y: e.pageY });
                setShowContextMenu(true);
              }}
            >
              <div className={styles['channelTabLable']}>{channelName}</div>
              <div className={styles['channelTabCount']}>
                {`(${channelUsers.length})`}
              </div>
            </div>
            {/* Expanded Sections */}
            {expanded && (
              <div className={styles['userList']}>
                {channelUsers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((channelUser: User) => (
                    <UserTab
                      key={user.id}
                      user={user}
                      server={server}
                      channelUser={channelUser}
                    />
                  ))}
              </div>
            )}
            {/* Context Menu */}
            {showContextMenu && canEdit && (
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
                    id: 'add',
                    icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                    label: '新增',
                    disabled: channel.isLobby,
                    onClick: () => {
                      setShowContextMenu(false);
                      setShowAddChannelModal(true);
                    },
                  },
                  {
                    id: 'delete',
                    icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                    label: '刪除',
                    disabled: channel.isLobby,
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
                isRoot={false}
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
        )}
      </Draggable>
    );
  },
);

interface UserTabProps {
  channelUser: User;
  server: Server;
  user: User;
}

const UserTab: React.FC<UserTabProps> = React.memo(
  ({ user, server, channelUser }) => {
    // Socket Control
    const socket = useSocket();

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
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // const channelUserMember = server.members?.find((m) => m.userId === user.id);
    const channelUserMember = server.members?.[user.id];
    const channelUserPermission = channelUserMember?.permissionLevel ?? 1;
    const channelUserNickname = channelUserMember?.nickname ?? user.name;
    const channelUserLevel = Math.min(56, Math.ceil(user.level / 5)); // 56 is max level
    const channelUserGender = user.gender;
    const channelUserBadges = user.badges ?? [];
    // const userMember = server.members?.find((m) => m.userId === user.id);
    const userMember = server.members?.[user.id];
    const userPermission = userMember?.permissionLevel ?? 1;
    const canEdit = userPermission >= 5;

    const handleKickUser = (targetId: string) => {
      socket?.emit('userKicked', {
        sessionId: store.getState().sessionToken,
        serverId: server.id,
        userId: user.id,
        targetId: targetId,
      });
    };

    const handleaddFriend = (targetId: string) => {
      socket?.emit('userAddFriend', {
        sessionId: store.getState().sessionToken,
        serverId: server.id,
        userId: user.id,
        targetId: targetId,
      });
    };

    return (
      <div key={user.id} ref={floatingBlockRef}>
        {/* User View */}
        <div
          className={`${styles['userTab']}`}
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
          <div className={styles['userState']} />
          <div
            className={`${styles['userIcon']} ${
              permission[channelUserGender]
            } ${permission[`lv-${channelUserPermission}`]}`}
          />
          <div className={styles['userTabName']}>{channelUserNickname}</div>
          <div
            className={`${styles['userGrade']} ${
              grade[`lv-${channelUserLevel}`]
            }`}
          />
          <BadgeViewer badges={channelUserBadges} maxDisplay={3} />
          {channelUser.id === user.id && (
            <div className={styles['myLocationIcon']} />
          )}
        </div>

        {/* Context Menu */}
        {showContextMenu && (
          <ContextMenu
            onClose={() => setShowContextMenu(false)}
            x={contentMenuPos.x}
            y={contentMenuPos.y}
            items={
              canEdit
                ? [
                    {
                      id: 'kick',
                      icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                      label: '踢出',
                      disabled: user.id == channelUser.id ? true : false,
                      onClick: () => {
                        setShowContextMenu(false);
                        handleKickUser(user.id);
                      },
                    },
                    {
                      id: 'addFriend',
                      icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                      label: '新增好友',
                      disabled: user.id == channelUser.id ? true : false,
                      onClick: () => {
                        setShowContextMenu(false);
                        handleaddFriend(user.id);
                      },
                    },
                  ]
                : [
                    {
                      id: 'addFriend',
                      icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                      label: '新增好友',
                      disabled: user.id == channelUser.id ? true : false,
                      onClick: () => {
                        setShowContextMenu(false);
                        handleaddFriend(user.id);
                      },
                    },
                  ]
            }
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
  },
);

interface ChannelViewerProps {
  channels: Channel[] | null;
}

const ChannelViewer: React.FC<ChannelViewerProps> = ({ channels }) => {
  if (!channels) return null;

  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const server = useSelector((state: { server: Server }) => state.server);
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );

  // Socket Control
  const socket = useSocket();

  const [contentMenuPos, setContentMenuPos] = useState<ContextMenuPosState>({
    x: 0,
    y: 0,
  });
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);

  // Modal Control
  const [showAddChannelModal, setShowAddChannelModal] =
    useState<boolean>(false);

  const connectStatus = 3;
  const userCurrentChannel = channels.find(
    (ch) => ch.id == user.currentChannelId,
  );
  const userCurrentChannelName = userCurrentChannel?.name ?? '';
  // const userMember = server.members?.find((m) => m.userId === user.id);
  const userMember = server.members?.[user.id];
  const userPermission = userMember?.permissionLevel ?? 1;
  const serverChannels = server.channels ?? [];
  const canEdit = userPermission >= 5;

  // Updates we send to the server
  interface ChannelUpdate {
    id: string;
    order: number;
    parentChannelId: string | null;
    isCategory: boolean;
  }

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, combine } = result;

    // Validation
    const movedChannel = channels?.find((ch) => ch.id === draggableId);
    if (!movedChannel) return;

    // Permission check
    // const userMember = server.members?.find((m) => m.userId === user.id);
    const userMember = server.members?.[user.id];
    const userPermission = userMember?.permissionLevel ?? 1;
    const canEdit = userPermission >= 5;
    if (!canEdit) return;

    // Prevent lobby movement restrictions
    if (
      movedChannel.isLobby &&
      (combine || destination?.droppableId !== 'root')
    ) {
      return;
    }

    // Helper to emit updates
    const emitUpdates = (updates: ChannelUpdate[]) => {
      if (updates.length === 0) return;
      socket?.emit('updateChannelOrder', {
        sessionId: store.getState().sessionToken,
        serverId: server.id,
        updates,
      });
    };

    // Handle combining channels
    if (combine) {
      const targetChannel = channels?.find(
        (ch) => ch.id === combine.draggableId,
      );
      if (!targetChannel || targetChannel.isLobby) return;

      // Calculate order for moved channel
      const siblings =
        channels?.filter((ch) =>
          ch.subChannels?.some((sub) => sub.id === targetChannel.id),
        ) || [];
      const newOrder = siblings.length;

      const updates: ChannelUpdate[] = [
        {
          id: targetChannel.id,
          order: targetChannel.order,
          parentChannelId: null,
          isCategory: true,
        },
        {
          id: movedChannel.id,
          order: newOrder,
          parentChannelId: targetChannel.id,
          isCategory: false,
        },
      ];

      // Update order of siblings in source
      const sourceChannels = channels?.filter((ch) =>
        ch.subChannels?.some((sub) => sub.id === movedChannel.id),
      );

      if (sourceChannels) {
        const sourceUpdates = sourceChannels.map(
          (ch, idx): ChannelUpdate => ({
            id: ch.id,
            order: idx,
            parentChannelId: null,
            isCategory: ch.isCategory,
          }),
        );
        updates.push(...sourceUpdates);
      }

      emitUpdates(updates);
      return;
    }

    // Handle regular drag and drop
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const targetParentId =
      destination.droppableId === 'root'
        ? null
        : destination.droppableId.replace('category-', '');

    // Get channels at destination level
    const siblings =
      channels?.filter((ch) => {
        if (targetParentId === null) {
          return ch.subChannels === undefined || ch.subChannels.length === 0;
        }
        return ch.subChannels?.some((sub) => sub.id === targetParentId);
      }) || [];

    // Remove moved channel and insert at new position
    const updatedChannels = siblings.filter((ch) => ch.id !== draggableId);
    updatedChannels.splice(destination.index, 0, movedChannel);

    // Create updates
    const updates: ChannelUpdate[] = updatedChannels.map((ch, idx) => ({
      id: ch.id,
      order: idx,
      parentChannelId: targetParentId,
      isCategory: ch.isCategory,
    }));

    // Add moved channel update
    updates.push({
      id: movedChannel.id,
      order: destination.index,
      parentChannelId: targetParentId,
      isCategory: movedChannel.isCategory,
    });

    emitUpdates(updates);
  };

  useEffect(() => {
    const currentChannel = server.channels?.find(
      (c) => c.id === user.currentChannelId,
    );
    if (currentChannel && currentChannel.isCategory) {
      const lobbyChannel = server.channels?.find((c) => c.isLobby);
      if (lobbyChannel && lobbyChannel.id !== user.currentChannelId) {
        socket?.connectChannel(lobbyChannel.id);
      }
    }
  }, [server.channels, user.currentChannelId, sessionId, socket]);

  return (
    <>
      {/* Current Channel */}
      <div className={styles['currentChannelBox']}>
        <div
          className={`${styles['currentChannelIcon']} ${
            styles[`status${connectStatus}`]
          }`}
        />
        <div className={styles['currentChannelText']}>
          {userCurrentChannelName}
        </div>
      </div>
      {/* Mic Queue */}
      <div className={styles['sectionTitle']}>麥序</div>
      <div className={styles['micQueueBox']}>
        <div className={styles['userList']}>
          {/* {micQueueUsers.map((user) => (
            <UserTab
              key={user.id}
              user={user}
              server={server}
              mainUser={user}
            />
          ))} */}
        </div>
      </div>
      {/* Saperator */}
      <div className={styles['saperator-2']} />
      {/* All Channels */}
      <div
        className={styles['sectionTitle']}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContentMenuPos({ x: e.pageX, y: e.pageY });
          setShowContextMenu(true);
        }}
      >
        所有頻道
      </div>
      {/* Channel List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable
          droppableId="root"
          type="CHANNEL" // Always accept CHANNEL type items
          ignoreContainerClipping={true}
          isDropDisabled={!canEdit}
          isCombineEnabled={true}
        >
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={styles['channelList']}
            >
              {serverChannels
                .filter((c) => c.isRoot)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((channel, index) =>
                  channel.isCategory ? (
                    <CategoryTab
                      key={channel.id}
                      category={channel}
                      server={server}
                      user={user}
                      index={index}
                    />
                  ) : (
                    <ChannelTab
                      key={channel.id}
                      channel={channel}
                      server={server}
                      user={user}
                      index={index}
                    />
                  ),
                )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {/* Context Menu */}
      {showContextMenu && canEdit && (
        <ContextMenu
          onClose={() => setShowContextMenu(false)}
          x={contentMenuPos.x}
          y={contentMenuPos.y}
          items={[
            {
              id: 'addChannel',
              icon: <Plus size={14} className="w-5 h-5 mr-2" />,
              label: '新增',
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
          isRoot={true}
        />
      )}
    </>
  );
};

ChannelViewer.displayName = 'ChannelViewer';

export default ChannelViewer;

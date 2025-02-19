/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react/display-name */
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Edit, Plus, Trash } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// CSS
import styles from '@/styles/serverPage.module.css';
import grade from '@/styles/common/grade.module.css';
import permission from '@/styles/common/permission.module.css';

// Types
import type { Channel, Server, User, Visibility } from '@/types';

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
    const userPermission = server.members?.[user.id].permissionLevel ?? 1;
    const canEdit = userPermission >= 5;
    const serverChannels = server.channels ?? [];

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
                category.isLobby
                  ? styles['lobby']
                  : styles[category.settings.visibility]
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
            {expanded && serverChannels.length > 0 && (
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
                    {serverChannels
                      .filter((c) => c.parentId === category.id)
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
                    id: 'delete',
                    icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                    label: '刪除',
                    onClick: () => {
                      setShowContextMenu(false);
                      setShowDeleteChannelModal(true);
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
    const mainUser = useSelector((state: { user: User }) => state.user);
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
        if (server.settings?.visibility === 'private' && userPermission === 1) {
          const targetChannel = server.channels?.find(
            (c) => c.id === channelId,
          );
          if (!targetChannel?.isLobby) {
            alert('在半公開伺服器中,普通用戶只能加入大廳頻道');
            return;
          }
        }

        socket?.emit('connectChannel', { sessionId, channelId });
      }
    };

    const channelVisibility = channel.settings.visibility ?? 'public';
    const channelName = channel.name ?? '';
    const channelUsers = channel.users ?? [];
    const userPermission = server.members?.[user.id].permissionLevel ?? 1;
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
                channel.isLobby
                  ? styles['lobby']
                  : styles[channel.settings.visibility]
              } ${expanded ? styles['expanded'] : ''}`}
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
            {(channel.isLobby || expanded) && channelUsers.length > 0 && (
              <div className={styles['userList']}>
                {channelUsers.map((user: User) => (
                  <UserTab
                    key={user.id}
                    user={user}
                    server={server}
                    mainUser={mainUser}
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
  user: User;
  server: Server;
  mainUser: User;
}

const UserTab: React.FC<UserTabProps> = React.memo(
  ({ user, server, mainUser }) => {
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

    const mainUserPermission =
      server.members?.[mainUser.id]?.permissionLevel ?? 1;
    const userPermission = server.members?.[user.id]?.permissionLevel ?? 1;
    const userNickname = server.members?.[user.id]?.nickname ?? user.name;
    const userLevel = Math.min(56, Math.ceil(user.level / 5)); // 56 is max level
    const userGender = user.gender;
    const userBadges = user.badges ?? [];

    const handleKickUser = (targetId: string) => {
      if (mainUserPermission >= 5) {
        socket?.emit('userKicked', {
          sessionId: store.getState().sessionToken,
          serverId: server.id,
          userId: mainUser.id,
          targetId: targetId,
        });
      }
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
            className={`${styles['userIcon']} ${permission[userGender]} ${
              permission[`lv-${userPermission}`]
            }`}
          />
          <div className={styles['userTabName']}>{userNickname}</div>
          <div
            className={`${styles['userGrade']} ${grade[`lv-${userLevel}`]}`}
          />
          <BadgeViewer badges={userBadges} maxDisplay={3} />
          {user.id === mainUser.id && (
            <div className={styles['myLocationIcon']} />
          )}
        </div>

        {/* Context Menu */}
        {showContextMenu && mainUserPermission >= 5 && (
          <ContextMenu
            onClose={() => setShowContextMenu(false)}
            x={contentMenuPos.x}
            y={contentMenuPos.y}
            items={[
              {
                id: 'kick',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: '踢出',
                disabled: mainUser.id == user.id ? true : false,
                onClick: () => {
                  setShowContextMenu(false);
                  handleKickUser(user.id);
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
    (_) => _.id == user.presence?.currentChannelId,
  );
  const userCurrentChannelName = userCurrentChannel?.name ?? '';
  const userPermission = server.members?.[user.id]?.permissionLevel ?? 1;
  const canEdit = userPermission >= 5;

  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // Drop was cancelled or dropped outside valid area
    if (!destination) return;

    // Item was dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Get the channel being moved
    const movedChannel = channels?.find((c) => c.id === draggableId);
    if (!movedChannel) return;

    // Get the source and destination parent IDs
    const sourceParentId =
      source.droppableId === 'root'
        ? null
        : source.droppableId.replace('category-', '');
    const destParentId =
      destination.droppableId === 'root'
        ? null
        : destination.droppableId.replace('category-', '');

    // Get all channels in the destination category
    const destCategoryChannels = channels
      ?.filter((c) => {
        if (destParentId === null) {
          return c.parentId === null;
        }
        return c.parentId === destParentId;
      })
      .filter((c) => c.id !== draggableId) // Remove the moved channel
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Create new array with moved channel at new position
    const newChannelArray = [...destCategoryChannels];
    newChannelArray.splice(destination.index, 0, movedChannel);

    // Update orders for all channels
    const updatedChannels = newChannelArray.map((channel, index) => ({
      ...channel,
      order: index,
      parentId: destParentId,
    }));

    // Emit socket event to update channel order
    socket?.emit('updateChannelOrder', {
      sessionId: store.getState().sessionToken,
      serverId: server.id,
      parentId: destParentId,
      updatedChannels: updatedChannels,
    });

    // If moving between categories, we also need to update the source category
    if (sourceParentId !== destParentId) {
      const sourceChannels = channels
        ?.filter((c) => {
          if (sourceParentId === null) {
            return c.parentId === null;
          }
          return c.parentId === sourceParentId;
        })
        .filter((c) => c.id !== draggableId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((channel, index) => ({
          ...channel,
          order: index,
        }));

      socket?.emit('updateChannelOrder', {
        sessionId: store.getState().sessionToken,
        serverId: server.id,
        parentId: sourceParentId,
        updatedChannels: sourceChannels,
      });
    }
  };

  // FOR TESTING
  const micQueueUsers: User[] = [
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
    user,
  ];

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
          {micQueueUsers.map((user) => (
            <UserTab
              key={user.id}
              user={user}
              server={server}
              mainUser={user}
            />
          ))}
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
          type="CATEGORY"
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
              {channels
                ?.filter((c) => !c.parentId)
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
          parentChannel={null}
        />
      )}
    </>
  );
};

ChannelViewer.displayName = 'ChannelViewer';

export default ChannelViewer;

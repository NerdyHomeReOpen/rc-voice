/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react/display-name */
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Edit, Plus, Trash } from 'lucide-react';

// CSS
import styles from '@/styles/serverPage.module.css';
import grade from '@/styles/common/grade.module.css';
import permission from '@/styles/common/permission.module.css';

// Types
import { popupType, type Channel, type Server, type User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useContextMenu } from '@/providers/ContextMenuProvider';

// Components
import BadgeViewer from '@/components/viewers/BadgeViewer';

// Services
import { ipcService } from '@/services/ipc.service';

interface CategoryTabProps {
  category: Channel;
  canEdit: boolean;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({ category, canEdit }) => {
    // Expanded Control
    const [expanded, setExpanded] = useState<boolean>(true);

    // Context Menu
    const contextMenu = useContextMenu();

    // Variables
    const categoryName = category.name;
    const categoryIsRoot = category.isRoot;
    const categoryIsLobby = category.isLobby;
    const categoryVisibility = category.settings.visibility;
    const categoryChannels = category.subChannels || [];

    return (
      <div key={category.id}>
        {/* Category View */}
        <div
          className={`
            ${styles['channelTab']} 
            ${expanded ? styles['expanded'] : ''} 
            ${categoryIsLobby ? styles['lobby'] : styles[categoryVisibility]}`}
          onClick={() =>
            setExpanded(categoryVisibility != 'readonly' ? !expanded : false)
          }
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'edit',
                icon: <Edit size={14} className="w-5 h-5 mr-2" />,
                label: '編輯',
                show: canEdit,
                onClick: () =>
                  ipcService.popup.open(popupType.EDIT_CHANNEL, 400, 300),
              },
              {
                id: 'add',
                icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                label: '新增',
                show: canEdit && !categoryIsLobby && categoryIsRoot,
                onClick: () =>
                  ipcService.popup.open(popupType.CREATE_CHANNEL, 400, 300),
              },
              {
                id: 'delete',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: '刪除',
                show: canEdit && !categoryIsLobby,
                onClick: () =>
                  ipcService.popup.open(popupType.DELETE_CHANNEL, 400, 300),
              },
            ]);
          }}
        >
          <div className={styles['channelTabLable']}>{categoryName}</div>
        </div>

        {/* Expanded Sections */}
        {expanded && (
          <div className={styles['channelList']}>
            {categoryChannels
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((channel, index) =>
                channel.isCategory ? (
                  <CategoryTab
                    key={channel.id}
                    category={channel}
                    canEdit={canEdit}
                  />
                ) : (
                  <ChannelTab
                    key={channel.id}
                    channel={channel}
                    canEdit={canEdit}
                  />
                ),
              )}
          </div>
        )}
      </div>
    );
  },
);

interface ChannelTabProps {
  channel: Channel;
  canEdit: boolean;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(
  ({ channel, canEdit }) => {
    // Redux
    const user = useSelector((state: { user: User }) => state.user);
    const server = useSelector((state: { server: Server }) => state.server);

    // Variables
    const serverUsers = server.users || [];
    const channelName = channel.name;
    const channelIsRoot = channel.isRoot;
    const channelIsLobby = channel.isLobby;
    const channelVisibility = channel.settings.visibility;
    const channelUsers = serverUsers.filter(
      (u) => u.currentChannelId === channel.id,
    );
    const userInChannel = user.currentChannelId === channel.id;

    // Socket
    const socket = useSocket();

    // Context Menu
    const contextMenu = useContextMenu();

    // Expanded Control
    const [expanded, setExpanded] = useState<boolean>(true);

    // Handlers
    const handleJoinChannel = (channelId: string) => {
      socket?.send.connectChannel({ channelId });
    };

    return (
      <div key={channel.id}>
        {/* Channel View */}
        <div
          className={`
            ${styles['channelTab']} 
            ${expanded ? styles['expanded'] : ''} 
            ${channelIsLobby ? styles['lobby'] : styles[channelVisibility]}  
            ${channelIsRoot ? '' : styles['subChannel']}`}
          onClick={() =>
            setExpanded(channelVisibility != 'readonly' ? !expanded : false)
          }
          onDoubleClick={() => {
            if (userInChannel) return;
            if (channelVisibility === 'readonly') return;
            handleJoinChannel(channel.id);
          }}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'edit',
                icon: <Edit size={14} className="w-5 h-5 mr-2" />,
                label: '編輯',
                show: canEdit,
                onClick: () =>
                  ipcService.popup.open(popupType.EDIT_CHANNEL, 400, 300),
              },
              {
                id: 'add',
                icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                label: '新增',
                show: canEdit && !channelIsLobby && channelIsRoot,
                onClick: () =>
                  ipcService.popup.open(popupType.CREATE_CHANNEL, 400, 300),
              },
              {
                id: 'delete',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: '刪除',
                show: canEdit && !channelIsLobby,
                onClick: () =>
                  ipcService.popup.open(popupType.DELETE_CHANNEL, 400, 300),
              },
            ]);
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
              .map((user: User) => (
                <UserTab key={user.id} user={user} canEdit={canEdit} />
              ))}
          </div>
        )}
      </div>
    );
  },
);

interface UserTabProps {
  user: User;
  canEdit: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(({ user, canEdit }) => {
  // Redux
  const server = useSelector((state: { server: Server }) => state.server);

  // Context
  const contextMenu = useContextMenu();

  // Variables
  const serverMembers = server.members || {};
  const channelUser = user;
  const channelUserMember = serverMembers[user.id] || {
    id: '',
    isBlocked: false,
    nickname: '',
    permissionLevel: 0,
    userId: '',
    serverId: '',
    createdAt: 0,
  };
  const channelUserPermission = channelUserMember.permissionLevel;
  const channelUserNickname = channelUserMember.nickname;
  const channelUserLevel = user.level;
  const channelUserGrade = Math.min(56, Math.ceil(channelUserLevel / 5)); // 56 is max level
  const channelUserGender = user.gender;
  const channelUserBadges = user.badges || [];

  return (
    <div key={user.id}>
      {/* User View */}
      <div
        className={`${styles['userTab']}`}
        data-user-block
        data-user-id={user.id}
        onDoubleClick={(e) => {
          contextMenu.showUserInfoBlock(e.pageX, e.pageY, user, server);
        }}
        onContextMenu={(e) => {
          contextMenu.showContextMenu(e.pageX, e.pageY, [
            {
              id: 'kick',
              icon: <Trash size={14} className="w-5 h-5 mr-2" />,
              label: '踢出',
              show: canEdit && user.id != channelUser.id,
              onClick: () => {
                // handleKickUser(user.id);
              },
            },
            {
              id: 'addFriend',
              icon: <Plus size={14} className="w-5 h-5 mr-2" />,
              label: '新增好友',
              show: canEdit && user.id != channelUser.id,
              onClick: () => {
                // handleAddFriend(user.id);
              },
            },
          ]);
        }}
      >
        <div
          className={`${styles['userState']} ${false ? styles['unplay'] : ''}`}
        />
        <div
          className={`${styles['userIcon']} ${permission[channelUserGender]} ${
            permission[`lv-${channelUserPermission}`]
          }`}
        />
        <div className={styles['userTabName']}>{channelUserNickname}</div>
        <div
          className={`${styles['userGrade']} ${
            grade[`lv-${channelUserGrade}`]
          }`}
        />
        <BadgeViewer badges={channelUserBadges} maxDisplay={3} />
        {channelUser.id === user.id && (
          <div className={styles['myLocationIcon']} />
        )}
      </div>
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

  // Variables
  const connectStatus = 3;
  const serverMembers = server.members || {};
  const userCurrentChannelId = user.currentChannelId;
  const userCurrentChannel = channels.find(
    (ch) => ch.id === userCurrentChannelId,
  ) || {
    id: '',
    name: '未知頻道',
    isRoot: false,
    isCategory: false,
    isLobby: false,
    voiceMode: 'free',
    chatMode: 'free',
    order: 0,
    serverId: '',
    settings: {
      bitrate: 0,
      slowmode: false,
      userLimit: -1,
      visibility: 'public',
    },
    createdAt: 0,
  };
  const userCurrentChannelName = userCurrentChannel.name;
  const userCurrentChannelVoiceMode = userCurrentChannel.voiceMode;
  const userMember = serverMembers[user.id] || {
    id: '',
    isBlocked: false,
    nickname: '',
    permissionLevel: 0,
    userId: '',
    serverId: '',
    createdAt: 0,
  };
  const userPermission = userMember.permissionLevel;
  const canEdit = userPermission >= 5;

  // Context
  const contextMenu = useContextMenu();

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
      {userCurrentChannelVoiceMode === 'queue' && (
        <>
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
        </>
      )}

      {/* Saperator */}
      <div className={styles['saperator-2']} />
      {/* All Channels */}
      <div
        className={styles['sectionTitle']}
        onContextMenu={(e) => {
          contextMenu.showContextMenu(e.pageX, e.pageY, [
            {
              id: 'addChannel',
              icon: <Plus size={14} className="w-5 h-5 mr-2" />,
              label: '新增',
              show: canEdit,
              onClick: () =>
                ipcService.popup.open(popupType.CREATE_CHANNEL, 400, 300),
            },
          ]);
        }}
      >
        所有頻道
      </div>
      {/* Channel List */}
      <div className={styles['channelList']}>
        {channels
          .filter((c) => c.isRoot)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((channel, index) =>
            channel.isCategory ? (
              <CategoryTab
                key={channel.id}
                category={channel}
                canEdit={canEdit}
              />
            ) : (
              <ChannelTab
                key={channel.id}
                channel={channel}
                canEdit={canEdit}
              />
            ),
          )}
      </div>
    </>
  );
};

ChannelViewer.displayName = 'ChannelViewer';

export default ChannelViewer;

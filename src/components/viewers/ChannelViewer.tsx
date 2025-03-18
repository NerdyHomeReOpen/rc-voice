import React, { useState } from 'react';
import { Edit, Plus, Trash } from 'lucide-react';

// CSS
import styles from '@/styles/serverPage.module.css';
import grade from '@/styles/common/grade.module.css';
import permission from '@/styles/common/permission.module.css';

// Types
import { PopupType, ServerMember, Channel, Server, User } from '@/types';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';
import { useContextMenu } from '@/providers/ContextMenuProvider';

// Components
import BadgeViewer from '@/components/viewers/BadgeViewer';

// Services
import { ipcService } from '@/services/ipc.service';

interface CategoryTabProps {
  user: User;
  server: Server;
  category: Channel;
  canEdit: boolean;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({ user, server, category, canEdit }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();

    // Variables
    const categoryName = category.name;
    const categoryIsRoot = category.isRoot;
    const categoryIsLobby = category.isLobby;
    const categoryVisibility = category.settings.visibility;
    const categoryChannel = category.subChannels || [];

    // States
    const [expanded, setExpanded] = useState<boolean>(true);

    // Handlers
    const handleOpenEditChannel = () => {
      ipcService.popup.open(PopupType.EDIT_CHANNEL);
      ipcService.initialData.onRequest(PopupType.EDIT_CHANNEL, {
        channelId: category.id,
        userId: user.id,
      });
    };

    const handleOpenCreateChannel = () => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        serverId: category.serverId,
        parentId: category.id,
        userId: user.id,
      });
    };

    const handleOpenWarning = () => {
      ipcService.popup.open(PopupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(PopupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: lang.tr.warningDeleteChannel,
        submitTo: PopupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_WARNING, () =>
        handleDeleteChannel(category.id),
      );
    };

    const handleDeleteChannel = (channelId: string) => {
      if (!socket) return;
      socket.send.deleteChannel({ channelId, userId: user.id });
    };

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
                label: lang.tr.edit,
                show: canEdit,
                onClick: () => handleOpenEditChannel(),
              },
              {
                id: 'add',
                icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.add,
                show: canEdit && !categoryIsLobby && categoryIsRoot,
                onClick: () => handleOpenCreateChannel(),
              },
              {
                id: 'delete',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.delete,
                show: canEdit && !categoryIsLobby,
                onClick: () => handleOpenWarning(),
              },
            ]);
          }}
        >
          <div className={styles['channelTabLable']}>{categoryName}</div>
        </div>

        {/* Expanded Sections */}
        {expanded && (
          <div className={styles['channelList']}>
            {categoryChannel
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((channel) => (
                <ChannelTab
                  key={channel.id}
                  user={user}
                  server={server}
                  channel={channel}
                  canEdit={canEdit}
                />
              ))}
          </div>
        )}
      </div>
    );
  },
);

CategoryTab.displayName = 'CategoryTab';

interface ChannelTabProps {
  user: User;
  server: Server;
  channel: Channel;
  canEdit: boolean;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(
  ({ user, server, channel, canEdit }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();

    // Variables
    const serverUsers = server.users || [];
    const channelName = channel.name;
    const channelIsRoot = channel.isRoot;
    const channelIsLobby = channel.isLobby;
    const channelVisibility = channel.settings.visibility;
    // TODO: Change this logic
    const channelUsers = serverUsers.filter(
      (u) => u.currentChannelId === channel.id,
    );
    const userInChannel = user.currentChannelId === channel.id;

    // Expanded Control
    const [expanded, setExpanded] = useState<boolean>(true);

    // Handlers
    const handleOpenEditChannel = () => {
      ipcService.popup.open(PopupType.EDIT_CHANNEL);
      ipcService.initialData.onRequest(PopupType.EDIT_CHANNEL, {
        channelId: channel.id,
        userId: user.id,
      });
    };

    const handleOpenCreateChannel = () => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        serverId: channel.serverId,
        parentId: channel.id,
        userId: user.id,
      });
    };

    const handleOpenWarning = () => {
      ipcService.popup.open(PopupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(PopupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: lang.tr.warningDeleteChannel,
        submitTo: PopupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_WARNING, () =>
        handleDeleteChannel(channel.id),
      );
    };

    const handleDeleteChannel = (channelId: string) => {
      if (!socket) return;
      socket.send.deleteChannel({ channelId, userId: user.id });
    };

    const handleJoinChannel = (channelId: string) => {
      if (!socket) return;
      socket.send.connectChannel({ channelId, userId: user.id });
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
                label: lang.tr.edit,
                show: canEdit,
                onClick: () => handleOpenEditChannel(),
              },
              {
                id: 'add',
                icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.add,
                show: canEdit && !channelIsLobby && channelIsRoot,
                onClick: () => handleOpenCreateChannel(),
              },
              {
                id: 'delete',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.delete,
                show: canEdit && !channelIsLobby,
                onClick: () => handleOpenWarning(),
              },
            ]);
          }}
        >
          <div className={styles['channelTabLable']}>{channelName}</div>
          <div className={styles['channelTabCount']}>
            {`(${channelUsers.length})`}
          </div>
          {userInChannel && !expanded && (
            <div className={styles['myLocationIcon']} />
          )}
        </div>
        {/* Expanded Sections */}
        {expanded && (
          <div className={styles['userList']}>
            {channelUsers
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((channelUser) => (
                <UserTab
                  key={channelUser.id}
                  user={user}
                  channelUser={channelUser}
                  canEdit={canEdit}
                />
              ))}
          </div>
        )}
      </div>
    );
  },
);

ChannelTab.displayName = 'ChannelTab';

interface UserTabProps {
  user: User;
  channelUser: ServerMember;
  canEdit: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(
  ({ user, channelUser, canEdit }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // Variables
    const channelUserPermission = channelUser.permissionLevel;
    const channelUserNickname = channelUser.nickname || channelUser.name;
    const channelUserLevel = channelUser.level;
    const channelUserGrade = Math.min(56, Math.ceil(channelUserLevel / 5)); // 56 is max level
    const channelUserGender = channelUser.gender;
    const channelUserBadges = channelUser.badges || [];
    const isCurrentUser = user.id === channelUser.id;

    // Handlers
    const handleOpenApplyFriend = () => {
      ipcService.popup.open(PopupType.APPLY_FRIEND);
      ipcService.initialData.onRequest(PopupType.APPLY_FRIEND, {
        userId: user.id,
        targetUserId: channelUser.id,
      });
    };

    return (
      <div key={channelUser.id}>
        {/* User View */}
        <div
          className={`${styles['userTab']}`}
          onDoubleClick={(e) => {
            contextMenu.showUserInfoBlock(e.pageX, e.pageY, channelUser);
          }}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'kick',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.kick,
                show: canEdit && user.id != channelUser.id,
                onClick: () => {
                  // handleKickUser(user.id);
                },
              },
              {
                id: 'addFriend',
                icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.addFriend,
                show: canEdit && user.id != channelUser.id,
                onClick: () => handleOpenApplyFriend(),
              },
            ]);
          }}
        >
          <div
            className={`${styles['userState']} ${
              false ? styles['unplay'] : ''
            }`}
          />
          <div
            className={`${styles['userIcon']} ${
              permission[channelUserGender]
            } ${permission[`lv-${channelUserPermission}`]}`}
          />
          <div className={styles['userTabName']}>{channelUserNickname}</div>
          <div
            className={`${styles['userGrade']} ${
              grade[`lv-${channelUserGrade}`]
            }`}
          />
          <BadgeViewer badges={channelUserBadges} maxDisplay={3} />
          {isCurrentUser && <div className={styles['myLocationIcon']} />}
        </div>
      </div>
    );
  },
);

UserTab.displayName = 'UserTab';

interface ChannelViewerProps {
  user: User;
  server: Server;
  currentChannel: Channel;
}

const ChannelViewer: React.FC<ChannelViewerProps> = ({
  user,
  server,
  currentChannel,
}) => {
  // Hooks
  const lang = useLanguage();
  const contextMenu = useContextMenu();

  // Variables
  const connectStatus = 3;
  const userCurrentChannelName = currentChannel.name;
  const userCurrentChannelVoiceMode = currentChannel.voiceMode;
  const serverChannels = server.channels || [];
  const serverUsers = server.users || [];
  const serverMember =
    serverUsers.find((u) => u.id === user.id) || ({} as ServerMember);
  const memberPermission = serverMember.permissionLevel;
  const canEdit = memberPermission >= 5;

  // Handlers
  const handleOpenCreateChannel = () => {
    ipcService.popup.open(PopupType.CREATE_CHANNEL);
    ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
      serverId: server.id,
      parentId: null,
      userId: user.id,
    });
  };

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
          <div className={styles['sectionTitle']}>{lang.tr.micOrder}</div>
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
              label: lang.tr.add,
              show: canEdit,
              onClick: () => handleOpenCreateChannel(),
            },
          ]);
        }}
      >
        {lang.tr.allChannel}
      </div>
      {/* Channel List */}
      <div className={styles['channelList']}>
        {serverChannels
          .filter((c) => c.isRoot)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((channel) =>
            channel.subChannels && channel.subChannels.length > 0 ? (
              <CategoryTab
                key={channel.id}
                user={user}
                server={server}
                category={channel}
                canEdit={canEdit}
              />
            ) : (
              <ChannelTab
                key={channel.id}
                user={user}
                server={server}
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

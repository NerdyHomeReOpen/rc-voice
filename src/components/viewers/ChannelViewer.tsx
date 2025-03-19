import React, { useState } from 'react';
import { Edit, Plus, Trash } from 'lucide-react';

// CSS
import styles from '@/styles/serverPage.module.css';
import grade from '@/styles/common/grade.module.css';
import permission from '@/styles/common/permission.module.css';

// Types
import {
  PopupType,
  ServerMember,
  Channel,
  Server,
  User,
  Member,
  Category,
} from '@/types';

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
  category: Category;
  canEdit: boolean;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({ user, server, category, canEdit }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();

    // Variables
    const serverChannels = server.channels || [];
    const categoryName = category.name;
    const categoryIsRoot = category.isRoot;
    const categoryChannel = serverChannels
      .filter((ch) => ch.type === 'channel')
      .filter((ch) => ch.categoryId === category.id);

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
            ${styles['public']}`}
          onClick={() => setExpanded(!expanded)}
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
                show: canEdit && !categoryIsRoot,
                onClick: () => handleOpenCreateChannel(),
              },
              {
                id: 'delete',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.delete,
                show: canEdit,
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
    const serverMembers = server.members || [];
    const channelName = channel.name;
    const channelIsRoot = channel.isRoot;
    const channelIsLobby = channel.isLobby;
    const channelVisibility = channel.visibility;
    const channelMembers = serverMembers.filter(
      (mb) => mb.currentChannelId === channel.id,
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
            {`(${channelMembers.length})`}
          </div>
          {userInChannel && !expanded && (
            <div className={styles['myLocationIcon']} />
          )}
        </div>
        {/* Expanded Sections */}
        {expanded && (
          <div className={styles['userList']}>
            {channelMembers
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((channelMember) => (
                <UserTab
                  key={channelMember.id}
                  user={user}
                  channelMember={channelMember}
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
  channelMember: ServerMember;
  canEdit: boolean;
}

const UserTab: React.FC<UserTabProps> = React.memo(
  ({ user, channelMember, canEdit }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // Variables
    const channelMemberPermission = channelMember.permissionLevel;
    const channelMemberNickname = channelMember.nickname || channelMember.name;
    const channelMemberLevel = channelMember.level;
    const channelMemberGrade = Math.min(56, Math.ceil(channelMemberLevel / 5)); // 56 is max level
    const channelMemberGender = channelMember.gender;
    const channelMemberBadges = channelMember.badges || [];
    const isCurrentUser = user.id === channelMember.userId;

    // Handlers
    const handleOpenApplyFriend = () => {
      ipcService.popup.open(PopupType.APPLY_FRIEND);
      ipcService.initialData.onRequest(PopupType.APPLY_FRIEND, {
        userId: user.id,
        targetUserId: channelMember.id,
      });
    };

    return (
      <div key={channelMember.id}>
        {/* User View */}
        <div
          className={`${styles['userTab']}`}
          onDoubleClick={(e) => {
            contextMenu.showUserInfoBlock(e.pageX, e.pageY, channelMember);
          }}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'kick',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.kick,
                show: canEdit && user.id != channelMember.id,
                onClick: () => {
                  // handleKickUser(user.id);
                },
              },
              {
                id: 'addFriend',
                icon: <Plus size={14} className="w-5 h-5 mr-2" />,
                label: lang.tr.addFriend,
                show: canEdit && user.id != channelMember.id,
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
              permission[channelMemberGender]
            } ${permission[`lv-${channelMemberPermission}`]}`}
          />
          <div className={styles['userTabName']}>{channelMemberNickname}</div>
          <div
            className={`${styles['userGrade']} ${
              grade[`lv-${channelMemberGrade}`]
            }`}
          />
          <BadgeViewer badges={channelMemberBadges} maxDisplay={3} />
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
  member: Member;
  currentChannel: Channel;
}

const ChannelViewer: React.FC<ChannelViewerProps> = ({
  user,
  server,
  member,
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
  const memberPermission = member.permissionLevel;
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
          .map((item) =>
            item.type === 'category' ? (
              <CategoryTab
                key={item.id}
                user={user}
                server={server}
                category={item}
                canEdit={canEdit}
              />
            ) : (
              <ChannelTab
                key={item.id}
                user={user}
                server={server}
                channel={item}
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

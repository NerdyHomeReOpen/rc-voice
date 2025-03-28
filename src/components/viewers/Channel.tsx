import React, { useState, useEffect } from 'react';

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
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';
import { useExpandedContext } from '@/providers/Expanded';
// import { useWebRTC } from '@/providers/WebRTC';

// Components
import BadgeViewer from '@/components/viewers/Badge';

// Services
import ipcService from '@/services/ipc.service';

interface CategoryTabProps {
  user: User;
  server: Server;
  member: Member;
  category: Category;
  permissionLevel: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(
  ({
    user,
    server,
    member,
    category,
    permissionLevel,
    expanded,
    setExpanded,
  }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();
    const { setCategoryExpanded } = useExpandedContext();
    // Variables
    const { channels: serverChannels = [] } = server;
    const { id: userId } = user;
    const { id: serverId } = server;
    const {
      id: categoryId,
      name: categoryName,
      visibility: categoryVisibility,
    } = category;
    const categoryChannels = serverChannels
      .filter((ch) => ch.type === 'channel')
      .filter((ch) => ch.categoryId === categoryId);
    const canEdit = permissionLevel >= 5;
    const userInCategory = categoryChannels.some(
      (ch) => ch.id === user.currentChannelId,
    );

    // Handlers
    const handleOpenEditChannel = (
      channelId: Channel['id'],
      serverId: Server['id'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_CHANNEL);
      ipcService.initialData.onRequest(PopupType.EDIT_CHANNEL, {
        channelId,
        serverId,
      });
    };

    const handleOpenCreateChannel = (
      serverId: Server['id'],
      categoryId: Category['id'],
      userId: User['id'],
    ) => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        serverId,
        categoryId,
        userId,
      });
    };

    const handleOpenWarning = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(PopupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: message,
        submitTo: PopupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_WARNING, () =>
        handleDeleteChannel(categoryId, serverId),
      );
    };

    const handleDeleteChannel = (
      channelId: Channel['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.deleteChannel({ channelId, serverId });
    };

    // Effect
    useEffect(() => {
      if (setCategoryExpanded && userInCategory)
        setCategoryExpanded.current = () =>
          setExpanded((prev) => ({
            ...prev,
            [categoryId]: true,
          }));
    }, [categoryId, setCategoryExpanded, setExpanded, userInCategory]);

    return (
      <>
        {/* Category View */}
        <div
          key={categoryId}
          className={`
            ${styles['channelTab']} 
            ${expanded[categoryId] ? styles['expanded'] : ''} 
            ${styles[categoryVisibility]}
          `}
          onClick={() =>
            setExpanded((prev) => ({
              ...prev,
              [categoryId]: !prev[categoryId],
            }))
          }
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'edit',
                label: lang.tr.editChannel,
                show: canEdit,
                onClick: () => handleOpenEditChannel(categoryId, serverId),
              },
              {
                id: 'add',
                label: lang.tr.addChannel,
                show: canEdit,
                onClick: () =>
                  handleOpenCreateChannel(serverId, categoryId, userId),
              },
              {
                id: 'delete',
                label: lang.tr.deleteChannel,
                show: canEdit,
                onClick: () => handleOpenWarning(lang.tr.warningDeleteChannel),
              },
            ]);
          }}
        >
          <div className={styles['channelTabLable']}>{categoryName}</div>
          {!expanded[categoryId] && userInCategory && (
            <div className={styles['myLocationIcon']} />
          )}
        </div>

        {/* Expanded Sections */}
        {expanded[categoryId] && (
          <div className={styles['channelList']}>
            {categoryChannels
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((channel) => (
                <ChannelTab
                  key={channel.id}
                  user={user}
                  server={server}
                  member={member}
                  channel={channel}
                  permissionLevel={permissionLevel}
                  expanded={expanded}
                  setExpanded={setExpanded}
                />
              ))}
          </div>
        )}
      </>
    );
  },
);

CategoryTab.displayName = 'CategoryTab';

interface ChannelTabProps {
  user: User;
  server: Server;
  member: Member;
  channel: Channel;
  permissionLevel: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(
  ({
    user,
    server,
    member,
    channel,
    permissionLevel,
    expanded,
    setExpanded,
  }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();
    const { setChannelExpanded } = useExpandedContext();
    // Variables
    const { id: userId } = user;
    const { id: serverId, members: serverMembers = [] } = server;
    const {
      id: channelId,
      name: channelName,
      isRoot: channelIsRoot,
      isLobby: channelIsLobby,
      visibility: channelVisibility,
      userLimit: channelUserLimit,
    } = channel;
    const { permissionLevel: userPermission } = member;
    const channelMembers = serverMembers.filter(
      (mb) => mb.currentChannelId === channelId,
    );
    const userInChannel = user.currentChannelId === channelId;
    const canEdit = permissionLevel >= 5;
    const canJoin =
      !userInChannel &&
      channelVisibility !== 'readonly' &&
      !(channelVisibility === 'private' && permissionLevel < 3) &&
      !(channelVisibility === 'member' && permissionLevel < 2) &&
      (channelUserLimit === 0 ||
        channelUserLimit > channelMembers.length ||
        userPermission > 4);

    // Handlers
    const handleOpenEditChannel = (
      channelId: Channel['id'],
      serverId: Server['id'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_CHANNEL);
      ipcService.initialData.onRequest(PopupType.EDIT_CHANNEL, {
        channelId,
        serverId,
      });
    };

    const handleOpenCreateChannel = (
      serverId: Server['id'],
      categoryId: Channel['id'],
      userId: User['id'],
    ) => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        serverId,
        categoryId,
        userId,
      });
    };

    const handleOpenWarning = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(PopupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: message,
        submitTo: PopupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_WARNING, () =>
        handleDeleteChannel(channelId, serverId),
      );
    };

    const handleDeleteChannel = (
      channelId: Channel['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.deleteChannel({ channelId, serverId });
    };

    const handleJoinChannel = (
      userId: User['id'],
      channelId: Channel['id'],
    ) => {
      if (!socket) return;
      socket.send.connectChannel({ userId, channelId });
    };

    // Effect
    useEffect(() => {
      if (setChannelExpanded && userInChannel)
        setChannelExpanded.current = () =>
          setExpanded((prev) => ({
            ...prev,
            [channelId]: true,
          }));
    }, [channelId, setChannelExpanded, setExpanded, userInChannel]);

    return (
      <>
        {/* Channel View */}
        <div
          key={channelId}
          className={`
            ${styles['channelTab']} 
            ${expanded[channelId] ? styles['expanded'] : ''} 
            ${channelIsLobby ? styles['lobby'] : styles[channelVisibility]} 
          `}
          onDoubleClick={() => {
            if (canJoin) handleJoinChannel(userId, channelId);
          }}
          onClick={() =>
            setExpanded((prev) => ({
              ...prev,
              [channelId]: !prev[channelId],
            }))
          }
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'edit',
                label: lang.tr.editChannel,
                show: canEdit,
                onClick: () => handleOpenEditChannel(channelId, serverId),
              },
              {
                id: 'add',
                label: lang.tr.addChannel,
                show: canEdit && !channelIsLobby && channelIsRoot,
                onClick: () =>
                  handleOpenCreateChannel(serverId, channelId, userId),
              },
              {
                id: 'delete',
                label: lang.tr.deleteChannel,
                show: canEdit && !channelIsLobby,
                onClick: () => handleOpenWarning(lang.tr.warningDeleteChannel),
              },
            ]);
          }}
        >
          <div className={styles['channelTabLable']}>{channelName}</div>
          {channelVisibility !== 'readonly' && (
            <div className={styles['channelTabCount']}>
              {`(${channelMembers.length}${
                channelUserLimit > 0 ? `/${channelUserLimit}` : ''
              })`}
            </div>
          )}
          {userInChannel && !expanded[channelId] && (
            <div className={styles['myLocationIcon']} />
          )}
        </div>

        {/* Expanded Sections */}
        {expanded[channelId] && (
          <div className={styles['userList']}>
            {channelMembers
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((channelMember) => (
                <UserTab
                  key={channelMember.id}
                  user={user}
                  channelMember={channelMember}
                  permissionLevel={permissionLevel}
                />
              ))}
          </div>
        )}
      </>
    );
  },
);

ChannelTab.displayName = 'ChannelTab';

interface UserTabProps {
  user: User;
  channelMember: ServerMember;
  permissionLevel: number;
}

const UserTab: React.FC<UserTabProps> = React.memo(
  ({ user, channelMember, permissionLevel }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();
    const socket = useSocket();
    // const webRTC = useWebRTC();

    // Variables
    const { id: userId } = user;
    const {
      id: channelMemberId,
      name: channelMemberName,
      serverId: channelMemberServerId,
      permissionLevel: channelMemberPermission,
      nickname: channelMemberNickname,
      userId: channelMemberUserId,
      level: channelMemberLevel,
      gender: channelMemberGender,
      badges: channelMemberBadges = [],
    } = channelMember;
    const channelMemberGrade = Math.min(56, Math.ceil(channelMemberLevel / 5)); // 56 is max leve
    const isCurrentUser = userId === channelMemberUserId;
    const canEdit = permissionLevel > channelMemberPermission;
    // const isSpeaking = isCurrentUser
    //   ? webRTC.speakingUsers?.includes('local')
    //   : webRTC.speakingUsers?.includes(channelMemberUserId);
    // console.log(channelMemberUserId, webRTC.speakingUsers);

    // Handlers
    const handleOpenEditMember = (
      serverId: Server['id'],
      userId: User['id'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_MEMBER);
      ipcService.initialData.onRequest(PopupType.EDIT_MEMBER, {
        serverId,
        userId,
      });
    };

    const handleUpdateMember = (
      member: Partial<Member>,
      userId: User['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.updateMember({
        member,
        userId,
        serverId,
      });
    };

    return (
      <div
        key={channelMemberId}
        className={`${styles['userTab']}`}
        onDoubleClick={(e) => {
          contextMenu.showUserInfoBlock(e.pageX, e.pageY, channelMember);
        }}
        onContextMenu={(e) => {
          contextMenu.showContextMenu(e.pageX, e.pageY, [
            {
              id: 'edit-nickname',
              label: '修改群名片',
              onClick: () =>
                handleOpenEditMember(
                  channelMember.serverId,
                  channelMemberUserId,
                ),
              show: isCurrentUser || canEdit,
            },
            {
              id: 'separator',
              label: '',
              show: !isCurrentUser && canEdit,
            },
            {
              id: 'member-management',
              label: lang.tr.memberManagement,
              show: !isCurrentUser && canEdit,
              icon: 'submenu',
              hasSubmenu: true,
              submenuItems: [
                {
                  id: 'set-guest',
                  label: lang.tr.setGuest,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 1 },
                      channelMemberUserId,
                      channelMemberServerId,
                    ),
                },
                {
                  id: 'set-member',
                  label: lang.tr.setMember,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 2 },
                      channelMemberUserId,
                      channelMemberServerId,
                    ),
                },
                {
                  id: 'set-channel-admin',
                  label: lang.tr.setChannelAdmin,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 3 },
                      channelMemberUserId,
                      channelMemberServerId,
                    ),
                },
                {
                  id: 'set-category-admin',
                  label: lang.tr.setCategoryAdmin,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 4 },
                      channelMemberUserId,
                      channelMemberServerId,
                    ),
                },
                {
                  id: 'set-admin',
                  label: lang.tr.setAdmin,
                  onClick: () =>
                    handleUpdateMember(
                      { permissionLevel: 5 },
                      channelMemberUserId,
                      channelMemberServerId,
                    ),
                },
              ],
            },
          ]);
        }}
      >
        <div className={`${styles['userState']}`} />
        <div
          className={`${styles['userIcon']} ${
            permission[channelMemberGender]
          } ${permission[`lv-${channelMemberPermission}`]}`}
        />
        <div
          className={`${styles['userTabName']} ${
            channelMemberNickname && channelMemberName
              ? styles['channelMemberName']
              : ''
          }`}
        >
          {channelMemberNickname || channelMemberName}
        </div>
        <div
          className={`${styles['userGrade']} ${
            grade[`lv-${channelMemberGrade}`]
          }`}
        />
        <BadgeViewer badges={channelMemberBadges} maxDisplay={3} />
        {isCurrentUser && <div className={styles['myLocationIcon']} />}
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

const ChannelViewer: React.FC<ChannelViewerProps> = React.memo(
  ({ user, server, member, currentChannel }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // States
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [view, setView] = useState<'all' | 'current'>('all');

    // Variables
    const connectStatus = 3;
    const { id: userId } = user;
    const { id: serverId, channels: serverChannels = [] } = server;
    const { permissionLevel: memberPermission } = member;
    const { name: currentChannelName, voiceMode: currentChannelVoiceMode } =
      currentChannel;
    const canEdit = memberPermission >= 5;

    // Handlers
    const handleCreateRootChannel = () => {
      ipcService.popup.open(PopupType.CREATE_CHANNEL);
      ipcService.initialData.onRequest(PopupType.CREATE_CHANNEL, {
        serverId,
        categoryId: null,
        userId,
      });
    };

    // Effect
    useEffect(() => {
      for (const channel of serverChannels) {
        setExpanded((prev) => ({
          ...prev,
          [channel.id]: true,
        }));
      }
    }, [serverChannels]);

    return (
      <div
        style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
        onContextMenu={(e) => {
          if (
            !(e.target as HTMLElement).closest(`.${styles['channelTab']}`) &&
            !(e.target as HTMLElement).closest(`.${styles['categoryTab']}`) &&
            !(e.target as HTMLElement).closest(`.${styles['userTab']}`)
          ) {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'addChannel',
                label: lang.tr.addChannel,
                show: canEdit,
                onClick: handleCreateRootChannel,
              },
            ]);
          }
        }}
      >
        <div style={{ flexGrow: 1, overflow: 'auto' }}>
          {/* Current Channel */}
          <div className={styles['currentChannelBox']}>
            <div
              className={`${styles['currentChannelIcon']} ${
                styles[`status${connectStatus}`]
              }`}
            />
            <div className={styles['currentChannelText']}>
              {currentChannelName}
            </div>
          </div>

          {/* Mic Queue */}
          {currentChannelVoiceMode === 'queue' && (
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
              <div className={styles['saperator-2']} />
            </>
          )}

          {/* Channel List Title */}
          <div className={styles['sectionTitle']}>
            {view === 'current' ? lang.tr.currentChannel : lang.tr.allChannel}
          </div>

          {/* Channel List */}
          <div className={styles['channelList']}>
            {view === 'current' ? (
              <ChannelTab
                key={currentChannel.id}
                user={user}
                server={server}
                member={member}
                channel={currentChannel}
                permissionLevel={memberPermission}
                expanded={{ [currentChannel.id]: true }}
                setExpanded={() => {}}
              />
            ) : (
              serverChannels
                .filter((c) => c.isRoot)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((item) =>
                  item.type === 'category' ? (
                    <CategoryTab
                      key={item.id}
                      user={user}
                      server={server}
                      member={member}
                      category={item}
                      permissionLevel={memberPermission}
                      expanded={expanded}
                      setExpanded={setExpanded}
                    />
                  ) : (
                    <ChannelTab
                      key={item.id}
                      user={user}
                      server={server}
                      member={member}
                      channel={item}
                      permissionLevel={memberPermission}
                      expanded={expanded}
                      setExpanded={setExpanded}
                    />
                  ),
                )
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className={styles['bottomNav']}>
          <div
            className={`${styles['navItem']} ${
              view === 'current' ? styles['active'] : ''
            }`}
            onClick={() => setView('current')}
          >
            {lang.tr.currentChannel}
          </div>
          <div
            className={`${styles['navItem']} ${
              view === 'all' ? styles['active'] : ''
            }`}
            onClick={() => setView('all')}
          >
            {lang.tr.allChannel}
          </div>
        </div>
      </div>
    );
  },
);

ChannelViewer.displayName = 'ChannelViewer';

export default ChannelViewer;

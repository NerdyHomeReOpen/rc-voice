import React, { useRef, useEffect, useState } from 'react';

// CSS
import styles from '@/styles/friendPage.module.css';
import grade from '@/styles/common/grade.module.css';
import vip from '@/styles/common/vip.module.css';
// Types
import {
  PopupType,
  User,
  FriendGroup,
  UserFriend,
  Server,
  // Friend,
} from '@/types';

// Components
import BadgeViewer from '@/components/viewers/Badge';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';

// Services
import ipcService from '@/services/ipc.service';
import { createDefault } from '@/utils/createDefault';
import refreshService from '@/services/refresh.service';

interface FriendGroupTabProps {
  friendGroup: FriendGroup;
  friends: UserFriend[];
  user: User;
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(
  ({ friendGroup, friends, user }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // States
    const [expanded, setExpanded] = useState<boolean>(true);

    // Socket
    const socket = useSocket();

    // Variables
    const {
      id: friendGroupId,
      name: friendGroupName,
      order: friendGroupOrder,
    } = friendGroup;
    const friendGroupFriends =
      friendGroupId === ''
        ? friends
        : friends.filter((fd) => fd.friendGroupId === friendGroupId);
    const friendsInServer = friendGroupFriends.filter(
      (fd) => fd.currentServerId,
    ).length;

    return (
      <div key={friendGroupId}>
        {/* Tab View */}
        <div
          className={styles['tab']}
          onClick={() => setExpanded(!expanded)}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'edit',
                label: lang.tr.editFriendGroup,
                show: friendGroupId !== '',
                onClick: () => {
                  ipcService.popup.open(PopupType.EDIT_FRIEND_GROUP);
                  ipcService.initialData.onRequest(
                    PopupType.EDIT_FRIEND_GROUP,
                    {
                      friendGroupId,
                      friendGroupName,
                      friendGroupOrder,
                    },
                  );
                },
              },
              {
                id: 'delete',
                label: lang.tr.delete,
                show: friendGroupId !== '',
                onClick: () => {
                  // Open Delete Group Modal
                  ipcService.popup.open(PopupType.DIALOG_ALERT);
                  ipcService.initialData.onRequest(PopupType.DIALOG_ALERT, {
                    iconType: 'warning',
                    title: lang.tr.deleteFriendGroupDialog.replace(
                      '{0}',
                      friendGroupName,
                    ),
                    submitTo: PopupType.DIALOG_ALERT,
                  });
                  ipcService.popup.onSubmit(PopupType.DIALOG_ALERT, () => {
                    socket.send.deleteFriendGroup({
                      friendGroupId,
                    });
                  });
                },
              },
            ]);
          }}
        >
          <div
            className={`${styles['toggleIcon']} ${
              expanded ? styles['expanded'] : ''
            }`}
          />
          <span className={styles['tabLable']}>{friendGroupName}</span>
          <span
            className={styles['tabCount']}
          >{`(${friendsInServer}/${friendGroupFriends.length})`}</span>
        </div>

        {/* Expanded Sections */}
        {expanded && friends && (
          <div className={styles['tabContent']}>
            {friendGroupFriends.map((friend) => (
              <FriendCard key={friend.id} user={user} friend={friend} />
            ))}
          </div>
        )}
      </div>
    );
  },
);

FriendGroupTab.displayName = 'FriendGroupTab';

interface FriendCardProps {
  user: User;
  friend: UserFriend;
}

const FriendCard: React.FC<FriendCardProps> = React.memo(({ friend }) => {
  // Hooks
  const lang = useLanguage();
  const contextMenu = useContextMenu();

  // Socket
  const socket = useSocket();

  // Refs
  const refreshed = useRef(false);

  // States
  const [friendServerName, setFriendServerName] = useState<Server['name']>(
    createDefault.server().name,
  );

  // Variables
  const {
    id: friendId,
    name: friendName,
    avatarUrl: friendAvatarUrl,
    signature: friendSignature,
    vip: friendVip,
    level: friendLevel,
    userId: friendUserId,
    targetId: friendTargetId,
    badges: friendBadges = [],
    currentServerId: friendCurrentServerId,
  } = friend;
  const friendGrade = Math.min(56, Math.ceil(friendLevel / 5)); // 56 is max level

  // Handlers
  // const handleOpenDirectMessage = (
  //   userId: User['id'],
  //   targetId: User['id'],
  //   targetName: User['name'],
  // ) => {
  //   ipcService.popup.open(PopupType.DIRECT_MESSAGE);
  //   ipcService.initialData.onRequest(PopupType.DIRECT_MESSAGE, {
  //     userId,
  //     targetId,
  //     targetName,
  //   });
  // };

  // Handlers
  const handleServerUpdate = (server: Server | null) => {
    if (!server) return;
    setFriendServerName(server.name);
  };

  const handleOpenEditFriend = (userId: User['id'], targetId: User['id']) => {
    ipcService.popup.open(PopupType.EDIT_FRIEND);
    ipcService.initialData.onRequest(PopupType.EDIT_FRIEND, {
      userId,
      targetId,
    });
  };

  const handleDeleteFriend = (friendId: UserFriend['id']) => {
    ipcService.popup.open(PopupType.DIALOG_ALERT);
    ipcService.initialData.onRequest(PopupType.DIALOG_ALERT, {
      iconType: 'warning',
      title: lang.tr.deleteFriendDialog.replace('{0}', friendName),
      submitTo: PopupType.DIALOG_ALERT,
    });
    ipcService.popup.onSubmit(PopupType.DIALOG_ALERT, () => {
      socket.send.deleteFriend({
        friendId,
      });
    });
  };

  useEffect(() => {
    if (!friendCurrentServerId || refreshed.current) return;
    const refresh = async () => {
      refreshed.current = true;
      const server = await refreshService.server({
        serverId: friendCurrentServerId,
      });
      handleServerUpdate(server);
    };
    refresh();
  }, [friendCurrentServerId]);

  return (
    <div key={friendId}>
      {/* User View */}
      <div
        className={styles['friendCard']}
        onContextMenu={(e) => {
          contextMenu.showContextMenu(e.pageX, e.pageY, [
            {
              id: 'delete',
              label: lang.tr.deleteFriend,
              onClick: () => handleDeleteFriend(friendId),
            },
            {
              id: 'edit',
              label: '編輯分組',
              onClick: () => handleOpenEditFriend(friendUserId, friendTargetId),
            },
          ]);
        }}
        // onDoubleClick={() => {
        //   handleOpenDirectMessage(friendUserId1, friendUserId2, friendName);
        // }}
      >
        <div
          className={styles['avatarPicture']}
          style={{
            backgroundImage: `url(${friendAvatarUrl})`,
            filter: !friendServerName ? 'grayscale(100%)' : '',
          }}
        />
        <div className={styles['baseInfoBox']}>
          <div className={styles['container']}>
            {friendVip > 0 && (
              <div
                className={`${vip['vipIcon']} ${vip[`vip-small-${friendVip}`]}`}
              />
            )}
            <div className={styles['name']}>{friendName}</div>
            <div
              className={`${grade['grade']} ${grade[`lv-${friendGrade}`]}`}
            />
            <BadgeViewer badges={friendBadges} />
          </div>
          {friendServerName ? (
            <div className={styles['container']}>
              <div className={styles['location']} />
              <div className={styles['serverName']}>{friendServerName}</div>
            </div>
          ) : (
            <div className={styles['signature']}>{friendSignature}</div>
          )}
        </div>
      </div>
    </div>
  );
});

FriendCard.displayName = 'FriendCard';

interface FriendListViewerProps {
  user: User;
}

const FriendListViewer: React.FC<FriendListViewerProps> = React.memo(
  ({ user }) => {
    // Hooks
    const lang = useLanguage();

    // States
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedTabId, setSelectedTabId] = useState<number>(0);

    // Variables
    const {
      id: userId,
      friends: userFriends = [],
      friendGroups: userFriendGroups = [],
    } = user;
    userFriends.sort((a, b) => {
      if (a.currentServerId && !b.currentServerId) return -1;
      if (!a.currentServerId && b.currentServerId) return 1;
      return 0;
    });
    const filteredFriends = userFriends.filter((fd) =>
      fd.name.includes(searchQuery),
    );
    const defaultFriendGroup: FriendGroup = createDefault.friendGroup({
      name: `${lang.tr.myFriends}`,
      order: 0,
      userId,
    });

    // Handlers
    const handleOpenAddFriend = (userId: User['id']) => {
      ipcService.popup.open(PopupType.ADD_FRIEND);
      ipcService.initialData.onRequest(PopupType.ADD_FRIEND, {
        userId,
      });
    };

    const handleOpenAddFriendGroup = () => {
      ipcService.popup.open(PopupType.ADD_FRIEND_GROUP);
      ipcService.initialData.onRequest(PopupType.ADD_FRIEND_GROUP, {
        userId,
      });
    };

    return (
      <>
        {/* Navigation Tabs */}
        <div className={styles['navigateTabs']}>
          <div
            className={`${styles['tab']} ${
              selectedTabId == 0 ? styles['selected'] : ''
            }`}
            onClick={() => setSelectedTabId(0)}
          >
            <div className={styles['friendListIcon']} />
          </div>
          <div
            className={`${styles['tab']} ${
              selectedTabId == 1 ? styles['selected'] : ''
            }`}
            onClick={() => setSelectedTabId(1)}
          >
            <div className={styles['recentIcon']} />
          </div>
        </div>

        {/* Friend List */}
        {selectedTabId == 0 && (
          <div className={styles['friendList']}>
            {/* Search Bar */}
            <div className={styles['searchBar']}>
              <div className={styles['searchIcon']} />
              <input
                type="text"
                placeholder={lang.tr.searchFriend}
                className={styles['searchInput']}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className={styles['prevIcon']} />
              <div className={styles['nextIcon']} />
            </div>
            {/* Friend Groups */}
            <div className={styles['friendGroups']}>
              {[defaultFriendGroup, ...userFriendGroups]
                .sort((a, b) => a.order - b.order)
                .map((friendGroup) => (
                  <FriendGroupTab
                    key={friendGroup.id}
                    user={user}
                    friendGroup={friendGroup}
                    friends={filteredFriends}
                  />
                ))}
            </div>
            {/* Bottom Buttons */}
            <div className={styles['bottomButtons']}>
              <div
                className={styles['button']}
                datatype="addGroup"
                onClick={() => handleOpenAddFriendGroup()}
              >
                {lang.tr.friendAddGroup}
              </div>
              <div
                className={styles['button']}
                datatype="addFriend"
                onClick={() => handleOpenAddFriend(userId)}
              >
                {lang.tr.addFriend}
              </div>
            </div>
          </div>
        )}

        {/* Recent */}
        {selectedTabId == 1 && <div className={styles['recentList']}></div>}
      </>
    );
  },
);

FriendListViewer.displayName = 'FriendListViewer';

export default FriendListViewer;

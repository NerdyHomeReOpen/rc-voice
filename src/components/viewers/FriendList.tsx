import React, { useState } from 'react';

// CSS
import styles from '@/styles/friendPage.module.css';
import grade from '@/styles/common/grade.module.css';

// Types
import { PopupType, User, FriendGroup, UserFriend } from '@/types';

// Components
import BadgeViewer from '@/components/viewers/Badge';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';

interface FriendGroupTabProps {
  friendGroup: FriendGroup;
  friends: UserFriend[];
}

const FriendGroupTab: React.FC<FriendGroupTabProps> = React.memo(
  ({ friendGroup, friends }) => {
    // Hooks
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // States
    const [expanded, setExpanded] = useState<boolean>(true);

    // Variables
    const { id: friendGroupId, name: friendGroupName } = friendGroup;
    const friendGroupFriends = friends.filter(
      (fd) => fd.friendGroupId === friendGroupId,
    );

    return (
      <div key={friendGroupId}>
        {/* Tab View */}
        <div
          className={styles['tab']}
          onClick={() => setExpanded(!expanded)}
          onContextMenu={(e) => {
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'delete',
                label: lang.tr.delete,
                onClick: () => {
                  // Open Delete Group Modal
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
          <span className={styles['tabCount']}>{`(${friends.length})`}</span>
        </div>

        {/* Expanded Sections */}
        {expanded && friends && (
          <div className={styles['tabContent']}>
            {friendGroupFriends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}
      </div>
    );
  },
);

FriendGroupTab.displayName = 'FriendGroupTab';

interface FriendCardProps {
  friend: UserFriend;
}

const FriendCard: React.FC<FriendCardProps> = React.memo(({ friend }) => {
  // Hooks
  const lang = useLanguage();
  const contextMenu = useContextMenu();

  // Variables
  const {
    id: friendId,
    name: friendName,
    avatarUrl: friendAvatarUrl,
    signature: friendSignature,
    level: friendLevel,
    user1Id: friendUserId1,
    user2Id: friendUserId2,
    badges: friendBadges = [],
  } = friend;
  const friendGrade = Math.min(56, Math.ceil(friendLevel / 5)); // 56 is max level

  // Handlers
  const handleOpenDirectMessage = (
    userId: User['id'],
    targetId: User['id'],
  ) => {
    ipcService.popup.open(PopupType.DIRECT_MESSAGE);
    ipcService.initialData.onRequest(PopupType.DIRECT_MESSAGE, {
      userId,
      targetId,
    });
  };

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
              onClick: () => {
                // Open Delete Friend Modal
              },
            },
          ]);
        }}
        onDoubleClick={() => {
          handleOpenDirectMessage(friendUserId1, friendUserId2);
        }}
      >
        <div
          className={styles['avatarPicture']}
          style={{ backgroundImage: `url(${friendAvatarUrl})` }}
        />
        <div className={styles['baseInfoBox']}>
          <div className={styles['container']}>
            <div className={styles['name']}>{friendName}</div>
            <div
              className={`${styles['userGrade']} ${grade[`lv-${friendGrade}`]}`}
            />
            <BadgeViewer badges={friendBadges} />
          </div>
          <div className={styles['signature']}>{friendSignature}</div>
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

    // Variables
    const {
      id: userId,
      friends: userFriends = [],
      friendGroups: userFriendGroups = [],
    } = user;
    const filteredFriends = userFriends.filter((fd) =>
      fd.name.includes(searchQuery),
    );
    const defaultFriendGroup: FriendGroup = {
      id: 'default',
      name: '我的好友',
      order: 0,
      userId,
      createdAt: Date.now(),
      friends: userFriends,
    };

    // States
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedTabId, setSelectedTabId] = useState<number>(0);

    // Handlers
    const handleOpenAddFriend = (userId: User['id'], targetId: User['id']) => {
      ipcService.popup.open(PopupType.ADD_FRIEND);
      ipcService.initialData.onRequest(PopupType.ADD_FRIEND, {
        userId,
        targetId,
      });
    };

    const handleOpenAddSubGroups = () => {
      ipcService.popup.open(PopupType.ADD_FRIEND_SUBGROUPS);
      ipcService.initialData.onRequest(PopupType.ADD_FRIEND_SUBGROUPS, {});
    };

    // const handleOpenCreateGroupPopup = () => {
    //   // ipcService.popup.open(PopupType.CREATE_FRIEND_GROUP);
    // };

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
              {[defaultFriendGroup, ...userFriendGroups].map((friendGroup) => (
                <FriendGroupTab
                  key={friendGroup.id}
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
                onClick={() => handleOpenAddSubGroups()}
              >
                {lang.tr.friendAddGroup}
              </div>
              <div
                className={styles['button']}
                datatype="addFriend"
                onClick={() => handleOpenAddFriend(userId, '_')}
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

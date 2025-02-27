/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/display-name */
import React, { useState } from 'react';
import { Trash } from 'lucide-react';

// CSS
import styles from '@/styles/friendPage.module.css';
import grade from '@/styles/common/grade.module.css';

// Types
import { popupType, type Friend, type FriendGroup } from '@/types';

// Components
import BadgeViewer from '@/components/viewers/BadgeViewer';

//
import { useContextMenu } from '@/components/ContextMenuProvider';
import { ipcService } from '@/services/ipc.service';

interface FriendGroupProps {
  friendGroup: FriendGroup;
  friends: Friend[];
}

const FriendGroup: React.FC<FriendGroupProps> = React.memo(
  ({ friendGroup, friends }) => {
    // Expanded Control
    const [expanded, setExpanded] = useState<boolean>(true);

    // Context Menu
    const contextMenu = useContextMenu();

    const groupName = friendGroup.name;
    const groupFriends = friends.filter(
      (friend) => friend.groupId == friendGroup.id,
    );

    return (
      <div key={friendGroup.id}>
        {/* Tab View */}
        <div
          className={styles['tab']}
          onClick={() => setExpanded(!expanded)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            contextMenu.showContextMenu(e.pageX, e.pageY, [
              {
                id: 'delete',
                icon: <Trash size={14} className="w-5 h-5 mr-2" />,
                label: '刪除',
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
          <span className={styles['tabLable']}>{groupName}</span>
          <span
            className={styles['tabCount']}
          >{`(${groupFriends.length})`}</span>
        </div>

        {/* Expanded Sections */}
        {expanded && groupFriends && (
          <div className={styles['tabContent']}>
            {groupFriends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}
      </div>
    );
  },
);

interface FriendCardProps {
  friend: Friend;
}
const FriendCard: React.FC<FriendCardProps> = React.memo(({ friend }) => {
  // Context Menu Control
  const contextMenu = useContextMenu();

  const friendUser = friend.user;
  const friendLevel = Math.min(56, Math.ceil((friendUser?.level ?? 0) / 5)); // 56 is max level
  const friendAvatarUrl = friendUser?.avatarUrl;
  const friendName = friendUser?.name;
  const friendBadges = friendUser?.badges ?? [];
  const friendSignature = friendUser?.signature ?? '';

  return (
    <div key={friend.id}>
      {/* User View */}
      <div
        className={styles['friendCard']}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          contextMenu.showContextMenu(e.pageX, e.pageY, [
            {
              id: 'delete',
              icon: <Trash size={14} className="w-5 h-5 mr-2" />,
              label: '刪除好友',
              onClick: () => {
                // Open Delete Friend Modal
              },
            },
          ]);
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          ipcService.popup.open(popupType.DIRECT_MESSAGE, 600, 450);
        }}
      >
        <div
          className={styles['avatarPicture']}
          style={
            friendAvatarUrl
              ? { backgroundImage: `url(${friendAvatarUrl})` }
              : {}
          }
        />
        <div className={styles['baseInfoBox']}>
          <div className={styles['container']}>
            <div className={styles['name']}>{friendName}</div>
            <div
              className={`${styles['userGrade']} ${grade[`lv-${friendLevel}`]}`}
            />
            <BadgeViewer badges={friendBadges} />
          </div>
          <div className={styles['signature']}>{friendSignature}</div>
        </div>
      </div>
    </div>
  );
});

interface FriendListViewerProps {
  friendGroups: FriendGroup[] | null;
  friends: Friend[] | null;
}

const FriendListViewer: React.FC<FriendListViewerProps> = React.memo(
  ({ friendGroups, friends }) => {
    if (!friendGroups) return null;

    // Search Control
    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredFriends =
      friends?.filter((friend) => friend.user?.name.includes(searchQuery)) ??
      [];

    // Tab Control
    const [selectedTabId, setSelectedTabId] = useState<number>(0);

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
                placeholder="搜尋好友"
                className={styles['searchInput']}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className={styles['prevIcon']} />
              <div className={styles['nextIcon']} />
            </div>
            {/* Friend Groups */}
            <div className={styles['friendGroups']}>
              {friendGroups.map((group) => (
                <FriendGroup
                  key={group.id}
                  friendGroup={group}
                  friends={filteredFriends}
                />
              ))}
            </div>
            {/* Bottom Buttons */}
            <div className={styles['bottomButtons']}>
              <div className={styles['button']} datatype="addGroup">
                添加分組
              </div>
              <div className={styles['button']} datatype="addFriend">
                新增好友
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

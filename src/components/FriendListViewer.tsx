/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Trash } from 'lucide-react';

// CSS
import styles from '@/styles/friendPage.module.css';
import lv from '@/styles/common/level.module.css';

// Types
import type { Friend, FriendCategory } from '@/types';

// Components
import BadgeViewer from '@/components/BadgeViewer';
import ContextMenu from '@/components/ContextMenu';

// Modal
import DirectMessageModal from '@/modals/DirectMessageModal';

interface ContextMenuPosState {
  x: number;
  y: number;
}

interface FriendGroupProps {
  category: FriendCategory;
}
const FriendGroup: React.FC<FriendGroupProps> = React.memo(({ category }) => {
  // Expanded Control
  const [expanded, setExpanded] = useState<boolean>(true);

  // Context Menu Control
  const [contentMenuPos, setContentMenuPos] = useState<ContextMenuPosState>({
    x: 0,
    y: 0,
  });
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);

  // Modal Control

  const categoryName = category.name;
  const categoryFriends = category.friends || [];

  return (
    <div key={category.id}>
      {/* Tab View */}
      <div
        className={styles['tab']}
        onDoubleClick={() => {}} // Open Chat Maybe?
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowContextMenu(true);
          setContentMenuPos({ x: e.pageX, y: e.pageY });
        }}
      >
        <div
          className={`${styles['toggleIcon']} ${
            expanded ? styles['expanded'] : ''
          }`}
          onClick={() => setExpanded(!expanded)}
        />
        <span className={styles['tabLable']}>{categoryName}</span>
        <span
          className={styles['tabCount']}
        >{`(${categoryFriends.length})`}</span>
      </div>

      {/* Expanded Sections */}
      {expanded && category.friends && (
        <div className={styles['tabContent']}>
          {categoryFriends.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          onClose={() => setShowContextMenu(false)}
          x={contentMenuPos.x}
          y={contentMenuPos.y}
          items={[
            {
              id: 'delete',
              icon: <Trash size={14} className="w-5 h-5 mr-2" />,
              label: '刪除',
              onClick: () => {
                setShowContextMenu(false);
                // Open Delete Group Modal
              },
            },
          ]}
        />
      )}

      {/* Delete Group Modal */}
    </div>
  );
});

interface FriendCardProps {
  friend: Friend;
}
const FriendCard: React.FC<FriendCardProps> = React.memo(({ friend }) => {
  // Context Menu Control
  const [contentMenuPos, setContentMenuPos] = useState<ContextMenuPosState>({
    x: 0,
    y: 0,
  });
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);

  // Modal Control
  const [showDeleteFriendModal, setShowDeleteFriendModal] =
    useState<boolean>(false);
  const [showDirectMessageModal, setShowDirectMessageModal] =
    useState<boolean>(false);

  const friendUser = friend.user;
  const friendLevel = Math.min(56, Math.ceil((friendUser?.level ?? 0) / 5)); // 56 is max level
  const friendAvatarUrl = friendUser?.avatarUrl ?? '/pfp/default.png';
  const friendGradeUrl = `/UserGrade_${friendLevel}.png`;
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
          setShowContextMenu(true);
          setContentMenuPos({ x: e.pageX, y: e.pageY });
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowDirectMessageModal(true);
        }}
      >
        <div className={styles['avatarPicture']} />
        <div className={styles['baseInfoWrapper']}>
          <div className={styles['baseInfoBox']}>
            <div className={styles['name']}>{friendName}</div>
            <div className={`${styles['userGrade']} ${lv[friendLevel]}`} />
            <BadgeViewer badges={friendBadges} />
          </div>
          <div className={styles['signature']}>{friendSignature}</div>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu
          onClose={() => setShowContextMenu(false)}
          x={contentMenuPos.x}
          y={contentMenuPos.y}
          items={[
            {
              id: 'delete',
              icon: <Trash size={14} className="w-5 h-5 mr-2" />,
              label: '刪除好友',
              onClick: () => {
                setShowContextMenu(false);
                // Open Delete Friend Modal
              },
            },
          ]}
        />
      )}

      {/* Delete Friend Moda */}

      {/* Direct Message Modal */}
      {showDirectMessageModal && (
        <div>
          <DirectMessageModal
            friend={friend}
            onClose={() => setShowDirectMessageModal(false)}
          />
        </div>
      )}
    </div>
  );
});

interface FriendListViewerProps {
  friendCategories: FriendCategory[] | null;
}

const FriendListViewer: React.FC<FriendListViewerProps> = React.memo(
  ({ friendCategories }) => {
    if (!friendCategories) return null;

    // Search Control
    const [searchQuery, setSearchQuery] = useState<string>('');

    const userFriendCategories = friendCategories.map((category) => ({
      ...category,
      friends: category.friends
        ? category.friends.filter(
            (friend) =>
              friend.user?.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) || searchQuery === '',
          )
        : null,
    }));

    //
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
              {userFriendCategories.map((category) => (
                <FriendGroup key={category.id} category={category} />
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

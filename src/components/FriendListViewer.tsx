import React, { useState } from 'react';
import {
  Plus,
  Minus,
  MoreVertical,
  Users,
  History,
  Search,
  FolderPlus,
  UserPlus,
  Trash,
} from 'lucide-react';

// Types
import type { Friend, FriendCategory, User } from '@/types';

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
    <div key={category.id} className="mb">
      {/* Tab View */}
      <div
        className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
        onDoubleClick={() => {}} // Open Chat Maybe?
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowContextMenu(true);
          setContentMenuPos({ x: e.pageX, y: e.pageY });
        }}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center outline outline-1 outline-gray-200 mr-1 cursor-pointer`}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <Minus size={12} /> : <Plus size={12} />}
          </div>
          <span className={`truncate`}>{categoryName}</span>
          <span className="ml-1 text-gray-500 text-sm">
            {`(${categoryFriends.length})`}
          </span>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowContextMenu(true);
            setContentMenuPos({ x: e.pageX, y: e.pageY });
          }}
        >
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Expanded Sections */}
      {expanded && category.friends && (
        <div className="ml-6">
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
  const friendGradeUrl = `/usergrade_${friendLevel}.png`;
  const friendName = friendUser?.name;
  const friendBadges = friendUser?.badges ?? [];
  const friendSignature = friendUser?.signature ?? '';

  return (
    <div key={friend.id}>
      {/* User View */}
      <div
        className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
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
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={`w-14 h-14 bg-gray-200 rounded-sm flex items-center justify-center mr-1`}
          >
            <img src={friendAvatarUrl} className="select-none" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center flex-1 min-w-0">
              <span className="truncate">{friendName}</span>
              <div
                className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center ml-1`}
              >
                <img src={friendGradeUrl} className="select-none" />
              </div>
              <div className="flex items-center space-x-1 ml-2 gap-1">
                {friendBadges.length > 0 && (
                  <BadgeViewer badges={friendBadges} maxDisplay={3} />
                )}
              </div>
            </div>
            <div className="flex items-center flex-1 min-w-0 ">
              <span className="truncate text-gray-500">{friendSignature}</span>
            </div>
          </div>
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

    return (
      <>
        {/* Navigation Tabs */}
        <div className="flex border-b">
          <button className="flex-1 p-2 hover:bg-gray-100">
            <Users className="w-5 h-5 mx-auto text-gray-600" />
          </button>
          <button className="flex-1 p-2 hover:bg-gray-100">
            <History className="w-5 h-5 mx-auto text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="w-full pl-8 pr-3 py-1 border-b relative">
          <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋好友"
            className="w-full rounded focus:outline-none"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Friend List */}
        <div className="flex flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar-thumb]:bg-transparent scrollbar-none">
          {userFriendCategories.map((category) => (
            <FriendGroup key={category.id} category={category} />
          ))}
        </div>

        {/* Bottom Buttons */}
        <div className="flex border-t">
          <button className="flex-1 p-2 text-blue-500 hover:bg-gray-100 flex items-center justify-center">
            <FolderPlus className="w-4 h-4 mr-1" />
            添加分组
          </button>
          <button className="flex-1 p-2 text-blue-500 hover:bg-gray-100 flex items-center justify-center">
            <UserPlus className="w-4 h-4 mr-1" />
            添加好友
          </button>
        </div>
      </>
    );
  },
);

FriendListViewer.displayName = 'FriendListViewer';

export default FriendListViewer;

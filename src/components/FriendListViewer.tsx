import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Plus,
  Minus,
  MoreVertical,
  Users,
  History,
  Search,
  FolderPlus,
  UserPlus,
} from 'lucide-react';

// Types
import type { FriendCategory, User, UserList } from '@/types';

// Components
import BadgeViewer from '@/components/BadgeViewer';

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
          // Open Context Menu
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
    </div>
  );
});

interface FriendCardProps {
  friend: User;
}
const FriendCard: React.FC<FriendCardProps> = React.memo(({ friend }) => {
  const friendLevel = Math.min(56, Math.ceil(friend.level / 5)); // 56 is max level
  const friendAvatarUrl = friend.avatarUrl ?? '/pfp/default.png';
  const friendName = friend.name;
  const friendBadges = friend.badges || [];
  const friendSignature = friend.signature || '';

  return (
    <div key={friend.id}>
      {/* User View */}
      <div className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none">
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={`w-14 h-14 bg-gray-200 rounded-sm flex items-center justify-center mr-1`}
          >
            <img
              src={friendAvatarUrl}
              alt={`${friendName} Avatar`}
              className="select-none"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center flex-1 min-w-0">
              <span className="truncate">{friendName}</span>
              <div
                className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center ml-1`}
              >
                <img
                  src={`/usergrade_${friendLevel}.png`}
                  alt={`usergrade_${friendLevel}`}
                  className="select-none"
                />
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
    </div>
  );
});

const FriendListViewer: React.FC = React.memo(() => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);

  // Search Control
  const [searchQuery, setSearchQuery] = useState<string>('');

  const userFriendCategories = (user.friendCategories || []).map(
    (category) => ({
      ...category,
      friends: category.friends
        ? category.friends.filter(
            (friend) =>
              friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              searchQuery === '',
          )
        : null,
    }),
  );

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

      <div
        className="p-2 flex items-center justify-between text-gray-400 text-xs select-none"
        onContextMenu={(e) => {
          e.preventDefault();
          //   setContentMenuPos({ x: e.pageX, y: e.pageY });
          //   setShowContextMenu2(true);
        }}
      >
        所有好友
      </div>
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
});

FriendListViewer.displayName = 'FriendListViewer';

export default FriendListViewer;

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
import type { User, UserList } from '@/types';

interface ContextMenuPosState {
  x: number;
  y: number;
}

interface FriendGroupProps {
  friendList: UserList;
  tab: {
    id: string;
    name: string;
    friendIds: string[];
  };
}
const FriendGroup: React.FC<FriendGroupProps> = React.memo(
  ({ friendList, tab }) => {
    // Expanded Control
    const [expanded, setExpanded] = useState<boolean>(true);

    return (
      <div key={tab.id} className="mb">
        {/* Tab View */}
        <div
          className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none"
          onDoubleClick={() => {}} // Open Chat Maybe?
          onContextMenu={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // Open Context Menu
          }}
        >
          <div className="flex items-center flex-1 min-w-0">
            <div
              className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center outline outline-1 outline-gray-200 mr-1 cursor-pointer`}
              onClick={() => setExpanded((prevExpanded) => !prevExpanded)}
            >
              {expanded ? <Minus size={12} /> : <Plus size={12} />}
            </div>
            <span className={`truncate`}>{tab.name}</span>
            <span className="ml-1 text-gray-500 text-sm">
              {`(${tab.friends?.length || 0})`}
            </span>

          </div>
          <button
            className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 p-1 rounded"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <MoreVertical size={14} />
          </button>
        </div>

        {/* Expanded Sections */}
        {expanded && tab.friends && (
          <div className="ml-6">
            {tab.friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        )}
      </div>
    );
  },
);

interface FriendCardProps {
  friend: User;
}
const FriendCard: React.FC<FriendCardProps> = React.memo(({ friend }) => {
  if (!friend) return <></>;

  const userLevel = Math.min(56, Math.ceil(friend.level / 5)); // 56 is max level
  return (
    <div key={friend.id}>
      {/* User View */}
      <div className="flex p-1 pl-3 items-center justify-between hover:bg-gray-100 group select-none">
        <div className="flex items-center flex-1 min-w-0">
          <div
            className={`w-14 h-14 bg-gray-200 rounded-sm flex items-center justify-center mr-1`}
          >
            <img
              src={friend.avatar ?? '/pfp/default.png'}
              alt={friend.avatar ?? '/pfp/default.png'}
              className="select-none"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center flex-1 min-w-0">
              <span className="truncate">{friend.name}</span>
              <div
                className={`min-w-3.5 min-h-3.5 rounded-sm flex items-center justify-center ml-1`}
              >
                <img
                  src={`/usergrade_${userLevel}.png`}
                  alt={`/usergrade_${userLevel}`}
                  className="select-none"
                />
              </div>
            </div>
            <div className="flex items-center flex-1 min-w-0 ">
              <span className="truncate text-gray-500">{friend.signature}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

interface FriendListViewerProps {}
const FriendListViewer: React.FC<FriendListViewerProps> = React.memo(() => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const friendList = useSelector(
    (state: { friendList: UserList }) => state.friendList,
  );
  const tabs = user.friendships.map((friendGroup) => {
    return {
      id: friendGroup.id,
      name: friendGroup.name,
      friends: friendGroup.friends,
    };
  });

  // Search Control
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserList>({});

  useEffect(() => {
    if (searchQuery) {
      const getResults = (friendList: UserList) => {
        return Object.values(friendList)
          .filter((friend) =>
            friend.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .reduce((acc, friend) => {
            acc[friend.id] = friend;
            return acc;
          }, {} as UserList);
      };
      setSearchResults(getResults(friendList));
    } else {
      setSearchResults(friendList);
    }
  }, [searchQuery, friendList]);

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
          e.stopPropagation();
          e.preventDefault();
          //   setContentMenuPos({ x: e.pageX, y: e.pageY });
          //   setShowContextMenu2(true);
        }}
      >
        所有好友
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar-thumb]:bg-transparent scrollbar-none">
        {tabs.map((tab) => (
          <FriendGroup key={tab.id} friendList={searchResults} tab={tab} />
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

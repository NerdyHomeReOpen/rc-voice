import React from 'react';
import type { User, Server } from '@/types';

interface UserInfoBlockProps {
  user: User;
  server: Server;
  style: {
    left: number;
    top: number;
  };
}

const UserInfoBlock: React.FC<UserInfoBlockProps> = ({ user, server, style }) => {
  const userPermission = server.permissions[user.id] || 1;
  const userLevel = Math.min(56, Math.ceil(user.level / 5));

  return (
    <div
      className="fixed w-[250px] h-[180px] bg-white border border-gray-200 rounded-md shadow-lg z-50"
      style={style}
    >
      <div className="flex flex-col h-full">
        {/* 上半部分 */}
        <div className="flex p-3 h-[90px]">
          {/* 左側頭像 */}
          <div className="w-[60px] h-[60px] flex items-center justify-center">
            <img
              src={`/channel/${user.gender}_${userPermission}.png`}
              alt={`${user.gender}_${userPermission}`}
              className="select-none w-full h-full object-contain"
            />
          </div>

          {/* 右側信息 */}
          <div className="flex-1 ml-3 relative">
            <div className="flex justify-between items-start">
              <span className="font-medium truncate">{user.name}</span>
              {user.level > 1 && (
                <img
                  src={`/usergrade_${userLevel}.png`}
                  alt={`/usergrade_${userLevel}`}
                  className="select-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* 分隔線 */}
        <div className="h-[1px] bg-gray-200 mx-3" />

        {/* 下半部分 */}
        <div className="h-[60px] p-3">
          <div className="text-sm">
            <div className="min-w-3.5 min-h-3.5 rounded-sm flex items-center mr-1">
              <img
                src={`/channel/${user.gender}_${userPermission}.png`}
                alt={`${user.gender}_${userPermission}`}
                className="select-none"
              />
            </div>
            <div className="mt-1">貢獻：{0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoBlock; 
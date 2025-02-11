import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

// Types
import type { User, Server } from '@/types';

interface UserInfoBlockProps {
  onClose: () => void;
  x: number;
  y: number;
  user: User;
}

const UserInfoBlock: React.FC<UserInfoBlockProps> = React.memo(
  ({ onClose, x, y, user }) => {
    // Redux
    const server = useSelector((state: { server: Server }) => state.server);

    // Ref
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (!ref.current?.contains(e.target as Node)) onClose();
      };

      window.addEventListener('click', handleClick);
      // window.addEventListener('contextmenu', handleClick);
      return () => {
        window.removeEventListener('click', handleClick);
        // window.addEventListener('contextmenu', handleClick);
      };
    }, [onClose]);

    const userGender = user.gender;
    const userPermission = server.members?.[user.id].permissionLevel ?? 1;
    const userLevel = Math.min(56, Math.ceil(user.level / 5));

    return (
      <div
        className="fixed w-[250px] h-[180px] bg-white border border-gray-200 rounded-md shadow-lg z-50"
        style={{
          top: `${y}px`,
          left: `${x}px`,
        }}
        ref={ref}
      >
        <div className="flex flex-col h-full">
          {/* Top Section */}
          <div className="flex p-3 h-[90px]">
            {/* Left Avatar */}
            <div className="w-[60px] h-[60px] flex items-center justify-center">
              <img
                src={`${user.avatarUrl ?? '/pfp/default.png'}`}
                alt={`${user.name} Avatar`}
                className="select-none w-full h-full object-contain"
              />
            </div>

            {/* Right Info */}
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
          {/* Separator */}
          <div className="h-[1px] bg-gray-200 mx-3" />
          {/* Bottom Section */}
          <div className="h-[60px] p-3">
            <div className="text-sm">
              <div className="min-w-3.5 min-h-3.5 rounded-sm flex items-center mr-1">
                <img
                  src={`/channel/${userGender}_${userPermission}.png`}
                  alt={`${userGender}_${userPermission}`}
                  className="select-none"
                />
              </div>
              <div className="mt-1">貢獻：{0}</div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

UserInfoBlock.displayName = 'UserInfoBlock';

export default UserInfoBlock;

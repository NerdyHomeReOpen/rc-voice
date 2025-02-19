/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @next/next/no-img-element */
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ArrowUp } from 'lucide-react';

// Components
import BadgeViewer from '@/components/viewers/BadgeViewer';

// Types
import type { User, Server } from '@/types';
import { getPermissionText } from '@/utils/formatters';

interface UserInfoBlockProps {
  user: User | null;
  x?: number;
  y?: number;
  onClose: () => void;
}

const UserInfoBlock: React.FC<UserInfoBlockProps> = React.memo(
  ({ onClose, x, y, user }) => {
    if (!user) return null;

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
    const userXpProgress = user.xpInfo?.progress ?? 0;
    const userBadges = user.badges ?? [];

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
                <div className="flex items-center min-w-0 mr-2">
                  <span className="truncate">{user.name}</span>
                  {user.level && (
                    <img
                      src={`/UserGrade_${userLevel}.png`}
                      alt={`/UserGrade_${userLevel}`}
                      className="select-none ml-1 mt-0.5"
                    />
                  )}
                </div>

                {userBadges.length > 0 && (
                  <div className="select-none mt-0.5 flex-shrink-0">
                    <BadgeViewer badges={userBadges} maxDisplay={3} />
                  </div>
                )}
              </div>
              {/** Show xp progress */}
              <div className="h-[6px] bg-gray-200 rounded-sm mt-2">
                <div
                  className="h-full bg-blue-500 rounded-sm"
                  style={{
                    width: `${userXpProgress}%`,
                  }}
                />
                {/** Xp */}
                <div className="absolute flex justify-between w-full text-xs">
                  <div>0</div>
                  <div
                    style={{
                      position: 'absolute',
                      left: `${userXpProgress}%`,
                      transform: 'translateX(-50%) scale(0.8)',
                      bottom: '-25px',
                    }}
                    className="flex flex-col items-center"
                  >
                    <ArrowUp size={12} className="text-blue-500" />
                    <span>{user.xpInfo?.xp}</span>
                  </div>
                  <div>{user.xpInfo?.required}</div>
                </div>
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
                <div className="text-xs ml-1 text-gray-500">
                  {getPermissionText(userPermission)}
                </div>
              </div>
              <div className="mt-1">
                貢獻：{server.members?.[user.id].contribution}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

UserInfoBlock.displayName = 'UserInfoBlock';

export default UserInfoBlock;

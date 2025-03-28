import React from 'react';

// CSS
import userInfoCard from '@/styles/userInfoCard.module.css';
import grade from '@/styles/common/grade.module.css';
import vip from '@/styles/common/vip.module.css';
import permission from '@/styles/common/permission.module.css';

// Components
import BadgeViewer from '@/components/viewers/Badge';

// Types
import type { ServerMember } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

interface UserInfoCardProps {
  x: number;
  y: number;
  member: ServerMember;
}

const UserInfoCard: React.FC<UserInfoCardProps> = React.memo(
  ({ x, y, member }) => {
    // Language
    const lang = useLanguage();

    const {
      name: memberName,
      avatarUrl: memberAvatarUrl,
      gender: memberGender,
      level: memberLevel,
      progress: memberXpProgress,
      requiredXp: memberRequiredXp,
      badges: memberBadges = [],
      permissionLevel: memberPermission,
      contribution: memberContributions,
      nickname: memberNickname,
    } = member;
    const memberGrade = Math.min(56, Math.ceil(memberLevel / 5));
    const memberVip = 0;

    return (
      <div
        className={`${userInfoCard['userInfoCard']} ${
          userInfoCard[`vip-${memberVip}`]
        }`}
        style={{ top: y, left: x }}
      >
        <div className={userInfoCard['body']}>
          <div className={userInfoCard['top']}>
            {/* Left Avatar */}
            <div
              className={userInfoCard['avatarPicture']}
              style={{ backgroundImage: `url(${memberAvatarUrl})` }}
            />
            {/* Right Info */}
            <div className={userInfoCard['userInfoWrapper']}>
              <div className={userInfoCard['name']}>{memberName}</div>
              <div className={`${userInfoCard['iconBox']}`}>
                <div
                  className={`${grade['grade']} ${grade[`lv-${memberGrade}`]}`}
                />
                <div
                  className={`${vip['vipIconBig']} ${
                    vip[`vip-big-${memberVip}`]
                  }`}
                />
              </div>
              {/* VIP Info Text */}
              {memberVip > 0 && (
                <div className={userInfoCard['vipText']}>
                  (會員{Math.min(2, 1 + memberVip * 0.2)}倍升級加速中)
                </div>
              )}
              {/* Xp Section */}
              <div className={userInfoCard['xpWrapper']}>
                <div className={userInfoCard['xpBox']}>
                  <div
                    className={userInfoCard['xpProgress']}
                    style={{ width: `${memberXpProgress * 100}%` }}
                  />
                </div>

                <div
                  className={userInfoCard['xpText']}
                  style={{ position: 'relative' }}
                >
                  <div>0</div>
                  <div
                    style={{
                      position: 'absolute',
                      left: `${memberXpProgress * 100}%`,
                      transform: 'translateX(-50%) scale(0.8)',
                    }}
                    className="flex flex-col items-center"
                  />
                  <div>{memberRequiredXp}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className={userInfoCard['bottom']}>
            {/* Member Info Section */}
            <div className={userInfoCard['bottomContent']}>
              {/* First Row - Nickname */}
              <div className={userInfoCard['nicknameRow']}>
                <div className={userInfoCard['nickname']}>{memberNickname}</div>
              </div>

              {/* Second Row - Permission & Contribution */}
              <div className={userInfoCard['infoRow']}>
                {/* Permission */}
                <div className={userInfoCard['permissionWrapper']}>
                  <div
                    className={`${permission[memberGender]} ${
                      permission[`lv-${memberPermission}`]
                    }`}
                  ></div>
                  <div className={userInfoCard['permissionText']}>
                    {lang.getPermissionText(memberPermission)}
                  </div>
                </div>

                <div className={userInfoCard['saperator']} />

                {/* Contribution */}
                <div className={userInfoCard['contributionBox']}>
                  <div className={userInfoCard['contributionText']}>
                    {lang.tr.contribution}:
                  </div>
                  <div className={userInfoCard['contributionValue']}>
                    {memberContributions}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className={userInfoCard['footer']}>
          <BadgeViewer badges={memberBadges} maxDisplay={13} />
        </div>
      </div>
    );
  },
);

UserInfoCard.displayName = 'UserInfoCard';

export default UserInfoCard;

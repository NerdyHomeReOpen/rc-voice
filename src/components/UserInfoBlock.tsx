/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { ArrowUp } from 'lucide-react';

// CSS
import UserInfoCard from '@/styles/common/channelInfoCard.module.css';
import styles from '@/styles/serverPage.module.css';
import Grade from '@/styles/common/grade.module.css';
import Vip from '@/styles/common/vip.module.css';
import Permission from '@/styles/common/permission.module.css';

// Components
import BadgeViewer from '@/components/viewers/BadgeViewer';

// Types
import type { ServerMember } from '@/types';
import { getPermissionText } from '@/utils/formatters';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';

interface MemberInfoBlockProps {
  x: number;
  y: number;
  member: ServerMember;
}

const MemberInfoBlock: React.FC<MemberInfoBlockProps> = React.memo(
  ({ x, y, member }) => {
    // Language
    const lang = useLanguage();

    const memberName = member.name;
    const memberAvatar = member.avatar;
    const memberGender = member.gender;
    const memberLevel = member.level;
    const memberGrade = Math.min(56, Math.ceil(memberLevel / 5));
    const memberXp = member.xp;
    const memberXpProgress = member.progress;
    const memberRequiredXp = member.requiredXp;
    const memberBadges = member.badges || [];
    const memberPermission = member.permissionLevel;
    const memberContributions = member.contribution;

    return (
      <div
        className={`${UserInfoCard['userInfoCard']} ${UserInfoCard['info-card-vip-5']}`}
        style={{ top: y, left: x }}
      >
        <div className={`${UserInfoCard['userInfoHeader']}}`}>
          {/* Left Avatar */}
          <div className={UserInfoCard['userInfoAvatarPicture']}></div>
          {/* Right Info */}
          <div className={UserInfoCard['userInfoRight']}>
            <div className={UserInfoCard['userInfoUsername']}>{memberName}</div>
            <div
              className={`${styles['userGrade']} ${UserInfoCard['userGrade']} ${
                Grade[`lv-${memberGrade}`]
              }`}
            ></div>
            <div className={`${Vip['vipIconBig']} ${Vip['vip-big-5']}`}></div>
            {/* VIP Info Text */}
            <div className={UserInfoCard['userInfoVipText']}>
              (會員%s倍升級加速中)
            </div>

            {/* Xp Section */}
            <div className={UserInfoCard['userInfoXpWrapper']}>
              {/** Show Xp Progress */}
              <div className={UserInfoCard['userInfoXpBox']}>
                <div
                  className={UserInfoCard['userInfoXpProgress']}
                  style={{
                    width: `${memberXpProgress * 100}%`,
                  }}
                />
                {/** Xp Text */}
                <div className={UserInfoCard['userInfoXpText']}>
                  <div>0</div>
                  <div
                    style={{
                      position: 'absolute',
                      left: `${memberXpProgress * 100}%`,
                      transform: 'translateX(-50%) scale(0.8)',
                      bottom: '-25px',
                    }}
                    className="flex flex-col items-center"
                  >
                    <ArrowUp size={12} className="text-blue-500" />
                    <span>{memberXp}</span>
                  </div>
                  <div>{memberRequiredXp}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className={UserInfoCard['userInfoBottom']}>
            <div
              className={`${UserInfoCard['userInfoPermission']} ${
                Permission[memberGender]
              } ${Permission[`lv-${memberPermission}`]}`}
            ></div>
            <div className={UserInfoCard['userInfoPermissionText']}>
              {getPermissionText(memberPermission, lang.tr)}
            </div>
            <div className={styles['saperator']}></div>
            <div className={UserInfoCard['userInfoContributionBox']}>
              <div className={UserInfoCard['userInfoContributionText']}>
                {lang.tr.contribution}:
              </div>
              <div className={UserInfoCard['userInfoContributionTextVal']}>
                {memberContributions}
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className={UserInfoCard['userInfoBadges']}>
            <BadgeViewer badges={memberBadges} maxDisplay={13} />
          </div>
        </div>
      </div>
    );
  },
);

MemberInfoBlock.displayName = 'MemberInfoBlock';

export default MemberInfoBlock;

import React, { useState, useEffect, useRef } from 'react';

// Types
import type { User } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';

// CSS
import grade from '@/styles/common/grade.module.css';
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';
import vip from '@/styles/common/vip.module.css';
// Utils
import { createDefault } from '@/utils/createDefault';
import refreshService from '@/services/refresh.service';
import apiService from '@/services/api.service';

interface UserSettingPopupProps {
  userId: string;
}

const UserSettingPopup: React.FC<UserSettingPopupProps> = React.memo(
  (initialData: UserSettingPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // States
    const [userName, setUserName] = useState<User['name']>(
      createDefault.user().name,
    );
    const [userGender, setUserGender] = useState<User['gender']>(
      createDefault.user().gender,
    );
    const [userSignature, setUserSignature] = useState<User['signature']>(
      createDefault.user().signature,
    );
    const [userAvatar, setUserAvatar] = useState<User['avatar']>(
      createDefault.user().avatar,
    );
    const [userAvatarUrl, setUserAvatarUrl] = useState<User['avatarUrl']>(
      createDefault.user().avatarUrl,
    );
    const [userLevel, setUserLevel] = useState<User['level']>(
      createDefault.user().level,
    );
    const [userVip, setUserVip] = useState<User['vip']>(
      createDefault.user().vip,
    );

    // Variables
    const { userId } = initialData;
    const userGrade = Math.min(56, Math.ceil(userLevel / 5)); // 56 is max level
    const currentYear = new Date().getFullYear();
    const userAge = 20; // REMOVE: only for testing
    const years = Array.from(
      { length: currentYear - 1900 + 1 },
      (_, i) => currentYear - i,
    );
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    // Handlers
    const handleUpdateUser = (user: Partial<User>, userId: User['id']) => {
      if (!socket) return;
      socket.send.updateUser({ user, userId });
    };

    const handleUserUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setUserName(data.name);
      setUserGender(data.gender);
      setUserSignature(data.signature);
      setUserAvatarUrl(data.avatarUrl);
      setUserLevel(data.level);
      setUserVip(data.vip);
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      if (!userId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        const user = await refreshService.user({ userId: userId });
        handleUserUpdate(user);
      };
      refresh();
    }, [userId]);

    return (
      <div className={`${popup['popupContainer']} ${popup['userProfile']}`}>
        <div className={`${popup['popupBody']} ${popup['col']}`}>
          <div className={popup['header']}>
            <div
              className={popup['avatar']}
              style={{ backgroundImage: `url(${userAvatarUrl})` }}
              onClick={() => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const formData = new FormData();
                    formData.append('_type', 'user');
                    formData.append('_fileName', userAvatar);
                    formData.append('_file', reader.result as string);
                    const data = await apiService.post('/upload', formData);
                    if (data) {
                      setUserAvatar(data.avatar);
                      setUserAvatarUrl(data.avatarUrl);
                    }
                  };
                  reader.readAsDataURL(file);
                };
                fileInput.click();
              }}
            />
            <div
              className={popup['row']}
              style={{ alignItems: 'center', gap: '5px' }}
            >
              <div className={popup['h3']}>{userName}</div>
              {userVip > 0 && (
                <div
                  className={`${vip['vipIcon']} ${vip[`vip-small-${userVip}`]}`}
                />
              )}
              <div
                className={`${grade['grade']} ${grade[`lv-${userGrade}`]}`}
              />
            </div>
            <div
              className={popup['p1']}
              style={{ color: '#fff' }}
              onClick={() => {
                navigator.clipboard.writeText(userId);
              }}
            >
              @{userName}
            </div>
            <div className={popup['p1']} style={{ color: '#fff' }}>
              {lang.tr[userGender === 'Male' ? 'male' : 'female']} . {userAge}.
              Taiwan
            </div>
            <div className={popup['p1']} style={{ color: '#fff' }}>
              {userSignature}
            </div>

            <div className={popup['tab']}>
              <div
                className={`${popup['item']} ${popup['about']} ${popup['selected']}`}
              >
                {lang.tr.about}
              </div>
              <div className={`${popup['item']} ${popup['groups']}`}>
                {lang.tr.groups}
              </div>
            </div>
          </div>
          <div className={setting['body']}>
            <div className={popup['col']}>
              <div className={popup['row']}>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <label
                    className={popup['label']}
                    htmlFor="profile-form-nickname"
                  >
                    {lang.tr.nickname}
                  </label>
                  <input
                    type="text"
                    id="profile-form-nickname"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>

                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <label
                    className={popup['label']}
                    htmlFor="profile-form-gender"
                  >
                    {lang.tr.gender}
                  </label>
                  <div className={popup['selectBox']}>
                    <select
                      value={userGender}
                      onChange={(e) =>
                        setUserGender(e.target.value as User['gender'])
                      }
                    >
                      <option value="Male">{lang.tr.male}</option>
                      <option value="Female">{lang.tr.female}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={popup['row']}>
                <div
                  className={`${popup['inputBox']} ${popup['col']} ${popup['disabled']}`}
                >
                  <label
                    className={popup['label']}
                    htmlFor="profile-form-country"
                  >
                    {lang.tr.country}
                  </label>
                  <div className={popup['selectBox']}>
                    <select>
                      <option value="taiwan">{lang.tr.taiwan}</option>
                    </select>
                  </div>
                </div>
                <div
                  className={`${popup['inputBox']} ${popup['col']} ${popup['disabled']}`}
                >
                  <label
                    className={popup['label']}
                    htmlFor="profile-form-birthdate"
                  >
                    {lang.tr.birthdate}
                  </label>
                  <div className={popup['row']}>
                    <div className={popup['selectBox']}>
                      <select
                        id="birthYear"
                        // value={userBirthYear}
                        // onChange={(e) => setUserBirthYear(e.target.value)}
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={popup['selectBox']}>
                      <select
                        className={popup['input']}
                        id="birthMonth"
                        // value={userBirthMonth}
                        // onChange={(e) => setUserBirthMonth(e.target.value)}
                      >
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={popup['selectBox']}>
                      <select
                        className={popup['input']}
                        id="birthDay"
                        // value={userBirthDay}
                        // onChange={(e) => setUserBirthDay(e.target.value)}
                      >
                        {days.map((day) => (
                          <option key={day} value={day}>
                            {day.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <label
                  className={popup['label']}
                  htmlFor="profile-form-signature"
                >
                  {lang.tr.signature}
                </label>
                <input
                  type="text"
                  id="profile-form-signature"
                  value={userSignature}
                  onChange={(e) => setUserSignature(e.target.value)}
                />
              </div>

              <div
                className={`${popup['inputBox']} ${popup['col']} ${popup['disabled']}`}
              >
                <label className={popup['label']} htmlFor="profile-form-about">
                  {lang.tr.about}
                </label>
                <textarea
                  id="profile-form-about"
                  // value={userAbout}
                  // onChange={(e) => setUserAbout(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <div className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </div>
          <div
            className={popup['button']}
            onClick={() => {
              handleUpdateUser(
                {
                  name: userName,
                  gender: userGender,
                  signature: userSignature,
                  avatar: userAvatar,
                  avatarUrl: userAvatarUrl,
                },
                userId,
              );
              handleClose();
            }}
          >
            {lang.tr.confirm}
          </div>
        </div>
      </div>
    );
  },
);

UserSettingPopup.displayName = 'UserSettingPopup';

export default UserSettingPopup;

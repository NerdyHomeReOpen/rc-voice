/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';

// Types
import type { User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';

// CSS
import UserSetting from '@/styles/popups/userSetting.module.css';
import grade from '@/styles/common/grade.module.css';

interface UserSettingModalProps {
  user: User;
}

const handleClose = () => {
  ipcService.window.close();
};

const UserSettingModal: React.FC<UserSettingModalProps> = React.memo(
  (initialData: UserSettingModalProps) => {
    const { user } = initialData;

    // Socket
    const socket = useSocket();

    // Language Control
    const lang = useLanguage();

    const userGrade = Math.min(56, Math.ceil(user?.level / 5)); // 56 is max level
    const userAvatar = user?.avatar;

    // Error Control
    const [error, setError] = useState('');

    // 生成年份選項 (例如從1900年到當前年份)
    const currentYear = new Date().getFullYear();
    const years = Array.from(
      { length: currentYear - 1900 + 1 },
      (_, i) => currentYear - i,
    );

    // 生成月份選項 (1-12)
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // 生成日期選項 (1-31)
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const [formData, setFormData] = useState<Partial<User>>({
      name: user?.name || '',
      gender: user?.gender || 'Male',
      signature: user?.signature || '',
      // birthYear: user?.birthYear || currentYear,
      // birthMonth: user?.birthMonth || 1,
      // birthDay: user?.birthDay || 1,
    });

    useEffect(() => {
      if (user) {
        setFormData({
          name: user.name,
          gender: user.gender,
          signature: user.signature,
        });
      }
    }, [user]);

    const handleChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const { id, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [id === 'profile-form-nickname'
          ? 'name'
          : id === 'profile-form-signature'
          ? 'signature'
          : id]: value,
      }));
    };

    const handleSubmit = () => {
      const updates: Partial<User> = {};

      if (formData.name !== user?.name) {
        updates.name = formData.name;
      }
      if (formData.gender !== user?.gender) {
        updates.gender = formData.gender;
      }
      if (formData.signature !== user?.signature) {
        updates.signature = formData.signature;
      }

      if (Object.keys(updates).length === 0) {
        handleClose();
        return;
      }

      socket?.send.updateUser({
        user: updates,
      });

      handleClose();
    };

    return (
      <>
        <div className={UserSetting['header']}>
          <div className={UserSetting['header-bg']}></div>
        </div>

        <div className={UserSetting['dialog-message-wrapper']}>
          <div className={UserSetting['profile-header-avatar-box']}>
            <div className={UserSetting['profile-header-avatar-border']}></div>
            <div
              className={UserSetting['profile-header-avatar']}
              style={
                userAvatar ? { backgroundImage: `url(${userAvatar})` } : {}
              }
            />
            <div className={UserSetting['profile-header-user-info']}>
              <span className={UserSetting['profile-header-display-name']}>
                {user?.name}
              </span>
              <div className={UserSetting['profile-header-icons']}>
                <div
                  className={`${UserSetting['userGrade']} ${
                    grade[`lv-${userGrade}`]
                  }`}
                />{' '}
                <span
                  className={UserSetting['profile-header-base-info-weath']}
                ></span>
              </div>
              <span className={UserSetting['profile-header-username']}>
                @{user?.name}
              </span>
              <div className={UserSetting['profile-header-other-info']}>
                <span className={UserSetting['profile-header-gender']}></span>
                <span className={UserSetting['profile-header-year-old']}>
                  0
                </span>
                <span className={UserSetting['profile-header-country']}>
                  台灣
                </span>
              </div>
            </div>
          </div>
          <div className={UserSetting['profile-tab']}>
            <div
              className={`${UserSetting['profile-me']} ${UserSetting.active}`}
            ></div>
            <div className={UserSetting['profile-groups']}></div>
          </div>
          <div className={UserSetting['profile-form-wrapper']}>
            <div className={UserSetting['profile-form-buttons']}>
              <div
                className={`${UserSetting['profile-form-button']} ${UserSetting.blue}`}
                onClick={handleSubmit}
              >
                {lang.tr.confirm}
              </div>
              <div
                className={UserSetting['profile-form-button']}
                onClick={handleClose}
              >
                {lang.tr.cancel}
              </div>
            </div>

            <div className={UserSetting['profile-form-input-wrapper']}>
              <div className={UserSetting['profile-form-row']}>
                <div className={UserSetting['profile-form-group']}>
                  <label
                    className={UserSetting.label}
                    htmlFor="profile-form-nickname"
                  >
                    {lang.tr.nickname}
                  </label>
                  <input
                    className={UserSetting.input}
                    type="text"
                    id="profile-form-nickname"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className={UserSetting['profile-form-group']}>
                  <label
                    className={UserSetting.label}
                    htmlFor="profile-form-gender"
                  >
                    {lang.tr.gender}
                  </label>
                  <div className={UserSetting['select-wrapper']}>
                    <select
                      className={UserSetting.select}
                      id="profile-form-gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="Male">男性</option>
                      <option value="Female">女性</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={UserSetting['profile-form-row']}>
                <div className={UserSetting['profile-form-group']}>
                  <label
                    className={UserSetting.label}
                    htmlFor="profile-form-country"
                  >
                    {lang.tr.country}
                  </label>
                  <div className={UserSetting['select-wrapper']}>
                    <select
                      className={UserSetting.select}
                      id="profile-form-country"
                      value={'台灣'}
                      onChange={handleChange}
                    >
                      <option value="台灣">台灣</option>
                    </select>
                  </div>
                </div>
                <div className={UserSetting['profile-form-group']}>
                  <label
                    className={UserSetting.label}
                    htmlFor="profile-form-birthdate"
                  >
                    {lang.tr.birthdate}
                  </label>
                  <div className={UserSetting['profile-form-birthdate-group']}>
                    <div className={UserSetting['select-wrapper']}>
                      <select
                        className={UserSetting.select}
                        id="birthYear"
                        // value={formData.birthYear}
                        onChange={handleChange}
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={UserSetting['select-wrapper']}>
                      <select
                        className={UserSetting.select}
                        id="birthMonth"
                        // value={formData.birthMonth}
                        onChange={handleChange}
                      >
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={UserSetting['select-wrapper']}>
                      <select
                        className={UserSetting.select}
                        id="birthDay"
                        // value={formData.birthDay}
                        onChange={handleChange}
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

              <div className={UserSetting['profile-form-group']}>
                <label
                  className={UserSetting.label}
                  htmlFor="profile-form-signature"
                >
                  {lang.tr.signature}
                </label>
                <input
                  className={UserSetting.input}
                  type="text"
                  id="profile-form-signature"
                  value={formData.signature}
                  onChange={handleChange}
                />
              </div>

              <div className={UserSetting['profile-form-group']}>
                <label
                  className={UserSetting.label}
                  htmlFor="profile-form-about"
                >
                  {lang.tr.about}
                </label>
                <textarea
                  className={UserSetting.textarea}
                  id="profile-form-about"
                  value={''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
);

UserSettingModal.displayName = 'UserSettingModal';

export default UserSettingModal;

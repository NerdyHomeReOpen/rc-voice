/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';

// CSS
import popup from '@/styles/common/popup.module.css';
import applyFriend from '@/styles/popups/applyFriend.module.css';

// Types
import { FriendApplication, popupType, User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useTranslation } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';

interface ApplyFriendModalProps {
  user: User | null;
  targetUser: User | null;
}

const ApplyFriendModal: React.FC<ApplyFriendModalProps> = React.memo(
  (initialData: ApplyFriendModalProps) => {
    // Variables
    const targetUserId = initialData.targetUser?.id || '';
    const targetUserName = initialData.targetUser?.name || '';
    const targetUserAvatarUrl = initialData.targetUser?.avatarUrl || '';
    const friendGroups = initialData.user?.friendGroups || [];

    // Language Control
    const lang = useTranslation();

    // Socket
    const socket = useSocket();

    // State
    const [description, setDescription] = useState('');
    const [friendGroup, setFriendGroup] = useState('');

    // const handleCreateFriendApplication = (application: FriendApplication) => {
    //   // socket?.send.createFriendApplication({});
    // };

    const handleOpenSuccessPopup = () => {
      ipcService.popup.open(popupType.DIALOG_SUCCESS);
      ipcService.initialData.onRequest(popupType.DIALOG_SUCCESS, {
        title: lang.friendApply,
        submitTo: popupType.DIALOG_SUCCESS,
      });
      ipcService.popup.onSubmit(popupType.DIALOG_SUCCESS, () => {
        handleClose();
      });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    return (
      <div className={popup['popupContainer']}>
        <div className={`${popup['popupBody']}`}>
          <div className={applyFriend['body']}>
            <div className={popup['label']}>{lang.friendLabel}</div>
            <div className={applyFriend['headerBox']}>
              <div className={applyFriend['avatarWrapper']}>
                <div className={applyFriend['avatarPicture']} />
              </div>
              <div className={applyFriend['userInfoWrapper']}>
                <div className={applyFriend['userAccount']}>
                  {`${targetUserName}`}
                </div>
                <div className={applyFriend['userName']}>
                  {`${targetUserId}`}
                </div>
              </div>
            </div>
            <div className={applyFriend['split']} />
            <div className={applyFriend['contentBox']}>
              <div className={popup['label']}>{lang.friendSelectGroup}</div>
              <div className={popup['inputBox']}>
                <select
                  className={popup['select']}
                  onChange={(e) => {
                    setFriendGroup(e.target.value);
                  }}
                >
                  {friendGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <div className={applyFriend['linkText']}>
                  {lang.friendAddGroup}
                </div>
              </div>
              <div className={popup['label']}>{lang.friendNote}</div>
              <div className={popup['inputBox']}>
                <textarea
                  rows={2}
                  onChange={(e) => {
                    setDescription(e.target.value);
                  }}
                />
              </div>
              <div className={applyFriend['noteText']}>
                {lang.max120content}
              </div>
            </div>
          </div>
        </div>
        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']} ${
              !description.trim() ? popup['disabled'] : ''
            }`}
            disabled={!description.trim()}
            onClick={() => {
              // handleCreateFriendApplication();
              handleOpenSuccessPopup();
            }}
          >
            {lang.sendRequest}
          </button>
          <button
            className={popup['button']}
            onClick={() => {
              handleClose();
            }}
          >
            {lang.cancel}
          </button>
        </div>
      </div>
    );
  },
);

ApplyFriendModal.displayName = 'ApplyFriendModal';

export default ApplyFriendModal;

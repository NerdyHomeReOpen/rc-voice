/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';

// CSS
import popup from '@/styles/common/popup.module.css';
import applyFriend from '@/styles/popups/applyFriend.module.css';

// Types
import { PopupType, SocketServerEvent, User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';

interface ApplyFriendModalProps {
  userId: string | null;
  targetUserId: string | null;
}

const ApplyFriendModal: React.FC<ApplyFriendModalProps> = React.memo(
  (initialData: ApplyFriendModalProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // State
    const [description, setDescription] = useState('');
    const [friendGroup, setFriendGroup] = useState('');

    const [user, setUser] = useState<User>({
      id: '',
      name: '未知使用者',
      avatar: '',
      avatarUrl: '',
      signature: '',
      status: 'online',
      gender: 'Male',
      level: 0,
      xp: 0,
      requiredXp: 0,
      progress: 0,
      currentChannelId: '',
      currentServerId: '',
      lastActiveAt: 0,
      createdAt: 0,
    });
    const [targetUser, setTargetUser] = useState<User>({
      id: '',
      name: '未知使用者',
      avatar: '',
      avatarUrl: '',
      signature: '',
      status: 'online',
      gender: 'Male',
      level: 0,
      xp: 0,
      requiredXp: 0,
      progress: 0,
      currentChannelId: '',
      currentServerId: '',
      lastActiveAt: 0,
      createdAt: 0,
    });

    // Variables
    const userId = initialData.userId || '';
    const targetUserId = initialData.targetUserId || '';
    const targetUserName = targetUser.name;
    const targetUserAvatar = targetUser.avatar;
    const userFriendGroups = user.friendGroups || [];

    // Handlers
    const handleOpenSuccessPopup = () => {
      ipcService.popup.open(PopupType.DIALOG_SUCCESS);
      ipcService.initialData.onRequest(PopupType.DIALOG_SUCCESS, {
        title: lang.tr.friendApply,
        submitTo: PopupType.DIALOG_SUCCESS,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_SUCCESS, () => {
        handleClose();
      });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // const handleCreateFriendApplication = (application: FriendApplication) => {
    //   // socket?.send.createFriendApplication({});
    // };

    const handleUserUpdate = (data: Partial<User>) => {
      if (data.id === userId) setUser((prev) => ({ ...prev, ...data }));
      if (data.id === targetUserId)
        setTargetUser((prev) => ({ ...prev, ...data }));
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, [socket]);

    useEffect(() => {
      if (!socket) return;
      socket.send.refreshUser({ userId: userId });
      socket.send.refreshUser({ userId: targetUserId });
    }, [socket, userId, targetUserId]);

    return (
      <div className={popup['popupContainer']}>
        <div className={`${popup['popupBody']}`}>
          <div className={applyFriend['body']}>
            <div className={popup['label']}>{lang.tr.friendLabel}</div>
            <div className={applyFriend['headerBox']}>
              <div className={applyFriend['avatarWrapper']}>
                <div className={applyFriend['avatarPicture']} />
              </div>
              <div className={applyFriend['userInfoWrapper']}>
                <div className={applyFriend['userAccount']}>
                  {`${targetUserId}`}
                </div>
                <div className={applyFriend['userName']}>
                  {`${targetUserName}`}
                </div>
              </div>
            </div>
            <div className={applyFriend['split']} />
            <div className={applyFriend['contentBox']}>
              <div className={popup['label']}>{lang.tr.friendSelectGroup}</div>
              <div className={popup['inputBox']}>
                <select
                  className={popup['select']}
                  onChange={(e) => setFriendGroup(e.target.value)}
                >
                  {userFriendGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <div className={applyFriend['linkText']}>
                  {lang.tr.friendAddGroup}
                </div>
              </div>
              <div className={popup['label']}>{lang.tr.friendNote}</div>
              <div className={popup['inputBox']}>
                <textarea
                  rows={2}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className={applyFriend['noteText']}>
                {lang.tr.max120content}
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
            {lang.tr.sendRequest}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

ApplyFriendModal.displayName = 'ApplyFriendModal';

export default ApplyFriendModal;

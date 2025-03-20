/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/common/popup.module.css';
import applyFriend from '@/styles/popups/applyFriend.module.css';

// Types
import {
  FriendApplication,
  FriendGroup,
  PopupType,
  SocketServerEvent,
  User,
} from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/default';

interface ApplyFriendModalProps {
  userId: string;
  targetId: string;
}

const ApplyFriendModal: React.FC<ApplyFriendModalProps> = React.memo(
  (initialData: ApplyFriendModalProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshRef = useRef(false);

    // State
    const [userFriendGroups, setUserFriendGroups] = useState<FriendGroup[]>([]);
    const [targetName, setTargetName] = useState<User['name']>('');
    const [targetAvatar, setTargetAvatar] = useState<User['avatar']>('');
    const [applicationDescription, setApplicationDescription] =
      useState<FriendApplication['description']>('');

    // Variables
    const { userId, targetId } = initialData;

    // Handlers
    const handleOpenSuccessDialog = () => {
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

    const handleCreateFriendApplication = (
      application: Partial<FriendApplication>,
    ) => {
      if (!socket) return;
      socket.send.createFriendApplication({ friendApplication: application });
    };

    const handleUserUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      if (data.id === userId) {
        setUserFriendGroups(data.friendGroups || []);
      }
      if (data.id === targetId) {
        setTargetName(data.name);
        setTargetAvatar(data.avatar);
      }
    };

    const handleFriendApplicationUpdate = (data: FriendApplication | null) => {
      if (!data) data = createDefault.friendApplication();
      setApplicationDescription(data.description);
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
        // [SocketServerEvent.FRIEND_APPLICATION_UPDATE]: handleFriendApplicationUpdate,
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
      if (!socket || !userId || !targetId) return;
      if (refreshRef.current) return;
      socket.send.refreshUser({ userId: userId });
      socket.send.refreshUser({ userId: targetId });
      socket.send.refreshFriendApplication({
        senderId: userId,
        receiverId: targetId,
      });
      refreshRef.current = true;
    }, [socket, userId, targetId]);

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
                <div className={applyFriend['userAccount']}>{targetName}</div>
                <div className={applyFriend['userName']}>{targetId}</div>
              </div>
            </div>
            <div className={applyFriend['split']} />
            <div className={applyFriend['contentBox']}>
              <div className={popup['label']}>{lang.tr.friendSelectGroup}</div>
              <div className={popup['inputBox']}>
                <select
                  className={popup['select']}
                  onChange={(e) => {
                    // FIXME
                  }}
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
                  onChange={(e) => setApplicationDescription(e.target.value)}
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
              !applicationDescription.trim() ? popup['disabled'] : ''
            }`}
            disabled={!applicationDescription.trim()}
            onClick={() => {
              handleCreateFriendApplication({
                senderId: userId,
                receiverId: targetId,
                description: applicationDescription,
              });
              handleOpenSuccessDialog();
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

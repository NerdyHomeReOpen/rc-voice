import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';
import applyFriend from '@/styles/popups/applyFriend.module.css';

// Types
import {
  Friend,
  FriendApplication,
  FriendGroup,
  PopupType,
  User,
} from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface ApplyFriendPopupProps {
  userId: string;
  targetId: string;
}

const ApplyFriendPopup: React.FC<ApplyFriendPopupProps> = React.memo(
  (initialData: ApplyFriendPopupProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshRef = useRef(false);

    // State
    const [section, setSection] = useState<number>(0);
    const [userFriendGroups, setUserFriendGroups] = useState<FriendGroup[]>(
      createDefault.user().friendGroups || [],
    );
    const [targetName, setTargetName] = useState<User['name']>(
      createDefault.user().name,
    );
    const [targetAvatarUrl, setTargetAvatarUrl] = useState<User['avatar']>(
      createDefault.user().avatar,
    );
    const [applicationSenderId, setApplicationSenderId] =
      useState<User['id']>('');
    const [applicationReceiverId, setApplicationReceiverId] =
      useState<User['id']>('');
    const [applicationDescription, setApplicationDescription] = useState<
      FriendApplication['description']
    >(createDefault.friendApplication().description);
    const [selectedFriendGroupId, setSelectedFriendGroupId] =
      useState<FriendGroup['id']>('');

    // Variables
    const { userId, targetId } = initialData;

    // Handlers
    const handleCreateFriendApplication = (
      friendApplication: Partial<FriendApplication>,
      senderId: User['id'],
      receiverId: User['id'],
    ) => {
      if (!socket) return;
      socket.send.createFriendApplication({
        friendApplication,
        senderId,
        receiverId,
      });
    };

    const handleDeleteFriendApplication = (
      senderId: User['id'],
      receiverId: User['id'],
    ) => {
      if (!socket) return;
      socket.send.deleteFriendApplication({ senderId, receiverId });
    };

    const handleCreateFriend = (
      friend: Partial<Friend>,
      userId: User['id'],
      targetId: User['id'],
    ) => {
      if (!socket) return;
      socket.send.createFriend({ friend, userId, targetId });
    };

    const handleUserUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setUserFriendGroups(data.friendGroups || []);
    };

    const handleTargetUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setTargetName(data.name);
      setTargetAvatarUrl(data.avatarUrl);
    };

    const handleSentApplicationUpdate = (data: FriendApplication | null) => {
      setSection(data ? 1 : 0);
      if (!data) data = createDefault.friendApplication();
      setApplicationDescription(data.description);
      setApplicationSenderId(data.senderId);
      setApplicationReceiverId(data.receiverId);
    };

    const handleReceivedApplicationUpdate = (
      data: FriendApplication | null,
    ) => {
      setSection(data ? 2 : 0);
      if (!data) data = createDefault.friendApplication();
      setApplicationDescription(data.description);
      setApplicationSenderId(data.senderId);
      setApplicationReceiverId(data.receiverId);
    };

    const handleOpenSuccessDialog = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_SUCCESS);
      ipcService.initialData.onRequest(PopupType.DIALOG_SUCCESS, {
        title: message,
        submitTo: PopupType.DIALOG_SUCCESS,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_SUCCESS, () => {
        setSection(1);
      });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      if (!userId || !targetId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        const user = await refreshService.user({ userId: userId });
        handleUserUpdate(user);
        const target = await refreshService.user({ userId: targetId });
        handleTargetUpdate(target);
        const sentApplication = await refreshService.friendApplication({
          senderId: userId,
          receiverId: targetId,
        });
        handleSentApplicationUpdate(sentApplication);
        const receivedApplication = await refreshService.friendApplication({
          senderId: targetId,
          receiverId: userId,
        });
        handleReceivedApplicationUpdate(receivedApplication);
      };
      refresh();
    }, [userId, targetId, socket]);

    switch (section) {
      // Friend Application Form
      case 0:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={setting['body']}>
                <div className={popup['col']}>
                  <div className={popup['label']}>{lang.tr.friendLabel}</div>
                  <div className={popup['row']}>
                    <div className={applyFriend['avatarWrapper']}>
                      <div
                        className={applyFriend['avatarPicture']}
                        style={{ backgroundImage: `url(${targetAvatarUrl})` }}
                      />
                    </div>
                    <div className={applyFriend['userInfoWrapper']}>
                      <div className={applyFriend['userAccount']}>
                        {targetName}
                      </div>
                      <div className={applyFriend['userName']}>{targetId}</div>
                    </div>
                  </div>
                  <div className={applyFriend['split']} />
                  <div className={popup['inputGroup']}>
                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <div className={popup['label']}>{lang.tr.friendNote}</div>
                      <textarea
                        rows={2}
                        value={applicationDescription}
                        onChange={(e) =>
                          setApplicationDescription(e.target.value)
                        }
                      />
                      <div className={popup['hint']}>
                        {lang.tr.max120content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={popup['popupFooter']}>
              <button
                className={popup['button']}
                onClick={() => {
                  handleCreateFriendApplication(
                    { description: applicationDescription },
                    userId,
                    targetId,
                  );
                  handleOpenSuccessDialog(lang.tr.friendApply);
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

      // Show Notification
      case 1:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={setting['body']}>
                <div className={popup['col']}>
                  <div className={popup['label']}>{lang.tr.friendLabel}</div>
                  <div className={popup['row']}>
                    <div className={applyFriend['avatarWrapper']}>
                      <div
                        className={applyFriend['avatarPicture']}
                        style={{ backgroundImage: `url(${targetAvatarUrl})` }}
                      />
                    </div>
                    <div className={applyFriend['userInfoWrapper']}>
                      <div className={applyFriend['userAccount']}>
                        {targetName}
                      </div>
                      <div className={applyFriend['userName']}>{targetId}</div>
                    </div>
                  </div>
                  <div className={applyFriend['split']} />
                  <div className={popup['inputGroup']}>
                    <div className={popup['hint']}>
                      {lang.tr.friendApplySent}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={popup['popupFooter']}>
              <button className={popup['button']} onClick={() => setSection(0)}>
                {lang.tr.modify}
              </button>
              <button className={popup['button']} onClick={() => handleClose()}>
                {lang.tr.confirm}
              </button>
            </div>
          </div>
        );

      // Apply Friend
      case 2:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={setting['body']}>
                <div className={popup['col']}>
                  <div className={popup['label']}>{lang.tr.friendLabel}</div>
                  <div className={popup['row']}>
                    <div className={applyFriend['avatarWrapper']}>
                      <div
                        className={applyFriend['avatarPicture']}
                        style={{ backgroundImage: `url(${targetAvatarUrl})` }}
                      />
                    </div>
                    <div className={applyFriend['userInfoWrapper']}>
                      <div className={applyFriend['userAccount']}>
                        {targetName}
                      </div>
                      <div className={applyFriend['userName']}>{targetId}</div>
                    </div>
                  </div>
                  <div className={applyFriend['split']} />
                  <div className={popup['inputGroup']}>
                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <div className={popup['label']}>
                        {lang.tr.friendSelectGroup}
                      </div>
                      <div className={popup['row']}>
                        <div className={popup['selectBox']}>
                          <select
                            className={popup['select']}
                            value={selectedFriendGroupId}
                            onChange={(e) =>
                              setSelectedFriendGroupId(e.target.value)
                            }
                          >
                            <option value={''}>{lang.tr.none}</option>
                            {userFriendGroups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className={popup['link']}>
                          {lang.tr.friendAddGroup}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={popup['popupFooter']}>
              <button
                className={popup['button']}
                onClick={() => {
                  handleDeleteFriendApplication(
                    applicationSenderId,
                    applicationReceiverId,
                  );
                  handleCreateFriend(
                    { friendGroupId: selectedFriendGroupId },
                    userId,
                    targetId,
                  );
                  handleClose();
                }}
              >
                {lang.tr.add}
              </button>
              <button className={popup['button']} onClick={() => handleClose()}>
                {lang.tr.cancel}
              </button>
            </div>
          </div>
        );
    }
  },
);

ApplyFriendPopup.displayName = 'ApplyFriendPopup';

export default ApplyFriendPopup;

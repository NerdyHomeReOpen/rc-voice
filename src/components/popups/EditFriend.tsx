import React, { useEffect, useRef, useState } from 'react';

// Types
import { User, Friend, FriendGroup } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';

// Services
import refreshService from '@/services/refresh.service';
import ipcService from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface EditFriendPopupProps {
  userId: string;
  targetId: string;
}

const EditFriendPopup: React.FC<EditFriendPopupProps> = React.memo(
  (initialData: EditFriendPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // Variables
    const { userId, targetId } = initialData;

    // States
    const [userFriendGroups, setUserFriendGroups] = useState<FriendGroup[]>(
      createDefault.user().friendGroups || [],
    );
    const [friendGroup, setFriendGroup] = useState<Friend['friendGroupId']>(
      createDefault.friend().friendGroupId,
    );

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleUpdateFriend = (
      friend: Partial<Friend>,
      userId: User['id'],
      targetId: User['id'],
    ) => {
      if (!socket) return;
      socket.send.updateFriend({ friend, userId, targetId });
    };

    const handleUserUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setUserFriendGroups(data.friendGroups || []);
    };

    const handleFriendUpdate = (data: Friend | null) => {
      if (!data) data = createDefault.friend();
      setFriendGroup(data.friendGroupId);
    };

    // Effects
    useEffect(() => {
      if (!userId || !targetId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        const user = await refreshService.user({
          userId: userId,
        });
        handleUserUpdate(user);
        const friend = await refreshService.friend({
          userId: userId,
          targetId: targetId,
        });
        handleFriendUpdate(friend);
      };
      refresh();
    }, [userId, targetId]);

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['row']}`}>
                <div className={popup['label']}>{'分組: '}</div>
                <div className={popup['selectBox']}>
                  <select
                    className={popup['input']}
                    value={friendGroup}
                    onChange={(e) => {
                      setFriendGroup(e.target.value);
                    }}
                  >
                    {userFriendGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']}`}
            onClick={() => {
              handleUpdateFriend(
                { friendGroupId: friendGroup },
                userId,
                targetId,
              );
              handleClose();
            }}
          >
            {lang.tr.confirm}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

EditFriendPopup.displayName = 'EditFriendPopup';

export default EditFriendPopup;

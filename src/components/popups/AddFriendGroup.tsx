import React, { useCallback, useEffect, useState } from 'react';

// Types
import { FriendGroup, PopupType, SocketServerEvent, User } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface AddFriendGroupPopupProps {
  userId: string;
}

const AddFriendGroupPopup: React.FC<AddFriendGroupPopupProps> = React.memo(
  (initialData: AddFriendGroupPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // States
    const [groupName, setGroupName] = useState<string>('');

    // Variables
    const { userId } = initialData;

    // Handlers
    const handleAddSubGroups = (
      group: Partial<FriendGroup>,
      userId: User['id'],
    ) => {
      if (!socket) return;
      socket.send.createFriendGroup({ group, userId });
    };

    const handleUserSearch = useCallback((name: User | null) => {
      if (!name) return;
      ipcService.popup.open(PopupType.APPLY_FRIEND);
      ipcService.initialData.onRequest(PopupType.APPLY_FRIEND, {}, () =>
        handleClose(),
      );
    }, []);

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.USER_SEARCH]: handleUserSearch,
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, [socket, handleUserSearch]);

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>
                  {lang.tr.pleaseInputFriendGroupName}
                </div>
                <input
                  className={popup['input']}
                  type="text"
                  value={groupName}
                  maxLength={20}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']} ${
              !groupName.trim() ? popup['disabled'] : ''
            }`}
            disabled={!groupName.trim()}
            onClick={() => {
              handleAddSubGroups(
                {
                  name: groupName,
                },
                userId,
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

AddFriendGroupPopup.displayName = 'AddFriendGroupPopup';

export default AddFriendGroupPopup;

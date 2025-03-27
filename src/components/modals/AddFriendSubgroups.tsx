import React, { useCallback, useEffect, useState } from 'react';

// Types
import { PopupType, SocketServerEvent, User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// CSS
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';

// Services
import ipcService from '@/services/ipc.service';

interface AddFriendProps {
  userId: string;
}

const AddFriendSubgroups: React.FC<AddFriendProps> = React.memo(() => {
  // Hooks
  const socket = useSocket();
  const lang = useLanguage();

  // States
  const [groupName, setGroupName] = useState<string>('');

  // Handlers[]
  const handleAddSubGroups = (groupName: string) => {
    if (!socket) return;
    socket.send.searchUser({ query: groupName });
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
                {lang.tr.pleaseInputFriendSubGroups}
              </div>
              <input
                className={popup['input']}
                type="text"
                value={groupName}
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
          onClick={() => handleAddSubGroups(groupName)}
        >
          {lang.tr.confirm}
        </button>
        <button className={popup['button']} onClick={() => handleClose()}>
          {lang.tr.cancel}
        </button>
      </div>
    </div>
  );
});

AddFriendSubgroups.displayName = 'AddFriendSubgroups';

export default AddFriendSubgroups;

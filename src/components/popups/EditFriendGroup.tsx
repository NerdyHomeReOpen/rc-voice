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

interface EditFriendGroupPopupProps {
  friendGroupId: string;
  friendGroupName: string;
  friendGroupOrder: number;
}

const EditFriendGroupPopup: React.FC<EditFriendGroupPopupProps> = React.memo(
  (initialData: EditFriendGroupPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Variables
    const { friendGroupId, friendGroupName, friendGroupOrder } = initialData;

    // States
    const [groupName, setGroupName] = useState<string>(friendGroupName);
    const [groupOrder, setGroupOrder] = useState<number>(friendGroupOrder);

    // Handlers
    const handleUpdateFriendGroup = (
      group: Partial<FriendGroup>,
      friendGroupId: FriendGroup['id'],
    ) => {
      if (!socket) return;
      socket.send.updateFriendGroup({ group, friendGroupId });
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
              <div className={`${popup['row']}`}>
                <div
                  className={`${popup['inputBox']} ${popup['col']}`}
                  style={{
                    flex: '3',
                  }}
                >
                  <div className={popup['label']}>
                    {lang.tr.pleaseInputFriendGroupName}
                  </div>
                  <input
                    className={popup['input']}
                    type="text"
                    placeholder={groupName}
                    value={groupName}
                    maxLength={20}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div
                  className={`${popup['inputBox']} ${popup['col']}`}
                  style={{
                    flex: '1',
                  }}
                >
                  <div className={popup['label']}>
                    {lang.tr.friendGroupOrder}
                  </div>
                  <input
                    className={popup['input']}
                    type="number"
                    placeholder={groupOrder.toString()}
                    value={groupOrder}
                    max={999}
                    min={-999}
                    onChange={(e) =>
                      setGroupOrder(parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']} ${
              !groupName.trim() ? popup['disabled'] : ''
            }`}
            disabled={
              !groupName.trim() ||
              (groupName === friendGroupName && groupOrder === friendGroupOrder)
            }
            onClick={() => {
              handleUpdateFriendGroup(
                {
                  name: groupName,
                  order: groupOrder,
                },
                friendGroupId,
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

EditFriendGroupPopup.displayName = 'EditFriendGroupPopup';

export default EditFriendGroupPopup;

import React, { useEffect, useState } from 'react';

// Types
import { Channel, SocketServerEvent, User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// CSS
import popup from '@/styles/common/popup.module.css';
import addChannel from '@/styles/popups/addChannel.module.css';

// Services
import { ipcService } from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/default';

interface AddChannelModalProps {
  userId: string;
  parentId: string;
  serverId: string;
}

const AddChannelModal: React.FC<AddChannelModalProps> = React.memo(
  (initialData: AddChannelModalProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // States
    const [user, setUser] = useState<User>(createDefault.user());
    const [parent, setParent] = useState<Channel>(createDefault.channel());
    const [channel, setChannel] = useState<Channel>(createDefault.channel());

    // Variables
    const userId = initialData.userId;
    const parentId = initialData.parentId;
    const serverId = initialData.serverId;
    const parentName = parent.name;
    const channelName = channel.name;
    const isRoot = !!parentId;

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleCreateChannel = (channel: Channel) => {
      if (!socket) return;
      socket.send.createChannel({ channel: channel, userId: user.id });
    };

    const handleChannelUpdate = (data: Partial<Channel> | null) => {
      if (!data) data = createDefault.channel();
      setParent((prev) => ({ ...prev, ...data }));
    };

    const handleUserUpdate = (data: Partial<User> | null) => {
      if (!data) data = createDefault.user();
      setUser((prev) => ({ ...prev, ...data }));
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.CHANNEL_UPDATE]: handleChannelUpdate,
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
      if (parentId) socket.send.refreshChannel({ channelId: parentId });
      if (userId) socket.send.refreshUser({ userId: userId });
    }, [socket]);

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={addChannel['body']}>
            <div className={addChannel['inputGroup']}>
              <div className={popup['inputBox']}>
                <div className={popup['label']}>{lang.tr.parentChannel}</div>
                <input
                  className={popup['input']}
                  type="text"
                  value={parentName}
                  disabled
                />
              </div>
              <div className={popup['inputBox']}>
                <div className={popup['label']}>{lang.tr.channelName}</div>
                <input
                  className={popup['input']}
                  type="text"
                  value={channelName}
                  onChange={(e) =>
                    setChannel((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
          </div>
        </div>
        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']} ${
              !channelName.trim() ? popup['disabled'] : ''
            }`}
            disabled={!channelName.trim()}
            onClick={() => {
              handleCreateChannel({
                ...channel,
                isRoot: isRoot,
                serverId: serverId,
              });
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

AddChannelModal.displayName = 'CreateChannelModal';

export default AddChannelModal;

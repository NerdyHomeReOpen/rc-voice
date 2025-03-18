import React, { useEffect, useState } from 'react';

// CSS
import Popup from '@/styles/common/popup.module.css';
import editChannel from '@/styles/popups/editChannel.module.css';

// Types
import { Channel, SocketServerEvent, User, Visibility } from '@/types';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';

// Services
import { ipcService } from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/default';

interface EditChannelModalProps {
  userId: string;
  channelId: string;
}

const EditChannelModal: React.FC<EditChannelModalProps> = React.memo(
  (initialData: EditChannelModalProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // States
    const [user, setUser] = useState<User>(createDefault.user());
    const [channel, setChannel] = useState<Channel>(createDefault.channel());

    // Variables
    const userId = initialData.userId;
    const channelId = initialData.channelId;
    const channelName = channel.name;
    const channelSettings = channel.settings;
    const isCategory = channel.isCategory;

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleUpdateChannel = async () => {
      if (!socket) return;
      socket.send.updateChannel({ channel: channel, userId: user.id });
    };

    const handleChannelUpdate = (data: Partial<Channel> | null) => {
      if (!data) data = createDefault.channel();
      setChannel((prev) => ({ ...prev, ...data }));
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
      if (channelId) socket.send.refreshChannel({ channelId: channelId });
      if (userId) socket.send.refreshUser({ userId: userId });
    }, [socket]);

    return (
      <div className={Popup['popupContainer']}>
        <div className={Popup['popupBody']}>
          <div className={editChannel['body']}>
            <div className={editChannel['inputGroup']}>
              <div className={Popup['inputBox']}>
                <div className={Popup['label']}>
                  {`${isCategory ? lang.tr.category : lang.tr.channel}${
                    lang.tr.name
                  }`}
                </div>
                <div className={Popup['input']}>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) =>
                      setChannel((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className={Popup['inputBox']}>
                <div className={Popup['label']}>
                  {lang.tr.channelPermission}
                </div>
                <select
                  className={Popup['input']}
                  value={channelSettings.visibility}
                  onChange={(e) =>
                    setChannel((prev) => {
                      return {
                        ...prev,
                        settings: {
                          ...prev.settings,
                          visibility: e.target.value as Visibility,
                        },
                      };
                    })
                  }
                >
                  <option value="public">{lang.tr.channelPublic}</option>
                  <option value="private">{lang.tr.channelPrivate}</option>
                  <option value="readonly">{lang.tr.channelReadonly}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className={Popup['popupFooter']}>
          <button
            className={Popup['button']}
            onClick={() => {
              handleUpdateChannel();
              handleClose();
            }}
          >
            {lang.tr.confirm}
          </button>
          <button className={Popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

EditChannelModal.displayName = 'EditChannelModal';

export default EditChannelModal;

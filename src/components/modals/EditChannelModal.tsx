import React, { useEffect, useState } from 'react';

// CSS
import Popup from '@/styles/common/popup.module.css';
import editChannel from '@/styles/popups/editchannel.module.css';

// Types
import { Channel, Visibility } from '@/types';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';

// Services
import { ipcService } from '@/services/ipc.service';

interface EditChannelModalProps {
  channelId: string | null;
}

const EditChannelModal: React.FC<EditChannelModalProps> = React.memo(
  (initialData: EditChannelModalProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // States
    const [channel, setChannel] = useState<Channel>({
      id: '',
      name: '',
      isLobby: false,
      isCategory: false,
      isRoot: false,
      serverId: '',
      voiceMode: 'free',
      chatMode: 'free',
      order: 0,
      settings: {
        bitrate: 0,
        visibility: 'public',
        slowmode: false,
        userLimit: 0,
      },
      createdAt: 0,
    });

    // Variables
    const channelId = initialData.channelId || '';
    const channelName = channel.name;
    const channelSettings = channel.settings;
    const isCategory = channel.isCategory;

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleUpdateChannel = async () => {
      if (!socket) return;
      socket.send.updateChannel({ channel: channel });
    };

    // Effects
    useEffect(() => {
      // GET CHANNEL DATA
    }, [channelId]);

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

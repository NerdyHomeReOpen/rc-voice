import React, { useEffect, useState } from 'react';

// CSS
import Popup from '@/styles/common/popup.module.css';
import editChannel from '@/styles/popups/editChannel.module.css';

// Types
import { Channel, Visibility } from '@/types';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';

// Services
import { ipcService } from '@/services/ipc.service';

interface EditChannelModalProps {
  channel: Channel | null;
}

const EditChannelModal: React.FC<EditChannelModalProps> = React.memo(
  (initialData: EditChannelModalProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Variables
    const channel = React.useMemo(
      () =>
        initialData.channel || {
          id: '',
          name: '未知頻道',
          isRoot: false,
          isCategory: false,
          isLobby: false,
          voiceMode: 'free',
          chatMode: 'free',
          order: 0,
          serverId: '',
          settings: {
            bitrate: 0,
            slowmode: false,
            userLimit: -1,
            visibility: 'public' as Visibility,
          },
          createdAt: 0,
        },
      [initialData.channel],
    );

    // States
    const [editedChannel, setEditedChannel] = useState<Partial<Channel>>({
      id: '',
      name: '',
      settings: {
        bitrate: 0,
        slowmode: false,
        userLimit: -1,
        visibility: 'public',
      },
    });

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleUpdateChannel = async () => {
      if (!socket) return;
      socket.send.updateChannel({ channel: editedChannel });
    };

    useEffect(() => {
      setEditedChannel({
        id: channel.id,
        name: channel.name,
        settings: channel.settings,
      });
    }, [channel]);

    return (
      <div className={Popup['popupContainer']}>
        <div className={Popup['popupBody']}>
          <div className={editChannel['body']}>
            <div className={editChannel['inputGroup']}>
              <div className={Popup['inputBox']}>
                <div className={Popup['label']}>
                  {`${
                    channel?.isCategory ? lang.tr.category : lang.tr.channel
                  }${lang.tr.name}`}
                </div>
                <div className={Popup['input']}>
                  <input
                    type="text"
                    value={editedChannel.name}
                    onChange={(e) =>
                      setEditedChannel((prev) => ({
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
                  value={editedChannel.settings?.visibility}
                  onChange={(e) =>
                    setEditedChannel((prev) => {
                      const settings = prev.settings ?? channel.settings;
                      return {
                        ...prev,
                        settings: {
                          ...settings,
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

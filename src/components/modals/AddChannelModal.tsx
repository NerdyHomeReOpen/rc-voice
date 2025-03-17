/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';

// Types
import { Channel } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// CSS
import popup from '@/styles/common/popup.module.css';
import addChannel from '@/styles/popups/addChannel.module.css';

// Services
import { ipcService } from '@/services/ipc.service';

interface AddChannelModalProps {
  parentId: string | null;
  serverId: string | null;
}

const AddChannelModal: React.FC<AddChannelModalProps> = React.memo(
  (initialData: AddChannelModalProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // States
    const [parent, setParent] = useState<Channel>({
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
    const parentId = initialData.parentId || '';
    const serverId = initialData.serverId || '';
    const parentName = parent.name;
    const channelName = channel.name;
    const isRoot = !!parentId;

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleCreateChannel = (channel: Channel) => {
      if (!socket) return;
      socket.send.createChannel({ channel: channel });
    };

    // Effects
    useEffect(() => {
      // GET PARENT CHANNEL DATA
    }, [parentId]);

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

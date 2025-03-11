/* eslint-disable react-hooks/rules-of-hooks */
import React, { FormEvent, useState } from 'react';

// Types
import { Channel } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';

// CSS
import popup from '../../styles/common/popup.module.css';
import addChannel from '../../styles/popups/addChannel.module.css';
import { ipcService } from '@/services/ipc.service';

interface AddChannelModalProps {
  parent: Channel;
}

const AddChannelModal: React.FC<AddChannelModalProps> = React.memo(
  (initialData: AddChannelModalProps) => {
    const { parent } = initialData;
    if (!initialData) return null;

    // Socket
    const socket = useSocket();

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      socket?.send.createChannel({ channel: channel });
      handleClose();
    };

    // Form Control
    const [channel, setChannel] = useState<Channel>({
      id: '',
      name: '',
      isLobby: false,
      isCategory: false,
      isRoot: !!parent,
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

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={addChannel['body']}>
            <div className={addChannel['inputGroup']}>
              <div className={popup['inputBox']}>
                <div className={popup['label']}>上級頻道</div>
                <input className={popup['input']} disabled value={'123'} />
              </div>
              <div className={popup['inputBox']}>
                <div className={popup['label']}>頻道名稱</div>
                <input
                  className={popup['input']}
                  type="text"
                  value={channel.name}
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
              !channel.name.trim() ? popup['disabled'] : ''
            }`}
            disabled={!channel.name.trim()}
            onClick={handleSubmit}
          >
            確定
          </button>
          <button className={popup['button']} onClick={handleClose}>
            取消
          </button>
        </div>
      </div>
    );
  },
);

AddChannelModal.displayName = 'CreateChannelModal';

export default AddChannelModal;

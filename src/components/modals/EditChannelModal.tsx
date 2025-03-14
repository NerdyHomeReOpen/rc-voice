/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';

// Types
import { Channel, Visibility } from '@/types';

// Providers
import { useTranslation } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';

// CSS
import EditChannel from '../../styles/popups/editChannel.module.css';
import Popup from '../../styles/common/popup.module.css';

interface EditChannelModalProps {
  onClose: () => void;
  channel: Channel;
}

const EditChannelModal: React.FC<EditChannelModalProps> = React.memo(
  ({ onClose, channel }) => {
    // Language Control
    const lang = useTranslation();

    // Socket
    const socket = useSocket();

    // Form Control
    const [editedChannel, setEditedChannel] = useState<Partial<Channel>>({
      name: channel?.name,
      settings: {
        ...channel?.settings,
      },
    });

    const handleSubmit = async (e: FormEvent<Element>) => {
      e.preventDefault();
      socket?.send.updateChannel({ channel: editedChannel });
      onClose();
    };

    return (
      <form className={Popup['popupContainer']} onSubmit={handleSubmit}>
        <div className={Popup['popupMessageWrapper']}>
          <div className={EditChannel['popupBody']}>
            <div className={Popup['inputBox']}>
              <div className={Popup['title']}>
                {`${channel?.isCategory ? lang.category : lang.channel}`}
                {lang.name}
              </div>
              <div className={Popup['inputBorder']}>
                <input
                  type="text"
                  value={editedChannel?.name}
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
              <div className={Popup['title']}>{lang.channelPermission}</div>
              <div className={Popup['inputBorder']}>
                <select
                  value={editedChannel?.settings?.visibility}
                  onChange={(e) =>
                    setEditedChannel((prev) => {
                      const settings = prev?.settings ?? channel?.settings;
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
                  <option value="public">{lang.channelPublic}</option>
                  <option value="private">{lang.channelPrivate}</option>
                  <option value="readonly">{lang.channelReadonly}</option>
                </select>
              </div>
            </div>
          </div>
          <div className={Popup['popupFooter']}>
            <button type="submit" className={Popup['button']}>
              {lang.confirm}
            </button>
            <button type="button" className={Popup['button']} onClick={onClose}>
              {lang.cancel}
            </button>
          </div>
        </div>
      </form>
    );
  },
);

EditChannelModal.displayName = 'EditChannelModal';
export default EditChannelModal;

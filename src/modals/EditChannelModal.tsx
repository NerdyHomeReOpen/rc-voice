import React, { FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';

// Types
import { Channel, Visibility } from '@/types';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

interface EditChannelModalProps {
  onClose: () => void;
  channel: Channel;
}

const EditChannelModal: React.FC<EditChannelModalProps> = React.memo(
  ({ onClose, channel }) => {
    // Socket
    const socket = useSocket();

    // Redux
    const sessionId = useSelector(
      (state: { sessionToken: string }) => state.sessionToken,
    );

    // Form Control
    const [editedChannel, setEditedChannel] = useState<Partial<Channel>>({
      name: channel.name,
      settings: {
        ...channel.settings,
      },
    });

    // Error Control
    const [error, setError] = useState<string>('');

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      socket?.emit('editChannel', {
        sessionId: sessionId,
        channel: editedChannel,
      });
      socket?.on('error', (error: { message: string }) => {
        setError(error.message);
      });
      onClose();
    };

    return (
      <Modal
        title={`編輯${channel.isCategory ? '類別' : '頻道'}`}
        submitText="確定"
        onClose={onClose}
        onSubmit={handleSubmit}
        width="400px"
        height="300px"
      >
        <input
          type="text"
          value={editedChannel.name}
          onChange={(e) =>
            setEditedChannel((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          className="w-full p-2 border rounded mb-4"
          placeholder={`${channel.isCategory ? '類別' : '頻道'}名稱`}
          required
        />
        <select
          value={editedChannel.settings?.visibility}
          onChange={(e) =>
            setEditedChannel((prev) => ({
              ...prev,
              visibility: e.target.value as Visibility,
            }))
          }
          className="w-full p-2 border rounded mb-4"
        >
          <option value="public">公開</option>
          <option value="private">會員</option>
          <option value="readonly">唯讀</option>
        </select>
      </Modal>
    );
  },
);

EditChannelModal.displayName = 'EditChannelModal';

export default EditChannelModal;

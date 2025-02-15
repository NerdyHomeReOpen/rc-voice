import React, { FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';

// Types
import { Channel } from '@/types';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

interface DeleteChannelModalProps {
  onClose: () => void;
  channel: Channel;
}

const DeleteChannelModal: React.FC<DeleteChannelModalProps> = React.memo(
  ({ onClose, channel }) => {
    // Socket
    const socket = useSocket();

    // Redux
    const sessionId = useSelector(
      (state: { sessionToken: string }) => state.sessionToken,
    );

    // Error Control
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      socket?.emit('deleteChannel', {
        sessionId: sessionId,
        channelId: channel.id,
      });
      socket?.on('error', (error: { message: string }) => {
        setError(error.message);
      });
      onClose();
    };

    return (
      <Modal
        title={`刪除頻道`}
        submitText="確認"
        onClose={onClose}
        onSubmit={handleSubmit}
        width="300px"
        height="200px"
      >
        <span className="text-red-500">
          {'確定要刪除頻道 ' + channel.name + ' 嗎？\n此操作無法撤銷。'}
        </span>
      </Modal>
    );
  },
);

DeleteChannelModal.displayName = 'DeleteChannelModal';

export default DeleteChannelModal;

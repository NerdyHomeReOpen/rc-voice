/* eslint-disable @typescript-eslint/no-unused-vars */
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
    // Redux
    const sessionId = useSelector(
      (state: { sessionToken: string }) => state.sessionToken,
    );

    // Socket
    const socket = useSocket();

    // Error Control
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent<Element>) => {
      e.preventDefault();
      socket?.deleteChannel(channel.id);
      onClose();
    };

    return (
      <Modal
        title={`刪除頻道`}
        onSubmit={handleSubmit}
        onClose={onClose}
        width="auto"
        height="auto"
        buttons={[
          {
            label: '取消',
            style: 'secondary',
            onClick: onClose,
          },
          {
            label: '確認',
            style: 'danger',
            type: 'submit',
            onClick: () => {},
          },
        ]}
      >
        <div className="p-4">
          <span className="text-red-500">
            {'確定要刪除頻道 ' + channel.name + ' 嗎？此操作無法撤銷。'}
          </span>
        </div>
      </Modal>
    );
  },
);

DeleteChannelModal.displayName = 'DeleteChannelModal';

export default DeleteChannelModal;

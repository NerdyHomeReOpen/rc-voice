/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';

// Types
import { Channel, Server, Visibility } from '@/types';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

interface AddChannelModalProps {
  onClose: () => void;
  parentChannel: Channel | null;
}

const AddChannelModal: React.FC<AddChannelModalProps> = React.memo(
  ({ onClose, parentChannel }) => {
    // Socket
    const socket = useSocket();

    // Redux
    const server = useSelector((state: { server: Server }) => state.server);
    const sessionId = useSelector(
      (state: { sessionToken: string }) => state.sessionToken,
    );

    // Form Control
    const [newChannel, setNewChannel] = useState<Channel>({
      id: '',
      name: '',
      isLobby: false,
      isCategory: false,
      serverId: server.id,
      userIds: [],
      messageIds: [],
      parentId: parentChannel?.id ?? null,
      createdAt: 0,
      settings: {
        bitrate: 0,
        visibility: 'public',
        slowmode: false,
        userLimit: 0,
      },
    });

    // Error Control
    const [error, setError] = useState<string>('');

    const handleSubmit = async (e: FormEvent<Element>) => {
      e.preventDefault();
      socket?.emit('addChannel', {
        sessionId: sessionId,
        channel: newChannel,
      });
      socket?.on('error', (error: { message: string }) => {
        setError(error.message);
      });
      onClose();
    };

    return (
      <Modal
        title={`新增頻道`}
        onSubmit={handleSubmit}
        width="300px"
        height="auto"
        buttons={[
          {
            label: '取消',
            style: 'secondary',
            onClick: onClose,
          },
          {
            label: '確認',
            style: 'primary',
            type: 'submit',
            onClick: () => {},
          },
        ]}
      >
        <div className="p-4 space-y-4">
          <input
            type="text"
            value={newChannel.name}
            onChange={(e) =>
              setNewChannel((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            className="w-full p-2 border rounded"
            placeholder={`頻道名稱`}
            required
          />
          <select
            value={newChannel.settings.visibility}
            onChange={(e) =>
              setNewChannel((prev) => ({
                ...prev,
                visibility: e.target.value as Visibility,
              }))
            }
            className="w-full p-2 border rounded"
          >
            <option value="public">公開</option>
            <option value="private">會員</option>
            <option value="readonly">唯讀</option>
          </select>
          <select
            value={newChannel.isCategory.toString()}
            onChange={(e) =>
              setNewChannel((prev) => ({
                ...prev,
                isCategory: e.target.value === 'true',
              }))
            }
            className="w-full p-2 border rounded"
          >
            <option value="false">頻道</option>
            <option value="true">類別</option>
          </select>
        </div>
      </Modal>
    );
  },
);

AddChannelModal.displayName = 'AddChannelModal';

export default AddChannelModal;

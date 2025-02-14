import React, { FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';

// Types
import { Channel, Server, Visibility } from '@/types';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Validation
const validateName = (name: string): string => {
  if (!name.trim()) return '請輸入頻道名稱';
  if (name.length > 30) return '頻道名稱不能超過30個字符';
  return '';
};

interface FormErrors {
  general?: string;
  name?: string;
}

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
    const [errors, setErrors] = useState<FormErrors>({});

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const nameError = validateName(newChannel.name);

      setErrors({
        name: nameError,
      });

      if (!nameError) {
        socket?.emit('addChannel', {
          sessionId: sessionId,
          channel: newChannel,
        });
        socket?.on('error', (error: { message: string }) => {
          setErrors({ general: error.message });
        });
        onClose();
      }
    };

    return (
      <Modal
        title={`新增頻道`}
        submitText="新增"
        onClose={onClose}
        onSubmit={handleSubmit}
        width="400px"
        height="300px"
      >
        <input
          type="text"
          value={newChannel.name}
          onChange={(e) =>
            setNewChannel((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          className="w-full p-2 border rounded mb-4"
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
          className="w-full p-2 border rounded mb-4"
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
          className="w-full p-2 border rounded mb-4"
        >
          <option value="false">頻道</option>
          <option value="true">類別</option>
        </select>
      </Modal>
    );
  },
);

AddChannelModal.displayName = 'AddChannelModal';

export default AddChannelModal;

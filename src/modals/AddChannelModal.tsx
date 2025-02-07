import React, { FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';

// Types
import { Channel, ChannelPermission, Server } from '@/types';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Validation
const validateName = (name: string): string => {
  if (!name.trim()) return '請輸入頻道名稱';
  if (name.length > 30) return '頻道名稱不能超過30個字符';
  return '';
};

interface ChannelFormData {
  name: string;
  permission: ChannelPermission;
  isCategory: boolean;
}

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

    // Form Control
    const [formData, setFormData] = useState<ChannelFormData>({
      name: '',
      permission: 'public',
      isCategory: false,
    });
    const [errors, setErrors] = useState<FormErrors>({});

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const nameError = validateName(formData.name);

      setErrors({
        name: nameError,
      });

      const channel: Channel = {
        ...formData,
        id: '',
        isLobby: false,
        userIds: [],
        messageIds: [],
        parentId: parentChannel?.id ?? null,
      };

      if (!nameError) {
        try {
          socket?.emit('addChannel', { serverId: server.id, channel });
          //   onChannelCreated(data.id);
          onClose();
        } catch (error) {
          setErrors({
            general: error instanceof Error ? error.message : '登入失敗',
          });
        }
      }
    };

    return (
      <Modal
        title={`新增頻道`}
        submitText="新增"
        onClose={onClose}
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          className="w-full p-2 border rounded mb-4"
          placeholder={`頻道名稱`}
          required
        />
        <select
          value={formData.permission}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              permission: e.target.value as ChannelPermission,
            }))
          }
          className="w-full p-2 border rounded mb-4"
        >
          <option value="public">公開</option>
          <option value="private">會員</option>
          <option value="readonly">唯讀</option>
        </select>
        <select
          value={formData.isCategory.toString()}
          onChange={(e) =>
            setFormData((prev) => ({
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

import React, { useState } from 'react';

// Redux
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Types
import { Server } from '@/types';

interface ServerApplicationModalProps {
  onClose: () => void;
  server: Server;
}

const ServerApplicationModal: React.FC<ServerApplicationModalProps> =
  React.memo(({ onClose, server }) => {
    // Socket
    const socket = useSocket();

    // State
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Redux
    const sessionId = useSelector(
      (state: { sessionToken: string }) => state.sessionToken,
    );

    const handleSubmit = () => {
      setError(null);

      // Emit application event
      socket?.emit('applyServerMembership', {
        sessionId,
        serverId: server.id,
        application: {
          description: description.trim() || '',
          timestamp: Date.now(),
        },
      });

      // Handle response
      socket?.once(
        'applicationResponse',
        (response: { success: boolean; message: string }) => {
          if (response.success) {
            onClose();
          } else {
            setError(response.message);
          }
        },
      );
    };

    return (
      <Modal
        title="申請加入會員"
        onClose={onClose}
        width="400px"
        height="auto"
        buttons={[
          {
            label: '取消',
            style: 'secondary',
            onClick: onClose,
          },
          {
            label: '申請會員',
            style: 'primary',
            onClick: handleSubmit,
          },
        ]}
      >
        <div className="m-2 border rounded-lg px-4 py-3 text-sm shadow-sm select-none bg-yellow-50 border-yellow-200 text-yellow-800">
          「{server.name}
          」為私密語音群，僅允許會員進入。請先申請成為會員後再嘗試加入。
        </div>

        {error && (
          <div className="m-2 border rounded-lg px-4 py-3 text-sm shadow-sm bg-red-50 border-red-200 text-red-800">
            {error}
          </div>
        )}

        <div className="m-4 mt-6">
          <label className="block text-sm font-medium text-gray-700">
            申請說明
          </label>
          <textarea
            className="w-full h-16 p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm border resize-none text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="請輸入申請說明(可選)"
            rows={2}
          />
        </div>
      </Modal>
    );
  });

ServerApplicationModal.displayName = 'ServerApplicationModal';

export default ServerApplicationModal;

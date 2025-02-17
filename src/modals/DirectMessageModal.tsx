/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';

// Types
import { User, Message, Friend } from '@/types';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Services
import { apiService } from '@/services/api.service';

// Components
import MessageViewer from '@/components/MessageViewer';
import MessageInputBox from '@/components/MessageInputBox';

interface DirectMessageModalProps {
  friend: Friend | null;
  onClose: () => void;
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = React.memo(
  ({ onClose, friend }) => {
    if (!friend) return null;

    // Socket
    const socket = useSocket();

    useEffect(() => {
      if (!socket) return;

      const handleDirectMessage = (data: Message[]) => {
        console.log('Direct message:', data);
        setDirectMessages(data ?? null);
      };

      socket.on('directMessage', handleDirectMessage);
      return () => {
        socket.off('directMessage', handleDirectMessage);
      };
    }, [socket]);

    // Redux
    const user = useSelector((state: { user: User }) => state.user);
    const sessionId = useSelector(
      (state: { sessionToken: string }) => state.sessionToken,
    );

    // API
    const [directMessages, setDirectMessages] = useState<Message[] | null>(
      null,
    );

    useEffect(() => {
      if (!sessionId) return;

      const fetchDMDatas = async () => {
        try {
          const data = await apiService.post('/user/directMessage', {
            sessionId,
            friendId: friend.user?.id,
          });
          console.log('Direct message fetch:', data);
          setDirectMessages(data?.messages ?? null);
        } catch (error: Error | any) {
          console.error(error);
        }
      };
      fetchDMDatas();
    }, []);

    const handleSendMessage = (message: Message) => {
      socket?.emit('sendDirectMessage', {
        sessionId: sessionId,
        recieverId: friend.user?.id,
        message,
      });
    };

    const friendUser = friend.user;
    const friendAvatar = friendUser?.avatarUrl ?? '/pfp/default.png';
    const friendName = friendUser?.name;
    const friendLevel = Math.min(56, Math.ceil((friendUser?.level ?? 0) / 5)); // 56 is max level
    const friendGradeUrl = `/UserGrade_${friendLevel}.png`;

    return (
      <Modal title={friendName} onClose={onClose} width="600px" height="600px">
        <div className="flex h-full">
          {/* Side Menu */}
          <div className="flex flex-col p-4 w-40 bg-blue-50 text-sm">
            <img src={friendAvatar} className="w-24 h-24" />
            <div className="flex items-center gap-2">
              <div className="">{`等級: ${friendLevel}`}</div>
              <img src={friendGradeUrl} className="select-none" />
            </div>
          </div>
          {/* Main Content */}
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Messages Area */}
            <div className="flex flex-[5] p-3">
              <MessageViewer messages={directMessages} />
            </div>
            {/* Input Area */}
            <div className="flex flex-[1] p-3">
              <MessageInputBox
                onSendMessage={(msg) => {
                  handleSendMessage({
                    id: '',
                    type: 'general',
                    content: msg,
                    senderId: user.id,
                    timestamp: 0,
                  });
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    );
  },
);

DirectMessageModal.displayName = 'DirectMessageModal';

export default DirectMessageModal;

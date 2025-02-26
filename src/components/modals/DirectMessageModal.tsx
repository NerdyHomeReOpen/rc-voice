/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';

// Types
import { User, Friend, DirectMessage } from '@/types';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Components
import MessageViewer from '@/components/viewers/MessageViewer';
import MessageInputBox from '@/components/MessageInputBox';

interface DirectMessageModalProps {
  friend: Friend | null;
  onClose: () => void;
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = React.memo(
  ({ onClose, friend }) => {
    if (!friend) return null;

    // Redux
    const user = useSelector((state: { user: User }) => state.user);
    const sessionId = useSelector(
      (state: { sessionToken: string }) => state.sessionToken,
    );

    // Socket
    const socket = useSocket();

    const handleSendMessage = (directMessage: DirectMessage) => {
      socket?.sendDirectMessage(directMessage);
    };

    const friendUser = friend.user;
    const friendAvatar = friendUser?.avatarUrl ?? '/pfp/default.png';
    const friendName = friendUser?.name;
    const friendLevel = Math.min(56, Math.ceil((friendUser?.level ?? 0) / 5)); // 56 is max level
    const friendGradeUrl = `/UserGrade_${friendLevel}.png`;
    const friendDirectMessages = friend.directMessages ?? [];

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
              <MessageViewer messages={friendDirectMessages} />
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
                    friendId: friend.id,
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

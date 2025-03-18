/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';

// Types
import { User, UserFriend, DirectMessage, SocketServerEvent } from '@/types';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';

// Components
import MessageViewer from '@/components/viewers/MessageViewer';
import MessageInputBox from '@/components/MessageInputBox';

interface DirectMessageModalProps {
  friendId: string | null;
  userId: string | null;
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = React.memo(
  (initialData: DirectMessageModalProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // States
    const [user, setUser] = useState<User>({
      id: '',
      name: '未知使用者',
      avatar: '',
      avatarUrl: '',
      signature: '',
      status: 'online',
      gender: 'Male',
      level: 0,
      xp: 0,
      requiredXp: 0,
      progress: 0,
      currentChannelId: '',
      currentServerId: '',
      lastActiveAt: 0,
      createdAt: 0,
    });
    const [friend, setFriend] = useState<UserFriend>({
      id: '',
      name: '未知使用者',
      avatar: '',
      avatarUrl: '',
      signature: '',
      status: 'online',
      gender: 'Male',
      level: 0,
      xp: 0,
      requiredXp: 0,
      progress: 0,
      currentChannelId: '',
      currentServerId: '',
      lastActiveAt: 0,
      createdAt: 0,
      isBlocked: false,
      friendGroupId: '',
      user1Id: '',
      user2Id: '',
    });

    // Variables
    const userId = user.id;
    const friendId = friend.id;
    const friendAvatar = friend.avatar;
    const friendName = friend.name;
    const friendLevel = friend.level;
    const friendGrade = Math.min(56, Math.ceil(friendLevel / 5)); // 56 is max level
    const friendDirectMessages = friend.directMessages || [];

    // Handlers
    const handleSendMessage = (directMessage: DirectMessage) => {
      if (!socket) return;
      socket.send.directMessage({ directMessage });
    };

    const handleUserUpdate = (data: Partial<User>) => {
      if (data.id === userId) setUser((prev) => ({ ...prev, ...data }));
      if (data.id === friendId) setFriend((prev) => ({ ...prev, ...data }));
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, [socket]);

    useEffect(() => {
      if (!socket) return;
      socket.send.refreshUser({ userId: userId });
      socket.send.refreshUser({ userId: friendId });
    }, [socket, userId, friendId]);

    return null;
    // <Modal title={friendName} onClose={onClose} width="600px" height="600px">
    //   <div className="flex h-full">
    //     {/* Side Menu */}
    //     <div className="flex flex-col p-4 w-40 bg-blue-50 text-sm">
    //       {/* <img src={friendAvatar} className="w-24 h-24" /> */}
    //       <div className="flex items-center gap-2">
    //         <div className="">{`${lang.tr.level}: ${friendLevel}`}</div>
    //         {/* <img src={friendGradeUrl} className="select-none" /> */}
    //       </div>
    //     </div>
    //     {/* Main Content */}
    //     <div className="flex flex-col flex-1 overflow-y-auto">
    //       {/* Messages Area */}
    //       <div className="flex flex-[5] p-3">
    //         <MessageViewer messages={friendDirectMessages} />
    //       </div>
    //       {/* Input Area */}
    //       <div className="flex flex-[1] p-3">
    //         <MessageInputBox
    //           onSendMessage={(msg) => {
    //             handleSendMessage({
    //               id: '',
    //               type: 'general',
    //               content: msg,
    //               senderId: userId,
    //               friendId: friendId,
    //               timestamp: 0,
    //             });
    //           }}
    //         />
    //       </div>
    //     </div>
    //   </div>
    // </Modal>
  },
);

DirectMessageModal.displayName = 'DirectMessageModal';

export default DirectMessageModal;

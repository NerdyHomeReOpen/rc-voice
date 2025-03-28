/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';

// Types
import { User, DirectMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';

// Components
import MessageViewer from '@/components/viewers/Message';
import MessageInputBox from '@/components/MessageInputBox';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface DirectMessageModalProps {
  friendId: string;
  userId: string;
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = React.memo(
  (initialData: DirectMessageModalProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshRef = useRef(false);

    // States
    const [friendAvatar, setFriendAvatar] = useState<User['avatar']>(
      createDefault.user().avatar,
    );
    const [friendName, setFriendName] = useState<User['name']>(
      createDefault.user().name,
    );
    const [friendLevel, setFriendLevel] = useState<User['level']>(
      createDefault.user().level,
    );

    // Variables
    const { friendId, userId } = initialData;
    const friendGrade = Math.min(56, Math.ceil(friendLevel / 5)); // 56 is max level

    // Handlers
    const handleSendMessage = (
      directMessage: Partial<DirectMessage>,
      friendId: User['id'],
    ) => {
      if (!socket) return;
      socket.send.directMessage({ directMessage, friendId });
    };

    const handleFriendUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setFriendAvatar(data.avatar);
      setFriendName(data.name);
      setFriendLevel(data.level);
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      if (!userId || !friendId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        const friend = await refreshService.user({ userId: friendId });
        handleFriendUpdate(friend);
      };
      refresh();
    }, [userId, friendId]);

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

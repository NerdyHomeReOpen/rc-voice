import React, { useEffect, useRef, useState } from 'react';

// Types
import { Member, User } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// CSS
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';

// Services
import refreshService from '@/services/refresh.service';
import ipcService from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface EditMemberModalProps {
  userId: string;
  serverId: string;
}

const EditMemberModal: React.FC<EditMemberModalProps> = React.memo(
  (initialData: EditMemberModalProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // Variables
    const { userId, serverId } = initialData;

    // States
    const [member, setMember] = useState(createDefault.member());
    const [memberNickname, setMemberNickname] = useState(
      createDefault.member().nickname,
    );
    const [userName, setUserName] = useState(createDefault.user().name);

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleUpdateMember = (
      member: Partial<Member>,
      action: string | null,
    ) => {
      if (!socket) return;
      socket.send.updateMember({
        member,
        userId,
        serverId,
        action,
      });
    };

    const handleMemberUpdate = (data: Member | null) => {
      if (!data) data = createDefault.member();
      setMemberNickname(data.nickname);
      setMember(data);
    };

    const handleUserUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setUserName(data.name);
    };

    // Effects
    useEffect(() => {
      if (!userId || !serverId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        const member = await refreshService.member({
          userId: userId,
          serverId: serverId,
        });
        const user = await refreshService.user({
          userId: userId,
        });
        handleMemberUpdate(member);
        handleUserUpdate(user);
      };
      refresh();
    }, [userId, serverId]);

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={popup['inputBox']}>
                <label>{lang.tr.nickname}</label>
                <label className={popup['value']}>{userName}</label>
              </div>
              <div className={`${popup['inputBox']} ${popup['col']}`}>
                <div className={popup['label']}>
                  {lang.tr.pleaseEnterTheMemberNickname}
                </div>
                <input
                  className={popup['input']}
                  type="text"
                  value={memberNickname || ''}
                  onChange={(e) => {
                    setMemberNickname(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']}`}
            onClick={() => {
              handleUpdateMember(
                {
                  ...member,
                  nickname: memberNickname,
                },
                'nickname',
              );
              handleClose();
            }}
          >
            {lang.tr.confirm}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

EditMemberModal.displayName = 'EditMemberModal';

export default EditMemberModal;

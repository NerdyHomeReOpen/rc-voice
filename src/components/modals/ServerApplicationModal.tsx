/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';

// CSS
import Popup from '@/styles/common/popup.module.css';
import applyMember from '@/styles/popups/serverApplication.module.css';

// Types
import {
  PopupType,
  User,
  Server,
  SocketServerEvent,
  MemberApplication,
} from '@/types';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';

// Services
import { ipcService } from '@/services/ipc.service';

interface ServerApplicationModalProps {
  serverId: string | null;
  userId: string | null;
}

const ServerApplicationModal: React.FC<ServerApplicationModalProps> =
  React.memo((initialData: ServerApplicationModalProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // State
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
    const [server, setServer] = useState<Server>({
      id: '',
      name: '未知伺服器',
      avatar: '',
      avatarUrl: '/logo_server_def.png',
      announcement: '',
      description: '',
      type: 'other',
      displayId: '00000000',
      slogan: '',
      level: 0,
      wealth: 0,
      lobbyId: '',
      ownerId: '',
      settings: {
        allowDirectMessage: false,
        visibility: 'public',
        defaultChannelId: '',
      },
      createdAt: 0,
    });
    const [application, setApplication] = useState<MemberApplication>({
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
      description: '',
      userId: '',
      serverId: '',
    });

    // Variables
    const userId = initialData.userId || '';
    const serverId = initialData.serverId || '';
    const serverName = server.name;
    const serverDisplayId = server.displayId;
    const serverAvatar = server.avatar;
    const applicationDescription = application.description;

    // Section Control
    const [section, setSection] = useState<number>(0);

    const handleCreatMemberApplication = (application: MemberApplication) => {
      socket?.send.createMemberApplication({ memberApplication: application });
    };

    const handleOpenSuccessDialog = () => {
      ipcService.popup.open(PopupType.DIALOG_SUCCESS);
      ipcService.initialData.onRequest(PopupType.DIALOG_SUCCESS, {
        title: lang.tr.serverApply,
        submitTo: PopupType.DIALOG_SUCCESS,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_SUCCESS, () => {
        setSection(1);
      });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleUserUpdate = (data: Partial<User>) => {
      setUser((prev) => ({ ...prev, ...data }));
    };

    const handleServerUpdate = (data: Partial<Server>) => {
      setServer((prev) => ({ ...prev, ...data }));
    };

    // UseEffect
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
        [SocketServerEvent.SERVER_UPDATE]: handleServerUpdate,
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, []);

    useEffect(() => {
      if (!socket) return;
      socket.send.refreshUser({ userId: userId });
      socket.send.refreshServer({ serverId: serverId });
    }, [socket]);

    switch (section) {
      // Member Application Form
      case 0:
        return (
          <div className={Popup['popupContainer']}>
            <div className={`${Popup['popupBody']}`}>
              <div className={applyMember['body']}>
                <div className={applyMember['headerBox']}>
                  <div className={applyMember['avatarWrapper']}>
                    <div
                      className={applyMember['avatarPicture']}
                      style={
                        serverAvatar
                          ? { backgroundImage: `url(${serverAvatar})` }
                          : {}
                      }
                    />
                  </div>
                  <div className={applyMember['serverInfoWrapper']}>
                    <div className={applyMember['serverName']}>
                      {serverName}
                    </div>
                    <div className={applyMember['serverId']}>
                      {`ID: ${serverDisplayId}`}
                    </div>
                  </div>
                </div>
                <div className={Popup['label']}>
                  {lang.tr.serverApplyNotice}
                </div>
                <div className={applyMember['noteText']}>
                  {'{server.settings.applicationNote}'}
                </div>
                <div className={applyMember['split']} />
                <div className={applyMember['contentBox']}>
                  <div className={Popup['label']}>
                    {lang.tr.serverApplyDescription}
                  </div>
                  <div className={Popup['inputBox']}>
                    <textarea
                      rows={2}
                      onChange={(e) =>
                        setApplication((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      value={applicationDescription}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className={Popup['popupFooter']}>
              <button
                type="submit"
                className={Popup['button']}
                onClick={() => {
                  handleCreatMemberApplication({
                    ...application,
                    serverId: serverId,
                    userId: userId,
                  });
                  handleOpenSuccessDialog();
                }}
              >
                {lang.tr.submit}
              </button>
              <button
                type="button"
                className={Popup['button']}
                onClick={() => handleClose()}
              >
                {lang.tr.cancel}
              </button>
            </div>
          </div>
        );

      // Show Notification
      case 1:
        return (
          <div className={Popup['popupContainer']}>
            <div className={Popup['popupBody']}>
              <div className={applyMember['body']}>
                <div className={applyMember['headerBox']}>
                  <div className={applyMember['avatarWrapper']}>
                    <div
                      className={applyMember['avatarPicture']}
                      style={
                        serverAvatar
                          ? { backgroundImage: `url(${serverAvatar})` }
                          : {}
                      }
                    />
                  </div>
                  <div className={applyMember['serverInfoWrapper']}>
                    <div className={applyMember['serverName']}>
                      {serverName}
                    </div>
                    <div className={applyMember['serverId']}>
                      {`ID: ${serverDisplayId}`}
                    </div>
                  </div>
                </div>
                <div className={Popup['label']}>{'申請須知'}</div>
                <div className={applyMember['noteText']}>
                  {'{server.settings.applicationNote}'}
                </div>
                <div className={applyMember['split']} />
                <div className={applyMember['contentBox']}>
                  <div className={applyMember['notificationText']}>
                    {'申請已送出，請等待管理員審核'}
                  </div>
                </div>
              </div>
            </div>
            <div className={Popup['popupFooter']}>
              <button className={Popup['button']} onClick={() => setSection(0)}>
                {'修改'}
              </button>
              <button className={Popup['button']} onClick={() => handleClose()}>
                {'確認'}
              </button>
            </div>
          </div>
        );
    }
  });

ServerApplicationModal.displayName = 'ServerApplicationModal';

export default ServerApplicationModal;

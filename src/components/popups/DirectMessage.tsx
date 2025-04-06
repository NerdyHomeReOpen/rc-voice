/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';

// Types
import { User, DirectMessage, SocketServerEvent } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';
import { useSocket } from '@/providers/Socket';

// Components
import MessageViewer from '@/components/viewers/Message';

// Services
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

// CSS
import popup from '@/styles/common/popup.module.css';
import directMessage from '@/styles/popups/directMessage.module.css';
import vip from '@/styles/common/vip.module.css';
import grade from '@/styles/common/grade.module.css';

interface DirectMessagePopupProps {
  userId: string;
  targetId: string;
  windowRef: React.RefObject<HTMLDivElement>;
}

const DirectMessagePopup: React.FC<DirectMessagePopupProps> = React.memo(
  (initialData: DirectMessagePopupProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshRef = useRef(false);

    // States
    const [userAvatarUrl, setUserAvatarUrl] = useState<User['avatar']>(
      createDefault.user().avatar,
    );
    const [targetAvatarUrl, setTargetAvatarUrl] = useState<User['avatar']>(
      createDefault.user().avatar,
    );
    const [targetLevel, setTargetLevel] = useState<User['level']>(
      createDefault.user().level,
    );
    const [targetSignature, setTargetSignature] = useState<User['signature']>(
      createDefault.user().signature,
    );
    const [targetVip, setTargetVip] = useState<User['vip']>(
      createDefault.user().vip,
    );
    const [targetCurrentServerName, setTargetCurrentServerName] =
      useState<string>();
    const [targetCurrentServerId, setTargetCurrentServerId] =
      useState<string>();
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
    const [messageInput, setMessageInput] = useState<string>('');
    const [isComposing, setIsComposing] = useState<boolean>(false);
    const [isDisabled, setIsDisabled] = useState<boolean>(false);
    const [isWarning, setIsWarning] = useState<boolean>(false);

    // Variables
    const { targetId, userId } = initialData;
    const targetGrade = Math.min(56, targetLevel); // 56 is max level

    // Handlers
    const handleSendMessage = (
      directMessage: Partial<DirectMessage>,
      userId: User['id'],
      targetId: User['id'],
    ) => {
      if (!socket) return;
      socket.send.directMessage({ directMessage, userId, targetId });
    };

    const handleShakeDirectMessage = () => {
      if (!socket) return;
      socket.send.shakeDirectMessage({ userId, targetId });
    };

    const handleReceiveShake = (data: any) => {
      // check if the current conversation
      const {userId: fromUserId, targetId: toUserId} = data;
      if (fromUserId && toUserId && userId === toUserId) {
        shakeWindow();
      }
    };

    const handleTargetUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setTargetAvatarUrl(data.avatarUrl);
      setTargetLevel(data.level);
      setTargetSignature(data.signature);
      setTargetVip(data.vip);
      data.currentServerId;
      currentServer(data.currentServerId);
    };

    const handleUserUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setUserAvatarUrl(data.avatarUrl);
    };

    const handleDirectMessageUpdate = (data: DirectMessage[] | null) => {
      if (!data) data = [];

      if (data.length > 0) {
        const currentUsers = [userId, targetId];
        const userId_1 = data[0].userId1;
        const userId_2 = data[0].userId2;

        // check if the message array is between the current users
        const isCurrentMessage =
          currentUsers.find((user) => user == userId_1) &&
          currentUsers.find((user) => user == userId_2);

        if (isCurrentMessage) {
          setDirectMessages(data);
        }
      }
    };

    const shakeWindow = (duration = 500) => {
      const el = initialData.windowRef.current;
      if (!el) return;

      const start = performance.now();

      const shake = (time: number) => {
        const elapsed = time - start;
        if (elapsed > duration) {
          el.style.transform = 'translate(0, 0)';
          return;
        }

        const x = Math.round((Math.random() - 0.5) * 10);
        const y = Math.round((Math.random() - 0.5) * 10);
        el.style.transform = `translate(${x}px, ${y}px)`;

        requestAnimationFrame(shake);
      };
      requestAnimationFrame(shake);
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.DIRECT_MESSAGE_UPDATE]: handleDirectMessageUpdate,
        [SocketServerEvent.SHAKE_DIRECT_MESSAGE]: handleReceiveShake,
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
      if (!userId || !targetId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          refreshService.user({
            userId: targetId,
          }),
          refreshService.user({
            userId: userId,
          }),
          refreshService.directMessage({
            userId: userId,
            targetId: targetId,
          }),
        ]).then(([target, user, directMessage]) => {
          handleTargetUpdate(target);
          handleUserUpdate(user);
          handleDirectMessageUpdate(directMessage);
        });
      };
      refresh();
    }, [userId, targetId]);

    const currentServer = async (serverId: string) => {
      Promise.all([
        refreshService.server({
          serverId: serverId,
        }),
      ]).then(([server]) => {
        setTargetCurrentServerName(server?.name);
        setTargetCurrentServerId(server?.id);
      });
    };
    return (
      <div className={popup['popupContainer']}>
        <div className={directMessage['header']}>
          <div className={directMessage['userSignature']}>
            {targetSignature}
          </div>
          <div className={directMessage['directOptionButtons']}>
            <div className={directMessage['fileShare']} />
            <div className={directMessage['blockUser']} />
            <div className={directMessage['unBlockUser']} />
            <div className={directMessage['inviteTempGroup']} />
            <div className={directMessage['report']} />
          </div>
        </div>
        <div className={popup['popupBody']}>
          <div className={directMessage['sidebar']}>
            <div className={directMessage['targetBox']}>
              <div
                className={directMessage['avatarPicture']}
                style={{ backgroundImage: `url(${targetAvatarUrl})` }}
              />
              {targetVip > 0 && (
                <div
                  className={`
                  ${vip['vipIconBig']}
                  ${vip[`vip-big-${targetVip}`]}`}
                />
              )}
              <div
                className={`
                    ${grade['grade']}
                    ${grade[`lv-${targetGrade}`]}`}
              />
            </div>
            <div className={directMessage['userBox']}>
              <div
                className={directMessage['avatarPicture']}
                style={{ backgroundImage: `url(${userAvatarUrl})` }}
              />
            </div>
          </div>
          <div className={directMessage['mainContent']}>
            <div className={directMessage['serverInArea']}>
              <div className={directMessage['serverInIcon']} />
              <div className={directMessage['serverInName']}>
                {targetCurrentServerName || ''}
              </div>
            </div>
            <div className={directMessage['messageArea']}>
              <MessageViewer messages={directMessages} />
            </div>
            <div className={directMessage['inputArea']}>
              <div className={directMessage['topBar']}>
                <div className={directMessage['buttons']}>
                  <div
                    className={`${directMessage['button']} ${directMessage['font']}`}
                  />
                  <div
                    className={`${directMessage['button']} ${directMessage['emoji']}`}
                  />
                  <div
                    className={`${directMessage['button']} ${directMessage['screenShot']}`}
                  />
                  <div
                    className={`${directMessage['button']} ${directMessage['nudge']}`}
                    onClick={() => handleShakeDirectMessage()}
                  />
                </div>
                <div className={directMessage['buttons']}>
                  <div className={directMessage['historyMessage']}>
                    訊息紀錄
                  </div>
                </div>
              </div>
              <textarea
                className={directMessage['input']}
                value={messageInput}
                onChange={(e) => {
                  if (isDisabled) return;
                  e.preventDefault();
                  setMessageInput(e.target.value);
                }}
                onPaste={(e) => {
                  if (isDisabled) return;
                  e.preventDefault();
                  setMessageInput(
                    (prev) => prev + e.clipboardData.getData('text'),
                  );
                }}
                onKeyDown={(e) => {
                  if (
                    e.shiftKey ||
                    e.key !== 'Enter' ||
                    !messageInput.trim() ||
                    messageInput.length > 2000 ||
                    isComposing ||
                    isDisabled ||
                    isWarning
                  )
                    return;
                  e.preventDefault();
                  handleSendMessage(
                    { content: messageInput },
                    userId,
                    targetId,
                  );
                  setMessageInput('');
                }}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                maxLength={2000}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

DirectMessagePopup.displayName = 'DirectMessagePopup';

export default DirectMessagePopup;

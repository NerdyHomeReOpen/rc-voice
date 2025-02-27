/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';

// Redux
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';
import Dialog from '@/components/common/Dialog';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Types
import { Server } from '@/types';

// CSS
import Popup from '../../styles/common/popup.module.css';
import ServerApplication from '../../styles/popups/serverApplication.module.css';

interface ServerApplicationModalProps {
  onClose: () => void;
  server?: Server;
}

const ServerApplicationModal: React.FC<ServerApplicationModalProps> =
  React.memo(({ onClose, server }) => {
    // Socket
    const socket = useSocket();

    // State
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    // Redux
    const sessionId = useSelector(
      (state: { sessionToken: string }) => state.sessionToken,
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log(description);
      // Emit application event
      // socket?.emit('applyServerMembership', {
      //   sessionId,
      //   serverId: server?.id,
      //   application: {
      //     description: description.trim() || '',
      //     timestamp: Date.now(),
      //   },
      // });
      // Handle response
      // socket?.once(
      //   'applicationResponse',
      //   (response: { success: boolean; message: string }) => {
      //     if (response.success) {
      //       onClose();
      //     } else {
      //       setError(response.message);
      //     }
      //   },
      // );
      onClose();
    };

    if (isApplying) {
      return (
        <form className={Popup['popupContainer']} onSubmit={handleSubmit}>
          <div className={Popup['popupMessageWrapper']}>
            <div
              className={`${ServerApplication['popupBody']} ${ServerApplication['applyMember']}`}
            >
              <div className={ServerApplication['header']}>
                <div className={ServerApplication['avatarWrapper']}>
                  <div
                    className={ServerApplication['avatarPictureBorder']}
                  ></div>
                  <div className={ServerApplication['avatarPicture']}></div>
                </div>
                <div className={ServerApplication['serverInfoBox']}>
                  <div className={ServerApplication['serverInfoName']}>
                    {server?.name}
                  </div>
                  <div className={ServerApplication['serverInfoIDBox']}>
                    <div className={ServerApplication['serverInfoIDTitle']}>
                      ID:
                    </div>
                    <div className={ServerApplication['serverInfoID']}>
                      {server?.id}
                    </div>
                  </div>
                </div>
              </div>
              <div className={ServerApplication['body']}>
                <div className={ServerApplication['serverInfoBox']}>
                  <div>申請須知</div>
                  <div className={ServerApplication['instructions']}>
                    申請須知內容
                  </div>
                </div>
                <div className={ServerApplication['split']}></div>
                <div className={ServerApplication['serverInfoBox']}>
                  <div>申請說明</div>
                  <div className={Popup['inputBorder']}>
                    <textarea
                      className={ServerApplication['instructionsInput']}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      value={description}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div className={Popup['popupFooter']}>
              <button
                type="submit"
                className={`${Popup['button']} ${
                  !description.trim() ? Popup['disabled'] : ''
                }`}
              >
                申請
              </button>
              <button
                type="button"
                className={Popup['button']}
                onClick={onClose}
              >
                取消
              </button>
            </div>
          </div>
        </form>
      );
    }

    return (
      <div className={Popup['popupContainer']}>
        <div className={Popup['popupMessageWrapper']}>
          <div className={ServerApplication['popupBody']}>
            <Dialog
              popupIcon="popupIconWarning"
              textBorder={Popup['textBorder']}
              title={
                <>
                  該群的管理員已設定只有會員才能訪問
                  <br />
                  如需訪問，請
                  <span
                    className={ServerApplication['applyText']}
                    onClick={() => setIsApplying(true)}
                    style={{ color: 'blue', cursor: 'pointer' }}
                  >
                    申請成為會員
                  </span>
                  。
                </>
              }
              onSubmit={(e) => {
                e.preventDefault();
                setIsApplying(true);
              }}
              onClose={onClose}
            />
          </div>
          <div className={Popup['popupFooter']}>
            <button type="button" className={Popup['button']} onClick={onClose}>
              確定
            </button>
          </div>
        </div>
      </div>
    );
  });

ServerApplicationModal.displayName = 'ServerApplicationModal';

export default ServerApplicationModal;

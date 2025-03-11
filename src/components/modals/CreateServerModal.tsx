/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import React, { FormEvent, useState, Suspense, useRef } from 'react';
import { useSelector } from 'react-redux';

// Providers
import { useSocket } from '@/providers/SocketProvider';

// Types
import { User, Server } from '@/types';

// CSS
import Popup from '../../styles/common/popup.module.css';
import CreateServer from '../../styles/popups/createServer.module.css';

// Services
import { ipcService } from '@/services/ipc.service';

// Validation
export const validateName = (name: string): string => {
  if (!name.trim()) return '請輸入群組名稱';
  if (name.length > 30) return '群組名稱不能超過30個字符';
  return '';
};
export const validateDescription = (description: string): string => {
  if (!description?.trim()) return '';
  if (description.length > 200) return '口號不能超過200個字符';
  return '';
};

interface ServerTypeTabProps {
  user: User;
  server: Server;
  setServer: (server: Server) => void;
}

const ServerTypeTab: React.FC<ServerTypeTabProps> = ({
  user,
  server,
  setServer,
}) => {
  const maxGroups = 3;
  const remainingGroups = maxGroups - (user.ownedServers?.length ?? 0);

  return (
    <>
      <div className={`${Popup['popupMessage']} ${CreateServer['message']}`}>
        {`您還可以創建${remainingGroups}個群，創建之後不能刪除或轉讓`}
      </div>
      <label className={CreateServer['label']} data-key="60030">
        請您選擇語音群類型
      </label>
      <div className={CreateServer['buttonGroup']}>
        {['遊戲', '娛樂', '其他'].map((type) => (
          <div
            key={type}
            className={`${CreateServer['button']} ${
              !remainingGroups ? Popup['disabled'] : ''
            }`}
            onClick={() => setServer({ ...server, type })}
          >
            {type}
          </div>
        ))}
      </div>
    </>
  );
};

interface ServerBasicInfoTabProps {
  server: Server;
  setServer: (server: Server) => void;
}

const ServerBasicInfoTab: React.FC<ServerBasicInfoTabProps> = ({
  server,
  setServer,
}) => {
  // Error Control
  const [errors, setErrors] = useState<{ [key: string]: string }>({
    name: '',
    description: '',
  });

  // Image Preview Control
  const [previewImage, setPreviewImage] = useState<string>(
    '/logo_server_def.png',
  );

  return (
    <>
      <div className={CreateServer['changeAvatarWrapper']}>
        <div>
          <img
            src={previewImage}
            alt="Avatar"
            className={CreateServer['changeAvatarPicture']}
          />
          <input
            type="file"
            id="avatar-upload"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || file.size > 5 * 1024 * 1024) return; // FIXME: Add error message
              const reader = new FileReader();
              reader.onloadend = () => {
                setPreviewImage(reader.result as string);
                setServer({ ...server, avatar: reader.result as string });
              };
              reader.readAsDataURL(file);
            }}
          />
          <label
            htmlFor="avatar-upload"
            style={{ marginTop: '10px' }}
            className={Popup['button']}
          >
            更換頭像
          </label>
        </div>
      </div>
      <div className={Popup['inputGroup']}>
        <div className={Popup['inputBox']}>
          <div className={Popup['title']}>群類型：</div>
          <div className={`${Popup['inputBorder']} ${Popup['disabled']}`}>
            <input disabled value={server.type} />
          </div>
        </div>
      </div>
      <div className={Popup['inputBox']}>
        <div className={`${Popup['title']} ${Popup['impotant']}`}>群名稱</div>
        <div className={Popup['inputBorder']}>
          <input
            type="text"
            value={server.name}
            onChange={(e) => setServer({ ...server, name: e.target.value })}
            onBlur={() =>
              setErrors({
                ...errors,
                name: validateName(server.name),
              })
            }
            placeholder="6-30個字元組成，首尾輸入的空格無效，不能包含不雅詞彙。"
            className={Popup['inputBorder']}
          />
        </div>
        {errors.name && <p className="text-red-500">{errors.name}</p>}
      </div>
      <div className={Popup['inputBox']}>
        <div className={Popup['title']}>口號</div>
        <div className={Popup['inputBorder']}>
          <textarea
            value={server.description}
            onChange={(e) =>
              setServer({ ...server, description: e.target.value })
            }
            onBlur={() =>
              setErrors({
                ...errors,
                description: validateDescription(server.description),
              })
            }
            placeholder="0-30個字元，口號是您建立團隊的目標"
            className={Popup['inputBorder']}
          />
        </div>
        {errors.description && (
          <p className="text-red-500">{errors.description}</p>
        )}
      </div>
    </>
  );
};

interface CreateServerModalProps {
  user: User;
}

const CreateServerModal: React.FC<CreateServerModalProps> = React.memo(
  (initialData: CreateServerModalProps) => {
    const { user } = initialData;
    if (!user) return null;

    // Socket Control
    const socket = useSocket();

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleSubmit = async (e: FormEvent<Element>) => {
      e.preventDefault();
      socket?.send.createServer({ server: server });
      handleClose();
    };

    const [section, setSection] = useState<number>(0);

    // Form Control
    const [server, setServer] = useState<Server>({
      id: '',
      name: '',
      avatar: null,
      avatarUrl: null,
      level: 0,
      description: '',
      wealth: 0,
      slogan: '',
      announcement: '',
      type: '',
      displayId: '',
      lobbyId: '',
      ownerId: user.id,
      settings: {
        allowDirectMessage: true,
        visibility: 'public',
        defaultChannelId: '',
      },
      createdAt: 0,
    });

    const getHeader = () => {
      switch (section) {
        case 0:
          return '選擇語音群類型';
        case 1:
          return '填寫資料';
      }
    };

    const getMainContent = () => {
      switch (section) {
        case 0:
          return (
            <ServerTypeTab user={user} server={server} setServer={setServer} />
          );
        case 1:
          return <ServerBasicInfoTab server={server} setServer={setServer} />;
      }
    };

    const getFooter = () => {
      switch (section) {
        case 0:
          return (
            <>
              <button className={Popup['button']} onClick={() => setSection(1)}>
                下一步
              </button>
              <button className={Popup['button']} onClick={handleClose}>
                取消
              </button>
            </>
          );
        case 1:
          return (
            <>
              <button className={Popup['button']} onClick={() => setSection(0)}>
                上一步
              </button>
              <button className={Popup['button']} onClick={handleSubmit}>
                確定
              </button>
            </>
          );
      }
    };

    return (
      <div className={Popup['popupContainer']}>
        <div className={Popup['popupMessageWrapper']}>
          <div className={CreateServer['header']}>
            <div className={CreateServer['headerButton']}>{getHeader()}</div>
          </div>
          <div className={Popup['popupBody']}>{getMainContent()}</div>
          <div className={Popup['popupFooter']}>{getFooter()}</div>
        </div>
      </div>
    );
  },
);

CreateServerModal.displayName = 'CreateServerModal';
export default CreateServerModal;

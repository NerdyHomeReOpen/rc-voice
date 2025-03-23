import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/common/popup.module.css';
import createServer from '@/styles/popups/createServer.module.css';

// Types
import { User, Server, PopupType } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import ipcService from '@/services/ipc.service';
import apiService from '@/services/api.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface CreateServerModalProps {
  userId: string;
}

const CreateServerModal: React.FC<CreateServerModalProps> = React.memo(
  (initialData: CreateServerModalProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshRef = useRef(false);

    // Constant
    const MAX_GROUPS = 3;
    const SERVER_TYPES: { value: Server['type']; name: string }[] = [
      {
        value: 'game',
        name: lang.tr.game,
      },
      {
        value: 'entertainment',
        name: lang.tr.entertainment,
      },
      {
        value: 'other',
        name: lang.tr.other,
      },
    ];

    // States
    const [userOwnedServers, setUserOwnedServers] = useState<Server[]>(
      createDefault.user().ownedServers || [],
    );
    const [serverName, setServerName] = useState<Server['name']>(
      createDefault.server().name,
    );
    const [serverType, setServerType] = useState<Server['type']>(
      createDefault.server().type,
    );
    const [serverAvatar, setServerAvatar] = useState<Server['avatar']>(
      createDefault.server().avatar,
    );
    const [serverAvatarUrl, setServerAvatarUrl] = useState<Server['avatarUrl']>(
      createDefault.server().avatarUrl,
    );
    const [serverDescription, setServerDescription] = useState<
      Server['description']
    >(createDefault.server().description);
    const [section, setSection] = useState<number>(0);

    // Variables
    const { userId } = initialData;
    const remainingGroups = MAX_GROUPS - userOwnedServers.length;
    const canCreate = remainingGroups > 0;

    // Handlers
    const handleCreateServer = (server: Partial<Server>) => {
      if (!socket) return;
      socket.send.createServer({ server });
    };

    const handleUserUpdate = (data: User | null) => {
      if (!data) data = createDefault.user();
      setUserOwnedServers(data.ownedServers || []);
    };

    const handleOpenErrorDialog = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_ERROR);
      ipcService.initialData.onRequest(PopupType.DIALOG_ERROR, {
        title: message,
        submitTo: PopupType.DIALOG_ERROR,
      });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      if (!userId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        const user = await refreshService.user({ userId: userId });
        handleUserUpdate(user);
      };
      refresh();
    }, [userId]);

    switch (section) {
      // Server Type Selection Section
      case 0:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={createServer['tab']}>
                <div
                  className={`${createServer['item']} ${createServer['active']}`}
                >
                  {lang.tr.selectGroupType}
                </div>
                <div className={`${createServer['item']}`}>
                  {lang.tr.fillInfo}
                </div>
              </div>
              <div className={createServer['body']}>
                <div className={`${createServer['message']}`}>
                  {`${lang.tr.remainingGroup1}${remainingGroups}${lang.tr.remainingGroup2}`}
                </div>
                <label className={createServer['typeLabel']} data-key="60030">
                  {lang.tr.selectGroupTypeDescription}
                </label>
                <div className={createServer['buttonGroup']}>
                  {SERVER_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className={`${createServer['button']} ${
                        serverType === type.value
                          ? createServer['selected']
                          : ''
                      }`}
                      onClick={() =>
                        setServerType(type.value as Server['type'])
                      }
                    >
                      {type.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={popup['popupFooter']}>
              <button
                className={`${popup['button']} ${
                  !serverType || !canCreate ? popup['disabled'] : ''
                }`}
                disabled={!serverType || !canCreate}
                onClick={() => setSection(1)}
              >
                {lang.tr.next}
              </button>
              <button className={popup['button']} onClick={() => handleClose()}>
                {lang.tr.cancel}
              </button>
            </div>
          </div>
        );

      // Server Data Input Section
      case 1:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={createServer['tab']}>
                <div className={`${createServer['item']}`}>
                  {lang.tr.selectGroupType}
                </div>
                <div
                  className={`${createServer['item']} ${createServer['active']}`}
                >
                  {lang.tr.fillInfo}
                </div>
              </div>
              <div className={createServer['body']}>
                <div className={createServer['avatarWrapper']}>
                  <div
                    className={createServer['avatarPicture']}
                    style={{ backgroundImage: `url(${serverAvatarUrl})` }}
                  />
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        handleOpenErrorDialog(lang.tr.canNotReadImage);
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        handleOpenErrorDialog(lang.tr.imageTooLarge);
                        return;
                      }

                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const formData = new FormData();
                        formData.append('_type', 'server');
                        formData.append('_fileName', serverAvatar);
                        formData.append('_file', reader.result as string);
                        const data = await apiService.post('/upload', formData);
                        if (data) {
                          setServerAvatar(data.avatar);
                          setServerAvatarUrl(data.avatarUrl);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <label
                    htmlFor="avatar-upload"
                    style={{ marginTop: '10px' }}
                    className={popup['button']}
                  >
                    {lang.tr.uploadAvatar}
                  </label>
                </div>
                <div className={createServer['inputGroup']}>
                  <div className={popup['inputBox']}>
                    <div className={popup['label']}>{lang.tr.groupType}</div>
                    <input
                      className={popup['input']}
                      type="text"
                      disabled
                      value={lang.tr[serverType as keyof typeof lang.tr]}
                    />
                  </div>
                  <div className={popup['inputBox']}>
                    <div className={`${popup['label']} ${popup['required']}`}>
                      {lang.tr.groupName}
                    </div>
                    <input
                      className={popup['input']}
                      type="text"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      // onBlur={() =>
                      //   setErrors((prev) => ({
                      //     ...prev,
                      //     name: validateName(serverName),
                      //   }))}
                      placeholder={lang.tr.groupNamePlaceholder}
                    />
                    {/* {errors.name && <p className="text-red-500">{errors.name}</p>} */}
                  </div>
                  <div className={popup['inputBox']}>
                    <div className={popup['label']}>{lang.tr.groupSlogan}</div>
                    <textarea
                      className={popup['input']}
                      value={serverDescription}
                      onChange={(e) => setServerDescription(e.target.value)}
                      // onBlur={() =>
                      //   setErrors((prev) => ({
                      //     ...prev,
                      //     description: validateDescription(serverDescription),
                      //   }))}
                      placeholder={lang.tr.groupSloganPlaceholder}
                    />
                    {/* {errors.description && (
                  <p className="text-red-500">{errors.description}</p>
                )} */}
                  </div>
                </div>
              </div>
            </div>
            <div className={popup['popupFooter']}>
              <button className={popup['button']} onClick={() => setSection(0)}>
                {lang.tr.previous}
              </button>
              <button
                className={`${popup['button']} ${
                  !serverName.trim() || !canCreate ? popup['disabled'] : ''
                }`}
                disabled={!serverName.trim() || !canCreate}
                onClick={() => {
                  handleCreateServer({
                    name: serverName,
                    avatar: serverAvatar,
                    avatarUrl: serverAvatarUrl,
                    description: serverDescription,
                    type: serverType,
                    ownerId: userId,
                  });
                  handleClose();
                }}
              >
                {lang.tr.confirm}
              </button>
            </div>
          </div>
        );
    }
  },
);

CreateServerModal.displayName = 'CreateServerModal';

export default CreateServerModal;

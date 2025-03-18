/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// CSS
import EditServer from '@/styles/popups/editServer.module.css';
import Popup from '@/styles/common/popup.module.css';
import permission from '@/styles/common/permission.module.css';

// Components
import MarkdownViewer from '@/components/viewers/MarkdownViewer';

// Types
import {
  MemberApplication,
  Server,
  PopupType,
  ServerMember,
  SocketServerEvent,
  User,
} from '@/types';

// Utils
import { getPermissionText } from '@/utils/formatters';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useContextMenu } from '@/providers/ContextMenuProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';

// Utils
import { createDefault } from '@/utils/default';

interface ServerSettingModalProps {
  serverId: string;
  userId: string;
}

const EditServerModal: React.FC<ServerSettingModalProps> = React.memo(
  (initialData: ServerSettingModalProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();

    // States
    const [user, setUser] = useState<User>(createDefault.user());
    const [server, setServer] = useState<Server>(createDefault.server());

    const [sortedMembers, setSortedMembers] = useState<ServerMember[]>([]);
    const [sortedApplications, setSortedApplications] = useState<
      MemberApplication[]
    >([]);
    const [sortedBlockMembers, setSortedBlockMembers] = useState<
      ServerMember[]
    >([]);

    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

    const setServerIcon = useRef<HTMLInputElement>(null);

    const [sortState, setSortState] = useState<number>(-1);
    const [sortField, setSortField] = useState<string>('name');

    // Variables
    const serverId = initialData.serverId;
    const userId = initialData.userId;
    const serverName = server.name;
    const serverAvatar = server.avatar;
    const serverAnnouncement = server.announcement;
    const serverDescription = server.description;
    const serverType = server.type;
    const serverDisplayId = server.displayId;
    const serverSlogan = server.slogan;
    const serverLevel = server.level;
    const serverWealth = server.wealth;
    const serverCreatedAt = server.createdAt;
    const serverSettings = server.settings;
    const serverUsers = server.users || [];
    const serverApplications = server.memberApplications || [];

    // Handlers
    const handleSort = (field: string, array: any[], direction: number) => {
      setSortField(field);
      setSortState(direction);
      return array.sort((a, b) => direction * (a[field] - b[field]));
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

    const handleSubmit = () => {
      if (!socket) return;
      socket.send.updateServer({ server: server, userId: user.id });
      handleClose();
    };

    const handleApplicationAction = (action: 'accept' | 'reject') => {};

    const handleUserMove = () => {};

    const handleKickServer = () => {};

    const handleBlockUser = () => {};

    const handleServerUpdate = (data: Partial<Server> | null) => {
      if (!data) data = createDefault.server();
      setServer((prev) => ({ ...prev, ...data }));
    };

    const handleUserUpdate = (data: Partial<User> | null) => {
      if (!data) data = createDefault.user();
      setUser((prev) => ({ ...prev, ...data }));
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
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
    }, [socket]);

    useEffect(() => {
      if (!socket) return;
      if (serverId) socket.send.refreshServer({ serverId: serverId });
      if (userId) socket.send.refreshUser({ userId: userId });
    }, [socket]);

    return (
      <div className={Popup['popupContainer']}>
        <div className={Popup['popupBody']}>
          <div style={{ display: 'flex', height: '100%', width: '100%' }}>
            {/* Left Sidebar */}
            <div className={EditServer['left']}>
              <div className={EditServer['tabs']}>
                {[
                  lang.tr.viewGroupInfo,
                  lang.tr.announcement,
                  lang.tr.memberManagement,
                  lang.tr.accessPermission,
                  lang.tr.memberApplicationManagement,
                  lang.tr.blacklistManagement,
                ].map((title, index) => (
                  <div
                    className={`${EditServer['item']} ${
                      activeTabIndex === index ? EditServer['active'] : ''
                    }`}
                    onClick={() => setActiveTabIndex(index)}
                    key={index}
                  >
                    {title}
                  </div>
                ))}
              </div>
            </div>
            {/* Right Content */}
            <div className={EditServer['right']}>
              <div className={EditServer['body']}>
                {activeTabIndex === 0 ? (
                  <>
                    <div
                      className={`${EditServer['inputGroup']} ${EditServer['row']}`}
                    >
                      <div
                        className={`${EditServer['inputGroup']} ${EditServer['col']}`}
                      >
                        <div
                          className={`${EditServer['inputGroup']} ${EditServer['row']}`}
                        >
                          <div
                            className={`${Popup['inputBox']} ${Popup['col']}`}
                          >
                            <div className={Popup['label']}>{lang.tr.name}</div>
                            <input
                              type="text"
                              value={serverName}
                              onChange={(e) => {
                                setServer((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }));
                              }}
                            />
                          </div>
                          <div
                            className={`${Popup['inputBox']} ${Popup['col']}`}
                          >
                            <div className={Popup['label']}>{lang.tr.id}</div>
                            <input
                              type="text"
                              value={serverDisplayId}
                              disabled
                            />
                          </div>
                        </div>
                        <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                          <div className={Popup['label']}>{lang.tr.slogan}</div>
                          <input
                            type="text"
                            value={serverSlogan}
                            onChange={(e) => {
                              setServer((prev) => ({
                                ...prev,
                                slogan: e.target.value,
                              }));
                            }}
                          />
                        </div>
                        <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                          <div className={Popup['label']}>{lang.tr.type}</div>
                          <select
                            value={serverType}
                            onChange={(e) => {
                              setServer((prev) => ({
                                ...prev,
                                type: e.target.value,
                              }));
                            }}
                          >
                            <option>{lang.tr.other}</option>
                            <option>{lang.tr.game}</option>
                            <option>{lang.tr.entertainment}</option>
                          </select>
                        </div>
                      </div>
                      <div className={EditServer['avatarWrapper']}>
                        <div
                          className={EditServer['avatarPicture']}
                          style={{
                            backgroundImage: `url(${serverAvatar})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        <input
                          type="file"
                          id="avatar-upload"
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          ref={setServerIcon}
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
                            reader.onloadend = () => {
                              setServer((prev) => ({
                                ...prev,
                                avatar: reader.result as string,
                              }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <label
                          htmlFor="avatar-upload"
                          className={Popup['button']}
                          style={{ marginTop: '10px' }}
                          onClick={(e) => {
                            e.preventDefault();
                            setServerIcon.current?.click();
                          }}
                        >
                          {lang.tr.changeImage}
                        </label>
                      </div>
                    </div>
                    <div style={{ minHeight: '10px' }} />
                    <div
                      className={`${EditServer['inputGroup']} ${EditServer['col']}`}
                    >
                      <div
                        className={`${EditServer['inputGroup']} ${EditServer['row']}`}
                      >
                        <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                          <div className={Popup['label']}>{lang.tr.level}</div>
                          <input type="text" value={serverLevel} disabled />
                        </div>
                        <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                          <div className={Popup['label']}>
                            {lang.tr.creationTime}
                          </div>
                          <input
                            type="text"
                            value={new Date(serverCreatedAt).toLocaleString()}
                            disabled
                          />
                        </div>
                        <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                          <div
                            className={`${Popup['label']} ${EditServer['wealthCoinIcon']}`}
                          >
                            {lang.tr.wealth}
                          </div>
                          <input type="text" value={serverWealth} disabled />
                        </div>
                      </div>
                      <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                        <div className={Popup['label']}>
                          {lang.tr.description}
                        </div>
                        <textarea
                          value={serverDescription}
                          onChange={(e) =>
                            setServer((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </>
                ) : activeTabIndex === 1 ? (
                  <>
                    <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                      <div className={Popup['label']}>
                        {lang.tr.inputAnnouncement}
                      </div>
                      <textarea
                        style={{ minHeight: '200px' }}
                        value={serverAnnouncement}
                        onChange={(e) =>
                          setServer((prev) => ({
                            ...prev,
                            announcement: e.target.value,
                          }))
                        }
                      />
                      <div className={Popup['label']}>
                        {lang.tr.markdownSupport}
                      </div>
                    </div>
                    {/* <div
                      className={Popup['button']}
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                    >
                      {isPreviewMode ? lang.tr.edit : lang.tr.preview}
                    </div> */}
                  </>
                ) : activeTabIndex === 2 ? (
                  <>
                    <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                      <div className={Popup['label']}>
                        {lang.tr.members}: {sortedMembers.length}
                      </div>
                      {/* <div className={EditServer['search']}>
                        <input
                          type="text"
                          placeholder={lang.tr.searchPlaceholder}
                          value={searchText}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setSearchText(e.target.value)
                          }
                        />
                      </div> */}
                      <table style={{ minHeight: '280px' }}>
                        <thead>
                          <tr>
                            {[
                              'name',
                              'permission',
                              'contribution',
                              'joinDate',
                            ].map((field) => {
                              return (
                                <th
                                  key={field}
                                  onClick={() => {
                                    const _ = handleSort(
                                      field,
                                      serverUsers,
                                      sortState,
                                    );
                                    setSortedMembers(_);
                                  }}
                                >
                                  {field}
                                  <span className="absolute right-0">
                                    {sortField === field &&
                                      (sortState === 1 ? (
                                        <ChevronUp size={16} />
                                      ) : (
                                        <ChevronDown size={16} />
                                      ))}
                                  </span>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedMembers.map((member) => {
                            const userGender = member.gender;
                            const userNickname = member.nickname;
                            const userPermission = member.permissionLevel;
                            const userContributions = member.contribution;
                            const userJoinDate = member.createdAt;
                            return (
                              <tr
                                key={member?.id}
                                onContextMenu={(e) => {
                                  const isCurrentUser =
                                    // member.userId === user.id; // FIXME
                                    false;
                                  contextMenu.showContextMenu(
                                    e.pageX,
                                    e.pageY,
                                    [
                                      {
                                        label: '傳送即時訊息',
                                        disabled: isCurrentUser,
                                        onClick: () => {},
                                      },
                                      {
                                        label: '檢視個人檔案',
                                        onClick: () => {},
                                      },
                                      {
                                        label: '新增好友',
                                        disabled: isCurrentUser,
                                        onClick: () => {},
                                      },
                                      {
                                        label: '拒聽此人語音',
                                        disabled: isCurrentUser,
                                        onClick: () => {},
                                      },
                                      {
                                        label: '修改群名片',
                                        onClick: () => {},
                                      },
                                      {
                                        label: lang.tr.moveToMyChannel,
                                        disabled: isCurrentUser,
                                        onClick: () => handleUserMove(),
                                      },
                                      {
                                        label: '禁止此人語音',
                                        disabled: isCurrentUser,
                                        onClick: () => {},
                                      },
                                      {
                                        label: '禁止文字',
                                        disabled: isCurrentUser,
                                        onClick: () => {},
                                      },
                                      {
                                        label: lang.tr.kickOut,
                                        disabled: isCurrentUser,
                                        onClick: () => handleKickServer(),
                                      },
                                      {
                                        label: lang.tr.block,
                                        disabled: isCurrentUser,
                                        onClick: () => handleBlockUser(),
                                      },
                                      {
                                        label: lang.tr.memberManagement,
                                        disabled: isCurrentUser,
                                        onClick: () => {},
                                      },
                                      {
                                        label: lang.tr.inviteToBeMember,
                                        disabled: isCurrentUser,
                                        onClick: () => {},
                                      },
                                    ],
                                  );
                                }}
                              >
                                <td>
                                  <div
                                    className={`${permission[userGender]} ${
                                      permission[`lv-${userPermission}`]
                                    }`}
                                  />
                                  {userNickname}
                                </td>
                                <td>
                                  {getPermissionText(userPermission, lang.tr)}
                                </td>
                                <td>{userContributions}</td>
                                <td>
                                  {new Date(userJoinDate).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className={EditServer['hintText']}>
                      {lang.tr.rightClickToProcess}
                    </div>
                  </>
                ) : activeTabIndex === 3 ? (
                  <>
                    <div
                      className={`${EditServer['inputGroup']} ${EditServer['col']}`}
                    >
                      <div className={Popup['label']}>
                        {lang.tr.accessPermission}
                      </div>
                      <div className={`${Popup['inputBox']} ${Popup['row']}`}>
                        <input
                          type="radio"
                          id="public"
                          name="permission"
                          value="public"
                          className="mr-3"
                          checked={serverSettings.visibility === 'public'}
                          onChange={(e) => {
                            if (e.target.checked)
                              setServer((prev) => ({
                                ...prev,
                                settings: {
                                  ...prev.settings,
                                  visibility: 'public',
                                },
                              }));
                          }}
                        />
                        <div className={Popup['label']}>
                          {lang.tr.publicGroup}
                        </div>
                      </div>
                      <div className={`${Popup['inputBox']} ${Popup['row']}`}>
                        <input
                          type="radio"
                          id="members"
                          name="permission"
                          value="members"
                          className="mr-3"
                          checked={serverSettings.visibility === 'private'}
                          onChange={(e) => {
                            if (e.target.checked)
                              setServer((prev) => ({
                                ...prev,
                                settings: {
                                  ...prev.settings,
                                  visibility: 'private',
                                },
                              }));
                          }}
                        />
                        <div>
                          <div className={Popup['label']}>
                            {lang.tr.semiPublicGroup}
                          </div>
                          <div className={EditServer['hintText']}>
                            {lang.tr.semiPublicGroupDescription}
                          </div>
                        </div>
                      </div>
                      <div className={`${Popup['inputBox']} ${Popup['row']}`}>
                        <input
                          type="radio"
                          id="private"
                          name="permission"
                          value="private"
                          className="mr-3"
                          checked={serverSettings.visibility === 'invisible'}
                          onChange={(e) => {
                            if (e.target.checked)
                              setServer((prev) => ({
                                ...prev,
                                settings: {
                                  ...prev.settings,
                                  visibility: 'invisible',
                                },
                              }));
                          }}
                        />
                        <div>
                          <div className={Popup['label']}>
                            {lang.tr.privateGroup}
                          </div>
                          <div className={EditServer['hintText']}>
                            {lang.tr.privateGroupDescription}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : activeTabIndex === 4 ? (
                  <>
                    <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                      <div className={Popup['label']}>
                        {lang.tr.applicants}: {sortedApplications.length}
                      </div>
                      {/* <div className={EditServer['search']}>
                        <input
                          type="text"
                          placeholder={lang.tr.searchPlaceholder}
                          value={searchText}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setSearchText(e.target.value)
                          }
                        />
                      </div> */}
                      <table style={{ minHeight: '280px' }}>
                        <thead>
                          <tr>
                            {['name', 'contribution', 'description'].map(
                              (field) => {
                                return (
                                  <th
                                    key={field}
                                    onClick={() => {
                                      const _ = handleSort(
                                        field,
                                        serverApplications,
                                        sortState,
                                      );
                                      setSortedApplications(_);
                                    }}
                                  >
                                    {field}
                                    <span className="absolute right-0">
                                      {sortField === field &&
                                        (sortState === 1 ? (
                                          <ChevronUp size={16} />
                                        ) : (
                                          <ChevronDown size={16} />
                                        ))}
                                    </span>
                                  </th>
                                );
                              },
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedApplications.map((application) => {
                            const userName = application.name;
                            // const userContribution = application.contribution; // FIXME
                            const userDescription = application.description;
                            return (
                              <tr
                                key={application.id}
                                onContextMenu={(e) => {
                                  contextMenu.showContextMenu(
                                    e.pageX,
                                    e.pageY,
                                    [],
                                  );
                                }}
                              >
                                <td>{userName}</td>
                                {/* <td>{userContribution}</td> */}
                                <td>{userDescription}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className={EditServer['hintText']}>
                      {lang.tr.rightClickToProcess}
                    </div>
                  </>
                ) : activeTabIndex === 5 ? (
                  <>
                    <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                      <div className={Popup['label']}>
                        {lang.tr.blacklist}: {sortedBlockMembers.length}
                      </div>
                      {/* <div className={EditServer['search']}>
                        <input
                          type="text"
                          placeholder={lang.tr.searchPlaceholder}
                          value={searchText}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setSearchText(e.target.value)
                          }
                        />
                      </div> */}
                      <table style={{ minHeight: '280px' }}>
                        <thead>
                          <tr>
                            {['name', 'contribution', 'description'].map(
                              (field) => {
                                return (
                                  <th
                                    key={field}
                                    onClick={() => {
                                      const _ = handleSort(
                                        field,
                                        sortedBlockMembers,
                                        sortState,
                                      );
                                      setSortedBlockMembers(_);
                                    }}
                                  >
                                    {field}
                                    <span className="absolute right-0">
                                      {sortField === field &&
                                        (sortState === 1 ? (
                                          <ChevronUp size={16} />
                                        ) : (
                                          <ChevronDown size={16} />
                                        ))}
                                    </span>
                                  </th>
                                );
                              },
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {sortedBlockMembers.map((blockMember) => {
                            const userName = blockMember.name;
                            const userContribution = blockMember.contribution;
                            return (
                              <tr
                                key={blockMember.id}
                                onContextMenu={(e) => {
                                  contextMenu.showContextMenu(
                                    e.pageX,
                                    e.pageY,
                                    [],
                                  );
                                }}
                              >
                                <td>{userName}</td>
                                <td>{userContribution}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className={EditServer['hintText']}>
                      {lang.tr.rightClickToProcess}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className={Popup['popupFooter']}>
          <button className={Popup['button']} onClick={() => handleSubmit()}>
            {lang.tr.confirm}
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
  },
);

EditServerModal.displayName = 'EditServerModal';

export default EditServerModal;

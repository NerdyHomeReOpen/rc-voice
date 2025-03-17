/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// CSS
import EditServer from '@/styles/popups/editServer.module.css';
import Popup from '@/styles/common/popup.module.css';
import permission from '@/styles/common/permission.module.css';

// Components
import MarkdownViewer from '@/components/viewers/MarkdownViewer';

// Types
import { ServerApplication, Server, Member, popupType } from '@/types';

// Utils
import { getPermissionText } from '@/utils/formatters';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useContextMenu } from '@/providers/ContextMenuProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';

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

    // Variables
    const serverId = initialData.serverId;
    const userId = initialData.userId;

    // States
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
    const [serverMembers, setserverMembers] = useState<Member[]>([]);
    const [serverApplications, setserverApplications] = useState<
      ServerApplication[]
    >([]);

    const [sortedMembers, setSortedMembers] = useState<Member[]>([]);
    const [sortedApplications, setSortedApplications] = useState<
      ServerApplication[]
    >([]);
    const [sortedBlockMembers, setSortedBlockMembers] = useState<Member[]>([]);

    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

    const setServerIcon = useRef<HTMLInputElement>(null);

    const [sortState, setSortState] = useState<number>(-1);
    const [sortField, setSortField] = useState<string>('name');

    const handleSort = (field: string, array: any[], direction: number) => {
      setSortField(field);
      setSortState(direction);
      return array.sort((a, b) => direction * (a[field] - b[field]));
    };

    const handleOpenErrorDialog = (message: string) => {
      ipcService.popup.open(popupType.DIALOG_ERROR);
      ipcService.initialData.onRequest(popupType.DIALOG_ERROR, {
        title: message,
        submitTo: popupType.DIALOG_ERROR,
      });
    };

    const handleApplicationAction = (action: 'accept' | 'reject') => {};

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleSubmit = () => {
      if (!socket) return;
      socket.send.updateServer({ server: server });
      handleClose();
    };

    const handleUserMove = (target: Member) => {};

    const handleKickServer = (target: Member) => {};

    const handleBlockUser = (target: Member) => {};

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
                              value={server?.name ?? server?.name}
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
                              value={server?.displayId || server?.id}
                              disabled
                            />
                          </div>
                        </div>
                        <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                          <div className={Popup['label']}>{lang.tr.slogan}</div>
                          <input
                            type="text"
                            value={server.slogan}
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
                          <select>
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
                            backgroundImage: `url(${'/logo_server_def.png'})`,
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
                          <input
                            type="text"
                            value={server?.level || 0}
                            disabled
                          />
                        </div>
                        <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                          <div className={Popup['label']}>
                            {lang.tr.creationTime}
                          </div>
                          <input
                            type="text"
                            value={new Date(server?.createdAt).toLocaleString()}
                            disabled
                          />
                        </div>
                        <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                          <div
                            className={`${Popup['label']} ${EditServer['wealthCoinIcon']}`}
                          >
                            {lang.tr.wealth}
                          </div>
                          <input
                            type="text"
                            value={server?.wealth || 0}
                            disabled
                          />
                        </div>
                      </div>
                      <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                        <div className={Popup['label']}>
                          {lang.tr.description}
                        </div>
                        <textarea
                          value={server?.description ?? server?.description}
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
                        value={server?.announcement}
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
                                    const _sortedMember = handleSort(
                                      field,
                                      Object.values(server.members || {}),
                                      sortState,
                                    );
                                    setSortedMembers(_sortedMember);
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
                            const memberUser = member.user;
                            const userGender = memberUser?.gender ?? 'Male';
                            const userNickname = member.nickname;
                            const userPermission = member.permissionLevel;
                            const userContributions = member.contribution;
                            const userJoinDate = new Date(
                              member.createdAt,
                            ).toLocaleString();

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
                                        onClick: () => handleUserMove(member),
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
                                        onClick: () => handleKickServer(member),
                                      },
                                      {
                                        label: lang.tr.block,
                                        disabled: isCurrentUser,
                                        onClick: () => handleBlockUser(member),
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
                                <td>{userJoinDate}</td>
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
                          checked={server.settings.visibility === 'public'}
                          onChange={(e) => {
                            if (e.target.checked)
                              setServer({
                                ...server,
                                settings: {
                                  ...server.settings,
                                  visibility: 'public',
                                },
                              });
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
                          checked={server.settings.visibility === 'private'}
                          onChange={(e) => {
                            if (e.target.checked)
                              setServer({
                                ...server,
                                settings: {
                                  ...server.settings,
                                  visibility: 'private',
                                },
                              });
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
                          checked={server.settings.visibility === 'invisible'}
                          onChange={(e) => {
                            if (e.target.checked)
                              setServer({
                                ...server,
                                settings: {
                                  ...server.settings,
                                  visibility: 'invisible',
                                },
                              });
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
                                      const _sortedMember = handleSort(
                                        field,
                                        Object.values(server.members || {}),
                                        sortState,
                                      );
                                      setSortedMembers(_sortedMember);
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
                                {/* FIXME */}
                                {/* <td>{application.user.name}</td> */}
                                {/* <td>{application.contribution}</td> */}
                                {/* <td>{application.description}</td> */}
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
                                      const _sortedMember = handleSort(
                                        field,
                                        Object.values(server.members || {}),
                                        sortState,
                                      );
                                      setSortedMembers(_sortedMember);
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
                                {/* FIXME */}
                                {/* <td>{blockMember.user.name}</td> */}
                                {/* <td>{blockMember.contribution}</td> */}
                                {/* <td>{blockMember.description}</td> */}
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

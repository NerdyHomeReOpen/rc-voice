/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// CSS
import EditServer from '@/styles/popups/editServer.module.css';
import Popup from '@/styles/common/popup.module.css';
import permission from '@/styles/common/permission.module.css';

// Components
// import MarkdownViewer from '@/components/viewers/MarkdownViewer';

// Types
import {
  MemberApplication,
  Server,
  PopupType,
  ServerMember,
  Member,
  Permission,
  User,
} from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useContextMenu } from '@/providers/ContextMenuProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import ipcService from '@/services/ipc.service';
import apiService from '@/services/api.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';
import { createSorter } from '@/utils/createSorter';

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

    // Constants
    const MEMBER_FIELDS = [
      {
        name: lang.tr.name,
        field: 'name',
      },
      {
        name: lang.tr.permission,
        field: 'permissionLevel',
      },
      {
        name: lang.tr.contribution,
        field: 'contribution',
      },
      {
        name: lang.tr.joinDate,
        field: 'createdAt',
      },
    ];
    const APPLICATION_FIELDS = [
      {
        name: lang.tr.name,
        field: 'name',
      },
      {
        name: lang.tr.description,
        field: 'description',
      },
      {
        name: lang.tr.creationTime,
        field: 'createdAt',
      },
    ];
    const BLOCK_MEMBER_FIELDS = [
      {
        name: lang.tr.name,
        field: 'name',
      },
    ];

    // Refs
    const refreshRef = useRef(false);

    // States
    const [serverName, setServerName] = useState<Server['name']>(
      createDefault.server().name,
    );
    const [serverAvatar, setServerAvatar] = useState<Server['avatar']>(
      createDefault.server().avatar,
    );
    const [serverAvatarUrl, setServerAvatarUrl] = useState<Server['avatarUrl']>(
      createDefault.server().avatarUrl,
    );
    const [serverAnnouncement, setServerAnnouncement] = useState<
      Server['announcement']
    >(createDefault.server().announcement);
    const [serverDescription, setServerDescription] = useState<
      Server['description']
    >(createDefault.server().description);
    const [serverType, setServerType] = useState<Server['type']>(
      createDefault.server().type,
    );
    const [serverDisplayId, setServerDisplayId] = useState<Server['displayId']>(
      createDefault.server().displayId,
    );
    const [serverSlogan, setServerSlogan] = useState<Server['slogan']>(
      createDefault.server().slogan,
    );
    const [serverLevel, setServerLevel] = useState<Server['level']>(
      createDefault.server().level,
    );
    const [serverWealth, setServerWealth] = useState<Server['wealth']>(
      createDefault.server().wealth,
    );
    const [serverCreatedAt, setServerCreatedAt] = useState<Server['createdAt']>(
      createDefault.server().createdAt,
    );
    const [serverVisibility, setServerVisibility] = useState<
      Server['visibility']
    >(createDefault.server().visibility);
    const [serverMembers, setServerMembers] = useState<ServerMember[]>(
      createDefault.server().members || [],
    );
    const [serverApplications, setServerApplications] = useState<
      MemberApplication[]
    >(createDefault.server().memberApplications || []);
    const [serverBlockMembers, setServerBlockMembers] = useState<
      ServerMember[]
    >(createDefault.server().members?.filter((mb) => mb.isBlocked) || []);

    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
    const [sortState, setSortState] = useState<1 | -1>(-1);
    const [sortField, setSortField] = useState<string>('');

    // Variables
    const { serverId, userId } = initialData;

    // Handlers
    const handleSort = <T extends ServerMember | MemberApplication>(
      field: keyof T,
      array: T[],
    ) => {
      const newDirection =
        sortField === String(field) ? (sortState === 1 ? -1 : 1) : -1;
      setSortField(String(field));
      setSortState(newDirection);
      return [...array].sort(createSorter(field, newDirection));
    };

    const handleUpdateServer = (
      server: Partial<Server>,
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.updateServer({ server, serverId });
    };

    const handleUpdateApplication = (
      memberApplication: Partial<MemberApplication>,
      userId: User['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.updateMemberApplication({
        memberApplication,
        userId,
        serverId,
      });
    };

    const handleUpdateMember = (
      member: Partial<Member>,
      userId: User['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.updateMember({ member, userId, serverId });
    };

    const handleCreateMember = (
      member: Partial<Member>,
      userId: User['id'],
      serverId: Server['id'],
    ) => {
      if (!socket) return;
      socket.send.createMember({ member, userId, serverId });
    };

    const handleServerUpdate = (data: Server | null) => {
      if (!data) data = createDefault.server();
      setServerName(data.name);
      setServerAvatar(data.avatar);
      setServerAvatarUrl(data.avatarUrl);
      setServerAnnouncement(data.announcement);
      setServerDescription(data.description);
      setServerType(data.type);
      setServerDisplayId(data.displayId);
      setServerSlogan(data.slogan);
      setServerLevel(data.level);
      setServerWealth(data.wealth);
      setServerCreatedAt(data.createdAt);
      setServerVisibility(data.visibility);
      setServerMembers(data.members || []);
      setServerApplications(data.memberApplications || []);
      setServerBlockMembers(data.members?.filter((mb) => mb.isBlocked) || []);
    };

    const handleBlockMemberSort = (field: keyof ServerMember) => {
      const sortedMembers = handleSort(field, [...serverBlockMembers]);
      setServerBlockMembers(sortedMembers);
    };

    const handleMemberSort = (field: keyof ServerMember) => {
      const sortedMembers = handleSort(field, [...serverMembers]);
      setServerMembers(sortedMembers);
    };

    const handleApplicationSort = (field: keyof MemberApplication) => {
      const sortedApplications = handleSort(field, [...serverApplications]);
      setServerApplications(sortedApplications);
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleUserMove = () => {};

    const handleKickServer = (member: ServerMember) => {
      if (!socket) return;
      ipcService.popup.open(PopupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(PopupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: `確定要踢出 ${member.name} 嗎？使用者可以再次加入。`,
        submitTo: PopupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_WARNING, () => {
        handleUpdateMember(
          {
            id: member.id,
            permissionLevel: Permission.Guest,
            createdAt: 0,
            nickname: '',
          },
          member.userId,
          member.serverId,
        );
      });
    };

    const handleBlockUser = (member: ServerMember) => {
      if (!socket) return;
      ipcService.popup.open(PopupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(PopupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: `確定要封鎖 ${member.name} 嗎？使用者將無法再次加入。`,
        submitTo: PopupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(PopupType.DIALOG_WARNING, () => {
        handleUpdateMember(
          {
            id: member.id,
            permissionLevel: Permission.Guest,
            nickname: '',
            isBlocked: true,
          },
          member.userId,
          member.serverId,
        );
      });
    };

    const handleOpenEditMember = (
      serverId: Server['id'],
      userId: User['id'],
    ) => {
      if (!socket) return;
      ipcService.popup.open(PopupType.EDIT_MEMBER);
      ipcService.initialData.onRequest(PopupType.EDIT_MEMBER, {
        serverId,
        userId,
      });
    };

    const handleOpenErrorDialog = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_ERROR);
      ipcService.initialData.onRequest(PopupType.DIALOG_ERROR, {
        title: message,
        submitTo: PopupType.DIALOG_ERROR,
      });
    };

    // Effects
    useEffect(() => {
      if (!serverId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        const server = await refreshService.server({ serverId: serverId });
        handleServerUpdate(server);
      };
      refresh();
    }, [serverId]);

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
                                setServerName(e.target.value);
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
                              setServerSlogan(e.target.value);
                            }}
                          />
                        </div>
                        <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                          <div className={Popup['label']}>{lang.tr.type}</div>
                          <select
                            value={serverType}
                            onChange={(e) => {
                              setServerType(e.target.value as Server['type']);
                            }}
                          >
                            <option value="other">{lang.tr.other}</option>
                            <option value="game">{lang.tr.game}</option>
                            <option value="entertainment">
                              {lang.tr.entertainment}
                            </option>
                          </select>
                        </div>
                      </div>
                      <div className={EditServer['avatarWrapper']}>
                        <div
                          className={EditServer['avatarPicture']}
                          style={{
                            backgroundImage: `url(${serverAvatarUrl})`,
                          }}
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
                              const data = await apiService.post(
                                '/upload',
                                formData,
                              );
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
                          className={Popup['button']}
                          style={{ marginTop: '10px' }}
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
                          onChange={(e) => setServerDescription(e.target.value)}
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
                        onChange={(e) => setServerAnnouncement(e.target.value)}
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
                        {lang.tr.members}: {serverMembers.length}
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
                            {MEMBER_FIELDS.map((field) => (
                              <th
                                key={field.field}
                                onClick={() =>
                                  handleMemberSort(
                                    field.field as keyof ServerMember,
                                  )
                                }
                              >
                                {field.name}
                                <span className="absolute right-0">
                                  {sortField === field.field &&
                                    (sortState === 1 ? (
                                      <ChevronUp size={16} />
                                    ) : (
                                      <ChevronDown size={16} />
                                    ))}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={EditServer['tableContainer']}>
                          {serverMembers.map((member) => {
                            const {
                              id: memberId,
                              name: memberName,
                              nickname: memberNickname,
                              gender: memberGender,
                              permissionLevel: memberPermissionLevel,
                              contribution: memberContribution,
                              userId: memberUserId,
                              serverId: memberServerId,
                              createdAt: memberJoinDate,
                            } = member;
                            return (
                              <tr
                                key={memberId}
                                onContextMenu={(e) => {
                                  const isCurrentUser = memberUserId === userId;
                                  contextMenu.showContextMenu(
                                    e.pageX,
                                    e.pageY,
                                    [
                                      {
                                        label: '傳送即時訊息',
                                        onClick: () => {},
                                        show: !isCurrentUser,
                                      },
                                      {
                                        label: '檢視個人檔案',
                                        onClick: () => {},
                                        show: !isCurrentUser,
                                      },
                                      {
                                        label: '新增好友',
                                        onClick: () => {},
                                        show: !isCurrentUser,
                                      },
                                      // {
                                      //   label: '拒聽此人語音',
                                      //   onClick: () => {},
                                      // },
                                      {
                                        label: '修改群名片',
                                        onClick: () =>
                                          handleOpenEditMember(
                                            memberServerId,
                                            memberUserId,
                                          ),
                                      },
                                      {
                                        label: lang.tr.moveToMyChannel,
                                        onClick: () => handleUserMove(),
                                        show: !isCurrentUser,
                                      },
                                      // {
                                      //   label: '禁止此人語音',
                                      //   onClick: () => {},
                                      // },
                                      // {
                                      //   label: '禁止文字',
                                      //   onClick: () => {},
                                      // },
                                      {
                                        label: lang.tr.kickOut,
                                        onClick: () => handleKickServer(member),
                                        show: !isCurrentUser,
                                      },
                                      {
                                        label: lang.tr.block,
                                        onClick: () => handleBlockUser(member),
                                        show: !isCurrentUser,
                                      },
                                      {
                                        label: lang.tr.memberManagement,
                                        onClick: () => {},
                                        show: !isCurrentUser,
                                      },
                                      // {
                                      //   label: lang.tr.inviteToBeMember,
                                      //   onClick: () => {},
                                      // },
                                    ],
                                  );
                                }}
                              >
                                <td>
                                  <div
                                    className={`${permission[memberGender]} ${
                                      permission[`lv-${memberPermissionLevel}`]
                                    }`}
                                  />
                                  {memberNickname || memberName}
                                </td>
                                <td>
                                  {lang.getPermissionText(
                                    memberPermissionLevel,
                                  )}
                                </td>
                                <td>{memberContribution}</td>
                                <td>
                                  {new Date(memberJoinDate).toLocaleString()}
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
                          checked={serverVisibility === 'public'}
                          onChange={(e) => {
                            if (e.target.checked) setServerVisibility('public');
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
                          checked={serverVisibility === 'private'}
                          onChange={(e) => {
                            if (e.target.checked)
                              setServerVisibility('private');
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
                          checked={serverVisibility === 'invisible'}
                          onChange={(e) => {
                            if (e.target.checked)
                              setServerVisibility('invisible');
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
                        {lang.tr.applicants}: {serverApplications.length}
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
                            {APPLICATION_FIELDS.map((field) => (
                              <th
                                key={field.field}
                                onClick={() =>
                                  handleApplicationSort(
                                    field.field as keyof MemberApplication,
                                  )
                                }
                              >
                                {field.name}
                                <span className="absolute right-0">
                                  {sortField === field.field &&
                                    (sortState === 1 ? (
                                      <ChevronUp size={16} />
                                    ) : (
                                      <ChevronDown size={16} />
                                    ))}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={EditServer['tableContainer']}>
                          {serverApplications.map((application) => {
                            const {
                              id: applicationId,
                              name: applicationName,
                              description: applicationDescription,
                              createdAt: applicationCreatedDate,
                              userId: applicationUserId,
                              serverId: applicationServerId,
                            } = application;
                            return (
                              <tr
                                key={applicationId}
                                onContextMenu={(e) => {
                                  contextMenu.showContextMenu(
                                    e.pageX,
                                    e.pageY,
                                    [
                                      {
                                        label: '接受申請',
                                        onClick: () => {
                                          handleUpdateApplication(
                                            { applicationStatus: 'accepted' },
                                            applicationUserId,
                                            applicationServerId,
                                          );
                                          handleCreateMember(
                                            { permissionLevel: 2 },
                                            applicationUserId,
                                            applicationServerId,
                                          );
                                        },
                                      },
                                      {
                                        label: '拒絕申請',
                                        onClick: () => {
                                          handleUpdateApplication(
                                            { applicationStatus: 'rejected' },
                                            applicationUserId,
                                            applicationServerId,
                                          );
                                        },
                                      },
                                    ],
                                  );
                                }}
                              >
                                <td>{applicationName}</td>
                                <td>{applicationDescription}</td>
                                <td>
                                  {new Date(
                                    applicationCreatedDate,
                                  ).toLocaleString()}
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
                ) : activeTabIndex === 5 ? (
                  <>
                    <div className={`${Popup['inputBox']} ${Popup['col']}`}>
                      <div className={Popup['label']}>
                        {lang.tr.blacklist}: {serverBlockMembers.length}
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
                            {BLOCK_MEMBER_FIELDS.map((field) => (
                              <th
                                key={field.field}
                                onClick={() =>
                                  handleBlockMemberSort(
                                    field.field as keyof ServerMember,
                                  )
                                }
                              >
                                {field.name}
                                <span className="absolute right-0">
                                  {sortField === field.field &&
                                    (sortState === 1 ? (
                                      <ChevronUp size={16} />
                                    ) : (
                                      <ChevronDown size={16} />
                                    ))}
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={EditServer['tableContainer']}>
                          {serverBlockMembers.map((blockMember) => {
                            const {
                              id: blockMemberId,
                              userId: blockMemberUserId,
                              serverId: blockMemberServerId,
                              nickname: blockMemberNickname,
                              name: blockMemberName,
                              contribution: blockMemberContribution,
                            } = blockMember;
                            return (
                              <tr
                                key={blockMemberId}
                                onContextMenu={(e) => {
                                  contextMenu.showContextMenu(
                                    e.pageX,
                                    e.pageY,
                                    [],
                                  );
                                }}
                              >
                                <td>
                                  {blockMemberNickname || blockMemberName}
                                </td>
                                <td>{blockMemberContribution}</td>
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
          <button
            className={Popup['button']}
            onClick={() => {
              handleUpdateServer(
                {
                  name: serverName,
                  avatar: serverAvatar,
                  avatarUrl: serverAvatarUrl,
                  announcement: serverAnnouncement,
                  description: serverDescription,
                  type: serverType,
                  displayId: serverDisplayId,
                  slogan: serverSlogan,
                  level: serverLevel,
                  wealth: serverWealth,
                  createdAt: serverCreatedAt,
                  visibility: serverVisibility,
                },
                serverId,
              );
              handleClose();
            }}
          >
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

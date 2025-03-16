/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

// CSS
import EditServer from '@/styles/popups/editServer.module.css';
import Popup from '@/styles/common/popup.module.css';
import permission from '@/styles/common/permission.module.css';

// Components
import MarkdownViewer from '@/components/viewers/MarkdownViewer';

// Types
import { ServerApplication, Server, Member, popupType, User } from '@/types';

// Utils
import { getPermissionText } from '@/utils/formatters';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useContextMenu } from '@/providers/ContextMenuProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';

interface SortState {
  field:
    | 'name'
    | 'permission'
    | 'contribution'
    | 'joinDate'
    | 'applyContribution';
  direction: 'asc' | 'desc';
}

interface ServerSettingModalProps {
  server: Server;
  user: User;
}

const EditServerModal: React.FC<ServerSettingModalProps> = React.memo(
  (initialData: ServerSettingModalProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();

    // Variables
    const server = initialData.server;
    const user = initialData.user;

    // States
    const [editedServerData, seteditedServerData] = useState<Server>({
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

    const [markdownContent, setMarkdownContent] = useState<string>('');
    const setServerIcon = useRef<HTMLInputElement>(null);
    const [pendingIconFile, setPendingIconFile] = useState<{
      data: string;
      type: string;
    } | null>(null);

    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
    const [applications, setApplications] = useState<ServerApplication[]>([]);
    const [applicationContextMenu, setApplicationContextMenu] = useState<{
      x: number;
      y: number;
      application: any;
    } | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const [blockPage, setBlockPage] = useState<number>(1);

    const [originalServerData, setOriginalServerData] = useState<Server>({
      ...server,
    });

    const [changeState, setChangeState] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [sortState, setSortState] = useState<SortState>({
      field: 'permission',
      direction: 'desc',
    });

    const [sortedMembers, setSortedMembers] = useState<Member[]>([]);
    const [sortedApplications, setSortedApplications] = useState<
      ServerApplication[]
    >([]);
    const [sortedBlockAccounts, setSortedBlockAccounts] = useState<Member[]>(
      [],
    );

    const handleSort = (
      field: string,
      array: any[],
      direction: 'desc' | 'asc',
    ) => {
      return array.sort(
        (a, b) => (direction === 'asc' ? 1 : -1) * (a[field] - b[field]),
      );
    };

    const handleServerIconChange = async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (!event.target.files || !event.target.files[0]) return;

      const file = event.target.files[0];

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.error(lang.tr.fileSizeError);
        return;
      }

      // Validate file type
      if (
        !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
          file.type,
        )
      ) {
        console.error(lang.tr.fileTypeError);
        return;
      }

      try {
        // Read file as base64 for preview and later upload
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result?.toString();

          if (base64Data) {
            setPendingIconFile({
              data: base64Data.split(',')[1],
              type: file.type,
            });

            // Update editing state for change detection
            seteditedServerData((prev) => ({
              ...prev,
              pendingIconUpdate: true, // Flag for change detection
            }));
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('讀取檔案時發生錯誤:', error);
      }
    };

    useEffect(() => {
      if (!socket) return;
      const ObjectToArray = (obj: Record<string, any>): any[] => {
        return Object.keys(obj).map((key) => obj[key]);
      };

      if (activeTabIndex === 2) {
        const filteredMembers = ObjectToArray(server?.members || {}).filter(
          (member) => member.createdAt !== 0,
        );
        setMembers(filteredMembers);
      }
    }, [activeTabIndex, socket]);

    const handleApplicationAction = (action: 'accept' | 'reject') => {
      if (!applicationContextMenu?.application) return;

      // 這裡需修改
      // socket?.emit('handleApplication', {
      //   sessionId: sessionId,
      //   serverId: server?.id,
      //   applicationId: applicationContextMenu.application?.id,
      //   action: action,
      // });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleSubmit = () => {
      if (!socket) return;
      socket.send.updateServer({ server: editedServerData });
      handleClose();
    };

    // const findDifferencesDeep = (
    //   obj1: Record<string, any>,
    //   obj2: Record<string, any>,
    //   prefix = '',
    // ): string[] => {
    //   const allKeys = new Set([
    //     ...Object.keys(obj1 || {}),
    //     ...Object.keys(obj2 || {}),
    //   ]);

    //   return Array.from(allKeys).reduce((acc, key) => {
    //     const fullKey = prefix ? `${prefix}.${key}` : key;
    //     const value1 = obj1[key];
    //     const value2 = obj2[key];

    //     if (typeof value1 === 'string' && typeof value2 === 'string') {
    //       if (value1.trim() !== value2.trim()) {
    //         acc.push(fullKey);
    //       }
    //     } else if (
    //       value1 &&
    //       value2 &&
    //       typeof value1 === 'object' &&
    //       typeof value2 === 'object'
    //     ) {
    //       acc.push(...findDifferencesDeep(value1, value2, fullKey));
    //     } else if (value1 !== value2) {
    //       acc.push(fullKey);
    //     }

    //     return acc;
    //   }, [] as string[]);
    // };

    // useEffect(() => {
    //   const findDifferencesDeep = (
    //     obj1: Record<string, any> = {},
    //     obj2: Record<string, any> = {},
    //     prefix = '',
    //   ): string[] => {
    //     const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    //     return Array.from(allKeys).reduce((acc, key) => {
    //       const fullKey = prefix ? `${prefix}.${key}` : key;
    //       const value1 = obj1[key];
    //       const value2 = obj2[key];

    //       if (typeof value1 === 'string' && typeof value2 === 'string') {
    //         if (value1.trim() !== value2.trim()) acc.push(fullKey);
    //       } else if (
    //         value1 &&
    //         value2 &&
    //         typeof value1 === 'object' &&
    //         typeof value2 === 'object'
    //       ) {
    //         acc.push(...findDifferencesDeep(value1, value2, fullKey));
    //       } else if (value1 !== value2) {
    //         acc.push(fullKey);
    //       }

    //       return acc;
    //     }, [] as string[]);
    //   };

    //   const dif = findDifferencesDeep(server, editedServerData);

    //   if (markdownContent.trim() !== (server?.announcement || '').trim())
    //     dif.push('announcement');
    //   if (pendingIconFile) dif.push('avatar');

    //   setChangeState(
    //     dif
    //       .map((key) => {
    //         switch (key) {
    //           case 'name':
    //             return lang.tr.name;
    //           case 'slogan':
    //             return lang.tr.slogan;
    //           case 'type':
    //             return lang.tr.type;
    //           case 'description':
    //             return lang.tr.description;
    //           case 'settings.visibility':
    //             return lang.tr.accessPermission;
    //           case 'avatar':
    //             return lang.tr.avatar;
    //           case 'announcement':
    //             return lang.tr.announcement;
    //           default:
    //             return '';
    //         }
    //       })
    //       .filter(Boolean),
    //   );
    // }, [editedServerData, pendingIconFile, markdownContent]);

    const sortFunctions: Record<string, any> = {
      name: (a: Member, b: Member, direction: number): number => {
        const nameA = (a.nickname || '未知').toLowerCase();
        const nameB = (b.nickname || '未知').toLowerCase();
        return direction * nameA.localeCompare(nameB);
      },
      permission: (a: Member, b: Member, direction: number): number => {
        const permissionA = a.permissionLevel ?? 1;
        const permissionB = b.permissionLevel ?? 1;
        return direction * (permissionA - permissionB);
      },
      contribution: (a: Member, b: Member, direction: number): number => {
        const contribA = a.contribution ?? 0;
        const contribB = b.contribution ?? 0;
        return direction * (contribA - contribB);
      },
      joinDate: (a: Member, b: Member, direction: number): number => {
        const dateA = a?.createdAt ?? 0;
        const dateB = b?.createdAt ?? 0;
        return direction * (dateA - dateB);
      },
    };

    const handleUserMove = (target: Member) => {
      // 這裡需修改
      // socket?.emit('ManageUserAction', {
      //   sessionId: sessionId,
      //   serverId: server?.id,
      //   targetId: target.userId,
      //   type: 'move',
      // });
    };

    const handleKickServer = (target: Member) => {
      ipcService.popup.open(popupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(popupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: `確定要踢出 ${target.nickname} 嗎？使用者可以再次申請加入。`,
        submitTo: popupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(popupType.DIALOG_WARNING, () => {
        setMembers((prev) =>
          prev.filter((member) => member?.id !== target?.id),
        );

        socket?.send.updateMember({
          serverId: server?.id,
          targetMember: {
            ...target,
            permissionLevel: 0,
            createdAt: 0,
            nickname: '',
          },
        });
      });
    };

    const handleBlockUser = (target: Member) => {
      ipcService.popup.open(popupType.DIALOG_WARNING);
      ipcService.initialData.onRequest(popupType.DIALOG_WARNING, {
        iconType: 'warning',
        title: `確定要封鎖 ${target.nickname} 嗎？使用者將無法再次申請加入。`,
        submitTo: popupType.DIALOG_WARNING,
      });
      ipcService.popup.onSubmit(popupType.DIALOG_WARNING, () => {
        setMembers((prev) =>
          prev.filter((member) => member?.id !== target?.id),
        );

        socket?.send.updateMember({
          member: {
            ...target,
            permissionLevel: 0,
            createdAt: 0,
            nickname: '',
            isBlocked: true,
          },
        });
      });
    };

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
                              value={editedServerData?.name ?? server?.name}
                              onChange={(e) => {
                                seteditedServerData((prev) => ({
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
                            value={editedServerData.slogan}
                            onChange={(e) => {
                              seteditedServerData((prev) => ({
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
                          onChange={(e) => handleServerIconChange(e)}
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
                          value={
                            editedServerData?.description ?? server?.description
                          }
                          onChange={(e) =>
                            seteditedServerData((prev) => ({
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
                        value={editedServerData?.announcement}
                        onChange={(e) =>
                          seteditedServerData((prev) => ({
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
                                      sortState.direction,
                                    );
                                    setSortedMembers(_sortedMember);
                                  }}
                                >
                                  {field}
                                  <span className="absolute right-0">
                                    {sortState.field === 'name' &&
                                      (sortState.direction === 'asc' ? (
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
                                    member.userId === user.id;
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
                          checked={
                            editedServerData?.settings?.visibility ===
                              'public' ||
                            server.settings.visibility === 'public'
                          }
                          onChange={(e) => {
                            if (e.target.checked)
                              seteditedServerData({
                                ...editedServerData,
                                settings: {
                                  ...editedServerData.settings,
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
                          checked={
                            editedServerData?.settings?.visibility ===
                              'private' ||
                            server.settings.visibility === 'private'
                          }
                          onChange={(e) => {
                            if (e.target.checked)
                              seteditedServerData({
                                ...editedServerData,
                                settings: {
                                  ...editedServerData.settings,
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
                          checked={
                            editedServerData?.settings?.visibility ===
                              'invisible' ||
                            server.settings.visibility === 'invisible'
                          }
                          onChange={(e) => {
                            if (e.target.checked)
                              seteditedServerData({
                                ...editedServerData,
                                settings: {
                                  ...editedServerData.settings,
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
                                        sortState.direction,
                                      );
                                      setSortedMembers(_sortedMember);
                                    }}
                                  >
                                    {field}
                                    <span className="absolute right-0">
                                      {sortState.field === 'name' &&
                                        (sortState.direction === 'asc' ? (
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
                            const applicationUser = application.user;
                            const member =
                              server.members?.[applicationUser?.id || ''] ??
                              null;
                            const userNickname =
                              member?.nickname ?? user?.name ?? '未知使用者';
                            const userContributions = member?.contribution ?? 0;
                            const applicationDesc =
                              application.description || '該使用者未填寫訊息';

                            return (
                              <tr
                                key={member?.id}
                                onContextMenu={(e) => {
                                  contextMenu.showContextMenu(
                                    e.pageX,
                                    e.pageY,
                                    [],
                                  );
                                }}
                              >
                                <td>{userNickname}</td>
                                <td>{userContributions}</td>
                                <td>{applicationDesc}</td>
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
                        {lang.tr.blacklist}: {sortedBlockAccounts.length}
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
                                        sortState.direction,
                                      );
                                      setSortedMembers(_sortedMember);
                                    }}
                                  >
                                    {field}
                                    <span className="absolute right-0">
                                      {sortState.field === 'name' &&
                                        (sortState.direction === 'asc' ? (
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
                            const applicationUser = application.user;
                            const member =
                              server.members?.[applicationUser?.id || ''] ??
                              null;
                            const userNickname =
                              member?.nickname ?? user?.name ?? '未知使用者';
                            const userContributions = member?.contribution ?? 0;
                            const applicationDesc =
                              application.description || '該使用者未填寫訊息';

                            return (
                              <tr
                                key={member?.id}
                                onContextMenu={(e) => {
                                  contextMenu.showContextMenu(
                                    e.pageX,
                                    e.pageY,
                                    [],
                                  );
                                }}
                              >
                                <td>{userNickname}</td>
                                <td>{userContributions}</td>
                                <td>{applicationDesc}</td>
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

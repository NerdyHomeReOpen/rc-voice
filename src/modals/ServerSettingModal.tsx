/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
import React, {
  ChangeEvent,
  memo,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

// Components
import Modal from '@/components/Modal';
import MarkdownViewer from '@/components/MarkdownViewer';

// Types
import type { Server } from '@/types';

// Utils
import { getPermissionText } from '@/utils/formatters';
import { validateName, validateDescription } from './CreateServerModal';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Redux
import { useSelector } from 'react-redux';

// Service
import { API_URL } from '@/services/api.service';

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
  onClose: () => void;
}

const ServerSettingModal = memo(({ onClose }: ServerSettingModalProps) => {
  // Redux
  const server = useSelector((state: { server: Server }) => state.server);
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );

  // Socket Control
  const socket = useSocket();

  const [markdownContent, setMarkdownContent] = useState<string>('');
  const setServerIcon = useRef<HTMLInputElement>(null);
  const [pendingIconFile, setPendingIconFile] = useState<{
    data: string;
    type: string;
  } | null>(null);

  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  const [searchText, setSearchText] = useState<string>('');
  const [blockPage, setBlockPage] = useState<number>(1);

  const [originalServerData, setOriginalServerData] = useState<Server>({
    ...server,
  });
  const [editingServerData, setEditingServerData] = useState<Server>({
    ...server,
  });
  const [changeState, setChangeState] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [sortState, setSortState] = useState<SortState>({
    field: 'permission',
    direction: 'desc',
  });

  const handleSort = useCallback(
    (
      field:
        | 'name'
        | 'permission'
        | 'contribution'
        | 'joinDate'
        | 'applyContribution',
    ) => {
      if (sortState.field === field) {
        setSortState((prev) => ({
          ...prev,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }));
      } else {
        setSortState({
          field,
          direction: 'desc',
        });
      }
    },
    [sortState.field],
  );

  const handleServerIconChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.error('檔案大小不能超過 5MB');
      return;
    }

    // Validate file type
    if (
      !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
        file.type,
      )
    ) {
      console.error('不支援的檔案格式');
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
          setEditingServerData((prev) => ({
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

  const handleSubmit = useCallback(async () => {
    try {
      // Validate form data
      const nameError = validateName(editingServerData.name);
      const descriptionError = validateDescription(
        editingServerData.description,
      );

      const newErrors = {
        name: nameError,
        description: descriptionError,
      };
      setErrors(newErrors);

      // Check if there are any errors
      if (Object.values(newErrors).some((error) => error)) return;

      // Prepare updates object
      const updates: Partial<Server> & {
        fileData?: string;
        fileType?: string;
      } = {};

      // Add all field updates
      if (editingServerData.name !== originalServerData.name) {
        updates.name = editingServerData.name;
      }
      if (editingServerData.slogan !== originalServerData.slogan) {
        updates.slogan = editingServerData.slogan;
      }
      if (editingServerData.description !== originalServerData.description) {
        updates.description = editingServerData.description;
      }
      if (
        editingServerData.settings.visibility !==
        originalServerData.settings.visibility
      ) {
        updates.settings = { ...editingServerData.settings };
      }

      // Add announcement update
      if (markdownContent.trim() !== originalServerData.announcement?.trim()) {
        updates.announcement = markdownContent;
      }

      // Add icon update if needed
      if (pendingIconFile) {
        updates.fileData = pendingIconFile.data;
        updates.fileType = pendingIconFile.type;
      }

      // Check if there are any updates
      if (Object.keys(updates).length === 0 && !pendingIconFile) {
        onClose();
        return;
      }

      // Emit all updates together
      socket?.emit('updateServer', {
        sessionId: sessionId,
        serverId: server.id,
        updates: updates,
      });

      // Update original state after successful emission
      setOriginalServerData({
        ...editingServerData,
        announcement: markdownContent,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update server:', error);
    }
  }, [editingServerData, markdownContent, pendingIconFile, server, onClose]);

  const findDifferencesDeep = (
    obj1: Record<string, any>,
    obj2: Record<string, any>,
    prefix = '',
  ): string[] => {
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    return Array.from(allKeys).reduce((acc, key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value1 = obj1[key];
      const value2 = obj2[key];

      if (typeof value1 === 'string' && typeof value2 === 'string') {
        if (value1.trim() !== value2.trim()) {
          acc.push(fullKey);
        }
      } else if (
        value1 &&
        value2 &&
        typeof value1 === 'object' &&
        typeof value2 === 'object'
      ) {
        acc.push(...findDifferencesDeep(value1, value2, fullKey));
      } else if (value1 !== value2) {
        acc.push(fullKey);
      }

      return acc;
    }, [] as string[]);
  };

  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const togglePreview = (): void => setIsPreviewMode(!isPreviewMode);

  // const usersList = useCallback((): UserList => {
  //   if (!server?.members || !users) return {};
  //   return Object.values(server.members)
  //     .filter((user) => user.permissionLevel < 7)
  //     .reduce((acc, member) => {
  //       if (member.userId && users[member.userId]) {
  //         acc[member.userId] = users[member.userId];
  //       }
  //       return acc;
  //     }, {} as UserList);
  // }, [server?.members, users]);

  useEffect(() => {
    setMarkdownContent(server.announcement || '');
  }, [server.announcement]);

  useEffect(() => {
    const findDifferencesDeep = (
      obj1: Record<string, any>,
      obj2: Record<string, any>,
      prefix = '',
    ): string[] => {
      const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

      return Array.from(allKeys).reduce((acc, key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value1 = obj1[key];
        const value2 = obj2[key];

        if (typeof value1 === 'string' && typeof value2 === 'string') {
          if (value1.trim() !== value2.trim()) {
            acc.push(fullKey);
          }
        } else if (
          value1 &&
          value2 &&
          typeof value1 === 'object' &&
          typeof value2 === 'object'
        ) {
          acc.push(...findDifferencesDeep(value1, value2, fullKey));
        } else if (value1 !== value2) {
          acc.push(fullKey);
        }

        return acc;
      }, [] as string[]);
    };

    const dif = findDifferencesDeep(server, editingServerData);

    if (markdownContent.trim() !== (server.announcement || '').trim())
      dif.push('announcement');
    if (pendingIconFile) dif.push('icon');

    setChangeState(
      dif
        .map((key) => {
          switch (key) {
            case 'name':
              return '名稱';
            case 'slogan':
              return '口號';
            case 'type':
              return '類型';
            case 'description':
              return '介紹';
            case 'settings.visibility':
              return '訪問許可權';
            case 'icon':
              return '頭像';
            case 'announcement':
              return '公告';
            default:
              return '';
          }
        })
        .filter(Boolean),
    );
  }, [editingServerData, pendingIconFile, markdownContent]);

  const renderContent = (): React.ReactElement | null => {
    const serverIcon = server.iconUrl
      ? API_URL + server.iconUrl
      : '/logo_server_def.png';

    switch (activeTabIndex) {
      case 0:
        return (
          <>
            <div className="flex mb-8 p-4">
              <div className="flex-1">
                <div className="mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4 mb-2">
                      <label className="w-20 text-right text-sm">名稱</label>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editingServerData.name}
                          className={`w-full p-1 border rounded text-sm ${
                            errors.name ? 'border-red-500' : ''
                          }`}
                          placeholder="請輸入群組名稱 (最多30字)"
                          onChange={(e) => {
                            const newName = e.target.value;
                            setEditingServerData({
                              ...editingServerData,
                              name: newName,
                            });

                            // Validate immediately
                            const error = validateName(newName);
                            setErrors((prev) => ({
                              ...prev,
                              name: error,
                            }));
                          }}
                        />
                        {errors.name && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <label className="w-20 text-right text-sm">ID</label>
                    <input
                      type="text"
                      value={server.displayId || server.id}
                      className="w-32 p-1 border rounded text-sm"
                      disabled
                    />
                  </div>
                  <div className="flex items-start gap-4 mb-2">
                    <label className="w-20 text-right text-sm">口號</label>
                    <textarea
                      className="flex-1 p-2 border rounded text-sm h-20"
                      placeholder="請輸入口號，這會顯示在搜尋頁面中"
                      value={editingServerData.slogan || ''}
                      onChange={(e) => {
                        setEditingServerData({
                          ...editingServerData,
                          slogan: e.target.value,
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {/* <div className="flex items-center gap-4">
                    <label className="w-20 text-right text-sm">類型</label>
                    <select
                      className="p-1 border rounded text-sm"
                      onChange={(e) => {
                        setEditingServerData({
                          ...editingServerData,
                          type: e.target.value,
                        });
                      }}
                    >
                      {(server?.type ?? ['遊戲', '音樂', '原神']).map(
                        (type: string) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ),
                      )}

                    </select>
                  </div> */}
                  <div className="flex items-center gap-4">
                    <label className="w-20 text-right text-sm">等級</label>
                    <input
                      type="text"
                      value={server.level || 0}
                      className="w-20 p-1 border rounded text-sm"
                      disabled
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-20 text-right text-sm">創建時間</label>
                    <input
                      type="text"
                      value={new Date(server.createdAt).toLocaleString()}
                      className="w-48 p-1 border rounded text-sm"
                      disabled
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="w-20 text-right text-sm">財富值</label>
                    <img
                      src="/golden_pea.png"
                      alt="Golden Pea"
                      className="w-4 h-4"
                    />
                    <input
                      type="text"
                      value={server.wealth || 0}
                      className="w-20 p-1 border rounded text-sm"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* 頭像區域 */}
              <div className="w-48 flex flex-col items-center">
                <img
                  src={
                    pendingIconFile
                      ? `data:${pendingIconFile.type};base64,${pendingIconFile.data}`
                      : server.iconUrl
                      ? API_URL + server.iconUrl
                      : '/logo_server_def.png'
                  }
                  alt="Icon"
                  className="w-32 h-32 border-2 border-gray-300 mb-2"
                />
                <button
                  className="px-4 py-1 bg-blue-50 hover:bg-blue-100 rounded text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setServerIcon.current?.click();
                  }}
                >
                  更換頭像
                </button>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  ref={setServerIcon}
                  onChange={handleServerIconChange}
                />
              </div>
            </div>

            {/* 網址和介紹 */}
            <div className="p-4">
              <div>
                <label className="block text-sm mb-1">介紹</label>
                <textarea
                  className={`w-full h-32 p-2 border rounded text-sm ${
                    errors.description ? 'border-red-500' : ''
                  }`}
                  placeholder="請輸入群組介紹 (最多200字)"
                  value={editingServerData.description}
                  onChange={(e) => {
                    const newDescription = e.target.value;
                    setEditingServerData({
                      ...editingServerData,
                      description: newDescription,
                    });

                    // Validate immediately
                    const error = validateDescription(newDescription);
                    setErrors((prev) => ({
                      ...prev,
                      description: error,
                    }));
                  }}
                />
                {errors.description && (
                  <span className="text-xs text-red-500 mt-1">
                    {errors.description}
                  </span>
                )}
              </div>
            </div>
          </>
        );

      case 1:
        return (
          <div className="space-y-4 p-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium select-none">
                公告編輯
              </label>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePreview();
                }}
                className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 rounded select-none"
              >
                {isPreviewMode ? '編輯' : '預覽'}
              </button>
            </div>

            <div className="rounded">
              {isPreviewMode ? (
                <div className="w-full p-2 rounded text-sm min-h-[200px] border">
                  <MarkdownViewer markdownText={markdownContent} />
                </div>
              ) : (
                <textarea
                  className="w-full p-2 rounded text-sm min-h-[200px] border"
                  value={markdownContent}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setMarkdownContent(e.target.value)
                  }
                  placeholder="在此輸入 Markdown 內容..."
                />
              )}
            </div>

            <div className="text-xs text-gray-500 select-none">
              支援 Markdown 語法：
              <span>
                **粗體**, *斜體*, # 標題, - 列表, ```程式碼```, [連結](https://)
              </span>
            </div>
          </div>
        );

      case 2:
        const members = Object.values(server.members || [])
          .filter((member) => {
            const displayName = member.nickname.toLowerCase() || '未知用戶';
            return (
              displayName.includes(searchText.toLowerCase()) ||
              searchText === ''
            );
          })
          .sort((a, b) => {
            const direction = sortState.direction === 'asc' ? 1 : -1;

            switch (sortState.field) {
              case 'name':
                const nameA = a.nickname || '未知';
                const nameB = b.nickname || '未知';
                return direction * nameA.localeCompare(nameB);

              case 'permission':
                const permissionA = a.permissionLevel || 1;
                const permissionB = b.permissionLevel || 1;
                return direction * (permissionA - permissionB);

              case 'contribution':
                const contribA = a.contribution || 0;
                const contribB = b.contribution || 0;
                return direction * (contribA - contribB);

              case 'joinDate':
                const dateA = a.joinedAt || 0;
                const dateB = b.joinedAt || 0;
                return direction * (dateA - dateB);

              default:
                return 0;
            }
          });

        return (
          <div className="flex flex-col p-4">
            <div className="flex flex-row justify-between items-center mb-6  select-none">
              <span className="text-sm font-medium">
                會員: {members.length}
              </span>
              <div className="flex justify-end items-center border rounded-md overflow-hidden">
                <Search className="text-gray-400 h-5 w-5 ml-2" />
                <input
                  type="text"
                  placeholder="輸入關鍵字搜尋"
                  className="w-60 px-2 py-1.5 text-sm border-none outline-none"
                  value={searchText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSearchText(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex flex-col border rounded-lg overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-gray-600 select-none">
                    <tr>
                      <th
                        className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center relative pr-6">
                          會員資料
                          <span className="absolute right-0">
                            {sortState.field === 'name' &&
                              (sortState.direction === 'asc' ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              ))}
                          </span>
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('permission')}
                      >
                        <div className="flex items-center relative pr-6">
                          身分
                          <span className="absolute right-0">
                            {sortState.field === 'permission' &&
                              (sortState.direction === 'asc' ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              ))}
                          </span>
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('contribution')}
                      >
                        <div className="flex items-center relative pr-6">
                          貢獻值
                          <span className="absolute right-0">
                            {sortState.field === 'contribution' &&
                              (sortState.direction === 'asc' ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              ))}
                          </span>
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('joinDate')}
                      >
                        <div className="flex items-center relative pr-6">
                          入會時間
                          <span className="absolute right-0">
                            {sortState.field === 'joinDate' &&
                              (sortState.direction === 'asc' ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              ))}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const user = member.user;
                      const userGender = user?.gender ?? 'Male';
                      const userNickname = member.nickname ?? '';
                      const userPermission = member.permissionLevel ?? 1;
                      const userContributions = member.contribution ?? 0;
                      const userJoinDate = new Date(
                        member.joinedAt || 0,
                      ).toLocaleString();

                      return (
                        <tr
                          key={member.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={`/channel/${userGender}_${userPermission}.png`}
                                className="w-4 h-5 select-none"
                                alt={`${userGender}_${userPermission}`}
                              />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {userNickname}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-xs">
                                {getPermissionText(userPermission || 1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {userContributions}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {userJoinDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 text-right text-sm text-gray-500 select-none">
              右鍵可以進行處理
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 p-4">
            <div className="text-sm">
              <span className="font-medium">訪問許可權</span>
              <div className="mt-4 ml-8">
                <div className="flex items-center mb-6">
                  <input
                    type="radio"
                    id="public"
                    name="permission"
                    value="public"
                    className="mr-3"
                    checked={editingServerData.settings.visibility === 'public'}
                    onChange={(e) => {
                      if (e.target.checked)
                        setEditingServerData({
                          ...editingServerData,
                          settings: {
                            ...editingServerData.settings,
                            visibility: 'public',
                          },
                        });
                    }}
                  />
                  <label htmlFor="public">公開群</label>
                </div>

                <div className="flex items-start mb-6">
                  <input
                    type="radio"
                    id="members"
                    name="permission"
                    value="members"
                    className="mr-3"
                    checked={
                      editingServerData.settings.visibility === 'private'
                    }
                    onChange={(e) => {
                      if (e.target.checked)
                        setEditingServerData({
                          ...editingServerData,
                          settings: {
                            ...editingServerData.settings,
                            visibility: 'private',
                          },
                        });
                    }}
                  />
                  <div>
                    <label htmlFor="members">半公開群</label>
                    <div className="text-gray-500 text-xs mt-1">
                      (非會員只允許加入大廳)
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <input
                    type="radio"
                    id="private"
                    name="permission"
                    value="private"
                    className="mr-3"
                    checked={
                      editingServerData.settings.visibility === 'invisible'
                    }
                    onChange={(e) => {
                      if (e.target.checked)
                        setEditingServerData({
                          ...editingServerData,
                          settings: {
                            ...editingServerData.settings,
                            visibility: 'invisible',
                          },
                        });
                    }}
                  />
                  <div>
                    <label htmlFor="private">私密群</label>
                    <div className="text-gray-500 text-xs mt-1">
                      (該群只允許會員進入，不參與排行，只能通過ID搜索到)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        const applications = (server.applications || []).sort((a, b) => {
          const direction = sortState.direction === 'asc' ? -1 : 1;

          const contribA = server.members?.[a.userId].contribution || 0;
          const contribB = server.members?.[b.userId].contribution || 0;
          return direction * (contribB - contribA);
        });

        return (
          <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium">
                申請人數: {applications.length}
              </span>
              <button
                className="text-sm text-blue-400 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                申請設定
              </button>
            </div>

            <div className="flex flex-col border rounded-lg overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-gray-600 select-none">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100">
                        暱稱
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('applyContribution')}
                      >
                        <div className="flex items-center relative pr-6">
                          貢獻值
                          <span className="absolute right-0">
                            {sortState.field === 'applyContribution' &&
                              (sortState.direction === 'asc' ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              ))}
                          </span>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100">
                        申請說明
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((application, index) => {
                      const user = application.user;
                      const member = server.members?.[user?.id || ''] ?? null;
                      const userNickname = member?.nickname ?? null;
                      const userContributions = member?.contribution ?? 0;
                      const applicationDesc =
                        application.description || '該使用者未填寫訊息';

                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 truncate">
                            <p className="font-medium text-gray-900">
                              {userNickname}
                            </p>
                          </td>
                          <td className="px-4 py-3">{userContributions}</td>
                          <td className="px-4 py-3">{applicationDesc}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 text-right text-sm text-gray-500 select-none">
              右鍵可以進行處理
            </div>
          </div>
        );

      case 5:
        const blockAccountList = {
          '1': { name: 'test1' },
          '2': { name: 'test2' },
          '3': { name: 'test3' },
          '4': { name: 'test4' },
          '5': { name: 'test5' },
          '6': { name: 'test6' },
          '7': { name: 'test7' },
          '8': { name: 'test8' },
          '9': { name: 'test9' },
          '10': { name: 'test10' },
        };

        const blockAccountPage = (
          <div className="flex flex-col w-full">
            {/* head */}
            <div className="flex flex-row justify-between items-center mb-6  select-none">
              <span className="text-sm font-medium">
                黑名單: {Object.keys(blockAccountList).length}
              </span>
              <div className="flex justify-end items-center border rounded-md overflow-hidden">
                <Search className="text-gray-400 h-5 w-5 ml-2" />
                <input
                  type="text"
                  placeholder="輸入關鍵字搜尋"
                  className="w-60 px-2 py-1.5 text-sm border-none outline-none"
                />
              </div>
            </div>

            {/* body */}
            <div className="flex flex-col border rounded-lg overflow-hidden mt-2">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-gray-600 select-none">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100">
                        勾選
                      </th>
                      <th className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100">
                        暱稱
                      </th>
                      <th className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100">
                        ID
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(blockAccountList).map(([userId, user]) => {
                      const displayName = user.name || '未知用戶';

                      return (
                        <tr key={userId} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input type="checkbox" />
                          </td>
                          <td className="px-4 py-3 truncate">{displayName}</td>
                          <td className="px-4 py-3">{userId}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

        const blockIpPage = <div></div>;

        return (
          <div className="flex flex-col items-center p-4">
            <div className="flex flex-row items-center justify-start mb-2">
              <div className="flex flex-row border rounded text-sm font-medium">
                <div
                  className={`p-2 bg-${
                    blockPage == 1 ? 'gray-200' : 'white'
                  } cursor-pointer hover:bg-gray-200 w-20 text-center`}
                  onClick={() => {
                    setBlockPage(1);
                  }}
                >
                  封鎖帳號
                </div>
                <div
                  className={`p-2 bg-${
                    blockPage == 1 ? 'white' : 'gray-200'
                  } cursor-pointer hover:bg-gray-200 w-20 text-center`}
                  onClick={() => {
                    setBlockPage(2);
                  }}
                >
                  封鎖IP
                </div>
              </div>
            </div>
            {blockPage === 1
              ? blockAccountPage
              : blockPage === 2
              ? blockIpPage
              : null}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={server.name}
      onClose={onClose}
      changeContent={changeState}
      tabs={[
        {
          id: '基本資料',
          label: '基本資料',
          onClick: () => setActiveTabIndex(0),
        },
        {
          id: '公告',
          label: '公告',
          onClick: () => setActiveTabIndex(1),
        },
        {
          id: '會員管理',
          label: '會員管理',
          onClick: () => setActiveTabIndex(2),
        },
        {
          id: '訪問許可權',
          label: '訪問許可權',
          onClick: () => setActiveTabIndex(3),
        },
        {
          id: '會員申請管理',
          label: '會員申請管理',
          onClick: () => setActiveTabIndex(4),
        },
        {
          id: '黑名單管理',
          label: '黑名單管理',
          onClick: () => setActiveTabIndex(5),
        },
      ]}
      buttons={[
        {
          label: '取消',
          style: 'secondary',
          onClick: onClose,
        },
        {
          label: '保存',
          style: 'primary',
          type: 'submit',
          onClick: handleSubmit,
        },
      ]}
    >
      {renderContent()}
    </Modal>
  );
});

ServerSettingModal.displayName = 'ServerSettingModal';

export default ServerSettingModal;

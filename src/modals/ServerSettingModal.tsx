import React, { ChangeEvent, memo, useCallback, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

// Components
import MarkdownViewer from '@/components/MarkdownViewer';
import Modal from '@/components/Modal';

// Types
import type { Server, User, UserList, ModalTabItem } from '@/types';

// Utils
import { getPermissionText } from '@/utils/formatters';

// Redux
import { useSelector } from 'react-redux';

interface SortState {
  field:
    | 'name'
    | 'permission'
    | 'contribution'
    | 'joinDate'
    | 'applyContribution';
  direction: 'asc' | 'desc';
}

const TABS: ModalTabItem[] = [
  {
    id: '基本資料',
    label: '基本資料',
    onClick: () => {},
  },
  {
    id: '公告',
    label: '公告',
    onClick: () => {},
  },
  {
    id: '會員管理',
    label: '會員管理',
    onClick: () => {},
  },
  {
    id: '訪問許可權',
    label: '訪問許可權',
    onClick: () => {},
  },
  {
    id: '會員申請管理',
    label: '會員申請管理',
    onClick: () => {},
  },
  {
    id: '黑名單管理',
    label: '黑名單管理',
    onClick: () => {},
  },
];

interface ServerSettingModalProps {
  onClose: () => void;
}

const ServerSettingModal = memo(({ onClose }: ServerSettingModalProps) => {
  // Redux
  const server = useSelector((state: { server: Server }) => state.server);
  const users = useSelector((state: { users: UserList }) => state.users);

  const [activeTab, setActiveTab] = useState<ModalTabItem>(TABS[0]);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

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

  const togglePreview = (): void => setIsPreviewMode(!isPreviewMode);

  const getServerUsers = useCallback((): User[] => {
    if (!server?.userIds) return [];
    return Object.values(users).filter(
      (user) => user && user.id && server.userIds.includes(user.id),
    );
  }, [server?.userIds, users]);

  const usersList = useCallback((): UserList => {
    return getServerUsers()
      .filter((user) => {
        const permissionLevel = server.permissions?.[user.id] || 1;
        return permissionLevel < 7;
      })
      .reduce((acc, user) => {
        if (user?.id) {
          acc[user.id] = user;
        }
        return acc;
      }, {} as UserList);
  }, [getServerUsers, server.permissions]);

  const renderContent = (): React.ReactElement | null => {
    switch (activeTab.id) {
      case '基本資料':
        return (
          <>
            <div className="flex mb-8">
              <div className="flex-1">
                <div className="mb-4">
                  <div className="flex items-center gap-4 mb-2">
                    <label className="w-20 text-right text-sm">名稱</label>
                    <input
                      type="text"
                      value={server.name}
                      className="flex-1 p-1 border rounded text-sm"
                      onChange={
                        /* 處理名稱變更 */
                        () => {}
                      }
                    />
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
                    <textarea className="flex-1 p-2 border rounded text-sm h-20" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <label className="w-20 text-right text-sm">類型</label>
                    <select className="p-1 border rounded text-sm">
                      <option>遊戲</option>
                      <option>音樂</option>
                      <option>原神</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-20 text-right text-sm">等級</label>
                    <input
                      type="text"
                      value="8"
                      className="w-20 p-1 border rounded text-sm"
                      disabled
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-20 text-right text-sm">創建時間</label>
                    <input
                      type="text"
                      value="2014-10-11 19:15:44"
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
                      value="4157"
                      className="w-20 p-1 border rounded text-sm"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* 頭像區域 */}
              <div className="w-48 flex flex-col items-center">
                <img
                  src="/logo_server_def.png"
                  alt="Icon"
                  className="w-32 h-32 border-2 border-gray-300 mb-2"
                />
                <button className="px-4 py-1 bg-blue-50 hover:bg-blue-100 rounded text-sm">
                  更換頭像
                </button>
              </div>
            </div>

            {/* 網址和介紹 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">介紹</label>
                <textarea className="w-full h-32 p-2 border rounded text-sm" />
              </div>
            </div>
          </>
        );

      case '公告':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">公告編輯</label>
              <button
                onClick={togglePreview}
                className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 rounded"
              >
                {isPreviewMode ? '編輯' : '預覽'}
              </button>
            </div>

            <div className="border rounded p-4">
              {isPreviewMode ? (
                <div className="prose prose-sm max-w-none">
                  <MarkdownViewer markdownText={markdownContent} />
                </div>
              ) : (
                <textarea
                  className="w-full p-2 rounded text-sm min-h-[200px] font-mono"
                  value={markdownContent}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setMarkdownContent(e.target.value)
                  }
                  placeholder="在此輸入 Markdown 內容..."
                />
              )}
            </div>

            {!isPreviewMode && (
              <div className="text-xs text-gray-500">
                支援 Markdown 語法：
                <span className="font-mono">
                  **粗體**, *斜體*, # 標題, - 列表, ```程式碼```,
                  [連結](https://)
                </span>
              </div>
            )}
          </div>
        );

      case '會員管理':
        const sortedUsers = Object.entries(usersList())
          .filter(([, user]) => {
            const displayName = (
              server.nicknames?.[user.id] ||
              user.name ||
              ''
            ).toLowerCase();
            return (
              displayName.includes(searchText.toLowerCase()) ||
              searchText === ''
            );
          })
          .sort(([, a], [, b]) => {
            const direction = sortState.direction === 'asc' ? 1 : -1;

            switch (sortState.field) {
              case 'name':
                const nameA = server.nicknames?.[a.id] || a.name || '';
                const nameB = server.nicknames?.[b.id] || b.name || '';
                return direction * nameA.localeCompare(nameB);

              case 'permission':
                const permissionA = server.permissions?.[a.id] || 1;
                const permissionB = server.permissions?.[b.id] || 1;
                return direction * (permissionA - permissionB);

              case 'contribution':
                const contribA = server.contributions?.[a.id] || 0;
                const contribB = server.contributions?.[b.id] || 0;
                return direction * (contribA - contribB);

              case 'joinDate':
                const dateA = server.joinDate[a.id] || a.createdAt;
                const dateB = server.joinDate[b.id] || b.createdAt;
                return direction * (dateA - dateB);

              default:
                return 0;
            }
          });

        return (
          <div className="flex flex-col">
            <div className="flex flex-row justify-between items-center mb-6  select-none">
              <span className="text-sm font-medium">
                會員: {sortedUsers.length}
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
                    {sortedUsers.map(([key, user]) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={`/channel/${user.gender}_${
                                server.permissions[user.id] || 0
                              }.png`}
                              className="w-4 h-5 select-none"
                              alt={user.name}
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {server.nicknames?.[user.id] || user.name}
                              </div>
                              {server.nicknames[user.id] && (
                                <div className="text-gray-500 text-xs">
                                  原始名稱: {user.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-gray-500 text-xs">
                              {getPermissionText(
                                server.permissions?.[user.id] || 1,
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {server.contributions?.[user.id] || 0}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(
                            server.joinDate[user.id] || user.createdAt,
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 text-right text-sm text-gray-500 select-none">
              右鍵可以進行處理
            </div>
          </div>
        );

      case '訪問許可權':
        return (
          <div className="space-y-4">
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
                    defaultChecked
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

      case '會員申請管理':
        const application = Object.entries(server.applications || {}).sort(
          (a, b) => {
            const direction = sortState.direction === 'asc' ? -1 : 1;

            const contribA = server.contributions[a[0]] || 0;
            const contribB = server.contributions[b[0]] || 0;
            return direction * (contribB - contribA);
          },
        );

        return (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium">
                申請人數:{application.length}
              </span>
              <button className="text-sm text-blue-400 hover:underline">
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
                    {application.map(([userId, message]) => {
                      const applicantUser = users[userId];
                      const displayName =
                        server.nicknames[userId] ||
                        (applicantUser?.name ?? '未知用戶');

                      return (
                        <tr key={userId} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 truncate">{displayName}</td>
                          <td className="px-4 py-3">
                            {server.contributions[userId] || 0}
                          </td>
                          <td className="px-4 py-3">{message}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-500 text-end">
              右鍵可以進行處理
            </div>
          </div>
        );
      default:
        return <div>{activeTab.id}</div>;
    }
  };

  return (
    <Modal
      title={server.name}
      tabs={TABS}
      submitText="保存"
      onClose={onClose}
      onSubmit={onClose}
      onSelectTab={(tab) => setActiveTab(tab)}
    >
      {renderContent()}
    </Modal>
  );
});

ServerSettingModal.displayName = 'ServerSettingModal';

export default ServerSettingModal;

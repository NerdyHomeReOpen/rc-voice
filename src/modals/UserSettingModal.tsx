import React, { useState } from 'react';

// Service
import userService from '@/services/user.service';

// Components
import Modal from '@/components/Modal';

// Types
import type { User, ModalTabItem } from '@/types';
import { useSelector } from 'react-redux';

const TABS: ModalTabItem[] = [{ id: '基本資料', label: '基本資料' }];

interface UserSettingModal {
  onClose: () => void;
  onLogout: () => void;
}

const PersonalSettingPage: React.FC<UserSettingModal> = ({
  onClose,
  onLogout,
}) => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ModalTabItem>(TABS[0]);

  // Default user data
  const [preview, setPreview] = useState('/im/IMLogo.png');
  const [userName, setUserName] = useState(user?.name || '');
  const [selectedGender, setSelectedGender] = useState(user?.gender || 'Male');

  const handleSave = async () => {
    if (userName !== user.name || selectedGender !== user.gender) {
      console.log(user);
      try {
        setIsLoading(true);
        setError('');

        const response = await userService.updateProfile({
          userId: user.id,
          name: userName,
          gender: selectedGender,
        });

        localStorage.setItem(
          'userData',
          JSON.stringify({
            ...user,
            name: userName,
            gender: selectedGender,
          }),
        );
        console.log(response);
        onClose();
      } catch (err: Error | any) {
        setError(err.message || 'Save failed');
      }
    } else {
      onClose();
    }
    setIsLoading(false);
  };

  const renderContent = () => {
    switch (activeTab.id) {
      case '基本資料':
        return (
          <>
            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            <div className="flex mt-8">
              <div className="flex-1">
                <div className="mb-4">
                  <div className="flex items-center gap-4 mb-2 select-none">
                    <label className="w-20 text-right text-sm">顯示名稱</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="flex-1 p-1 border rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="w-20 text-right text-sm select-none">
                      ID
                    </label>
                    <input
                      type="text"
                      value="27054971"
                      className="w-32 p-1 border rounded text-sm"
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-4 select-none">
                    <label className="w-20 text-right text-sm select-none">
                      性別
                    </label>
                    <select
                      value={selectedGender}
                      onChange={(e) =>
                        setSelectedGender(e.target.value as 'Male' | 'Female')
                      }
                      className="p-1 border rounded text-sm"
                    >
                      <option value="Male">男性</option>
                      <option value="Female">女性</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4 select-none">
                    <label className="w-20 text-right text-sm">創建時間</label>
                    <label className="w-48 p-1 rounded text-sm">
                      {new Date(user?.createdAt || 0).toLocaleString()}
                    </label>
                  </div>

                  <div className="flex justify-center select-none">
                    <button
                      className="px-6 py-1 mt-5 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => {
                        onLogout();
                      }}
                    >
                      登出
                    </button>
                  </div>
                </div>
              </div>

              {/* 頭像區域 */}
              <div className="w-48 flex flex-col items-center select-none">
                <img
                  src={preview}
                  alt="Avatar"
                  className="w-32 h-32 border-2 border-gray-300 mb-2 rounded-full object-cover"
                />
                <button className="px-4 py-1 bg-blue-50 hover:bg-blue-100 rounded text-sm">
                  更換頭像
                </button>
                {/* <label className="px-4 py-1 bg-blue-50 hover:bg-blue-100 rounded text-sm cursor-pointer transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  更換頭像
                </label> */}
              </div>
            </div>
          </>
        );
      default:
        return <div>{activeTab.label}</div>;
    }
  };

  return (
    <Modal
      title="個人資料設定"
      tabs={TABS}
      onSelectTab={(tab) => setActiveTab(tab)}
      onClose={onClose}
      onSubmit={onClose}
    >
      {renderContent()}
    </Modal>
  );
};

PersonalSettingPage.displayName = 'PersonalSettingPage';

export default PersonalSettingPage;

import React, { FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';

// Services
import { serverService } from '@/services/server.service';
import { ServerList, User } from '@/types';

// Validation
const validateName = (name: string): string => {
  if (!name.trim()) return '請輸入群組名稱';
  if (name.length > 30) return '群組名稱不能超過30個字符';
  return '';
};
const validateDescription = (description: string): string => {
  if (description.length > 200) return '群組介紹不能超過200個字符';
  return '';
};

interface ServerFormData {
  name: string;
  description: string;
  avatar: File | null;
}

interface FormErrors {
  general?: string;
  name?: string;
  description?: string;
}

interface CreateServerModalProps {
  onClose: () => void;
  onServerCreated: (serverId: string) => void;
}

const CreateServerModal: React.FC<CreateServerModalProps> = React.memo(
  ({ onClose, onServerCreated }) => {
    // Redux
    const serverList = useSelector(
      (state: { serverList: ServerList }) => state.serverList,
    );
    const userId = useSelector((state: { user: User }) => state.user.id);

    const maxGroups = 3; // 最多可創建的群組數量
    console.log('serverList111', serverList);
    const userOwnedServerCount = Object.values(serverList || {}).reduce(
      // 使用者擁有的群組數量
      (count, server) => {
        const hasOwnerPermission = server.ownerId === userId;
        return count + (hasOwnerPermission ? 1 : 0);
      },
      0,
    );

    // Form Control
    const [formData, setFormData] = useState<ServerFormData>({
      name: '',
      description: '',
      avatar: null,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [previewImage, setPreviewImage] = useState<string>(
      '/logo_server_def.png',
    );

    const remainingGroups = maxGroups - userOwnedServerCount;
    const canCreateGroup = remainingGroups > 0;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!canCreateGroup) {
        setErrors({
          general: '您已達到可創建的群組上限',
        });
        return;
      }

      const nameError = validateName(formData.name);
      const descriptionError = validateDescription(formData.description);

      setErrors({
        name: nameError,
        description: descriptionError,
      });

      if (!nameError && !descriptionError) {
        try {
          const data = await serverService.createServer(formData);
          onServerCreated(data.id);
          onClose();
        } catch (error) {
          setErrors({
            general: error instanceof Error ? error.message : '創建群組失敗',
          });
        }
      }
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        alert('請選擇一張圖片');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('圖片大小不能超過5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
      setFormData((prev) => ({ ...prev, avatar: file }));
    };

    return (
      <Modal
        onClose={onClose}
        onSubmit={handleSubmit}
        title="創建語音群"
        submitText="創建"
        width="760px"
        height="80vh"
      >
        <div className="flex mb-4 gap-8">
          <div className="flex-1">
            <div className="space-y-6">
              <div
                className={`border rounded-lg px-4 py-3 text-sm shadow-sm select-none ${
                  canCreateGroup
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {canCreateGroup
                  ? `您還可以創建${remainingGroups}個群，創建之後不能刪除或轉讓`
                  : '您已達到可創建的群組上限'}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="w-24 text-right text-sm font-medium text-gray-700 select-none">
                    群組名稱
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      disabled={!canCreateGroup}
                      className={`w-full p-2 border ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        !canCreateGroup ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      placeholder="請輸入群組名稱 (最多30字)"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <label className="w-24 text-right text-sm font-medium text-gray-700 pt-2 select-none">
                    群組介紹
                  </label>
                  <div className="flex-1">
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      disabled={!canCreateGroup}
                      className={`w-full p-2 border ${
                        errors.description
                          ? 'border-red-500'
                          : 'border-gray-300'
                      } rounded-lg text-sm h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                        !canCreateGroup ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      placeholder="請輸入群組介紹 (最多200字)"
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-48 flex flex-col items-center select-none">
            <div className="relative group">
              <img
                src={previewImage}
                alt="Avatar"
                className="w-32 h-32 rounded-lg border-2 border-gray-300 object-cover transition-all"
              />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={!canCreateGroup}
              />
              <label
                htmlFor="avatar-upload"
                className={`mt-3 w-full px-4 py-2 rounded-lg text-sm font-medium transition-all border text-center block ${
                  canCreateGroup
                    ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 cursor-pointer'
                    : 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                }`}
              >
                更換頭像
              </label>
            </div>
          </div>
        </div>
      </Modal>
    );
  },
);

CreateServerModal.displayName = 'CreateServerModal';

export default CreateServerModal;

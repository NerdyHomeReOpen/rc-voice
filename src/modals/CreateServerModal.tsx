/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import React, { FormEvent, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '@/hooks/SocketProvider';

// Components
import Modal from '@/components/Modal';

// Services
import { serverService } from '@/services/server.service';

// Types
import { User } from '@/types';

// Validation
export const validateName = (name: string): string => {
  if (!name.trim()) return '請輸入群組名稱';
  if (name.length > 30) return '群組名稱不能超過30個字符';
  return '';
};
export const validateDescription = (description: string): string => {
  if (!description?.trim()) return '';
  if (description.length > 200) return '群組介紹不能超過200個字符';
  return '';
};

interface ServerFormData {
  userId: string;
  name: string;
  description: string;
  icon: File | null;
}

interface FormErrors {
  general?: string;
  name?: string;
  description?: string;
}

interface CreateServerModalProps {
  onClose: () => void;
}

const CreateServerModal: React.FC<CreateServerModalProps> = React.memo(
  ({ onClose }) => {
    // Redux
    const user = useSelector((state: { user: User }) => state.user);
    const sessionId = useSelector(
      (state: { sessionToken: string }) => state.sessionToken,
    );

    // Socket Control
    const socket = useSocket();

    // Form Control
    const [formData, setFormData] = useState<ServerFormData>({
      userId: user.id,
      name: '',
      description: '',
      icon: null,
    });

    // Error Control
    const [errors, setErrors] = useState<FormErrors>({});

    const handleSubmit = async (e: FormEvent<Element>) => {
      e.preventDefault();

      const nameError = validateName(formData.name);
      const descriptionError = validateDescription(formData.description);

      setErrors({
        name: nameError,
        description: descriptionError,
      });

      if (!nameError && !descriptionError) {
        try {
          const data = await serverService.createServer(formData);
          onClose();
          // Connect to the server
          socket?.emit('connectServer', {
            sessionId: sessionId,
            serverId: data.serverId,
          });
        } catch (error) {
          setErrors({
            general: error instanceof Error ? error.message : '創建群組失敗',
          });
        }
      }
    };

    // Image Preview
    const [previewImage, setPreviewImage] = useState<string>(
      '/logo_server_def.png',
    );

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
      setFormData((prev) => ({ ...prev, icon: file }));
    };

    const maxGroups = 3;
    const userOwnedServerCount = user.ownedServerIds.length;
    const remainingGroups = maxGroups - userOwnedServerCount;

    return (
      <Modal
        title="創建語音群"
        onSubmit={handleSubmit}
        width="760px"
        height="auto"
        buttons={[
          {
            label: '取消',
            style: 'secondary',
            onClick: onClose,
          },
          {
            label: '確認',
            style: 'primary',
            type: 'submit',
            onClick: () => {},
          },
        ]}
      >
        <div className="flex p-4 gap-8">
          <div className="flex-1">
            <div className="space-y-6">
              <div
                className={`border rounded-lg px-4 py-3 text-sm shadow-sm select-none ${
                  errors.general
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                }`}
              >
                {errors.general
                  ? errors.general
                  : `您還可以創建${remainingGroups}個群，創建之後不能刪除或轉讓`}
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
                      // disabled={!canCreateGroup}
                      className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      } `}
                      // ${!canCreateGroup ? 'bg-gray-100 cursor-not-allowed' : ''}
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
                      // disabled={!canCreateGroup}
                      className={`w-full p-2 border rounded-lg text-sm h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                        errors.description
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      // ${!canCreateGroup ? 'bg-gray-100 cursor-not-allowed' : ''}
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
                alt="Icon"
                className="w-32 h-32 rounded-lg border-2 border-gray-300 object-cover transition-all"
              />
              <input
                type="file"
                id="icon-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                // disabled={!canCreateGroup}
              />
              <label
                htmlFor="icon-upload"
                className={`mt-3 w-full px-4 py-2 rounded-lg text-sm font-medium transition-all border text-center block bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 cursor-pointer`}
                // ${canCreateGroup ? '' : 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'}
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

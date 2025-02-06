import React, { memo, useCallback } from 'react';

interface CreateServerModalProps {
  onClose: () => void;
}

const CreateServerModal = memo(({ onClose }: CreateServerModalProps) => {
  const renderContent = useCallback(() => {
    return (
      <>
        <div className="flex mb-2">
          <div className="flex-1">
            <div className="mb-2">
              <div className="flex items-center gap-4 mb-2">
                <label className="w-20 text-right text-sm">名稱</label>
                <input
                  type="text"
                  className="flex-1 p-1 border rounded text-sm"
                  onChange={
                    /* 處理名稱變更 */
                    () => {}
                  }
                />
              </div>
              <div className="flex items-start gap-4 mb-2">
                <label className="w-20 text-right text-sm">口號</label>
                <textarea className="flex-1 p-1 border rounded text-sm h-20" />
              </div>
              <div className="flex items-center gap-4 mb-2">
                <label className="w-20 text-right text-sm">類型</label>
                <select className="p-1 border rounded text-sm">
                  <option>遊戲</option>
                  <option>音樂</option>
                  <option>原神</option>
                </select>
              </div>
            </div>
          </div>

          {/* 頭像區域 */}
          <div className="w-48 flex flex-col items-center">
            <img
              src="/logo_server_def.png"
              alt="Avatar"
              className="w-32 h-32 border-2 border-gray-300 mb-2"
            />
            <button className="px-4 py-1 bg-blue-50 hover:bg-blue-100 rounded text-sm">
              更換頭像
            </button>
          </div>
        </div>

        {/* 網址和介紹 */}
        <div className="flex items-start gap-4 mb-2">
          <label className="w-20 text-right text-sm">介紹</label>
          <textarea className="flex-1 h-32 p-1 border rounded text-sm" />
        </div>
      </>
    );
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="flex flex-col w-[760] h-[700] bg-white rounded shadow-lg overflow-hidden transform outline-g">
        {/* Top Nevigation */}
        <div className="bg-blue-600 p-2 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/rc_logo_small.png" alt="Logo" className="w-5 h-5" />
            <span>{'創建語音群'}</span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Main Content */}
          <div className="flex-1 p-6">{renderContent()}</div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-end gap-2 p-4 bg-gray-50">
          <button
            className="px-6 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
            onClick={onClose}
          >
            {'建立'}
          </button>
          <button
            className="px-6 py-1 bg-white rounded hover:bg-gray-300 border border-black-200"
            onClick={onClose}
          >
            {'取消'}
          </button>
        </div>
      </div>
    </div>
  );
});

CreateServerModal.displayName = 'CreateServerModal';

export default CreateServerModal;

import React, { memo, useState, FormEvent } from 'react';

// Types
import type { ModalTabItem } from '@/types';

interface ModalProps {
  title: string;
  submitText: string;
  tabs?: ModalTabItem[];
  width?: string;
  height?: string;
  changeContent?: string[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSelectTab?: (tab: ModalTabItem) => void;
  children: React.ReactNode;
}

const Modal = memo(
  ({
    title,
    submitText = '保存',
    tabs,
    width = '800px',
    height = '700px',
    changeContent = [],
    onClose,
    onSubmit,
    onSelectTab,
    children,
  }: ModalProps) => {
    const [activeTab, setActiveTab] = useState<string>(tabs?.[0].id ?? '');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <form
          onSubmit={onSubmit}
          style={{ width: width, height: height }}
          className={`flex flex-col bg-white rounded shadow-lg overflow-hidden transform outline-g`}
        >
          {/* Top Nevigation */}
          <div className="bg-blue-600 p-2 text-white flex items-center justify-between select-none">
            <div className="flex items-center space-x-2">
              <img src="/rc_logo_small.png" alt="Logo" className="w-5 h-5" />
              <span>{title}</span>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Side Menu */}
            {tabs && (
              <div className="w-40 bg-blue-50 text-sm">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`cursor-pointer rounded transition-colors select-none px-4 py-1 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 font-bold'
                        : 'hover:bg-blue-100/50'
                    }`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (onSelectTab) onSelectTab(tab);
                      // tab.onClick(); // Can use this instead of onSelectTab
                    }}
                  >
                    {tab.label}
                  </div>
                ))}
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">{children}</div>
          </div>

          {/* Bottom */}
          <div className="flex flex-row justify-end items-center bg-gray-50">
            {/* Changed content */}
            {changeContent.length !== 0 && (
              <div className="flex flex-row text-sm text-red-400">
                更動內容： *
                {changeContent.map((content, i) => (
                  <div key={i}>{(i ? ',' : '') + content}</div>
                ))}
                *
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2 p-4 bg-gray-50">
              <button
                type="submit"
                className="px-6 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
              >
                {submitText}
              </button>
              <button
                className="px-6 py-1 bg-white rounded hover:bg-gray-300 border border-black-200"
                onClick={onClose}
              >
                取消
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  },
);

Modal.displayName = 'SettingPage';

export default Modal;

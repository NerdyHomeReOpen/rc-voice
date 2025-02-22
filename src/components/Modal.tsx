/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { memo, useState, FormEvent } from 'react';

// Types
import type { ModalButton, ModalTabItem } from '@/types';

// Components
import Header from '@/components/Header';

const getButtonStyle = (button: ModalButton, disabled: boolean) => {
  switch (button.style) {
    case 'primary':
      return `bg-blue-600 text-white hover:bg-blue-700 ${
        disabled ? 'disabled:bg-blue-400' : ''
      }`;
    case 'secondary':
      return `bg-white border border-black-200 text-black hover:bg-gray-300`;
    case 'danger':
      return `bg-red-600 text-white hover:bg-red-700 ${
        disabled ? 'disabled:bg-red-400' : ''
      }`;
  }
};

interface ModalProps {
  title?: string;
  buttons?: ModalButton[];
  tabs?: ModalTabItem[];
  width?: string;
  height?: string;
  changeContent?: string[];
  children?: React.ReactNode;
  onClose?: () => void;
  onSubmit?: (e: FormEvent) => void;
}

const Modal = memo(
  ({
    title,
    tabs,
    buttons,
    width = '800px',
    height = '700px',
    changeContent = [],
    children,
    onClose = () => {},
    onSubmit = (e) => e.preventDefault(),
  }: ModalProps) => {
    const [activeTab, setActiveTab] = useState<string>(tabs?.[0].id ?? '');

    const hasSideMenu = tabs && tabs.length > 0;
    const hasButtons = buttons && buttons.length > 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <form
          onSubmit={onSubmit}
          style={{ width: width, height: height }}
          className={`flex flex-col bg-white rounded shadow-lg overflow-hidden transform outline-g`}
        >
          {/* Top Nevigation */}
          <Header title={title} onClose={onClose}></Header>
          {/* Mid Part */}
          <div className="flex flex-1 min-h-0">
            {/* Side Menu */}
            {hasSideMenu && (
              <div className="w-40 bg-blue-50 text-sm">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`cursor-pointer transition-colors select-none px-4 py-1 text-black ${
                      activeTab === tab.id
                        ? 'bg-white font-bold'
                        : 'hover:bg-blue-100/50'
                    }`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.onClick) tab.onClick();
                      // tab.onClick(); // Can use this instead of onSelectTab
                    }}
                  >
                    {tab.label}
                  </div>
                ))}
              </div>
            )}
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">{children}</div>
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
            {hasButtons && (
              <div className="flex justify-end gap-2 p-4 bg-gray-50">
                {buttons.map((button, i) => (
                  <button
                    key={i}
                    type={button.type}
                    onClick={button.onClick}
                    className={`px-4 py-2 rounded ${getButtonStyle(
                      button,
                      false,
                    )}`}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    );
  },
);

Modal.displayName = 'SettingPage';

export default Modal;

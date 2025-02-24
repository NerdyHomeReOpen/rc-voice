/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';

// Types
import type { ModalButton } from '@/types';

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

// interface ModalProps {
//   title?: string;
//   buttons: ModalButton[];
//   width: string;
//   height: string;
//   changeContent: string[];
//   children: React.ReactNode;
//   onClose: () => void;
// }

const Modal = React.memo(
  // ({ title, buttons, onClose = () => {} }: { title: string, buttons: ModalButton[], onClose: () => void }) => {
    () => {
    // const hasButtons = buttons && buttons.length > 0;

    const getMainContent = () => {
      return <> </>;
      // if (!socket || !user) return <LoadingSpinner />;
      // else {
      //   switch (selectedTabId) {
      //     case 1:
      //       return <HomePage />;
      //     case 2:
      //       return <FriendPage />;
      //     case 3:
      //       if (!server) return;
      //       return <ServerPage />;
      //   }
      // }
    };

    return (
      <div
        className={`fixed w-full h-full flex-1 flex-col bg-white rounded shadow-lg overflow-hidden transform outline-g`}
      >
        {/* Top Nevigation */}
        {/* <Header title={title} onClose={onClose}></Header> */}
        {/* Main Content */}
        <div className="flex flex-1 min-h-0 overflow-y-auto">
          {getMainContent()}
        </div>
        {/* Bottom */}
        <div className="flex flex-row justify-end items-center bg-gray-50">
          {/* {hasButtons && (
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
          )} */}
        </div>
      </div>
    );
  },
);

Modal.displayName = 'SettingPage';

export default Modal;

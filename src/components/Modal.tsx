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

    return <></>;
  },
);

Modal.displayName = 'SettingPage';

export default Modal;

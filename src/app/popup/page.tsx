/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, ReactNode } from 'react';

// CSS
import header from '@/styles/common/header.module.css';

// Types
import { popupType } from '@/types';

// Components
import CreateServerModal from '@/components/modals/CreateServerModal';
import EditServerModal from '@/components/modals/EditServerModal';
import AddChannelModal from '@/components/modals/AddChannelModal';
import EditChannelModal from '@/components/modals/EditChannelModal';
import UserSettingModal from '@/components/modals/UserSettingModal';
import ServerApplication from '@/components/modals/ServerApplicationModal';
import ApplyFriend from '@/components/modals/ApplyFriend';
import Dialog from '@/components/modals/Dialog';

// Services
import { ipcService } from '@/services/ipc.service';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';

interface HeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
}

const Header: React.FC<HeaderProps> = React.memo(({ title, buttons }) => {
  // Fullscreen Control
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handlers
  const handleFullscreen = () => {
    if (isFullscreen) ipcService.window.unmaximize();
    else ipcService.window.maximize();
    setIsFullscreen(!isFullscreen);
  };

  const handleMinimize = () => {
    ipcService.window.minimize();
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  return (
    <div className={header['header']}>
      <div className={header['titleBox']}>
        <span className={header['title']}>{title}</span>
      </div>
      <div className={header['buttons']}>
        {buttons.includes('minimize') && (
          <div
            className={header['minimize']}
            onClick={() => handleMinimize()}
          />
        )}
        {buttons.includes('maxsize') && (
          <div
            className={isFullscreen ? header['restore'] : header['maxsize']}
            onClick={() => handleFullscreen()}
          />
        )}
        {buttons.includes('close') && (
          <div className={header['close']} onClick={() => handleClose()} />
        )}
      </div>
    </div>
  );
});

Header.displayName = 'Header';

const Modal = React.memo(() => {
  // Language
  const lang = useLanguage();

  // States
  const [header, setHeader] = useState<ReactNode | null>(null);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [initialData, setInitialData] = useState<any | null>(null);

  // Effects
  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') as popupType;
      if (!type) return;

      ipcService.initialData.request(type, (data) => {
        setInitialData(data);
      });

      switch (type) {
        case popupType.EDIT_USER:
          setHeader(<Header title={lang.tr.editUser} buttons={['close']} />);
          setContent(<UserSettingModal {...initialData} />);
          break;
        case popupType.CREATE_SERVER:
          setHeader(
            <Header title={lang.tr.createServer} buttons={['close']} />,
          );
          setContent(<CreateServerModal {...initialData} />);
          break;
        case popupType.EDIT_SERVER:
          setHeader(<Header title={lang.tr.editServer} buttons={['close']} />);
          setContent(<EditServerModal {...initialData} />);
          break;
        case popupType.DELETE_SERVER:
          // This doesn't exist lol
          break;
        case popupType.CREATE_CHANNEL:
          setHeader(
            <Header title={lang.tr.createChannel} buttons={['close']} />,
          );
          setContent(<AddChannelModal {...initialData} />);
          break;
        case popupType.EDIT_CHANNEL:
          setHeader(<Header title={lang.tr.editChannel} buttons={['close']} />);
          setContent(<EditChannelModal {...initialData} />);
          break;
        case popupType.DELETE_CHANNEL:
          // This doesn't exist lol
          break;
        case popupType.APPLY_MEMBER:
          setHeader(<Header title={lang.tr.applyMember} buttons={['close']} />);
          setContent(<ServerApplication {...initialData} />);
          break;
        case popupType.APPLY_FRIEND:
          setHeader(<Header title={lang.tr.applyFriend} buttons={['close']} />);
          setContent(<ApplyFriend {...initialData} />);
          break;
        case popupType.DIRECT_MESSAGE:
          // setHeader(<Header title={lang.tr.directMessage} buttons={['close']} />);
          // setContent(<DirectMessageModal onClose={() => {}} />);
          break;
        case popupType.DIALOG_ALERT:
        case popupType.DIALOG_ALERT2:
          setHeader(<Header title={lang.tr.dialogAlert} buttons={['close']} />);
          setContent(<Dialog {...{ ...initialData, iconType: 'ALERT' }} />);
          break;
        case popupType.DIALOG_SUCCESS:
          setHeader(
            <Header title={lang.tr.dialogSuccess} buttons={['close']} />,
          );
          setContent(<Dialog {...{ ...initialData, iconType: 'SUCCESS' }} />);
          break;
        case popupType.DIALOG_WARNING:
          setHeader(
            <Header title={lang.tr.dialogWarning} buttons={['close']} />,
          );
          setContent(<Dialog {...{ ...initialData, iconType: 'WARNING' }} />);
          break;
        case popupType.DIALOG_ERROR:
          setHeader(<Header title={lang.tr.dialogError} buttons={['close']} />);
          setContent(<Dialog {...{ ...initialData, iconType: 'ERROR' }} />);
          break;
        case popupType.DIALOG_INFO:
          setHeader(<Header title={lang.tr.dialogInfo} buttons={['close']} />);
          setContent(<Dialog {...{ ...initialData, iconType: 'INFO' }} />);
          break;
        default:
          break;
      }
    }
  }, [lang, initialData]);

  return (
    <div className="wrapper">
      {/* Top Nevigation */}
      {header}
      {/* Main Content */}
      {content}
    </div>
  );
});

Modal.displayName = 'SettingPage';

export default Modal;

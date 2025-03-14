/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useEffect, useState } from 'react';

// CSS
import popup from '@/styles/common/popup.module.css';
import header from '@/styles/common/header.module.css';

// Types
import { popupType } from '@/types';

// Modals
import CreateServerModal from '@/components/modals/CreateServerModal';
import EditServerModal from '@/components/modals/EditServerModal';
import AddChannelModal from '@/components/modals/AddChannelModal';
import DeleteChannelModal from '@/components/modals/DeleteChannelModal';
import EditChannelModal from '@/components/modals/EditChannelModal';
import ServerApplication from '@/components/modals/ServerApplicationModal';
import ApplyFriend from '@/components/modals/ApplyFriend';

// Services
import { ipcService } from '@/services/ipc.service';
import Dialog from '@/components/modals/Dialog';

interface HeaderProps {
  title?: string;
  buttons?: string[];
}

const Header: React.FC<HeaderProps> = React.memo(({ title, buttons }) => {
  // Fullscreen Control
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handlers
  const handleFullscreen = () => {
    isFullscreen
      ? ipcService.window.unmaximize()
      : ipcService.window.maximize();
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
        {title && <span className={header['title']}>{title}</span>}
      </div>
      <div className={header['buttons']}>
        {buttons?.includes('minimize') && (
          <div className={header['minimize']} onClick={handleMinimize} />
        )}
        {buttons?.includes('maxsize') && (
          <div
            className={isFullscreen ? header['restore'] : header['maxsize']}
            onClick={handleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          />
        )}
        {buttons?.includes('close') && (
          <div className={header['close']} onClick={handleClose} />
        )}
      </div>
    </div>
  );
});

const Modal = React.memo(() => {
  const [type, setType] = useState<popupType | null>(null);
  const [initialData, setInitialData] = useState<any | null>(null);

  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const newType = params.get('type') as popupType;
      setType(newType);

      if (newType) {
        ipcService.initialData.request(newType, (data) => {
          setInitialData(data);
        });
      }
    }
  }, []);

  const getTitle = () => {
    switch (type) {
      case popupType.EDIT_USER:
        return { title: '編輯個人資料', button: ['close'] };
      case popupType.CREATE_SERVER:
        return { title: '創建語音群', button: ['close'] };
      case popupType.EDIT_SERVER:
        return { title: '編輯語音群', button: ['close'] };
      case popupType.DELETE_SERVER:
        return { title: '刪除語音群', button: ['close'] };
      case popupType.CREATE_CHANNEL:
        return { title: '創建頻道', button: ['close'] };
      case popupType.EDIT_CHANNEL:
        return { title: `編輯頻道`, button: ['close'] };
      case popupType.DELETE_CHANNEL:
        return { title: '刪除頻道', button: ['close'] };
      case popupType.APPLY_MEMBER:
        return { title: '申請會員', button: ['close'] };
      case popupType.APPLY_FRIEND:
        return { title: '好友請求', button: ['close'] };
      case popupType.DIRECT_MESSAGE:
        return { title: '私訊', button: ['close'] };
      case popupType.DIALOG_ALERT:
      case popupType.DIALOG_ALERT2:
        return { title: '警告', button: ['close'] };
      case popupType.DIALOG_SUCCESS:
        return { title: '成功', button: ['close'] };
      case popupType.DIALOG_WARNING:
        return { title: '警告', button: ['close'] };
      case popupType.DIALOG_ERROR:
        return { title: '錯誤', button: ['close'] };
      case popupType.DIALOG_INFO:
        return { title: '資訊', button: ['close'] };
      default:
        return undefined;
    }
  };

  const getMainContent = () => {
    switch (type) {
      case popupType.EDIT_USER:
        return; // <EditUserModal {...initialData} />;
      case popupType.CREATE_SERVER:
        return <CreateServerModal {...initialData} />;
      case popupType.EDIT_SERVER:
        return <EditServerModal {...initialData} />;
      case popupType.DELETE_SERVER:
        return; // This one doesn't exist :D
      case popupType.CREATE_CHANNEL:
        return <AddChannelModal {...initialData} />;
      case popupType.EDIT_CHANNEL:
      // return <EditChannelModal onClose={() => {}} channel={} />;
      case popupType.DELETE_CHANNEL:
      // return <DeleteChannelModal onClose={() => {}} channel={} />;
      case popupType.APPLY_MEMBER:
        return <ServerApplication {...initialData} />;
      case popupType.APPLY_FRIEND:
        return <ApplyFriend {...initialData} />;
      case popupType.DIRECT_MESSAGE:
        return; // <DirectMessageModal onClose={() => {}} />;
      case popupType.DIALOG_ALERT:
      case popupType.DIALOG_ALERT2:
        return <Dialog {...{ ...initialData, iconType: 'ALERT' }} />;
      case popupType.DIALOG_SUCCESS:
        return <Dialog {...{ ...initialData, iconType: 'SUCCESS' }} />;
      case popupType.DIALOG_WARNING:
        return <Dialog {...{ ...initialData, iconType: 'WARNING' }} />;
      case popupType.DIALOG_ERROR:
        return <Dialog {...{ ...initialData, iconType: 'ERROR' }} />;
      case popupType.DIALOG_INFO:
        return <Dialog {...{ ...initialData, iconType: 'INFO' }} />;
      default:
        return <div className={popup['popupContainer']} />;
    }
  };

  return (
    <div className="wrapper">
      {/* Top Nevigation */}
      <Header title={getTitle()?.title} buttons={getTitle()?.button} />
      {/* Main Content */}
      {getMainContent()}
    </div>
  );
});

Modal.displayName = 'SettingPage';

export default Modal;

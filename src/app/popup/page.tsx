/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, ReactNode } from 'react';

// CSS
import header from '@/styles/common/header.module.css';

// Types
import { PopupType } from '@/types';

// Components
import AddChannel from '@/components/popups/AddChannel';
import AddFriend from '@/components/popups/AddFriend';
import AddFriendGroup from '@/components/popups/AddFriendGroup';
import ApplyFriend from '@/components/popups/ApplyFriend';
import ApplyMember from '@/components/popups/ApplyMember';
import ChannelSetting from '@/components/popups/ChannelSetting';
import CreateServer from '@/components/popups/CreateServer';
import Dialog from '@/components/popups/Dialog';
import DirectMessageModal from '@/components/popups/DirectMessage';
import EditApply from '@/components/popups/EditApplySetting';
import EditMember from '@/components/popups/EditNickname';
import EditServer from '@/components/popups/ServerSetting';
import SystemSetting from '@/components/popups/SystemSetting';
import UserSetting from '@/components/popups/UserSetting';

// Services
import ipcService from '@/services/ipc.service';

// Providers
import { useLanguage } from '@/providers/Language';

interface HeaderProps {
  title: string;
  buttons: ('minimize' | 'maxsize' | 'close')[];
}

const Header: React.FC<HeaderProps> = React.memo(({ title, buttons }) => {
  // States
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

const Popup = React.memo(() => {
  // Language
  const lang = useLanguage();

  // States
  const [headerTitle, setHeaderTitle] = useState<string>('');
  const [headerButtons, setHeaderButtons] = useState<
    ('minimize' | 'maxsize' | 'close')[]
  >([]);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [initialData, setInitialData] = useState<any | null>(null);

  // Effects
  useEffect(() => {
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type') as PopupType;
      if (!type) return;
      if (type === PopupType.SYSTEM_SETTING) {
        ipcService.autoLaunch.get((enabled) => {
          setInitialData({ autoLaunch: enabled });
        });
      } else {
        ipcService.initialData.request(type, (data) => {
          setInitialData(data);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!initialData) return;

    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') as PopupType;
    if (!type) return;

    switch (type) {
      case PopupType.SYSTEM_SETTING:
        setHeaderTitle(lang.tr.systemSetting);
        setHeaderButtons(['close']);
        setContent(<SystemSetting {...initialData} />);
        break;
      case PopupType.EDIT_APPLY:
        setHeaderTitle(lang.tr.editApplySettings);
        setHeaderButtons(['close']);
        setContent(<EditApply {...initialData} />);
        break;
      case PopupType.EDIT_MEMBER:
        setHeaderTitle(lang.tr.editMemberCard);
        setHeaderButtons(['close']);
        setContent(<EditMember {...initialData} />);
        break;
      case PopupType.EDIT_USER:
        setHeaderTitle(lang.tr.editUser);
        setHeaderButtons(['close']);
        setContent(<UserSetting {...initialData} />);
        break;
      case PopupType.CREATE_SERVER:
        setHeaderTitle(lang.tr.createServer);
        setHeaderButtons(['close']);
        setContent(<CreateServer {...initialData} />);
        break;
      case PopupType.EDIT_SERVER:
        setHeaderTitle(lang.tr.editServer);
        setHeaderButtons(['close']);
        setContent(<EditServer {...initialData} />);
        break;
      case PopupType.CREATE_CHANNEL:
        setHeaderTitle(lang.tr.createChannel);
        setHeaderButtons(['close']);
        setContent(<AddChannel {...initialData} />);
        break;
      case PopupType.EDIT_CHANNEL:
        setHeaderTitle(lang.tr.editChannel);
        setHeaderButtons(['close']);
        setContent(<ChannelSetting {...initialData} />);
        break;
      case PopupType.APPLY_MEMBER:
        setHeaderTitle(lang.tr.applyMember);
        setHeaderButtons(['close']);
        setContent(<ApplyMember {...initialData} />);
        break;
      case PopupType.APPLY_FRIEND:
        setHeaderTitle(lang.tr.applyFriend);
        setHeaderButtons(['close']);
        setContent(<ApplyFriend {...initialData} />);
        break;
      case PopupType.ADD_FRIEND:
        setHeaderTitle(lang.tr.addFriend);
        setHeaderButtons(['close']);
        setContent(<AddFriend {...initialData} />);
        break;
      case PopupType.ADD_FRIEND_SUBGROUPS:
        setHeaderTitle(lang.tr.addFriendSubGroups);
        setHeaderButtons(['close']);
        setContent(<AddFriendGroup {...initialData} />);
        break;
      case PopupType.DIRECT_MESSAGE:
        setHeaderTitle(lang.tr.directMessage);
        setHeaderButtons(['close']);
        setContent(<DirectMessageModal {...initialData} />);
        break;
      case PopupType.DIALOG_ALERT:
      case PopupType.DIALOG_ALERT2:
        setHeaderTitle(lang.tr.dialogAlert);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...initialData, iconType: 'ALERT' }} />);
        break;
      case PopupType.DIALOG_SUCCESS:
        setHeaderTitle(lang.tr.dialogSuccess);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...initialData, iconType: 'SUCCESS' }} />);
        break;
      case PopupType.DIALOG_WARNING:
        setHeaderTitle(lang.tr.dialogWarning);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...initialData, iconType: 'WARNING' }} />);
        break;
      case PopupType.DIALOG_ERROR:
        setHeaderTitle(lang.tr.dialogError);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...initialData, iconType: 'ERROR' }} />);
        break;
      case PopupType.DIALOG_INFO:
        setHeaderTitle(lang.tr.dialogInfo);
        setHeaderButtons(['close']);
        setContent(<Dialog {...{ ...initialData, iconType: 'INFO' }} />);
        break;
      default:
        break;
    }
  }, [lang, initialData]);

  return (
    <div className="wrapper">
      {/* Top Nevigation */}
      <Header title={headerTitle} buttons={headerButtons} />
      {/* Main Content */}
      {content}
    </div>
  );
});

Popup.displayName = 'Popup';

export default Popup;

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { CircleX } from 'lucide-react';

// CSS
import header from '@/styles/common/header.module.css';

// Types
import {
  PopupType,
  SocketServerEvent,
  LanguageKey,
  Server,
  User,
} from '@/types';

// Pages
import FriendPage from '@/components/pages/FriendPage';
import HomePage from '@/components/pages/HomePage';
import ServerPage from '@/components/pages/ServerPage';

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Utils
import { errorHandler, StandardizedError } from '@/utils/errorHandler';
import { createDefault } from '@/utils/createDefault';

// Providersx
import ExpandedProvider from '@/providers/ExpandedContextProvider';
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useContextMenu } from '@/providers/ContextMenuProvider';

// Services
import ipcService from '@/services/ipc.service';
import authService from '@/services/auth.service';

interface HeaderProps {
  user: User;
  server: Server;
  selectedId: 'home' | 'friends' | 'server';
  setSelectedTabId: (tabId: 'home' | 'friends' | 'server') => void;
}

const Header: React.FC<HeaderProps> = React.memo(
  ({ user, server, selectedId, setSelectedTabId }) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();
    const contextMenu = useContextMenu();

    // States
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    // Variables
    const { id: serverId } = server;
    const { id: userId, name: userName, status: userStatus } = user;

    // Constants
    const MAIN_TABS = [
      { id: 'home', label: lang.tr.home },
      { id: 'friends', label: lang.tr.friends },
      { id: 'server', label: server.name },
    ];
    const STATUS_OPTIONS = [
      { status: 'online', label: lang.tr.online },
      { status: 'dnd', label: lang.tr.dnd },
      { status: 'idle', label: lang.tr.idle },
      { status: 'gn', label: lang.tr.gn },
    ];

    // Handlers
    const handleLeaveServer = (userId: User['id'], serverId: Server['id']) => {
      if (!socket) return;
      socket.send.disconnectServer({ userId, serverId });
    };

    const handleUpdateStatus = (status: User['status'], userId: User['id']) => {
      if (!socket) return;
      socket.send.updateUser({ user: { status }, userId });
    };

    const handleLogout = () => {
      authService.logout();
    };

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

    const handleLanguageChange = (language: LanguageKey) => {
      lang.set(language);
      localStorage.setItem('language', language);
    };

    const handleShowEditUser = (userId: User['id']) => {
      ipcService.popup.open(PopupType.EDIT_USER);
      ipcService.initialData.onRequest(PopupType.EDIT_USER, {
        userId,
      });
    };

    const handleOpenSystemSetting = () => {
      ipcService.popup.open(PopupType.SYSTEM_SETTING);
      ipcService.initialData.onRequest(PopupType.SYSTEM_SETTING, {});
    };

    return (
      <div className={header['header']}>
        {/* Title */}
        <div className={`${header['titleBox']} ${header['big']}`}></div>
        {/* User Status */}
        <div className={header['userStatus']}>
          <div
            className={header['nameDisplay']}
            onClick={() => handleShowEditUser(userId)}
          >
            {userName}
          </div>
          <div
            className={header['statusBox']}
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown);
            }}
          >
            <div className={header['statusDisplay']} datatype={userStatus} />
            <div className={header['statusTriangle']} />
            <div
              className={`${header['statusDropdown']} ${
                showStatusDropdown ? '' : header['hidden']
              }`}
            >
              {STATUS_OPTIONS.map((option) => (
                <div
                  key={option.status}
                  className={header['option']}
                  datatype={option.status}
                  onClick={() => {
                    handleUpdateStatus(option.status as User['status'], userId);
                    setShowStatusDropdown(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Main Tabs */}
        <div className={header['mainTabs']}>
          {MAIN_TABS.map((Tab) => {
            const TabId = Tab.id;
            const TabLable = Tab.label;
            const TabClose = TabId === 'server';
            if (TabId === 'server' && !serverId) return null;
            return (
              <div
                key={`Tabs-${TabId}`}
                className={`${header['tab']} ${
                  TabId === selectedId ? header['selected'] : ''
                }`}
                onClick={() =>
                  setSelectedTabId(TabId as 'home' | 'friends' | 'server')
                }
              >
                <div className={header['tabLable']}>{TabLable}</div>
                <div className={header['tabBg']}></div>
                {TabClose && (
                  <CircleX
                    onClick={() => handleLeaveServer(userId, serverId)}
                    size={16}
                    className={header['tabClose']}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* Buttons */}
        <div className={header['buttons']}>
          <div className={header['gift']} />
          <div className={header['game']} />
          <div className={header['notice']} />
          <div className={header['spliter']} />
          <div
            className={header['menu']}
            onClick={(e) =>
              contextMenu.showContextMenu(e.clientX, e.clientY, [
                {
                  id: 'system-setting',
                  label: lang.tr.systemSettings,
                  icon: 'setting',
                  onClick: () => handleOpenSystemSetting(),
                },
                {
                  id: 'message-history',
                  label: lang.tr.messageHistory,
                  icon: 'message',
                  onClick: () => {
                    // TODO: Implement
                  },
                },
                {
                  id: 'change-theme',
                  label: lang.tr.changeTheme,
                  icon: 'skin',
                  onClick: () => {
                    // TODO: Implement
                  },
                },
                {
                  id: 'feedback',
                  label: lang.tr.feedback,
                  icon: 'feedback',
                  onClick: () => {
                    window.open(
                      'https://forms.gle/AkBTqsZm9NGr5aH46',
                      '_blank',
                    );
                  },
                },
                {
                  id: 'language-select',
                  label: lang.tr.languageSelect,
                  icon: 'submenu',
                  hasSubmenu: true,
                  submenuItems: [
                    {
                      id: 'language-select-tw',
                      label: '繁體中文',
                      onClick: () => handleLanguageChange('tw'),
                    },
                    {
                      id: 'language-select-cn',
                      label: '簡體中文',
                      onClick: () => handleLanguageChange('cn'),
                    },
                    {
                      id: 'language-select-en',
                      label: 'English',
                      onClick: () => handleLanguageChange('en'),
                    },
                    {
                      id: 'language-select-jp',
                      label: '日本語',
                      onClick: () => handleLanguageChange('jp'),
                    },
                  ],
                },
                {
                  id: 'logout',
                  label: lang.tr.logout,
                  icon: 'logout',
                  onClick: () => handleLogout(),
                },
                {
                  id: 'exit',
                  label: lang.tr.exit,
                  icon: 'exit',
                  onClick: () => handleClose(),
                },
              ])
            }
          />
          <div
            className={header['minimize']}
            onClick={() => handleMinimize()}
          />
          <div
            className={isFullscreen ? header['restore'] : header['maxsize']}
            onClick={() => handleFullscreen()}
          />
          <div className={header['close']} onClick={() => handleClose()} />
        </div>
      </div>
    );
  },
);

Header.displayName = 'Header';

const Home = () => {
  // Hooks
  const socket = useSocket();
  const lang = useLanguage();

  // States
  const [user, setUser] = useState<User>(createDefault.user());
  const [server, setServer] = useState<Server>(createDefault.server());
  const [selectedTabId, setSelectedTabId] = useState<
    'home' | 'friends' | 'server'
  >('home');

  // Handlers
  const handleConnect = () => {
    setSelectedTabId('home');
  };

  const handleDisconnect = () => {
    setSelectedTabId('home');
    setUser(createDefault.user());
    setServer(createDefault.server());
  };

  const handleError = (error: StandardizedError) => {
    new errorHandler(error).show();
  };

  const handleUserUpdate = (data: Partial<User> | null) => {
    if (!data) data = createDefault.user();
    setUser((prev) => ({ ...prev, ...data }));
  };

  const handleServerUpdate = (data: Partial<Server> | null) => {
    setSelectedTabId(data ? 'server' : 'home');
    if (!data) data = createDefault.server();
    setServer((prev) => ({ ...prev, ...data }));
  };

  const handleOpenPopup = (data: any) => {
    const { popupType, initialData } = data;
    ipcService.popup.open(popupType);
    ipcService.initialData.onRequest(popupType, initialData);
  };

  // Effects
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.CONNECT]: handleConnect,
      [SocketServerEvent.DISCONNECT]: handleDisconnect,
      [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
      [SocketServerEvent.SERVER_UPDATE]: handleServerUpdate,
      [SocketServerEvent.OPEN_POPUP]: handleOpenPopup,
      [SocketServerEvent.ERROR]: handleError,
    };
    const unsubscribe: (() => void)[] = [];

    Object.entries(eventHandlers).map(([event, handler]) => {
      const unsub = socket.on[event as SocketServerEvent](handler);
      unsubscribe.push(unsub);
    });

    return () => {
      unsubscribe.forEach((unsub) => unsub());
    };
  }, [socket]);

  useEffect(() => {
    if (!lang) return;
    const language = localStorage.getItem('language');
    if (language) lang.set(language as LanguageKey);
  }, [lang]);

  const getMainContent = () => {
    if (!socket) return <LoadingSpinner />;
    switch (selectedTabId) {
      case 'home':
        return <HomePage user={user} handleUserUpdate={handleUserUpdate} />;
      case 'friends':
        return <FriendPage user={user} handleUserUpdate={handleUserUpdate} />;
      case 'server':
        return (
          <ExpandedProvider>
            <ServerPage
              user={user}
              server={server}
              handleServerUpdate={handleServerUpdate}
            />
          </ExpandedProvider>
        );
    }
  };

  return (
    <div className="wrapper">
      <Header
        user={user}
        server={server}
        selectedId={selectedTabId}
        setSelectedTabId={setSelectedTabId}
      />
      {/* Main Content */}
      <div className="content">{getMainContent()}</div>
    </div>
  );
};

Home.displayName = 'Home';

export default Home;

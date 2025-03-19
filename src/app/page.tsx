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
import { createDefault } from '@/utils/default';

// Providers
import WebRTCProvider from '@/providers/WebRTCProvider';
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';
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

    // States
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    // Variables
    const serverId = server.id;
    const userId = user.id;
    const userName = user.name;
    const userStatus = user.status;

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
    const handleLogout = () => {
      authService.logout();
    };

    const handleLeaveServer = () => {
      if (!socket) return;
      socket.send.disconnectServer({ serverId: serverId, userId: userId });
    };

    const handleUpdateStatus = (status: User['status']) => {
      if (!socket) return;
      socket.send.updateUser({ user: { id: userId, status } });
    };

    const handleCreateError = (error: StandardizedError) => {
      new errorHandler(error).show();
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

    const handleOpenDevtool = () => {
      ipcService.window.openDevtool();
    };

    const handleLanguageChange = (language: LanguageKey) => {
      lang.set(language);
      localStorage.setItem('language', language);
    };

    const handleShowEditUser = () => {
      ipcService.popup.open(PopupType.EDIT_USER);
      ipcService.initialData.onRequest(PopupType.EDIT_USER, {
        user: user,
      });
    };

    return (
      <div className={header['header']}>
        {/* Title */}
        <div className={`${header['titleBox']} ${header['big']}`}></div>
        {/* User Status */}
        <div className={header['userStatus']}>
          <div
            className={header['nameDisplay']}
            onClick={() => {
              handleShowEditUser();
            }}
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
                    handleUpdateStatus(option.status as User['status']);
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
                    onClick={() => handleLeaveServer()}
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
            onClick={() => setShowMenu(!showMenu)}
          >
            <div
              className={`${header['menuDropDown']} ${
                showMenu ? '' : header['hidden']
              }`}
            >
              <div
                className={`${header['option']} ${header['hasImage']}`}
                data-type="system-setting"
                data-key="30066"
                onClick={() => handleOpenDevtool()}
              >
                {lang.tr.systemSettings}
              </div>
              <div
                className={`${header['option']} ${header['hasImage']}`}
                data-type="message-history"
                data-key="30136"
                onClick={() =>
                  handleCreateError(
                    new StandardizedError(
                      '此頁面尚未完工',
                      'NotImplementedError',
                      'Page',
                      'PAGE_NOT_IMPLEMENTED',
                      404,
                    ),
                  )
                }
              >
                {lang.tr.messageHistory}
              </div>
              <div
                className={`${header['option']} ${header['hasImage']}`}
                data-type="change-theme"
                data-key="60028"
              >
                {lang.tr.changeTheme}
              </div>
              <div
                className={header['option']}
                data-type="feed-back"
                data-key="30039"
              >
                {lang.tr.feedback}
              </div>
              <div
                className={`${header['option']} ${header['hasImage']} ${header['hasSubmenu']}`}
                data-type="language-select"
              >
                <span data-key="30374">{lang.tr.languageSelect}</span>
                <div
                  className={`${header['menuDropDown']} ${header['hidden']}`}
                >
                  <div
                    className={header['option']}
                    data-lang="tw"
                    onClick={() => handleLanguageChange('tw')}
                  >
                    繁體中文
                  </div>
                  <div
                    className={header['option']}
                    data-lang="cn"
                    onClick={() => handleLanguageChange('cn')}
                  >
                    简体中文
                  </div>
                  <div
                    className={header['option']}
                    data-lang="en"
                    onClick={() => handleLanguageChange('en')}
                  >
                    English
                  </div>
                  <div
                    className={header['option']}
                    data-lang="jp"
                    onClick={() => handleLanguageChange('jp')}
                  >
                    日本語
                  </div>
                  <div
                    className={header['option']}
                    data-lang="ru"
                    onClick={() => handleLanguageChange('ru')}
                  >
                    русский язык
                  </div>
                </div>
              </div>
              <div
                className={header['option']}
                data-type="logout"
                data-key="30060"
                onClick={() => handleLogout()}
              >
                {lang.tr.logout}
              </div>
              <div
                className={`${header['option']} ${header['hasImage']}`}
                data-type="exit"
                data-key="30061"
                onClick={() => handleClose()}
              >
                {lang.tr.exit}
              </div>
            </div>
          </div>
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

  // Effects
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.CONNECT]: handleConnect,
      [SocketServerEvent.DISCONNECT]: handleDisconnect,
      [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
      [SocketServerEvent.SERVER_UPDATE]: handleServerUpdate,
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

  // Handlers
  const handleConnect = () => {
    console.log('Socket connected');
    setSelectedTabId('home');
  };

  const handleDisconnect = () => {
    console.log('Socket disconnected');
    setUser(createDefault.user());
    setServer(createDefault.server());
    setSelectedTabId('home');
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

  const getMainContent = () => {
    if (!socket) return <LoadingSpinner />;
    switch (selectedTabId) {
      case 'home':
        return <HomePage user={user} />;
      case 'friends':
        return <FriendPage user={user} />;
      case 'server':
        return <ServerPage user={user} server={server} />;
    }
  };

  return (
    <div className="wrapper">
      <WebRTCProvider>
        <Header
          user={user}
          server={server}
          selectedId={selectedTabId}
          setSelectedTabId={setSelectedTabId}
        />
        {/* Main Content */}
        <div className="content">{getMainContent()}</div>
      </WebRTCProvider>
    </div>
  );
};

Home.displayName = 'Home';

export default Home;

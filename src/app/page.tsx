'use client';

import React, { useEffect, useState } from 'react';
import { CircleX } from 'lucide-react';

// CSS
import header from '@/styles/common/header.module.css';

// Types
import {
  PopupType,
  Channel,
  Server,
  User,
  SocketServerEvent,
  LanguageKey,
} from '@/types';

// Pages
import FriendPage from '@/components/pages/FriendPage';
import HomePage from '@/components/pages/HomePage';
import ServerPage from '@/components/pages/ServerPage';

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Utils
import { errorHandler, StandardizedError } from '@/utils/errorHandler';

// Providers
import WebRTCProvider from '@/providers/WebRTCProvider';
import { useSocket } from '@/providers/SocketProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';
import authService from '@/services/auth.service';

// Redux
import store from '@/redux/store';
import { clearServer } from '@/redux/serverSlice';
import { clearUser } from '@/redux/userSlice';
import { clearChannel, setChannel } from '@/redux/channelSlice';

interface HeaderProps {
  user: User;
  server: Server;
  selectedId: number;
  setSelectedTabId: (tabId: number) => void;
}

const Header: React.FC<HeaderProps> = React.memo(
  ({ user, server, selectedId = 1, setSelectedTabId }) => {
    // Variables
    const serverId = server.id;
    const userName = user.name;
    const userStatus = user.status;

    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // States
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    // Constants
    const MAIN_TABS = [
      { id: 1, label: lang.tr.home },
      { id: 2, label: lang.tr.friends },
      { id: 3, label: server.name },
    ];
    const STATUS_OPTIONS = [
      { status: 'online', label: lang.tr.online },
      { status: 'dnd', label: lang.tr.dnd },
      { status: 'idle', label: lang.tr.idle },
      { status: 'gn', label: lang.tr.gn },
    ];

    // Handlers
    const handleLogout = () => {
      store.dispatch(clearChannel());
      store.dispatch(clearServer());
      store.dispatch(clearUser());
      authService.logout();
    };

    const handleLeaveServer = (serverId: string) => {
      if (!socket) return;
      socket.send.disconnectServer({ serverId: serverId });
    };

    const handleUpdateStatus = (status: User['status']) => {
      if (!socket) return;
      socket.send.updateUser({ user: { status } });
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
            return (
              <div
                key={`Tabs-${TabId}`}
                className={`${header['tab']} ${
                  TabId === selectedId ? header['selected'] : ''
                }`}
                onClick={() => setSelectedTabId(TabId)}
              >
                <div className={header['tabLable']}>{TabLable}</div>
                <div className={header['tabBg']}></div>
                {TabId > 2 && serverId && (
                  <CircleX
                    onClick={() => handleLeaveServer(serverId)}
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
  const [user, setUser] = useState<User>({
    id: '',
    name: '未知使用者',
    avatar: '',
    avatarUrl: '',
    signature: '',
    status: 'online',
    gender: 'Male',
    level: 0,
    xp: 0,
    requiredXp: 0,
    progress: 0,
    currentChannelId: '',
    currentServerId: '',
    lastActiveAt: 0,
    createdAt: 0,
  });
  const [server, setServer] = useState<Server>({
    id: '',
    name: '未知伺服器',
    avatar: '',
    avatarUrl: '/logo_server_def.png',
    announcement: '',
    description: '',
    type: 'other',
    displayId: '00000000',
    slogan: '',
    level: 0,
    wealth: 0,
    lobbyId: '',
    ownerId: '',
    settings: {
      allowDirectMessage: false,
      visibility: 'public',
      defaultChannelId: '',
    },
    createdAt: 0,
  });
  const [selectedTabId, setSelectedTabId] = useState<number>(1);

  // Effects
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.CONNECT]: () => handleConnect,
      [SocketServerEvent.DISCONNECT]: () => handleDisconnect,
      [SocketServerEvent.USER_CONNECT]: handleUserConnect,
      [SocketServerEvent.USER_DISCONNECT]: handleUserDisconnect,
      [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
      [SocketServerEvent.SERVER_CONNECT]: handleServerConnect,
      [SocketServerEvent.SERVER_DISCONNECT]: handleServerDisconnect,
      [SocketServerEvent.SERVER_UPDATE]: handleServerUpdate,
      [SocketServerEvent.CHANNEL_CONNECT]: handleChannelConnect,
      [SocketServerEvent.CHANNEL_DISCONNECT]: handleChannelDisconnect,
      [SocketServerEvent.CHANNEL_UPDATE]: handleChannelUpdate,
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
  };

  const handleDisconnect = () => {
    console.log('Socket disconnected');
  };

  const handleError = (error: StandardizedError) => {
    new errorHandler(error).show();
  };

  const handleUserConnect = (user: User) => {
    console.log('User connected: ', user);
    setUser(user);
    setSelectedTabId(1);
  };

  const handleUserDisconnect = () => {
    console.log('User disconnected');
    store.dispatch(clearChannel());
    store.dispatch(clearServer());
    store.dispatch(clearUser());
    authService.logout();
  };

  const handleUserUpdate = (data: Partial<User>) => {
    console.log('User update: ', data);
    setUser({ ...user, ...data });
  };

  const handleServerConnect = (server: Server) => {
    console.log('Server connected: ', server);
    setServer(server);
    setSelectedTabId(3);
  };

  const handleServerDisconnect = () => {
    console.log('Server disconnected');
    store.dispatch(clearServer());
    setSelectedTabId(1);
  };

  const handleServerUpdate = (data: Partial<Server>) => {
    console.log('Server update: ', data);
    setServer({ ...server, ...data });
  };

  const handleChannelConnect = (channel: Channel) => {
    console.log('Channel connected: ', channel);
    store.dispatch(setChannel(channel));
  };

  const handleChannelDisconnect = () => {
    console.log('Channel disconnected');
    store.dispatch(clearChannel());
  };

  const handleChannelUpdate = (data: Partial<Channel>) => {
    console.log('Channel update: ', data);
    store.dispatch(setChannel(data));
  };

  const getMainContent = () => {
    if (!socket) return <LoadingSpinner />;
    switch (selectedTabId) {
      case 1:
        return <HomePage user={user} />;
      case 2:
        return <FriendPage user={user} />;
      case 3:
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

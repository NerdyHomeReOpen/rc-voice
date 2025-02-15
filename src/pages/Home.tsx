'use client';

import { Minus, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Types
import type { Presence, Server, User } from '@/types';

// Pages
import AuthPage from '@/pages/AuthPage';
import FriendPage from '@/pages/FriendPage';
import HomePage from '@/pages/HomePage';
import ServerPage from '@/pages/ServerPage';

// Components
import Tabs from '@/components/Tabs';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FullscreenSquare from '@/components/FullscreenSquare';

// Utils
import { measureLatency } from '@/utils/measureLatency';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Redux
import store from '@/redux/store';
import { clearServer, setServer } from '@/redux/serverSlice';
import { clearUser, setUser, updateUser } from '@/redux/userSlice';
import { clearSessionToken, setSessionToken } from '@/redux/sessionTokenSlice';

// Modals
import UserSettingModal from '@/modals/UserSettingModal';

const STATE_ICON = {
  online: '/online.png',
  dnd: '/dnd.png',
  idle: '/idle.png',
  gn: '/gn.png',
} as const;

const Home = () => {
  // Socket Control
  const socket = useSocket();

  // Sound Control
  const joinSoundRef = useRef<HTMLAudioElement | null>(null);
  const leaveSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    joinSoundRef.current = new Audio('/sounds/join.mp3');
    leaveSoundRef.current = new Audio('/sounds/leave.mp3');
  }, []);

  // Redux
  const user = useSelector((state: { user: User }) => state.user);
  const server = useSelector((state: { server: Server }) => state.server);
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );

  useEffect(() => {
    const token =
      store.getState().sessionToken ?? localStorage.getItem('sessionToken');
    if (!token) return;
    store.dispatch(setSessionToken(token));
    localStorage.setItem('sessionToken', token);
  }, [sessionId]);

  useEffect(() => {
    if (!socket || !sessionId) return;
    console.log('Connect to socket with session Id:', sessionId);
    socket.emit('connectUser', { sessionId });
  }, [sessionId]);

  useEffect(() => {
    if (!socket || !sessionId) return;
    const handleDisconnect = () => {
      console.log('Socket disconnected, ', sessionId);
      socket.emit('disconnectUser', { sessionId });
    };
    const handleForceDisconnect = () => {
      console.log('Socket force disconnected: ', sessionId);
      socket.emit('disconnectUser', { sessionId });
    };
    const handleUserConnect = (user: any) => {
      console.log('User connected: ', user);
      store.dispatch(setUser(user));
    };
    const handleUserDisconnect = () => {
      console.log('User disconnected');
      store.dispatch(clearServer());
      store.dispatch(clearUser());
      store.dispatch(clearSessionToken());
      localStorage.removeItem('sessionToken');
    };
    const handleServerConnect = (server: Server) => {
      console.log('Server connected: ', server);
      store.dispatch(setServer(server));
      socket.emit('connectChannel', { sessionId, channelId: server.lobbyId });
    };
    const handleServerDisconnect = () => {
      console.log('Server disconnected');
      store.dispatch(clearServer());
    };
    const handleChannelConnect = () => {
      console.log('Channel connected');
    };
    const handleChannelDisconnect = () => {
      console.log('Channel disconnected');
    };
    const handleUpdateUserPresence = (data: Partial<Presence>) => {
      console.log('User presence update: ', data);
      const presence = user.presence ? { ...user.presence, ...data } : null;
      store.dispatch(setUser({ ...user, presence }));
    };
    const handleServerUpdate = (data: Partial<Server>) => {
      console.log('Server update: ', data);
      store.dispatch(setServer({ ...server, ...data }));
    };
    const handleUserUpdate = (data: Partial<User>) => {
      console.log('User update: ', data);
      store.dispatch(setUser({ ...user, ...data }));
    };
    const handlePlaySound = (sound: 'join' | 'leave') => {
      switch (sound) {
        case 'join':
          console.log('Play join sound');
          joinSoundRef.current?.play();
          break;
        case 'leave':
          console.log('Play leave sound');
          leaveSoundRef.current?.play();
          break;
      }
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('forceDisconnect', handleForceDisconnect);
    socket.on('userConnect', handleUserConnect);
    socket.on('userDisconnect', handleUserDisconnect);
    socket.on('serverConnect', handleServerConnect);
    socket.on('serverDisconnect', handleServerDisconnect);
    socket.on('channelConnect', handleChannelConnect);
    socket.on('channelDisconnect', handleChannelDisconnect);
    socket.on('userPresenceUpdate', handleUpdateUserPresence);
    socket.on('serverUpdate', handleServerUpdate);
    socket.on('userUpdate', handleUserUpdate);
    socket.on('playSound', handlePlaySound);

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('forceDisconnect', handleForceDisconnect);
      socket.off('userConnect', handleUserConnect);
      socket.off('userDisconnect', handleUserDisconnect);
      socket.off('serverConnect', handleServerConnect);
      socket.off('serverDisconnect', handleServerDisconnect);
      socket.off('channelConnect', handleChannelConnect);
      socket.off('channelDisconnect', handleChannelDisconnect);
      socket.off('userPresenceUpdate', handleUpdateUserPresence);
      socket.off('serverUpdate', handleServerUpdate);
      socket.off('userUpdate', handleUserUpdate);
      socket.off('playSound', handlePlaySound);
    };
  }, [sessionId, server, user]);

  // Tab Control
  const [selectedTabId, setSelectedTabId] = useState<number>(1);

  useEffect(() => {
    if (server) setSelectedTabId(3);
    else setSelectedTabId(1);
  }, [server]);

  // Latency Control
  const [latency, setLatency] = useState<string | null>('0');

  useEffect(() => {
    const _ = setInterval(async () => {
      const res = await measureLatency();
      setLatency(res);
    }, 500);
    return () => clearInterval(_);
  }, []);

  const getMainContent = () => {
    if (!socket) return <LoadingSpinner />;
    if (!user) return <AuthPage />;
    switch (selectedTabId) {
      case 1:
        return <HomePage />;
      case 2:
        return <FriendPage />;
      case 3:
        if (!server) return;
        return <ServerPage />;
    }
  };

  const handleUpdateStatus = (status: Presence['status']) => {
    socket?.emit('updatePresence', { sessionId, presence: { status } });
  };

  const userName = user?.name ?? 'RiceCall';
  const userPresenceStatus = user?.presence?.status ?? 'online';

  // User Setting Control
  const [showUserSetting, setShowUserSetting] = useState<boolean>(false);

  const toggleUserSetting = (state?: boolean) =>
    setShowUserSetting(state ?? !showUserSetting);

  return (
    <div className="h-screen flex flex-col bg-background font-['SimSun'] overflow-hidden">
      {/* Top Navigation */}
      <div className="bg-blue-600 flex items-center justify-between text-white text-sm flex-none h-12 gap-3 min-w-max">
        {/* User State Display */}
        <div className="flex items-center space-x-2 min-w-max m-2">
          <img
            src="/rc_logo_small.png"
            alt="RiceCall"
            className="w-6 h-6 select-none"
          />
          <button
                onClick={() => toggleUserSetting()}
                className="p-1 hover:bg-gray-100 rounded"
          >
            <span className="text-xs font-bold text-black select-none">
              {userName}
            </span>
          </button>
          <div className="flex items-center">
            <img
              src={STATE_ICON[userPresenceStatus]}
              alt="User State"
              className="w-5 h-5 p-1 select-none"
            />
            <select
              value={userPresenceStatus}
              onChange={(e) => {
                handleUpdateStatus(e.target.value as Presence['status']);
              }}
              className="bg-transparent text-white text-xs appearance-none hover:bg-blue-700 p-1 rounded cursor-pointer focus:outline-none select-none"
            >
              <option value="online" className="bg-blue-600">
                線上
              </option>
              <option value="dnd" className="bg-blue-600">
                勿擾
              </option>
              <option value="idle" className="bg-blue-600">
                暫離
              </option>
              <option value="gn" className="bg-blue-600">
                離線
              </option>
            </select>
          </div>
          <div className="px-3 py-1 bg-gray-100 text-xs text-gray-600 select-none">
            {latency} ms
          </div>
        </div>
        {/* Switch page */}
        {showUserSetting && (
          <UserSettingModal onClose={() => toggleUserSetting(false)} />
        )}
        {user && (
          <Tabs
            selectedId={selectedTabId}
            onSelect={(tabId) => setSelectedTabId(tabId)}
          />
        )}
        <div className="flex items-center space-x-2 min-w-max m-2">
          <button className="hover:bg-blue-700 p-2 rounded">
            <Minus size={16} />
          </button>
          <FullscreenSquare className="hover:bg-blue-700 p-2 rounded"></FullscreenSquare>
          <button className="hover:bg-blue-700 p-2 rounded">
            <X size={16} />
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-1 min-h-0">{getMainContent()}</div>
    </div>
  );
};
Home.displayName = 'Home';

export default Home;

'use client';

import { Minus, Square, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Types
import type { Presence, Server, User } from '@/types';

// Pages
import AuthPage from '@/pages/AuthPage';
import FriendPage from '@/pages/FriendPage';
import HomePage from '@/pages/HomePage';
import ServerPage from '@/pages/ServerPage';

// Modals

// Components
import Tabs from '@/components/Tabs';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Utils
import { measureLatency } from '@/utils/measureLatency';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Redux
import store from '@/redux/store';
import { clearServer, setServer } from '@/redux/serverSlice';
import { setUser } from '@/redux/userSlice';
import { clearSessionToken } from '@/redux/sessionTokenSlice';

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
  const sessionId = useSelector(
    (state: { sessionToken: string }) => state.sessionToken,
  );
  const user = useSelector((state: { user: User }) => state.user);
  const server = useSelector((state: { server: Server }) => state.server);

  useEffect(() => {
    const token =
      store.getState().sessionToken ?? localStorage.getItem('sessionToken');
    if (!socket || !token) return;
    console.log('Connect to socket with token:', token);
    socket?.emit('connectUser', { sessionId: token });
  }, [socket, sessionId]);

  useEffect(() => {
    if (!socket || !sessionId) return;
    const handleConnectUser = (user: any) => {
      console.log('User connected: ', user);
      store.dispatch(setUser(user));
    };
    const handleDisconnectUser = () => {
      console.log('User disconnected');
      store.dispatch(clearSessionToken());
    };
    const handleConnectServer = (server: Server) => {
      console.log('Server connected: ', server);
      socket.emit('connectChannel', { sessionId, channelId: server.lobbyId });
      store.dispatch(setServer(server));
    };
    const handleDisconnectServer = () => {
      console.log('Server disconnected');
      store.dispatch(clearServer());
    };
    const handleConnectChannel = () => {
      console.log('Channel connected');
    };
    const handleDisconnectChannel = () => {
      console.log('Channel disconnected');
    };
    const handleUpdateUserPresence = (userPresence: Presence) => {
      console.log('User presence update: ', userPresence);
      store.dispatch(
        setUser({
          ...user,
          presence: userPresence,
        }),
      );
    };
    const handleServerUpdate = (server: Server) => {
      console.log('Server update: ', server);
      store.dispatch(setServer(server));
    };

    socket.on('connectUser', handleConnectUser);
    socket.on('disconnectUser', handleDisconnectUser);
    socket.on('connectServer', handleConnectServer);
    socket.on('disconnectServer', handleDisconnectServer);
    socket.on('connectChannel', handleConnectChannel);
    socket.on('disconnectChannel', handleDisconnectChannel);
    socket.on('userPresenceUpdate', handleUpdateUserPresence);
    socket.on('serverUpdate', handleServerUpdate);

    return () => {
      socket.off('connectUser', handleConnectUser);
      socket.off('disconnectUser', handleDisconnectUser);
      socket.off('connectServer', handleConnectServer);
      socket.off('disconnectServer', handleDisconnectServer);
      socket.off('connectChannel', handleConnectChannel);
      socket.off('disconnectChannel', handleDisconnectChannel);
      socket.off('userPresenceUpdate', handleUpdateUserPresence);
      socket.off('serverUpdate', handleServerUpdate);
    };
  }, [sessionId, user, server]);

  useEffect(() => {
    if (server) setSelectedTabId(3);
    else setSelectedTabId(1);
  }, [server]);

  // Tab Control
  const [selectedTabId, setSelectedTabId] = useState<number>(1);

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

  return (
    <>
      <div className="h-screen flex flex-col bg-background font-['SimSun'] overflow-hidden">
        {/* Top Navigation */}
        <div className="bg-blue-600 p-2 flex items-center justify-between text-white text-sm flex-none h-12 gap-3 min-w-max">
          {/* User State Display */}
          <div className="flex items-center space-x-2 min-w-max">
            <img
              src="/rc_logo_small.png"
              alt="RiceCall"
              className="w-6 h-6 select-none"
            />
            {user && (
              <>
                <span className="text-xs font-bold text-black select-none">
                  {user.name}
                </span>
                <div className="flex items-center">
                  <img
                    src={STATE_ICON[user.presence?.status ?? 'online']}
                    alt="User State"
                    className="w-5 h-5 p-1 select-none"
                  />
                  <select
                    value={user.presence?.status ?? 'online'}
                    onChange={(e) => {}} // change to websocket
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
              </>
            )}
            <div className="px-3 py-1 bg-gray-100 text-xs text-gray-600 select-none">
              {latency} ms
            </div>
          </div>
          {/* Switch page */}
          {user && (
            <Tabs
              selectedId={selectedTabId}
              onSelect={(tabId) => setSelectedTabId(tabId)}
            />
          )}
          <div className="flex items-center space-x-2 min-w-max">
            <button className="hover:bg-blue-700 p-2 rounded">
              <Minus size={16} />
            </button>
            <button className="hover:bg-blue-700 p-2 rounded">
              <Square size={16} />
            </button>
            <button className="hover:bg-blue-700 p-2 rounded">
              <X size={16} />
            </button>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex flex-1 min-h-0">{getMainContent()}</div>
      </div>
    </>
  );
};
Home.displayName = 'Home';

export default Home;

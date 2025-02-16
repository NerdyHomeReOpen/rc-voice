/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useRef, useState } from 'react';
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
import Header from '@/components/common/Header';

// Utils
import { measureLatency } from '@/utils/measureLatency';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Redux
import store from '@/redux/store';
import { clearServer, setServer } from '@/redux/serverSlice';
import { clearUser, setUser } from '@/redux/userSlice';
import { clearSessionToken, setSessionToken } from '@/redux/sessionTokenSlice';
import UserStatusDisplay from '@/components/UserStatusDispIay';

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
    const handleDirectMessage = (data: any) => {
      console.log('Direct message: ', data);
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
    socket.on('directMessage', handleDirectMessage);
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
      socket.off('directMessage', handleDirectMessage);
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

  // useEffect(() => {
  //   const _ = setInterval(async () => {
  //     const res = await measureLatency();
  //     setLatency(res);
  //   }, 500);
  //   return () => clearInterval(_);
  // }, []);

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
    <div className="h-screen flex flex-col bg-background font-['SimSun'] overflow-hidden">
      {/* Top Navigation */}
      <Header>
        {/* User State Display */}
        <UserStatusDisplay user={user} />
        {/* Switch page */}
        <Tabs
          selectedId={selectedTabId}
          onSelect={(tabId) => setSelectedTabId(tabId)}
          disabled={!user}
        />
      </Header>
      {/* Main Content */}
      <div className="flex flex-1 min-h-0">{getMainContent()}</div>
    </div>
  );
};
Home.displayName = 'Home';

export default Home;

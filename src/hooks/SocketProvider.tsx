/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { useSelector } from 'react-redux';

// Types
import type { Channel, Server, User } from '@/types';

// Utils
import { errorHandler } from '@/utils/errorHandler';

// Redux
import store from '@/redux/store';
import { clearServer, setServer } from '@/redux/serverSlice';
import { clearUser, setUser } from '@/redux/userSlice';
import { clearSessionToken, setSessionToken } from '@/redux/sessionTokenSlice';
import { clearChannel, setChannel } from '@/redux/channelSlice';

const WS_URL = 'ws://localhost:4500';

type SocketContextType = Socket | null;

const SocketContext = createContext<SocketContextType>(null);

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [socket, setSocket] = useState<SocketContextType>(null);

  // Redux
  const user = useSelector((state: { user: User | null }) => state.user);
  const server = useSelector(
    (state: { server: Server | null }) => state.server,
  );
  const channel = useSelector(
    (state: { channel: Channel | null }) => state.channel,
  );
  const sessionId = useSelector(
    (state: { sessionToken: string | null }) => state.sessionToken,
  );

  useEffect(() => {
    const token =
      store.getState().sessionToken ?? localStorage.getItem('sessionToken');
    if (!token) return;
    store.dispatch(setSessionToken(token));
    localStorage.setItem('sessionToken', token);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const socket: Socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      query: {
        sessionId: sessionId,
      },
    });

    setSocket(socket);

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server with session ID:', sessionId);
    });
    socket.on('error', (error) => {
      setError(error);
      errorHandler.ResponseError(error);
      console.log('Connect server error');
    });
    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!socket || !sessionId) return;
    const handleDisconnect = () => {
      console.log('Socket disconnected, ', sessionId);
      store.dispatch(clearServer());
      store.dispatch(clearUser());
      store.dispatch(clearSessionToken());
      localStorage.removeItem('sessionToken');
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
    const handleUserUpdate = (data: Partial<User>) => {
      console.log('User update: ', data);
      if (!user) return;
      store.dispatch(setUser({ ...user, ...data }));
    };
    const handleServerConnect = (server: Server) => {
      console.log('Server connected: ', server);
      store.dispatch(setServer(server));
    };
    const handleServerDisconnect = () => {
      console.log('Server disconnected');
      store.dispatch(clearServer());
    };
    const handleServerUpdate = (data: Partial<Server>) => {
      console.log('Server update: ', data);
      if (!server) return;
      store.dispatch(setServer({ ...server, ...data }));
    };
    const handleChannelConnect = (channel: Channel) => {
      store.dispatch(setChannel(channel));
      console.log('Channel connected: ', channel);
    };
    const handleChannelDisconnect = () => {
      console.log('Channel disconnected');
      store.dispatch(clearChannel());
    };
    const handleChannelUpdate = (data: Partial<Channel>) => {
      console.log('Channel update: ', data);
      if (!channel) return;
      store.dispatch(setChannel({ ...channel, ...data }));
    };
    const handleDirectMessage = (data: any) => {
      console.log('Direct message: ', data);
    };
    const handlePlaySound = (sound: 'join' | 'leave') => {
      switch (sound) {
        case 'join':
        // console.log('Play join sound');
        // joinSoundRef.current?.play();
        // break;
        case 'leave':
        // console.log('Play leave sound');
        // leaveSoundRef.current?.play();
        // break;
      }
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('userConnect', handleUserConnect);
    socket.on('userDisconnect', handleUserDisconnect);
    socket.on('userUpdate', handleUserUpdate);
    socket.on('serverConnect', handleServerConnect);
    socket.on('serverDisconnect', handleServerDisconnect);
    socket.on('serverUpdate', handleServerUpdate);
    socket.on('channelConnect', handleChannelConnect);
    socket.on('channelDisconnect', handleChannelDisconnect);
    socket.on('channelUpdate', handleChannelUpdate);
    socket.on('directMessage', handleDirectMessage);
    socket.on('playSound', handlePlaySound);

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('userConnect', handleUserConnect);
      socket.off('userDisconnect', handleUserDisconnect);
      socket.off('userUpdate', handleUserUpdate);
      socket.off('serverConnect', handleServerConnect);
      socket.off('serverDisconnect', handleServerDisconnect);
      socket.off('serverUpdate', handleServerUpdate);
      socket.off('channelConnect', handleChannelConnect);
      socket.off('channelDisconnect', handleChannelDisconnect);
      socket.off('channelUpdate', handleChannelUpdate);
      socket.off('directMessage', handleDirectMessage);
      socket.off('playSound', handlePlaySound);
    };
  }, [socket, sessionId, user, server, channel]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

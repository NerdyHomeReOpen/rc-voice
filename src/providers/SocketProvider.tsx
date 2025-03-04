/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { createContext, useContext, useEffect } from 'react';

// Types
import {
  Channel,
  Server,
  User,
  SocketServerEvent,
  SocketClientEvent,
} from '@/types';

// Utils
import { errorHandler } from '@/utils/errorHandler';

// Redux
import store from '@/redux/store';
import { clearServer, setServer } from '@/redux/serverSlice';
import { clearUser, setUser } from '@/redux/userSlice';
import { clearSessionToken } from '@/redux/sessionTokenSlice';
import { clearChannel, setChannel } from '@/redux/channelSlice';

// Services
import { ipcService } from '@/services/ipc.service';

// const WS_URL = 'ws://localhost:4500';

type SocketContextType = {
  event?: {
    send: Record<SocketClientEvent, (data: any) => void>;
    on: Record<SocketServerEvent, (callback: (data: any) => void) => void>;
  };
};

const SocketContext = createContext<SocketContextType>({});

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context.event;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

const SocketProvider = ({ children }: SocketProviderProps) => {
  const handleDisconnect = () => {
    console.log('Socket disconnected');
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
    const user_ = store.getState().user;
    if (!user_) return;
    store.dispatch(setUser({ ...user_, ...data }));
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
    const server_ = store.getState().server;
    if (!server_) return;
    store.dispatch(setServer({ ...server_, ...data }));
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
    const channel_ = store.getState().channel;
    if (!channel_) return;
    store.dispatch(setChannel({ ...channel_, ...data }));
  };

  // Initialize socket event listeners
  useEffect(() => {
    if (ipcService.getAvailability()) {
      ipcService.requestInitialData();
      ipcService.onInitialData((data) => {
        console.log('Initial data:', data);
        store.dispatch(setUser(data.user));
        store.dispatch(setServer(data.server));
        store.dispatch(setChannel(data.channel));
      });

      const eventHandlers = {
        [SocketServerEvent.CONNECT]: () => console.log('Connected to server'),
        [SocketServerEvent.ERROR]: (error: any) => console.error(error),
        [SocketServerEvent.DISCONNECT]: handleDisconnect,
        [SocketServerEvent.USER_CONNECT]: handleUserConnect,
        [SocketServerEvent.USER_DISCONNECT]: handleUserDisconnect,
        [SocketServerEvent.USER_UPDATE]: handleUserUpdate,
        [SocketServerEvent.SERVER_CONNECT]: handleServerConnect,
        [SocketServerEvent.SERVER_DISCONNECT]: handleServerDisconnect,
        [SocketServerEvent.SERVER_UPDATE]: handleServerUpdate,
        [SocketServerEvent.CHANNEL_CONNECT]: handleChannelConnect,
        [SocketServerEvent.CHANNEL_DISCONNECT]: handleChannelDisconnect,
        [SocketServerEvent.CHANNEL_UPDATE]: handleChannelUpdate,
      };

      Object.entries(eventHandlers).forEach(([event, handler]) => {
        ipcService.onSocketEvent(event as SocketServerEvent, handler);
      });

      // Cleanup
      return () => {
        Object.keys(eventHandlers).forEach((event) => {
          ipcService.removeListener(event);
        });
      };
    }
  }, []);

  const event = {
    send: Object.values(SocketClientEvent).reduce((acc, event) => {
      acc[event] = (data: any) => {
        console.log(event, data);
        ipcService.sendSocketEvent(event, data);
      };
      return acc;
    }, {} as Record<SocketClientEvent, (data: any) => void>),
    on: Object.values(SocketServerEvent).reduce((acc, event) => {
      acc[event] = (callback: (data: any) => void) => {
        console.log(event, callback);
        ipcService.onSocketEvent(event, callback);
      };
      return acc;
    }, {} as Record<SocketServerEvent, (callback: (data: any) => void) => void>),
  };

  return (
    <SocketContext.Provider value={{ event }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.displayName = 'SocketProvider';

export default SocketProvider;

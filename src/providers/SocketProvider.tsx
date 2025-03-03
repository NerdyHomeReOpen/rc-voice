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

// Providers
import { useWebRTC } from './WebRTCProvider';

// const WS_URL = 'ws://localhost:4500';

type SocketContextType = {
  // event?: Record<
  //   SocketClientEvent | SocketServerEvent,
  //   (...args: any[]) => void
  // >;
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
  // const handleSendSocket = (socket: Socket) => {
  //   console.log('socket: ', socket);
  //   if (!newCallRef.current) {
  //     newCallRef.current = new Call(socket);
  //     newCall = newCallRef.current;
  //   } else {
  //     newCall = newCallRef.current;
  //   }
  // };
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
  // const handlePlaySound = (sound: 'join' | 'leave') => {
  //   switch (sound) {
  //     case 'join':
  //     // console.log('Play join sound');
  //     // joinSoundRef.current?.play();
  //     // break;
  //     case 'leave':
  //     // console.log('Play leave sound');
  //     // leaveSoundRef.current?.play();
  //     // break;
  //   }
  // };
  // const handleVoiceStream = (data: ArrayBuffer) => {
  //   // FIXME: handle voice stream
  //   const audioBlob = new Blob([data], { type: 'audio/webm' }); // 重新組合 Blob
  //   const audioUrl = URL.createObjectURL(audioBlob);
  //   const audio = new Audio(audioUrl);
  //   audio.play();
  // };

  // Initialize socket event listeners
  // make sure it only runs once
  useEffect(() => {
    let isInitialDataReceived = false;
    if (ipcService.getAvailability()) {
      ipcService.requestInitialData();
      ipcService.onInitialData((data) => {
        isInitialDataReceived = true;
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
        // [SocketServerEvent.PLAY_SOUND]: handlePlaySound,
        // [SocketServerEvent.VOICE_STREAM]: handleVoiceStream,
        // [SocketServerEvent.SEND_SOCKET]: handleSendSocket,
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

  // const event = {
  //   // Client events

  //   [SocketClientEvent.CONNECT_USER]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.CONNECT_USER, data),
  //   [SocketClientEvent.DISCONNECT_USER]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.DISCONNECT_USER, data),
  //   [SocketClientEvent.UPDATE_USER]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.UPDATE_USER, data),
  //   [SocketClientEvent.CONNECT_SERVER]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.CONNECT_SERVER, data),
  //   [SocketClientEvent.DISCONNECT_SERVER]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.DISCONNECT_SERVER, data),
  //   [SocketClientEvent.CREATE_SERVER]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.CREATE_SERVER, data),
  //   [SocketClientEvent.UPDATE_SERVER]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.UPDATE_SERVER, data),
  //   [SocketClientEvent.DELETE_SERVER]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.DELETE_SERVER, data),
  //   [SocketClientEvent.CONNECT_CHANNEL]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.CONNECT_CHANNEL, data),
  //   [SocketClientEvent.DISCONNECT_CHANNEL]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.DISCONNECT_CHANNEL, data),
  //   [SocketClientEvent.CREATE_CHANNEL]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.CREATE_CHANNEL, data),
  //   [SocketClientEvent.UPDATE_CHANNEL]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.UPDATE_CHANNEL, data),
  //   [SocketClientEvent.DELETE_CHANNEL]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.DELETE_CHANNEL, data),
  //   [SocketClientEvent.SEND_MESSAGE]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.SEND_MESSAGE, data),
  //   [SocketClientEvent.SEND_DIRECT_MESSAGE]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.SEND_DIRECT_MESSAGE, data),
  //   [SocketClientEvent.RTC_ANSWER]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.RTC_ANSWER, data),
  //   [SocketClientEvent.RTC_OFFER]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.RTC_OFFER, data),
  //   [SocketClientEvent.RTC_ICE_CANDIDATE]: (data: any) =>
  //     ipcService.sendSocketEvent(SocketClientEvent.RTC_ICE_CANDIDATE, data),

  //   // Server events
  //   [SocketServerEvent.CONNECT]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.CONNECT, callback),
  //   [SocketServerEvent.DISCONNECT]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.DISCONNECT, callback),
  //   [SocketServerEvent.NOTIFICATION]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.NOTIFICATION, callback),
  //   [SocketServerEvent.USER_CONNECT]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.USER_CONNECT, callback),
  //   [SocketServerEvent.USER_DISCONNECT]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.USER_DISCONNECT, callback),
  //   [SocketServerEvent.USER_UPDATE]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.USER_UPDATE, callback),
  //   [SocketServerEvent.SERVER_CONNECT]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.SERVER_CONNECT, callback),
  //   [SocketServerEvent.SERVER_DISCONNECT]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.SERVER_DISCONNECT, callback),
  //   [SocketServerEvent.SERVER_UPDATE]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.SERVER_UPDATE, callback),
  //   [SocketServerEvent.CHANNEL_CONNECT]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.CHANNEL_CONNECT, callback),
  //   [SocketServerEvent.CHANNEL_DISCONNECT]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.CHANNEL_DISCONNECT, callback),
  //   [SocketServerEvent.CHANNEL_UPDATE]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.CHANNEL_UPDATE, callback),
  //   // [SocketServerEvent.PLAY_SOUND]: (callback: (data: any) => void) =>
  //   //   ipcService.onSocketEvent(SocketServerEvent.PLAY_SOUND, callback),
  //   [SocketServerEvent.ERROR]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.ERROR, callback),
  //   // [SocketServerEvent.VOICE_STREAM]: (
  //   //   callback: (voiceStream: ArrayBuffer) => void,
  //   // ) => ipcService.onSocketEvent(SocketServerEvent.VOICE_STREAM, callback),
  //   // [SocketServerEvent.SEND_SOCKET]: (callback: () => void) =>
  //   //   ipcService.onSocketEvent(SocketServerEvent.SEND_SOCKET, callback),
  //   [SocketServerEvent.RTC_ANSWER]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.RTC_ANSWER, callback),
  //   [SocketServerEvent.RTC_OFFER]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.RTC_OFFER, callback),
  //   [SocketServerEvent.RTC_ICE_CANDIDATE]: (callback: (data: any) => void) =>
  //     ipcService.onSocketEvent(SocketServerEvent.RTC_ICE_CANDIDATE, callback),
  // };

  return (
    <SocketContext.Provider value={{ event }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.displayName = 'SocketProvider';

export default SocketProvider;

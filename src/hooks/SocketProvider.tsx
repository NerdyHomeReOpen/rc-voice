/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
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

// Services
import {
  ipcService,
  SOCKET_IPC_CHANNEL,
  SocketServerEventData,
} from '@/services/ipc.service';
import { electronService } from '@/services/electron.service';

const WS_URL = 'ws://localhost:4500';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context.socket;
};

export const useSocketStatus = () => {
  const context = useContext(SocketContext);
  return {
    isConnected: context.isConnected,
    error: context.error,
  };
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [isMainWindow, setIsMainWindow] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);

  const isMainWindowRef = useRef<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const isInitializedRef = useRef<boolean>(false);

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
    const token = store.getState().sessionToken ?? null;
    if (!token) return;
    store.dispatch(setSessionToken(token));
    localStorage.setItem('sessionToken', token);
  }, [sessionId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMainWindow(window.location.pathname === '/');
    }
  }, []);

  // useEffect(() => {
  //   if (!sessionId) return;

  //   const socket: Socket = io(WS_URL, {
  //     transports: ['websocket'],
  //     reconnection: true,
  //     reconnectionAttempts: 5,
  //     reconnectionDelay: 1000,
  //     reconnectionDelayMax: 5000,
  //     timeout: 20000,
  //     query: {
  //       sessionId: sessionId,
  //     },
  //   });

  //   setSocket(socket);

  //   socket.on('connect', () => {
  //     setIsConnected(true);
  //     console.log('Connected to server with session ID:', sessionId);
  //   });
  //   socket.on('error', (error) => {
  //     setError(error);
  //     errorHandler.ResponseError(error);
  //     console.log('Connect server error');
  //   });
  //   socket.on('disconnect', () => {
  //     setIsConnected(false);
  //     console.log('Disconnected from server');
  //   });

  //   return () => {
  //     socket.disconnect();
  //   };
  // }, [sessionId]);

  // useEffect(() => {
  //   if (!socket || !sessionId) return;

  //   if (typeof window !== 'undefined') {
  //     setIsMainWindow(window.location.pathname === '/');
  //   }

  //   const handleDisconnect = () => {
  //     console.log('Socket disconnected, ', sessionId);
  //     store.dispatch(clearServer());
  //     store.dispatch(clearUser());
  //     store.dispatch(clearSessionToken());
  //     localStorage.removeItem('sessionToken');
  //   };
  //   const handleUserConnect = (user: any) => {
  //     console.log('User connected: ', user);
  //     store.dispatch(setUser(user));
  //   };
  //   const handleUserDisconnect = () => {
  //     console.log('User disconnected');
  //     store.dispatch(clearServer());
  //     store.dispatch(clearUser());
  //     store.dispatch(clearSessionToken());
  //     localStorage.removeItem('sessionToken');
  //   };
  //   const handleUserUpdate = (data: Partial<User>) => {
  //     console.log('User update: ', data);
  //     if (!user) return;
  //     store.dispatch(setUser({ ...user, ...data }));
  //   };
  //   const handleServerConnect = (server: Server) => {
  //     console.log('Server connected: ', server);
  //     store.dispatch(setServer(server));
  //   };
  //   const handleServerDisconnect = () => {
  //     console.log('Server disconnected');
  //     store.dispatch(clearServer());
  //   };
  //   const handleServerUpdate = (data: Partial<Server>) => {
  //     console.log('Server update: ', data);
  //     if (!server) return;
  //     store.dispatch(setServer({ ...server, ...data }));
  //   };
  //   const handleChannelConnect = (channel: Channel) => {
  //     store.dispatch(setChannel(channel));
  //     console.log('Channel connected: ', channel);
  //   };
  //   const handleChannelDisconnect = () => {
  //     console.log('Channel disconnected');
  //     store.dispatch(clearChannel());
  //   };
  //   const handleChannelUpdate = (data: Partial<Channel>) => {
  //     console.log('Channel update: ', data);
  //     if (!channel) return;
  //     store.dispatch(setChannel({ ...channel, ...data }));
  //   };
  //   const handleDirectMessage = (data: any) => {
  //     console.log('Direct message: ', data);
  //   };
  //   const handlePlaySound = (sound: 'join' | 'leave') => {
  //     switch (sound) {
  //       case 'join':
  //       // console.log('Play join sound');
  //       // joinSoundRef.current?.play();
  //       // break;
  //       case 'leave':
  //       // console.log('Play leave sound');
  //       // leaveSoundRef.current?.play();
  //       // break;
  //     }
  //   };

  //   socket.on('disconnect', handleDisconnect);
  //   socket.on('userConnect', handleUserConnect);
  //   socket.on('userDisconnect', handleUserDisconnect);
  //   socket.on('userUpdate', handleUserUpdate);
  //   socket.on('serverConnect', handleServerConnect);
  //   socket.on('serverDisconnect', handleServerDisconnect);
  //   socket.on('serverUpdate', handleServerUpdate);
  //   socket.on('channelConnect', handleChannelConnect);
  //   socket.on('channelDisconnect', handleChannelDisconnect);
  //   socket.on('channelUpdate', handleChannelUpdate);
  //   socket.on('directMessage', handleDirectMessage);
  //   socket.on('playSound', handlePlaySound);

  //   return () => {
  //     socket.off('disconnect', handleDisconnect);
  //     socket.off('userConnect', handleUserConnect);
  //     socket.off('userDisconnect', handleUserDisconnect);
  //     socket.off('userUpdate', handleUserUpdate);
  //     socket.off('serverConnect', handleServerConnect);
  //     socket.off('serverDisconnect', handleServerDisconnect);
  //     socket.off('serverUpdate', handleServerUpdate);
  //     socket.off('channelConnect', handleChannelConnect);
  //     socket.off('channelDisconnect', handleChannelDisconnect);
  //     socket.off('channelUpdate', handleChannelUpdate);
  //     socket.off('directMessage', handleDirectMessage);
  //     socket.off('playSound', handlePlaySound);
  //   };
  // }, [socket, sessionId, user, server, channel]);

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

    if (electronService.getAvailability()) {
      const socketEvents: SocketServerEventData['type'][] = [
        'connect',
        'disconnect',
        'userConnect',
        'userDisconnect',
        'userUpdate',
        'serverConnect',
        'serverDisconnect',
        'serverUpdate',
        'channelConnect',
        'channelDisconnect',
        'channelUpdate',
        'directMessage',
        'playSound',
      ];

      socket.on('connect_error', (error) => {
        ipcService.sendToMain(SOCKET_IPC_CHANNEL, {
          type: 'error',
          error: error.message,
        });
      });
      socket.on('error', (error) => {
        ipcService.sendToMain(SOCKET_IPC_CHANNEL, {
          type: 'error',
          error: error,
        });
      });
      socketEvents.forEach((event) => {
        socket.on(event, (data: any) => {
          ipcService.sendToMain(SOCKET_IPC_CHANNEL, {
            type: event,
            payload: data,
          });
        });
      });

      ipcService.onFromMain(
        SOCKET_IPC_CHANNEL,
        (data: SocketServerEventData) => {
          console.log('Socket event from main:', data);
          switch (data.type) {
            case 'error':
              // errorHandler.ResponseError(data.error);
              break;
            case 'disconnect':
              handleDisconnect();
              break;
            case 'userConnect':
              handleUserConnect(data.payload);
              break;
            case 'userDisconnect':
              handleUserDisconnect();
              break;
            case 'userUpdate':
              handleUserUpdate(data.payload);
              break;
            case 'serverConnect':
              handleServerConnect(data.payload);
              break;
            case 'serverDisconnect':
              handleServerDisconnect();
              break;
            case 'serverUpdate':
              handleServerUpdate(data.payload);
              break;
            case 'channelConnect':
              handleChannelConnect(data.payload);
              break;
            case 'channelDisconnect':
              handleChannelDisconnect();
              break;
            case 'channelUpdate':
              handleChannelUpdate(data.payload);
              break;
            case 'directMessage':
              handleDirectMessage(data.payload);
              break;
            case 'playSound':
              handlePlaySound(data.payload);
              break;
            default:
              break;
          }
        },
      );
      return () => {
        socketEvents.forEach((event) => () => socket.off(event));
        ipcService.removeListener(SOCKET_IPC_CHANNEL);
      };
    } else {
      socket.on('connect', () =>
        console.log('Connected to server with session ID:', sessionId),
      );
      socket.on('error', (error) => errorHandler.ResponseError(error));
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
    }
  }, [socket, sessionId, user, server, channel]);

  const initialSocket = useCallback(() => {
    if (!sessionId || socketRef.current) return;
    try {
      const socket: Socket = io(WS_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: false,
        query: {
          sessionId: sessionId,
        },
      });
      setSocket(socket);
      socketRef.current = socket;

      if (electronService.getAvailability()) {
        console.log('Connecting with electron service');
      } else {
        console.log('Connecting with web service');
      }

      socket.connect();
      return () => socket.disconnect();
    } catch (error) {
      console.error('Socket initialization error:', error);
      setError(
        `Socket initialization error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }, [sessionId, isMainWindow]);

  // const disconnect = useCallback(() => {
  //   if (socketRef.current) {
  //     socketRef.current.disconnect();
  //     socketRef.current = null;
  //     setSocket(null);
  //     setIsConnected(false);
  //   }
  // }, []);

  useEffect(() => {
    // Initialize will only run once, means only one socket connection per session ID
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      const cleanupSocket = initialSocket();
      return () => {
        isInitializedRef.current = false;
        cleanupSocket?.();
      };
    }
  }, [sessionId, isMainWindow, initialSocket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, error }}>
      {children}
    </SocketContext.Provider>
  );
};

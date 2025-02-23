/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client';

import {
  ipcService,
  SOCKET_IPC_CHANNEL,
  SocketEventData,
} from '@/services/ipc.service';
import { errorHandler } from '@/utils/errorHandler';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = 'ws://localhost:4500';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
  connect: () => {},
  disconnect: () => {},
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
    connect: context.connect,
    disconnect: context.disconnect,
  };
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isMainWindow, setIsMainWindow] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMainWindow(window.location.pathname === '/');
    }
  }, []);

  const setupSocketListeners = useCallback((newSocket: Socket) => {
    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);

      ipcService.sendToMain(SOCKET_IPC_CHANNEL, {
        type: 'error',
        error: err.message,
      });
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to server');

      ipcService.sendToMain(SOCKET_IPC_CHANNEL, {
        type: 'connect',
      });
    });

    newSocket.on('error', (err) => {
      setError(err);
      errorHandler.ResponseError(err);
      console.log('Socket error:', err);

      ipcService.sendToMain(SOCKET_IPC_CHANNEL, {
        type: 'error',
        error: err,
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');

      ipcService.sendToMain(SOCKET_IPC_CHANNEL, {
        type: 'disconnect',
      });
    });

    const socketEvents = ['serverUpdate', 'userUpdate', 'message'];
    socketEvents.forEach((eventName) => {
      newSocket.on(eventName, (data) => {
        ipcService.sendToMain(SOCKET_IPC_CHANNEL, {
          type: eventName,
          payload: data,
        });
      });
    });

    return socketEvents;
  }, []);

  const connect = useCallback(() => {
    if (!isMainWindow || socketRef.current) return;

    try {
      const newSocket: Socket = io(WS_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: false,
      });

      const socketEvents = setupSocketListeners(newSocket);
      socketRef.current = newSocket;
      setSocket(newSocket);
      newSocket.connect();

      return () => {
        socketEvents.forEach((eventName) => {
          newSocket.off(eventName);
        });
        newSocket.disconnect();
        socketRef.current = null;
      };
    } catch (err: unknown) {
      console.error('Socket initialization error:', err);
      setError(
        `Socket initialization error: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }, [isMainWindow, setupSocketListeners]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (isMainWindow && !isInitializedRef.current) {
      isInitializedRef.current = true;
      const cleanup = connect();
      return () => {
        cleanup?.();
        isInitializedRef.current = false;
      };
    } else if (!isMainWindow) {
      ipcService.onFromMain(SOCKET_IPC_CHANNEL, (data: SocketEventData) => {
        switch (data.type) {
          case 'connect':
            setIsConnected(true);
            setError(null);
            break;
          case 'disconnect':
            setIsConnected(false);
            break;
          case 'error':
            setError(data.error || null);
            break;
          default:
            break;
        }
      });

      return () => {
        ipcService.removeListener(SOCKET_IPC_CHANNEL);
      };
    }
  }, [isMainWindow, connect]);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, error, connect, disconnect }}
    >
      {children}
    </SocketContext.Provider>
  );
};

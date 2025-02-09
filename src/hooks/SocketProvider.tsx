'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { errorHandler, standardizedError } from '@/utils/errorHandler';

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

  useEffect(() => {
    const socket: Socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    setSocket(socket);

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });
    socket.on('error', (error) => {
      setError(error);
      errorHandler.ResponseError(error);
      console.log('Connect server error');
    });
    socket.on('disconnect', () => {
      setIsConnected(false);
      ('Disconnected from server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

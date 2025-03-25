/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';

// Types
import { SocketServerEvent, SocketClientEvent } from '@/types';

// Services
import ipcService from '@/services/ipc.service';

type SocketContextType = {
  send: Record<SocketClientEvent, (data: any) => () => void>;
  on: Record<SocketServerEvent, (callback: (data: any) => void) => () => void>;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context)
    throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

const SocketProvider = ({ children }: SocketProviderProps) => {
  const [on, setOn] = useState<SocketContextType['on']>(
    {} as SocketContextType['on'],
  );
  const [send, setSend] = useState<SocketContextType['send']>(
    {} as SocketContextType['send'],
  );
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    const newOn = Object.values(SocketServerEvent).reduce((acc, event) => {
      acc[event] = (callback: (data: any) => void) => {
        ipcService.removeListener(event);
        ipcService.onSocketEvent(event, callback);
        const cleanup = () => ipcService.removeListener(event);
        cleanupRef.current.push(cleanup);
        return cleanup;
      };
      return acc;
    }, {} as Record<SocketServerEvent, (callback: (data: any) => void) => () => void>);
    setOn(newOn);

    const newSend = Object.values(SocketClientEvent).reduce((acc, event) => {
      acc[event] = (data: any) => {
        ipcService.sendSocketEvent(event, data);
        return () => {};
      };
      return acc;
    }, {} as Record<SocketClientEvent, (data: any) => () => void>);
    setSend(newSend);

    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
    };
  }, []);

  return (
    <SocketContext.Provider value={{ on, send }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.displayName = 'SocketProvider';

export default SocketProvider;

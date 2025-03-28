/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

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
  if (!context || !context.on || !context.send)
    throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

const SocketProvider = ({ children }: SocketProviderProps) => {
  // States
  const [on, setOn] = useState<SocketContextType['on']>(
    Object.values(SocketServerEvent).reduce((acc, event) => {
      acc[event] = (callback: (data: any) => void) => {
        ipcService.onSocketEvent(event, callback);
        return () => ipcService.removeListener(event);
      };
      return acc;
    }, {} as SocketContextType['on']),
  );
  const [send, setSend] = useState<SocketContextType['send']>(
    Object.values(SocketClientEvent).reduce((acc, event) => {
      acc[event] = (data: any) => {
        ipcService.sendSocketEvent(event, data);
        return () => {};
      };
      return acc;
    }, {} as SocketContextType['send']),
  );

  // Refs
  const cleanupRef = useRef<(() => void)[]>(
    Object.values(SocketServerEvent).reduce((acc, event) => {
      acc.push(() => ipcService.removeListener(event));
      return acc;
    }, [] as (() => void)[]),
  );

  useEffect(() => {
    setOn(
      Object.values(SocketServerEvent).reduce((acc, event) => {
        acc[event] = (callback: (data: any) => void) => {
          ipcService.onSocketEvent(event, callback);
          return () => ipcService.removeListener(event);
        };
        return acc;
      }, {} as SocketContextType['on']),
    );

    setSend(
      Object.values(SocketClientEvent).reduce((acc, event) => {
        acc[event] = (data: any) => {
          ipcService.sendSocketEvent(event, data);
          return () => {};
        };
        return acc;
      }, {} as SocketContextType['send']),
    );

    ipcService.onSocketEvent(SocketServerEvent.DISCONNECT, () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
    });

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

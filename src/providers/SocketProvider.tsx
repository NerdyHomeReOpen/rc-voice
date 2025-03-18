/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';

// Types
import { SocketServerEvent, SocketClientEvent } from '@/types';

// Services
import { ipcService } from '@/services/ipc.service';

type SocketContextType = {
  event?: {
    send: Record<SocketClientEvent, (data: any) => () => void>;
    on: Record<
      SocketServerEvent,
      (callback: (data: any) => void) => () => void
    >;
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
  const [event, setEvent] = useState<SocketContextType['event']>();
  const cleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    const newEvent = {
      send: Object.values(SocketClientEvent).reduce((acc, event) => {
        acc[event] = (data: any) => {
          ipcService.sendSocketEvent(event, data);
          return () => {};
        };
        return acc;
      }, {} as Record<SocketClientEvent, (data: any) => () => void>),
      on: Object.values(SocketServerEvent).reduce((acc, event) => {
        acc[event] = (callback: (data: any) => void) => {
          ipcService.removeListener(event);
          ipcService.onSocketEvent(event, callback);
          const cleanup = () => ipcService.removeListener(event);
          cleanupRef.current.push(cleanup);
          return cleanup;
        };
        return acc;
      }, {} as Record<SocketServerEvent, (callback: (data: any) => void) => () => void>),
    };
    setEvent(newEvent);

    return () => {
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
    };
  }, []);

  return (
    <SocketContext.Provider value={{ event }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.displayName = 'SocketProvider';

export default SocketProvider;

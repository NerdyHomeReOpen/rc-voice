/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// Types
import { SocketServerEvent, SocketClientEvent } from '@/types';

// Services
import { ipcService } from '@/services/ipc.service';

// const WS_URL = 'ws://localhost:4500';

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
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 3;

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
          ipcService.onSocketEvent(event, callback);
          return () => ipcService.removeListener(event);
        };
        return acc;
      }, {} as Record<SocketServerEvent, (callback: (data: any) => void) => () => void>),
    };
    setEvent(newEvent);

    return () => {
      Object.keys(newEvent.on).map((event) => {
        ipcService.removeListener(event);
      });
    };
  }, []);

  // Setup handler for session errors
  useEffect(() => {
    if (!event) return;

    // // Add specific handling for session errors
    // const handleError = (error: any) => {
    //   console.error('Socket error:', error);

    //   // Check if the error is related to session expiration or invalid session
    //   if (
    //     error.part === 'CONNECTUSER' &&
    //     (error.tag === 'SESSION_EXPIRED' || error.tag === 'TOKEN_INVALID')
    //   ) {
    //     // If token is invalid, clear it and redirect to login
    //     if (error.tag === 'TOKEN_INVALID') {
    //       localStorage.removeItem('jwtToken');
    //       localStorage.removeItem('autoLogin');
    //       ipcService.auth.logout();
    //       console.log('Token invalid, redirecting to login');
    //     }
    //     // If session is not found but token might be valid (server restart case)
    //     else if (
    //       error.tag === 'SESSION_EXPIRED' &&
    //       reconnectAttempts < MAX_RECONNECT_ATTEMPTS
    //     ) {
    //       // Try to reconnect with the same token
    //       console.log(
    //         `Attempting to reconnect (${
    //           reconnectAttempts + 1
    //         }/${MAX_RECONNECT_ATTEMPTS})`,
    //       );
    //       const token = localStorage.getItem('jwtToken');

    //       if (token) {
    //         // Increment reconnect attempts
    //         setReconnectAttempts((prev) => prev + 1);

    //         // Small delay to allow server to fully process the previous connection attempt
    //         setTimeout(() => {
    //           ipcService.auth.login(token);
    //         }, 1000);
    //       }
    //     } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    //       // If we've reached max reconnect attempts, log out
    //       console.log('Maximum reconnection attempts reached, logging out');
    //       localStorage.removeItem('jwtToken');
    //       localStorage.removeItem('autoLogin');
    //       ipcService.auth.logout();
    //     }
    //   }
    // };

    // // Subscribe to error events
    // const unsubError = event.on[SocketServerEvent.ERROR](handleError);

    // Subscribe to successful connection to reset reconnect attempts
    const unsubConnect = event.on[SocketServerEvent.CONNECT](() => {
      if (reconnectAttempts > 0) {
        console.log('Reconnection successful');
        setReconnectAttempts(0);
      }
    });

    return () => {
      // unsubError();
      unsubConnect();
    };
  }, [event, reconnectAttempts]);

  return (
    <SocketContext.Provider value={{ event }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.displayName = 'SocketProvider';

export default SocketProvider;

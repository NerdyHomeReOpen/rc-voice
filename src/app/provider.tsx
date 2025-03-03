'use client';

import React from 'react';
import { Provider } from 'react-redux';

// Providers
import SocketProvider from '@/providers/SocketProvider';
import ContextMenuProvider from '@/providers/ContextMenuProvider';
import WebRTCProvider from '@/providers/WebRTCProvider';

// Redux
import store from '@/redux/store';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <Provider store={store}>
      <SocketProvider>
        <WebRTCProvider>
          <ContextMenuProvider>{children}</ContextMenuProvider>
        </WebRTCProvider>
      </SocketProvider>
    </Provider>
  );
};

Providers.displayName = 'Page';

export default Providers;

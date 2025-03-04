'use client';

import React from 'react';
import { Provider } from 'react-redux';

// Providers
import SocketProvider from '@/providers/SocketProvider';
import ContextMenuProvider from '@/providers/ContextMenuProvider';

// Redux
import store from '@/redux/store';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <Provider store={store}>
      <SocketProvider>
        <ContextMenuProvider>{children}</ContextMenuProvider>
      </SocketProvider>
    </Provider>
  );
};

Providers.displayName = 'Page';

export default Providers;

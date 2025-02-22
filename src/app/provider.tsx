'use client';

import React from 'react';
import { Provider } from 'react-redux';

// Hooks
import { SocketProvider } from '@/hooks/SocketProvider';

// Redux
import store from '@/redux/store';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <Provider store={store}>
      <SocketProvider>{children}</SocketProvider>
    </Provider>
  );
};

Providers.displayName = 'Page';

export default Providers;

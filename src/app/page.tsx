'use client';

import React from 'react';
import { Provider } from 'react-redux';

// Hooks
import { SocketProvider } from '@/hooks/SocketProvider';

// Redux
import store from '@/redux/store';

import Home from './Home';


const Page = () => {
  return (
    <Provider store={store}>
      <SocketProvider>
        <Home />
      </SocketProvider>
    </Provider>
  );
};

Page.displayName = 'Page';

export default Page;

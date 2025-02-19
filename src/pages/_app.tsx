'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { Geist, Geist_Mono } from 'next/font/google';
import { AppProps } from 'next/app';

// CSS
import '@/styles/globals.css';

// Hooks
import { SocketProvider } from '@/hooks/SocketProvider';

// Redux
import store from '@/redux/store';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <Provider store={store}>
      <SocketProvider>
        <div
          className={`${geistSans.variable} ${geistMono.variable} antialiased wrapper`}
        >
          <Component {...pageProps} />
        </div>
      </SocketProvider>
    </Provider>
  );
};

App.displayName = 'Page';

export default App;

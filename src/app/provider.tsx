'use client';

import React from 'react';

// Providers
import SocketProvider from '@/providers/Socket';
import ContextMenuProvider from '@/providers/ContextMenu';
import LanguageProvider from '@/providers/Language';
import MainTabProvider from '@/providers/MainTab';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <LanguageProvider>
      <SocketProvider>
        <MainTabProvider>
          <ContextMenuProvider>{children}</ContextMenuProvider>
        </MainTabProvider>
      </SocketProvider>
    </LanguageProvider>
  );
};

Providers.displayName = 'Page';

export default Providers;

'use client';

import React from 'react';

// Providers
import SocketProvider from '@/providers/Socket';
import ContextMenuProvider from '@/providers/ContextMenu';
import LanguageProvider from '@/providers/Language';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <LanguageProvider>
      <SocketProvider>
        <ContextMenuProvider>{children}</ContextMenuProvider>
      </SocketProvider>
    </LanguageProvider>
  );
};

Providers.displayName = 'Page';

export default Providers;

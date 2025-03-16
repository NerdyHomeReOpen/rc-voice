/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useContext, createContext, ReactNode } from 'react';

// Types
import { ContextMenuItem, Server, User } from '@/types';

// Components
import ContextMenu from '@/components/ContextMenu';
import UserInfoBlock from '@/components/UserInfoBlock';

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  showUserInfoBlock: (x: number, y: number, user: User, server: Server) => void;
  closeContextMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType>({} as any);

export const useContextMenu = () => {
  return useContext(ContextMenuContext);
};

interface ContextMenuProviderProps {
  children: ReactNode;
}

const ContextMenuProvider = ({ children }: ContextMenuProviderProps) => {
  // States
  const [isVisible, setIsVisible] = React.useState(false);
  const [content, setContent] = React.useState<ReactNode | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.context-menu')) {
        closeContextMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const showContextMenu = (x: number, y: number, items: ContextMenuItem[]) => {
    setContent(
      <ContextMenu
        x={x}
        y={y}
        items={items}
        onClose={() => closeContextMenu}
      />,
    );
    setIsVisible(true);
  };

  const showUserInfoBlock = (
    x: number,
    y: number,
    user: User,
    server: Server,
  ) => {
    setContent(<UserInfoBlock x={x} y={y} user={user} server={server} />);
    setIsVisible(true);
  };

  const closeContextMenu = () => {
    setIsVisible(false);
  };

  return (
    <ContextMenuContext.Provider
      value={{ showContextMenu, showUserInfoBlock, closeContextMenu }}
    >
      {isVisible && content}
      {children}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;

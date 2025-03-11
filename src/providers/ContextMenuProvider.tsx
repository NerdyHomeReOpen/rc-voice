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

enum ContextMenuTypes {
  GENERAL = 'general',
  USER_INFO_BLOCK = 'user-info-block',
}

interface ContextMenuProviderProps {
  children: ReactNode;
}

const ContextMenuProvider = ({ children }: ContextMenuProviderProps) => {
  const [x, setX] = React.useState(0);
  const [y, setY] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const [type, setType] = React.useState<ContextMenuTypes | null>(null);
  // GENERAL
  const [items, setItems] = React.useState<ContextMenuItem[]>([]);
  // USER_INFO_BLOCK
  const [user, setUser] = React.useState<User | null>(null);
  const [server, setServer] = React.useState<Server | null>(null);

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
    setX(x);
    setY(y);
    setIsVisible(true);
    setItems(items);
    setType(ContextMenuTypes.GENERAL);
  };

  const showUserInfoBlock = (
    x: number,
    y: number,
    user: User,
    server: Server,
  ) => {
    setX(x);
    setY(y);
    setIsVisible(true);
    setUser(user);
    setServer(server);
    setType(ContextMenuTypes.USER_INFO_BLOCK);
  };

  const closeContextMenu = () => {
    setIsVisible(false);
  };

  const getContextMenuItem = (type: ContextMenuTypes) => {
    switch (type) {
      case ContextMenuTypes.GENERAL:
        return (
          <ContextMenu x={x} y={y} items={items} onClose={closeContextMenu} />
        );
      case ContextMenuTypes.USER_INFO_BLOCK:
        return (
          <UserInfoBlock
            x={x}
            y={y}
            user={user}
            server={server}
            onClose={closeContextMenu}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ContextMenuContext.Provider
      value={{ showContextMenu, showUserInfoBlock, closeContextMenu }}
    >
      {isVisible && getContextMenuItem(type as ContextMenuTypes)}
      {children}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useContext, createContext, ReactNode } from 'react';

// Types
import { ContextMenuItem } from '@/types';

// Components
import ContextMenu from '@/components/ContextMenu';

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  closeContextMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType>({
  showContextMenu: () => {},
  closeContextMenu: () => {},
});

export const useContextMenu = () => {
  return useContext(ContextMenuContext);
};

interface ContextMenuProviderProps {
  children: ReactNode;
}

const ContextMenuProvider = ({ children }: ContextMenuProviderProps) => {
  const [x, setX] = React.useState(0);
  const [y, setY] = React.useState(0);
  const [items, setItems] = React.useState<ContextMenuItem[]>([]);
  const [isVisible, setIsVisible] = React.useState(false);

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
    setItems(items);
    setIsVisible(true);
  };

  const closeContextMenu = () => {
    setIsVisible(false);
  };

  return (
    <ContextMenuContext.Provider value={{ showContextMenu, closeContextMenu }}>
      {isVisible && (
        <ContextMenu x={x} y={y} onClose={closeContextMenu} items={items} />
      )}
      {children}
    </ContextMenuContext.Provider>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;

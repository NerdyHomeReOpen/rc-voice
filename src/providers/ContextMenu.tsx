import React, { useEffect, useContext, createContext, ReactNode } from 'react';

// Types
import { ContextMenuItem, ServerMember } from '@/types';

// Components
import ContextMenu from '@/components/ContextMenu';
import UserInfoCard from '@/components/UserInfoCard';

interface ContextMenuContextType {
  showContextMenu: (
    x: number,
    y: number,
    items: ContextMenuItem[],
    className?: string,
  ) => void;
  showUserInfoBlock: (x: number, y: number, member: ServerMember) => void;
  closeContextMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export const useContextMenu = (): ContextMenuContextType => {
  const context = useContext(ContextMenuContext);
  if (!context)
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  return context;
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
      if ((e.target as HTMLElement).closest('.context-menu')) return;
      if (isVisible) closeContextMenu();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key != 'Escape') return;
      if (isVisible) closeContextMenu();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleClick);
    };
  }, [isVisible]);

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

  const showUserInfoBlock = (x: number, y: number, member: ServerMember) => {
    setContent(<UserInfoCard x={x} y={y} member={member} />);
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

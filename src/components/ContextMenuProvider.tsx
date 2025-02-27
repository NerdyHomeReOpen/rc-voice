/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from 'react';

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, items: MenuItem[]) => void;
  closeContextMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType>({
  showContextMenu: () => {},
  closeContextMenu: () => {},
});

export const useContextMenu = () => {
  return useContext(ContextMenuContext);
};

interface MenuItem {
  id?: string;
  label: string;
  show?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: ReactNode;
  className?: string;
}

interface ContextMenuProviderProps {
  children: ReactNode;
}

const ContextMenuProvider = ({ children }: ContextMenuProviderProps) => {
  const [x, setX] = React.useState(0);
  const [y, setY] = React.useState(0);
  const [items, setItems] = React.useState<MenuItem[]>([]);
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

  const showContextMenu = (x: number, y: number, items: MenuItem[]) => {
    setX(x);
    setY(y);
    setItems(items);
    setIsVisible(true);
  };

  const closeContextMenu = () => {
    setIsVisible(false);
  };

  return (
    <>
      {isVisible && (
        <div
          className="fixed bg-white shadow-lg rounded border z-50"
          style={{ top: y, left: x }}
        >
          {items
            .filter((item) => item.show)
            .map((item, index) => (
              <button
                key={item.id || index}
                onClick={() => {
                  item.onClick();
                  closeContextMenu();
                }}
                disabled={item.disabled ?? false}
                className={`flex w-full px-4 py-2 text-left hover:bg-gray-100 ${
                  item.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
        </div>
      )}
      <ContextMenuContext.Provider
        value={{ showContextMenu, closeContextMenu }}
      >
        {children}
      </ContextMenuContext.Provider>
    </>
  );
};

ContextMenuProvider.displayName = 'ContextMenuProvider';

export default ContextMenuProvider;

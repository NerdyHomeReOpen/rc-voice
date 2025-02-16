/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect } from 'react';

// Types
import { ContextMenuItem } from '@/types';

interface ContextMenuProps {
  items: ContextMenuItem[] | null;
  x?: number;
  y?: number;
  onClose?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = React.memo(
  ({ onClose, x, y, items }) => {
    if (!items) return null;

    // Ref
    const ref = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (!ref.current?.contains(e.target as Node)) onClose?.();
      };

      window.addEventListener('click', handleClick);
      // window.addEventListener('contextmenu', handleClick);
      return () => {
        window.removeEventListener('click', handleClick);
        // window.addEventListener('contextmenu', handleClick);
      };
    }, [onClose]);

    return (
      <div
        className="fixed bg-white shadow-lg rounded border z-50"
        style={{ top: y, left: x }}
        ref={ref}
      >
        {items.map((item, index) => (
          <button
            key={index}
            className={`flex w-full px-4 py-2 text-left hover:bg-gray-100 ${
              item.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            onClick={item.onClick}
            disabled={item.disabled ?? false}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    );
  },
);

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;

import React from 'react';

// Types
import { ContextMenuItem } from '@/types';

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  return (
    <div
      className="fixed bg-white shadow-lg rounded border z-50"
      style={{ top: y, left: x }}
    >
      {items.map((item, index) => (
        <button
          key={item.id || index}
          onClick={() => {
            item.onClick();
            onClose();
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
  );
};

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;

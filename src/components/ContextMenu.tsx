/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, ReactNode, useContext, createContext } from 'react';

// interface ContextMenuContextType {
//   showContextMenu: (x: number, y: number, items: MenuItem[]) => void;
//   closeContextMenu: () => void;
// }

// const ContextMenuContext = createContext<ContextMenuContextType>({
//   showContextMenu: () => {},
//   closeContextMenu: () => {},
// });

// export const useContextMenu = () => {
//   return useContext(ContextMenuContext);
// };

// interface MenuItem {
//   id?: string;
//   label: string;
//   disabled?: boolean;
//   onClick: () => void;
//   icon?: ReactNode;
//   className?: string;
// }

// interface ContextMenuProps {
//   x: number;
//   y: number;
//   onClose: () => void;
//   items: MenuItem[];
// }

const ContextMenu = () => {
  // useEffect(() => {
  //   const handleClick = (e: MouseEvent) => {
  //     if (!(e.target as HTMLElement).closest('.context-menu')) {
  //       onClose();
  //     }
  //   };
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key === 'Escape') {
  //       onClose();
  //     }
  //   };
  //   document.addEventListener('click', handleClick);
  //   document.addEventListener('keydown', handleKeyDown);
  //   return () => {
  //     document.removeEventListener('click', handleClick);
  //     document.removeEventListener('keydown', handleKeyDown);
  //   };
  // }, [onClose]);
  // return (
  //   <div
  //     className="fixed bg-white shadow-lg rounded border z-50"
  //     style={{ top: y, left: x }}
  //   >
  //     {items.map((item, index) => (
  //       <button
  //         key={item.id || index}
  //         onClick={() => {
  //           item.onClick();
  //           onClose();
  //         }}
  //         disabled={item.disabled ?? false}
  //         className={`flex w-full px-4 py-2 text-left hover:bg-gray-100 ${
  //           item.disabled ? 'bg-gray-100 cursor-not-allowed' : ''
  //         }`}
  //       >
  //         {item.icon}
  //         {item.label}
  //       </button>
  //     ))}
  //   </div>
  // );
};

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;

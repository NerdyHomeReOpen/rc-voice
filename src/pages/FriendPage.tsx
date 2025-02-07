// import React, { useState, useEffect, useCallback } from 'react';

// // Components
// import FriendListViewer from '@/components/FriendListViewer';

// // Types
// import { User } from '../types';

// // Redux
// import { useSelector } from 'react-redux';

// const FriendPage = () => {
//   // Redux
//   const user = useSelector((state: { user: User }) => state.user);

//   // Sidebar Control
//   const [sidebarWidth, setSidebarWidth] = useState<number>(256);
//   const [isResizing, setIsResizing] = useState<boolean>(false);

//   const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
//     mouseDownEvent.preventDefault();
//     setIsResizing(true);
//   }, []);
//   const stopResizing = useCallback(() => {
//     setIsResizing(false);
//   }, []);
//   const resize = useCallback(
//     (mouseMoveEvent: MouseEvent) => {
//       if (isResizing) {
//         const maxWidth = window.innerWidth * 0.3;
//         const newWidth = Math.max(
//           220,
//           Math.min(mouseMoveEvent.clientX, maxWidth),
//         );
//         setSidebarWidth(newWidth);
//       }
//     },
//     [isResizing],
//   );

//   useEffect(() => {
//     window.addEventListener('mousemove', resize);
//     window.addEventListener('mouseup', stopResizing);
//     return () => {
//       window.removeEventListener('mousemove', resize);
//       window.removeEventListener('mouseup', stopResizing);
//     };
//   }, [resize, stopResizing]);

//   const userLevel = Math.min(56, Math.ceil(user.level / 5)); // 56 is max level

//   return (
//     <div className="flex flex-1 flex-col">
//       <header className="bg-white shadow-sm border-b">
//         <div className="flex items-center justify-between space-x-16 p-2 pr-[40%]">
//           {/* User Profile */}
//           <div className="flex items-center space-x-2">
//             <img
//               className="w-14 h-14 bg-gray-200"
//               src={user.avatar ?? '/pfp/default.png'}
//               alt={user.avatar ?? '/pfp/default.png'}
//             />
//             <div>
//               <div className="flex items-center space-x-1">
//                 <img src="/im/LV.png" alt="LV" />
//                 <img
//                   src={`/usergrade_${userLevel}.png`}
//                   alt={`/usergrade_${userLevel}`}
//                   className="select-none"
//                 />
//               </div>
//               <div className="flex items-center space-x-1">
//                 <span className="text-lg font-bold">{user.name}</span>
//               </div>
//             </div>
//           </div>
//           {/* User Status */}
//           <div className="flex-1 text-center">點擊更改簽名</div>
//         </div>
//       </header>
//       <main className="flex flex-1 min-h-0">
//         {/* Left Sidebar */}
//         <div
//           className="flex flex-col min-h-0 min-w-0 w-64 bg-white border-r text-sm"
//           style={{ width: `${sidebarWidth}px` }}
//         >
//           {/* Friend List */}
//           <FriendListViewer />
//         </div>
//         {/* Resize Handle */}
//         <div
//           className="w-0.5 cursor-col-resize bg-gray-200 transition-colors"
//           onMouseDown={startResizing}
//         />
//         {/* Main Content Area */}
//         <div className="flex-1 flex flex-col">
//           <div className="flex-1 p-4 flex justify-center items-start"></div>
//           <div className="p-2 text-center">
//             <button className="text-blue-500 hover:underline">
//               查看更多 ›
//             </button>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// FriendPage.displayName = 'FriendPage';

// export default FriendPage;

import React, { useState, useEffect, useCallback } from 'react';
import { Theme, Box, Flex, Text, Button } from '@radix-ui/themes'; // Import Radix UI components

// Components
import FriendListViewer from '@/components/FriendListViewer';

// Types
import { User } from '../types';

// Redux
import { useSelector } from 'react-redux';

const FriendPage = () => {
  // Redux
  const user = useSelector((state: { user: User }) => state.user);

  // Sidebar Control
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const maxWidth = window.innerWidth * 0.3;
        const newWidth = Math.max(
          220,
          Math.min(mouseMoveEvent.clientX, maxWidth),
        );
        setSidebarWidth(newWidth);
      }
    },
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const userLevel = Math.min(56, Math.ceil(user.level / 5)); // 56 is max level

  return (
    <Flex direction="column" className="flex-1">
      {/* Header */}
      <Flex className="bg-white shadow-sm border-b">
        <Flex align="center" justify="between" className="p-2 pr-[40%]">
          {/* User Profile */}
          <Flex align="center" gap="2">
            <img
              className="w-14 h-14 bg-gray-200"
              src={user.avatar ?? '/pfp/default.png'}
              alt={user.avatar ?? '/pfp/default.png'}
            />
            <Box>
              <Flex align="center" gap="1">
                <img src="/im/LV.png" alt="LV" />
                <img
                  src={`/usergrade_${userLevel}.png`}
                  alt={`/usergrade_${userLevel}`}
                  className="select-none"
                />
              </Flex>
              <Flex align="center" gap="1">
                <Text size="5" weight="bold">
                  {user.name}
                </Text>
              </Flex>
            </Box>
          </Flex>
          {/* User Status */}
          <Flex className="flex-1">
            <Text className="text-center">點擊更改簽名</Text>
          </Flex>
        </Flex>
      </Flex>

      {/* Main Content */}
      <Flex minHeight="0" className="flex-1">
        {/* Left Sidebar */}
        <Flex
          direction="column"
          minHeight="0"
          minWidth="0"
          className="bg-white border-r text-sm"
          style={{ width: `${sidebarWidth}px` }}
        >
          <FriendListViewer />
        </Flex>

        {/* Resize Handle */}
        <Flex
          width="0.5px"
          className="cursor-col-resize bg-gray-200 transition-colors"
          onMouseDown={startResizing}
        />

        {/* Main Content Area */}
        <Flex direction="column" className="flex-1">
          <Flex p="4" justify="center" align="start" className="flex-1"></Flex>
          <Flex p="2">
            <Button variant="ghost" color="blue">
              查看更多 ›
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

FriendPage.displayName = 'FriendPage';

export default FriendPage;

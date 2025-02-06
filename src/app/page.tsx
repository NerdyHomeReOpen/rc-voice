'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Minus, Square, X } from 'lucide-react';

// Types
import type { Channel, Message, Server, User, UserList } from '@/types';

// Pages
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import FriendPage from '@/pages/FriendPage';
import ServerPage from '@/pages/ServerPage';

import CreateServerModal from '@/modals/CreateServerModal';
import ServerSettingModalProps from '@/modals/ServerSettingModal';
import UserSettingModal from '@/modals/UserSettingModal';

// Components
import Tabs from '@/components/Tabs';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Utils
import { measureLatency } from '@/utils/measureLatency';
import { handleError } from '@/utils/errorHandler';

// hooks
import useWebSocket from '@/hooks/useWebSocket';

const STATE_ICON = {
  online: '/online.png',
  dnd: '/dnd.png',
  idle: '/idle.png',
  gn: '/gn.png',
} as const;

export default function Home() {
  const { socket, isConnected, error } = useWebSocket();

  // Authenticate Control
  const [serverId, setServerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const urlParm = new URLSearchParams(window.location.search);
    const serverId = urlParm.get('serverId');
    const userId = localStorage.getItem('userId') ?? '';
    setUserId(userId);
    setServerId(serverId ?? '');
  }, []);

  // Socket Control
  useEffect(() => {
    if (!socket || !userId) return;

    const handleUserData = (user: User) => {
      console.log('Recieve user data: ', user);
      setUser(user);
    };
    const handleError = (error: Error) => {
      //TODO: Backend need to handle each type of error, not just depend on the message string
      if (error.message.includes('Failed to get user')) {
        localStorage.removeItem('userId');
        setUserId(null);
      }
      alert(`錯誤: ${error.message}`);
    };

    socket.emit('connectUser', { userId });
    socket.on('user', handleUserData);
    socket.on('error', handleError);

    return () => {
      socket.off('user', handleUserData);
      socket.off('error', handleError);
    };
  }, [socket, userId]);

  useEffect(() => {
    if (!socket || !serverId) return;

    const handleServerData = (server: Server) => {
      console.log('Recieve server data: ', server);
      setServer(server);
    };
    const handleMessagesData = (messages: Message[]) => {
      console.log('Recieve messages data: ', messages);
      setMessages(messages);
    };
    const handleChannelsData = (channels: Channel[]) => {
      console.log('Recieve channels data: ', channels);
      setChannels(channels);
    };
    const handleUsersData = (users: UserList) => {
      console.log('Recieve users data: ', users);
      setUsers(users);
    };

    socket.emit('connectServer', { userId, serverId });
    socket.on('server', handleServerData);
    socket.on('messages', handleMessagesData);
    socket.on('channels', handleChannelsData);
    socket.on('users', handleUsersData);

    return () => {
      socket.off('server', handleServerData);
      socket.off('messages', handleMessagesData);
      socket.off('channels', handleChannelsData);
      socket.off('users', handleUsersData);
    };
  }, [socket, serverId]);

  const handleSendMessage = useCallback(
    (serverId: string, channelId: string, message: Message): void => {
      try {
        socket?.emit('chatMessage', { serverId, channelId, message });
      } catch (error) {
        const appError = handleError(error);
        console.error('發送消息失敗:', appError.message);
      }
    },
    [socket],
  );
  const handleAddChannel = useCallback(
    (serverId: string, channel: Channel): void => {
      try {
        socket?.emit('addChannel', { serverId, channel });
      } catch (error) {
        const appError = handleError(error);
        console.error('新增頻道失敗:', appError.message);
      }
    },
    [socket],
  );
  const handleEditChannel = useCallback(
    (serverId: string, channelId: string, channel: Partial<Channel>): void => {
      try {
        socket?.emit('editChannel', { serverId, channelId, channel });
      } catch (error) {
        const appError = handleError(error);
        console.error('編輯頻道/類別失敗:', appError.message);
      }
    },
    [socket],
  );
  const handleDeleteChannel = useCallback(
    (serverId: string, channelId: string): void => {
      try {
        socket?.emit('deleteChannel', { serverId, channelId });
      } catch (error) {
        const appError = handleError(error);
        console.error('刪除頻道/類別失敗:', appError.message);
      }
    },
    [socket],
  );
  const handleJoinChannel = useCallback(
    (serverId: string, userId: string, channelId: string): void => {
      try {
        socket?.emit('joinChannel', {
          serverId,
          userId,
          channelId,
        });
      } catch (error) {
        console.error('加入頻道失敗:', error);
      }
    },
    [socket],
  );
  const handleCreateServer = useCallback(
    (server: Server): void => {
      try {
        socket?.emit('createServer', server);
      } catch (error) {
        console.error('創建伺服器失敗:', error);
      }
    },
    [socket],
  );

  const handleLoginSuccess = (user: User): void => {
    localStorage.setItem('userId', user.id);
    setUserId(user.id);
  };
  const handleLogout = (): void => {
    localStorage.removeItem('userId');
    setUserId(null);
    window.location.reload();
  };
  const handleSelectServer = (serverId: string): void => {
    setServerId(serverId);
    //add the user last joined timestamp to generate the last joined server -> do this at backend
    setSelectedTabId(3);
    //server || handleLeaveServer();
  };
  const handleLeaveServer = (): void => {
    setSelectedTabId(1);
    setServerId(null);
    window.location.reload();
  };

  // Tab Control
  const [selectedTabId, setSelectedTabId] = useState<number>(1);

  // Page Control
  const [showCreateServer, setShowCreateServer] = useState<boolean>(false);
  const [showUserSetting, setShowUserSetting] = useState<boolean>(false);
  const [showServerSetting, setShowServerSetting] = useState<boolean>(false);

  // User Data (Request from API)
  const [user, setUser] = useState<User | null>(null);
  // Server Data (Request from API)
  const [server, setServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserList>({});

  // Latency Control
  const [latency, setLatency] = useState<string | null>('0');

  useEffect(() => {
    const _ = setInterval(async () => {
      const res = await measureLatency('http://localhost:4500/');
      setLatency(res);
    }, 10000);
    return () => clearInterval(_);
  }, []);

  const getMainContent = () => {
    if (!isConnected) {
      return <LoadingSpinner />;
    }

    if (!user) return <LoginPage onLoginSuccess={handleLoginSuccess} />;

    switch (selectedTabId) {
      case 1:
        return (
          <HomePage
            onSelectServer={handleSelectServer}
            onOpenCreateServer={() => setShowCreateServer(true)}
          />
        );
      case 2:
        return <FriendPage user={user} />;
      case 3:
        if (!server) return;
        return (
          <ServerPage
            user={user}
            server={server}
            channels={channels}
            messages={messages}
            users={users}
            onAddChannel={handleAddChannel}
            onDeleteChannel={handleDeleteChannel}
            onEditChannel={handleEditChannel}
            onJoinChannel={handleJoinChannel}
            onSendMessage={handleSendMessage}
            onOpenUserSetting={() => setShowUserSetting(true)}
            onOpenServerSetting={() => setShowServerSetting(true)}
          />
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background font-['SimSun'] overflow-hidden">
      {/* Can we move all the page to here ?? -> I tried*/}
      {showCreateServer && (
        <CreateServerModal onClose={() => setShowCreateServer(false)} />
      )}
      {showUserSetting && user && (
        <UserSettingModal
          onClose={() => setShowUserSetting(false)}
          onLogout={handleLogout}
          user={users[user.id]}
        />
      )}
      {showServerSetting && server && (
        <ServerSettingModalProps
          onClose={() => setShowServerSetting(false)}
          server={server}
          users={users}
        />
      )}
      {/* Top Navigation */}
      <div className="bg-blue-600 p-2 flex items-center justify-between text-white text-sm flex-none h-12 gap-3 min-w-max">
        {/* User State Display */}
        <div className="flex items-center space-x-2 min-w-max">
          <img
            src="/rc_logo_small.png"
            alt="RiceCall"
            className="w-6 h-6 select-none"
          />
          {user && (
            <>
              <span className="text-xs font-bold text-black select-none">
                {user.name}
              </span>
              <div className="flex items-center">
                <img
                  src={STATE_ICON[user.state] || STATE_ICON['online']}
                  alt="User State"
                  className="w-5 h-5 p-1 select-none"
                />
                <select
                  value={user.state}
                  onChange={(e) => {}} // change to websocket
                  className="bg-transparent text-white text-xs appearance-none hover:bg-blue-700 p-1 rounded cursor-pointer focus:outline-none select-none"
                >
                  <option value="online" className="bg-blue-600">
                    線上
                  </option>
                  <option value="dnd" className="bg-blue-600">
                    勿擾
                  </option>
                  <option value="idle" className="bg-blue-600">
                    暫離
                  </option>
                  <option value="gn" className="bg-blue-600">
                    離線
                  </option>
                </select>
              </div>
            </>
          )}
          <div className="px-3 py-1 bg-gray-100 text-xs text-gray-600">
            {latency} ms
          </div>
        </div>
        {/* Switch page */}
        {user && (
          <Tabs
            server={server}
            selectedId={selectedTabId}
            onSelect={(tabId) => setSelectedTabId(tabId)}
            closeLeaveServer={handleLeaveServer}
          />
        )}
        <div className="flex items-center space-x-2 min-w-max">
          <button className="hover:bg-blue-700 p-2 rounded">
            <Minus size={16} />
          </button>
          <button className="hover:bg-blue-700 p-2 rounded">
            <Square size={16} />
          </button>
          <button className="hover:bg-blue-700 p-2 rounded">
            <X size={16} />
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-1 min-h-0">{getMainContent()}</div>
    </div>
  );
}

Home.displayName = 'Home';

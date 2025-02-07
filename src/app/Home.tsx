'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useSelector } from 'react-redux';

// Types
import type {
  Channel,
  Message,
  Server,
  User,
  UserList,
  ServerList,
} from '@/types';

// Pages
import AuthPage from '@/pages/AuthPage';
import HomePage from '@/pages/HomePage';
import FriendPage from '@/pages/FriendPage';
import ServerPage from '@/pages/ServerPage';

// Modals
import CreateServerModal from '@/modals/CreateServerModal';
import ServerSettingModalProps from '@/modals/ServerSettingModal';
import UserSettingModal from '@/modals/UserSettingModal';

// Components
import Tabs from '@/components/Tabs';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Utils
import { measureLatency } from '@/utils/measureLatency';
import { standardizedError } from '@/utils/errorHandler';

// Hooks
import { useSocket } from '@/hooks/SocketProvider';

// Redux
import store from '@/redux/store';
import { setChannels } from '@/redux/channelsSlice';
import { setFriendList } from '@/redux/friendListSlice';
import { setMessages } from '@/redux/messagesSlice';
import { setServer } from '@/redux/serverSlice';
import { setServerList } from '@/redux/serverListSlice';
import { setUser } from '@/redux/userSlice';
import { setServerUserList } from '@/redux/serverUserListSlice';

const STATE_ICON = {
  online: '/online.png',
  dnd: '/dnd.png',
  idle: '/idle.png',
  gn: '/gn.png',
} as const;

const Home = () => {
  // Sound Control
  const joinSoundRef = useRef<HTMLAudioElement | null>(null);
  const leaveSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    joinSoundRef.current = new Audio('/sounds/join.mp3');
    leaveSoundRef.current = new Audio('/sounds/leave.mp3');
  }, []);

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
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !userId) return;

    const handleUserData = (user: User) => {
      console.log('Recieve user data: ', user);
      store.dispatch(setUser(user));
    };
    const handleFriendData = (friendList: UserList) => {
      console.log('Recieve friend list data: ', friendList);
      store.dispatch(setFriendList(friendList));
    };
    const handleServerListData = (serverList: ServerList) => {
      console.log('Recieve serverlist data: ', serverList);
      store.dispatch(setServerList(serverList));
    };

    socket.emit('connectUser', { userId });
    socket.on('user', handleUserData);
    socket.on('friendList', handleFriendData);
    socket.on('serverList', handleServerListData);

    // Has issue with the return function
    // return () => {
    //   socket.off('user', handleUserData);
    //   socket.off('error', handleError);
    // };
  }, [socket, userId]);

  useEffect(() => {
    if (!socket || !serverId) return;

    const handleServerData = (server: Server) => {
      console.log('Recieve server data: ', server);
      store.dispatch(setServer(server));
    };
    const handleMessagesData = (messages: Message[]) => {
      console.log('Recieve messages data: ', messages);
      store.dispatch(setMessages(messages));
    };
    const handleChannelsData = (channels: Channel[]) => {
      console.log('Recieve channels data: ', channels);
      store.dispatch(setChannels(channels));
    };
    const handleUsersData = (userList: UserList) => {
      console.log('Recieve server userlist data: ', userList);
      store.dispatch(setServerUserList(userList));
    };
    const handlePlayJoinSound = () => {
      joinSoundRef.current?.play();
    };
    const handlePlayLeaveSound = () => {
      leaveSoundRef.current?.play();
    };

    socket.emit('connectServer', { userId, serverId });
    socket.on('server', handleServerData);
    socket.on('messages', handleMessagesData);
    socket.on('channels', handleChannelsData);
    socket.on('users', handleUsersData);
    socket.on('channel_join', handlePlayJoinSound);
    socket.on('channel_leave', handlePlayLeaveSound);

    // Has issue with the return function
    // return () => {
    //   socket.off('server', handleServerData);
    //   socket.off('messages', handleMessagesData);
    //   socket.off('channels', handleChannelsData);
    //   socket.off('users', handleUsersData);
    // };
  }, [socket, serverId]);

  // Redux Control
  const user = useSelector((state: { user: User }) => state.user);
  const server = useSelector((state: { server: Server }) => state.server);

  const handleError = (_error: unknown) => {
    const error = standardizedError(_error);
    alert(`錯誤: ${error.message}`);
    //TODO: Backend need to handle each type of error, not just depend on the message string //Done
    if (error.part === 'CONNECTUSER') {
      localStorage.removeItem('userId');
      setUserId(null);
      return;
    }
    if (error.part === 'CONNECTSERVER') {
      if (error.tag === 'SERVER_ERROR' && error.status_code === 404) {
        setServerId(null);
        setSelectedTabId(1);
        return;
      }
    }
  };

  const handleSendMessage = useCallback(
    (serverId: string, channelId: string, message: Message): void => {
      try {
        socket?.emit('chatMessage', { serverId, channelId, message });
        socket?.on('error', handleError);
      } catch (error) {
        const appError = standardizedError(error);
        console.error('發送消息失敗:', appError.message);
      }
    },
    [socket],
  );
  const handleAddChannel = useCallback(
    (serverId: string, channel: Channel): void => {
      try {
        socket?.emit('addChannel', { serverId, channel });
        socket?.on('error', handleError);
      } catch (error) {
        const appError = standardizedError(error);
        console.error('新增頻道失敗:', appError.message);
      }
    },
    [socket],
  );
  const handleEditChannel = useCallback(
    (serverId: string, channelId: string, channel: Partial<Channel>): void => {
      try {
        socket?.emit('editChannel', { serverId, channelId, channel });
        socket?.on('error', handleError);
      } catch (error) {
        const appError = standardizedError(error);
        console.error('編輯頻道/類別失敗:', appError.message);
      }
    },
    [socket],
  );
  const handleDeleteChannel = useCallback(
    (serverId: string, channelId: string): void => {
      try {
        socket?.emit('deleteChannel', { serverId, channelId });
        socket?.on('error', handleError);
      } catch (error) {
        const appError = standardizedError(error);
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
        socket?.on('error', handleError);
      } catch (error) {
        const appError = standardizedError(error);
        console.error('加入頻道失敗:', appError.message);
      }
    },
    [socket],
  );
  const handleLeaveServer = useCallback(
    (serverId: string, userId: string) => {
      try {
        socket?.emit('disconnectServer', { userId, serverId });
        socket?.on('error', handleError);
        // setServerId(null);
      } catch (error) {
        const appError = standardizedError(error);
        console.error('離開伺服器失敗:', appError.message);
      }
    },
    [socket],
  );
  // const handleEditServer = useCallback(() => {}, []);

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
    // Add the user last joined timestamp to generate the last joined server -> do this at backend
  };
  const handleServerCreated = (serverId: string) => {
    setServerId(serverId);
    setShowCreateServer(false);
  };

  // const handleCreateServer = async () => {
  //   if (!validateForm() || isSubmitting) return;
  //   try {
  //     setIsSubmitting(true);
  //     const newServer = await serverService
  //       .createServer({
  //         name: formData.name,
  //         description: formData.description,
  //         avatar: formData.avatar,
  //       })
  //       .finally(() => {
  //         onClose();
  //       });

  //     onServerCreated(newServer.id);
  //   } catch (error) {
  //     console.error('Failed to create server:', error);
  //     alert('創建群組失敗：' + (error as Error).message);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  // Tab Control
  const [selectedTabId, setSelectedTabId] = useState<number>(1);

  // Page Control
  const [showCreateServer, setShowCreateServer] = useState<boolean>(false);
  const [showUserSetting, setShowUserSetting] = useState<boolean>(false);
  const [showServerSetting, setShowServerSetting] = useState<boolean>(false);

  // Latency Control
  const [latency, setLatency] = useState<string | null>('0');

  useEffect(() => {
    const _ = setInterval(async () => {
      const res = await measureLatency();
      setLatency(res);
    }, 5000);
    return () => clearInterval(_);
  }, []);

  const getMainContent = () => {
    if (!socket) return <LoadingSpinner />;

    if (!user) return <AuthPage onLoginSuccess={handleLoginSuccess} />;

    switch (selectedTabId) {
      case 1:
        return (
          <HomePage
            onSelectServer={handleSelectServer}
            onOpenCreateServer={() => setShowCreateServer(true)}
          />
        );
      case 2:
        return <FriendPage />;
      case 3:
        if (!server) return;
        return (
          <ServerPage
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
    <>
      {/* Can we move all the page to here ?? -> I tried -> No need to */}
      {showCreateServer && (
        <CreateServerModal
          onClose={() => setShowCreateServer(false)}
          onServerCreated={handleServerCreated}
        />
      )}
      {showUserSetting && user && (
        <UserSettingModal
          onClose={() => setShowUserSetting(false)}
          onLogout={handleLogout}
        />
      )}
      {showServerSetting && server && (
        <ServerSettingModalProps onClose={() => setShowServerSetting(false)} />
      )}
      <div className="h-screen flex flex-col bg-background font-['SimSun'] overflow-hidden">
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
              selectedId={selectedTabId}
              onSelect={(tabId) => setSelectedTabId(tabId)}
              onLeaveServer={handleLeaveServer}
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
    </>
  );
};
Home.displayName = 'Home';

export default Home;

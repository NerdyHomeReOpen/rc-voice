import { Minus, Square, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Types
import type { Channel, Message, Server, User, UserList } from "@/types";

// Pages
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import ServerPage from "./ServerPage";

// Components
import { handleError } from "@/utils/errorHandler";
import Tabs from "./Tabs";
import LoadingSpinner from "./common/LoadingSpinner";

const STATE_ICON = {
  online: "/online.png",
  dnd: "/dnd.png",
  idle: "/idle.png",
  gn: "/gn.png",
} as const;

interface AuthWrapperProps {
  socket: any;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ socket }) => {
  // Authenticate Control
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [serverId, setServerId] = useState<string>();
  const [userId, setUserId] = useState<string>();

  useEffect(() => {
    const urlParm = new URLSearchParams(window.location.search);
    const serverId = urlParm.get("serverId");
    const userId = localStorage.getItem("userId") ?? "";
    setUserId(userId);
    setIsAuthenticated(!!userId);
    setIsLoading(false);
    setServerId(serverId ?? "");
  }, []);

  // Tab Control
  const [selectedTabId, setSelectedTabId] = useState<number>(1);

  // Socket Control
  const [connectionStatus, setConnectionStatus] = useState("正在連結...");

  useEffect(() => {
    if (!socket || !userId) return;

    const handleUserData = (user: User) => {
      console.log("Recieve user data: ", user);
      setUser(user);
    };

    const handleError = (error: Error) => {
      alert(`錯誤: ${error.message}`);
    };

    socket.emit("connectUser", { userId });
    socket.on("user", handleUserData);
    socket.on("error", handleError);

    return () => {
      socket.off("user", handleUserData);
      socket.off("error", handleError);
    };
  }, [socket, userId]);

  useEffect(() => {
    if (!socket || !serverId) return;

    const handleServerData = (server: Server) => {
      console.log("Recieve server data: ", server);
      setServer(server);
      setConnectionStatus("已連結");
    };

    const handleMessagesData = (messages: Message[]) => {
      console.log("Recieve messages data: ", messages);
      setMessages(messages);
    };

    const handleChannelsData = (channels: Channel[]) => {
      console.log("Recieve channels data: ", channels);
      setChannels(channels);
    };

    const handleUsersData = (users: UserList) => {
      console.log("Recieve users data: ", users);
      setUsers(users);
    };

    socket.emit("connectServer", { userId, serverId });
    socket.on("server", handleServerData);
    socket.on("messages", handleMessagesData);
    socket.on("channels", handleChannelsData);
    socket.on("users", handleUsersData);

    return () => {
      socket.off("server", handleServerData);
      socket.off("messages", handleMessagesData);
      socket.off("channels", handleChannelsData);
      socket.off("users", handleUsersData);
    };
  }, [socket, serverId]);

  const handleSendMessage = useCallback(
    (serverId: string, channelId: string, message: Message): void => {
      try {
        socket?.emit("chatMessage", { serverId, channelId, message });
      } catch (error) {
        const appError = handleError(error);
        console.error("發送消息失敗:", appError.message);
      }
    },
    [socket]
  );

  const handleAddChannel = useCallback(
    (serverId: string, channel: Channel): void => {
      try {
        socket?.emit("addChannel", { serverId, channel });
      } catch (error) {
        const appError = handleError(error);
        console.error("新增頻道失敗:", appError.message);
      }
    },
    [socket]
  );

  const handleEditChannel = useCallback(
    (serverId: string, channelId: string, channel: Partial<Channel>): void => {
      try {
        socket?.emit("editChannel", { serverId, channelId, channel });
      } catch (error) {
        const appError = handleError(error);
        console.error("編輯頻道/類別失敗:", appError.message);
      }
    },
    [socket]
  );

  const handleDeleteChannel = useCallback(
    (serverId: string, channelId: string): void => {
      try {
        socket?.emit("deleteChannel", { serverId, channelId });
      } catch (error) {
        const appError = handleError(error);
        console.error("刪除頻道/類別失敗:", appError.message);
      }
    },
    [socket]
  );

  const handleJoinChannel = (serverId: string, userId: string, channelId: string): void => {
    try {
      socket?.emit("joinChannel", {
        serverId,
        userId,
        channelId,
      });
    } catch (error) {
      console.error("加入頻道失敗:", error);
    }
  };

  const handleLoginSuccess = (user: User): void => {
    localStorage.setItem("userId", user.id);
    setUserId(userId);
    setIsAuthenticated(true);
  };

  const handleLogout = (): void => {
    localStorage.removeItem("userId");
    setUserId("");
    setIsAuthenticated(false);
  };

  const handleSelectCard = (tabId: number): void => {
    setSelectedTabId(tabId);
  };

  const handleSelectServer = (serverId: string): void => {
    setServerId(serverId);
    setSelectedTabId(3);
  };

  // Data (Request from API)
  const [user, setUser] = useState<User | null>(null);
  const [server, setServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserList>({});

  const getMainContent = () => {
    if (isLoading || !user) {
      return <LoadingSpinner />;
    }

    if (!isAuthenticated) return <LoginPage onLoginSuccess={handleLoginSuccess} />;

    switch (selectedTabId) {
      case 1:
        return <HomePage onSelect={handleSelectServer} />;
      case 2:
        return <div>Under develop heehee</div>;
      case 3:
        if (!server) return;
        return <ServerPage user={user} server={server} channels={channels} messages={messages} users={users} onAddChannel={handleAddChannel} onDeleteChannel={handleDeleteChannel} onEditChannel={handleEditChannel} onJoinChannel={handleJoinChannel} onSendMessage={handleSendMessage} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background font-['SimSun']">
      {/* Top Navigation */}
      <div className="bg-blue-600 p-2 flex items-center justify-between text-white text-sm flex-none h-12">
        {/* User State Display */}
        <div className="flex items-center space-x-2">
          <img src="/rc_logo_small.png" alt="RiceCall" className="w-6 h-6 select-none" />
          {user && (
            <>
              <span className="text-xs font-bold text-black select-none">{user.name}</span>
              <div className="flex items-center">
                <img src={STATE_ICON[user.state] || STATE_ICON["online"]} alt="User State" className="w-5 h-5 p-1 select-none" />
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
          {/* {connectionStatus && (
            <div className="px-3 py-1 bg-gray-100 text-xs text-gray-600">
              {connectionStatus}
            </div>
          )} */}
        </div>
        {/* Switch page */}
        {isAuthenticated && <Tabs server={server} selectedId={selectedTabId} onSelect={handleSelectCard} />}
        <div className="flex space-x-2">
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
};

export default AuthWrapper;

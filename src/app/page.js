"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Volume2,
  Mic,
  Settings,
  X,
  Minus,
  Square,
  ArrowBigDown,
} from "lucide-react";
// Components
import useWebSocket from "@/hooks/useWebSocket";
import MarkdownViewer from "@/components/MarkdownViewer";
import MessageViewer from "@/components/MessageViewer";
import ChannelViewer from "@/components/ChannelViewer";
import SettingPage from "@/components/SettingPage";

const RCVoiceApp = () => {
  // Setting Control
  const [isSettingOpen, setIsSettingOpen] = useState(false);

  // Mic Control
  const [isMicOn, setIsMicOn] = useState(false);

  // Group Control
  const [groupId, setGroupId] = useState(1);

  useEffect(() => {
    // http://localhost:3000/?groupId=1
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get("groupId");
    if (groupId) {
      setGroupId(groupId);
    }
  }, []);

  useEffect(() => {
    // Fetch group data
    // fetch(`/api/groups/${groupId}`).then((res) => res.json()).then((data) => {
    //   console.log(data);
    // });
  }, [groupId]);

  // User State Control
  const [userState, setUserState] = useState("online");
  const stateIcons = {
    online: "/user_state_online.png",
    dnd: "/user_state_dnd.png",
    idle: "/user_state_idle.png",
    gn: "/user_state_gn.png",
  };

  // Current channel tracking
  const [currentChannelId, setCurrentChannelId] = useState(null);

  // Message input state
  const [messageInput, setMessageInput] = useState("");

  // WebSocket integration
  const { ws, isConnected, error } = useWebSocket(1); // userId

  // Sidebar Control
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const startResizing = useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);
  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);
  const resize = useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        const newWidth = Math.max(220, Math.min(mouseMoveEvent.clientX, 400));
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  // WebSocket message handler
  useEffect(() => {
    if (!ws) return;

    // ws.onmessage = (event) => {
    //   const message = JSON.parse(event.data);

    //   switch (message.type) {
    //     case "chat":
    //       setMessages((prev) => [...prev, message.data]);
    //       break;

    //     case "voice_state":
    //       // Update voice states of users in the channel
    //       const { userId, isSpeaking } = message.data;
    //       setChannels((prev) =>
    //         prev.map((channel) => ({
    //           ...channel,
    //           users: channel.users?.map((user) =>
    //             user.id === userId ? { ...user, isSpeaking } : user
    //           ),
    //         }))
    //       );
    //       break;

    //     case "user_status":
    //       // Update user status in the channel
    //       const { userId: statusUserId, status } = message.data;
    //       setUsers((prev) =>
    //         prev.map((user) =>
    //           user.id === statusUserId ? { ...user, status } : user
    //         )
    //       );
    //       break;

    //     case "channel_join":
    //     case "channel_leave":
    //       // Refresh channel users
    //       fetchChannelUsers(message.data.channelId);
    //       break;
    //   }
    // };
  }, [ws]);

  // Send chat message
  // const sendChatMessage = useCallback(() => {
  //   if (!messageInput.trim()) return;

  //   sendMessage("chat", {
  //     content: messageInput,
  //     channelId: currentChannelId,
  //     timestamp: Date.now(),
  //   });

  //   setMessageInput("");
  // }, [messageInput, currentChannelId, sendMessage]);

  // // Update voice state
  // useEffect(() => {
  //   if (isConnected && currentChannelId) {
  //     sendMessage("voice_state", {
  //       isSpeaking: isMicOn,
  //       channelId: currentChannelId,
  //     });
  //   }
  // }, [isMicOn, currentChannelId, isConnected, sendMessage]);

  // // Update user status
  // useEffect(() => {
  //   if (isConnected) {
  //     sendMessage("user_status", {
  //       status: userState,
  //     });
  //   }
  // }, [userState, isConnected, sendMessage]);

  // // Channel join handler
  // const handleChannelJoin = useCallback(
  //   (channelId) => {
  //     if (currentChannelId !== channelId) {
  //       sendMessage("channel_leave", {
  //         channelId: currentChannelId,
  //       });

  //       setCurrentChannelId(channelId);

  //       sendMessage("channel_join", {
  //         channelId,
  //       });
  //     }
  //   },
  //   [currentChannelId, sendMessage]
  // );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Data (Requires API)
  const [channels, setChannels] = useState([
    {
      id: 1,
      name: "大廳",
      permission: "public",
      isLobby: true,
      users: [
        {
          id: 1,
          name: "秋天的幻滅",
          gender: "Male",
          permission: 6,
        },
      ],
    },
    {
      id: 10,
      name: "▐▐▐▐▐▐▐▐▐聊天區▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐▐",
      permission: "public",
      channels: [
        {
          id: 2,
          name: "▐▐▐▐▐▐▐▐▐c 8▐",
          permission: "private",
          isLobby: false,
          users: [
            {
              id: 3,
              name: "阿帕契",
              gender: "Female",
              permission: 4,
            },
            {
              id: 3,
              name: "阿帕契",
              gender: "Female",
              permission: 4,
            },
            {
              id: 3,
              name: "阿帕契",
              gender: "Female",
              permission: 4,
            },
            {
              id: 3,
              name: "阿帕契",
              gender: "Female",
              permission: 4,
            },
          ],
        },
        {
          id: 3,
          name: "遊戲頻道 2",
          permission: "readonly",
          isLobby: false,
          users: [],
        },
      ],
    },
    {
      id: 20,
      name: "聊天頻道",
      permission: "public",
      channels: [
        {
          id: 4,
          name: "聊天頻道 1",
          permission: "public",
          isLobby: false,
          users: [],
        },
        {
          id: 5,
          name: "聊天頻道 2",
          permission: "private",
          isLobby: false,
          users: [],
        },
      ],
    },
    {
      id: 29,
      name: "▐▐▐▐壓乃拉▐",
      permission: "private",
      lobby: false,
      users: [],
    },
  ]);
  const [messages, setMessages] = useState([
    {
      messageId: 2,
      user: {
        id: 1,
        name: "秋天的幻滅",
        gender: "Male",
        permission: 6,
      },
      content: "這是一則訊息",
      timestamp: 1738321123000,
    },
    {
      messageId: 3,
      user: {
        id: 1,
        name: "秋天的幻滅",
        gender: "Male",
        permission: 6,
      },
      content: "這是一則訊息",
      timestamp: 1738234723000,
    },
    {
      messageId: 3,
      user: {
        id: 1,
        name: "秋天的幻滅",
        gender: "Male",
        permission: 6,
      },
      content: "這是一則訊息",
      timestamp: 1738234723000,
    },
    {
      messageId: 3,
      user: {
        id: 1,
        name: "秋天的幻滅",
        gender: "Male",
        permission: 6,
      },
      content: "這是一則訊息",
      timestamp: 1738234723000,
    },
    {
      messageId: 3,
      user: {
        id: 1,
        name: "秋天的幻滅",
        gender: "Male",
        permission: 6,
      },
      content: "這是一則訊息",
      timestamp: 1738234723000,
    },
    {
      messageId: 22,
      user: {
        id: 66,
        name: "書呆子",
        gender: "Female",
        permission: 1,
      },
      content: "???神金",
      timestamp: 1738321123000,
    },
    {
      messageId: 23,
      user: {
        id: 3,
        name: "阿帕契",
        gender: "Female",
        permission: 4,
      },
      content: "OAO",
      timestamp: 1738321143000,
    },
    {
      messageId: 24,
      user: {
        id: 3,
        name: "阿帕契",
        gender: "Female",
        permission: 4,
      },
      content: "OAO",
      timestamp: 1738324595000,
    },
    {
      messageId: 25,
      user: {
        id: 3,
        name: "阿帕契",
        gender: "Female",
        permission: 4,
      },
      content: "OAO",
      timestamp: 1738321143000,
    },
    {
      messageId: 26,
      user: {
        id: 3,
        name: "阿帕契",
        gender: "Female",
        permission: 4,
      },
      content: "OAO",
      timestamp: 1738321143000,
    },
    {
      messageId: 27,
      user: {
        id: 3,
        name: "阿帕契",
        gender: "Female",
        permission: 4,
      },
      content: "OAO",
      timestamp: 1738321143000,
    },
    {
      messageId: 28,
      user: {
        id: 3,
        name: "阿帕契",
        gender: "Female",
        permission: 4,
      },
      content: "OAO",
      timestamp: 1738321143000,
    },
    {
      messageId: 29,
      user: {
        id: 3,
        name: "阿帕契",
        gender: "Female",
        permission: 4,
      },
      content: "OAO",
      timestamp: 1738321143000,
    },
    {
      messageId: 30,
      user: {
        id: 3,
        name: "阿帕契",
        gender: "Female",
        permission: 4,
      },
      content: "OAO",
      timestamp: 1738321143000,
    },
    {
      messageId: 31,
      user: {
        id: 3,
        name: "阿帕契",
        gender: "Female",
        permission: 4,
      },
      content: "OAO",
      timestamp: 1738321143000,
    },
    {
      messageId: 1,
      user: {
        id: 1,
        name: "秋天的幻滅",
        gender: "Male",
        permission: 6,
      },
      content: `# 這是標題\n**這是粗體**\n*這是斜體*\n- 這是列表 1\n- 這是列表 2\n\`\`\`js\nconsole.log("這是程式碼區塊");\n\`\`\`\n[這是一個連結](https://example.com)`,
      timestamp: 1722854100000,
    },
  ]);
  const [users, setUsers] = useState([]);
  const [announcement, setAnnouncement] = useState(`
  # 這是標題
  **這是粗體**
  *這是斜體*
  - 這是列表 1
  - 這是列表 2
  \`\`\`js
  console.log("這是程式碼區塊");
  \`\`\`
  [這是一個連結](https://example.com)
  `);

  return (
    <div className="h-screen flex flex-col bg-background font-['SimSun']">
      {isSettingOpen && (
        <SettingPage
          visible={isSettingOpen}
          onClose={() => setIsSettingOpen(false)}
        />
      )}
      {/* Top Navigation */}
      <div className="bg-blue-600 p-2 flex items-center justify-between text-white text-sm flex-none">
        <div className="flex items-center space-x-2">
          <img
            src="/rc_logo_small.png"
            alt="RiceCall"
            className="w-6 h-6 select-none"
          />
          <span className="text-xs font-bold text-black shadow-lg select-none">
            秋天的幻滅
          </span>
          <div className="flex items-center">
            <img
              src={stateIcons[userState]}
              alt="User State"
              className="w-3.5 h-3.5 select-none"
            />
            <select
              value={userState}
              onChange={(e) => setUserState(e.target.value)}
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
        </div>
        <div className="flex space-x-2">
          <button className="hover:bg-blue-700 p-1 rounded">
            <Minus size={16} />
          </button>
          <button className="hover:bg-blue-700 p-1 rounded">
            <Square size={16} />
          </button>
          <button className="hover:bg-blue-700 p-1 rounded">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <div
          className="w-64 bg-white border-r text-sm"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="p-2">
            {/* Left side: Profile image and info */}
            <div className="flex items-center justify-between p-2 border-b mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src="https://preview.redd.it/the-context-behind-the-2015-jsal-pfp-also-the-images-are-in-v0-huyzsah41x8c1.jpg?width=640&crop=smart&auto=webp&s=bffb81c9d6a4a40896acd6e1b72bb82c0a73b03c"
                  alt="User Profile"
                  className="w-14 h-14 shadow border-2 border-[#A2A2A2] select-none"
                />
                <div>
                  <div className="text-gray-700">543隨你聊</div>
                  <div className="flex flex-row items-center gap-1">
                    <img
                      src="/channel/ID.png"
                      alt="User Profile"
                      className="w-3.5 h-3.5 select-none"
                    />
                    <div className="text-xs text-gray-500">27054971</div>
                    <img
                      src="/channel/member.png"
                      alt="User Profile"
                      className="w-3.5 h-3.5 select-none"
                    />
                    <div className="text-xs text-gray-500 select-none">
                      {users.length}
                    </div>
                    {/* Right side: Settings button */}
                    <button
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={() => setIsSettingOpen(true)}
                    >
                      <Settings size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Current channel */}
            <div className="flex flex-row p-1 items-center gap-1">
              <img
                src="/channel/NetworkStatus_5.png"
                alt="User Profile"
                className="w-6 h-6 select-none"
              />
              <div className="text-gray-500">{"{Current Channel}"}</div>
            </div>
            <div className="p-1 flex items-center justify-between text-gray-400 text-xs select-none">
              所有頻道
            </div>
            {/* Channel List */}
            <ChannelViewer channels={channels} />
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="w-0.5 cursor-col-resize bg-gray-200 transition-colors"
          onMouseDown={startResizing}
        />

        {/* Right Content */}
        <div className="flex flex-1 flex-col min-h-0">
          {/* Announcement Area */}
          <div className="flex flex-[2] overflow-y-auto border-b bg-gray-50 p-3 mb-1">
            <MarkdownViewer markdownText={announcement} />
          </div>
          {/* Messages Area */}
          <div className="flex flex-[5] flex-col overflow-y-auto p-3">
            <MessageViewer messages={messages} />
          </div>
          {/* Input Area */}
          <div className="flex flex-[1] p-3">
            <div className="flex flex-1 flex-row justify-flex-start p-1 border rounded-lg">
              <button className="w-7 h-7 p-1 hover:bg-gray-100 rounded transition-colors">
                <img src="/channel/FaceButton_5_18x18.png" alt="Emoji" />
              </button>
              <textarea
                className="w-full p-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows="2"
                placeholder="輸入訊息..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
              />
            </div>
          </div>
          {/* Bottom Controls */}
          <div className="flex-none bg-background border-t text-sm border-foreground/10 bg-linear-to-b from-violet-500 to-fuchsia-500">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1 p-5">
                <span>自由發言</span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <ArrowBigDown size={16} className="text-foreground" />
                </button>
              </div>
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`outline outline-2 outline-gray-300 rounded flex items-center justify-between p-2 hover:bg-foreground/10 transition-colors w-32`}
              >
                <img
                  src={
                    isMicOn
                      ? "/channel/icon_speaking_vol_5_24x30.png"
                      : "/channel/icon_mic_state_1_24x30.png"
                  }
                  alt="Mic"
                />
                <span
                  className={`text-lg font-bold ${
                    isMicOn ? "text-[#B9CEB7]" : "text-[#6CB0DF]"
                  }`}
                >
                  {isMicOn ? "已拿麥" : "拿麥發言"}
                </span>
              </button>
              <div className="flex items-center space-x-2 p-5">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Volume2 size={16} className="text-foreground " />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Mic size={16} className="text-foreground" />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Settings size={16} className="text-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RCVoiceApp;

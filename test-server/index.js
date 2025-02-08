const http = require('http');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { Server } = require('socket.io');
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const _ = require('lodash');
const fs = require('fs').promises;

// Logger
class Logger {
  constructor(origin) {
    this.origin = origin;
  }
  info(message) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.cyan(
        `[${this.origin}]`,
      )} ${message}`,
    );
  }
  command(message) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.hex('#F3CCF3')(
        `[${this.origin}]`,
      )} ${message}`,
    );
  }
  success(message) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.green(
        `[${this.origin}]`,
      )} ${message}`,
    );
  }
  warn(message) {
    console.warn(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.yellow(
        `[${this.origin}]`,
      )} ${message}`,
    );
  }
  error(message) {
    console.error(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.red(
        `[${this.origin}]`,
      )} ${message}`,
    );
  }
}

const port = 4500;
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };

// Message Types
const MessageTypes = {
  CHAT: 'chat',
  VOICE_STATE: 'voice_state',
  USER_STATUS: 'user_status',
  CHANNEL_JOIN: 'channel_join',
  CHANNEL_LEAVE: 'channel_leave',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  FETCH: 'fetch',
};

// User Sessions
const userSessions = new Map();

// File Upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/serverAvatars/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 限制
  },
});

// Send Error/Success Response
const sendError = (res, statusCode, message) => {
  res.writeHead(statusCode, CONTENT_TYPE_JSON);
  res.end(JSON.stringify({ error: message }));
};

const sendSuccess = (res, data) => {
  res.writeHead(200, CONTENT_TYPE_JSON);
  res.end(JSON.stringify(data));
};

// HTTP Server with CORS
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, PATCH');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, ngrok-skip-browser-warning, userId',
  );

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/servers') {
    req.on('end', async () => {
      const userId = req.headers['userid'];
      if (!userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少用戶 ID' }));
        return;
      }

      const data = JSON.parse(body);
      if (!data.name || !userId) {
        sendError(res, 400, '缺少必要欄位');
        return;
      }

      // 獲取資料庫
      const serverList = (await db.get('serverList')) || {};
      const serverMembers = (await db.get('serverMembers')) || {};
      const userList = (await db.get('userList')) || {};

      // 檢查用戶是否存在
      const user = userList[userId];
      if (!user) {
        sendError(res, 404, '用戶不存在');
        return;
      }

      // 檢查用戶創建的伺服器數量
      const userServers = Object.values(serverMembers).filter(
        (member) => member.userId === userId && member.permission === 6,
      );
      if (userServers.length >= 3) {
        sendError(res, 400, '已達到最大創建伺服器數量限制');
        return;
      }

      // 創建新伺服器
      const serverId = uuidv4();
      const lobbyId = uuidv4();
      const membershipId = uuidv4();

      // 創建伺服器
      serverList[serverId] = {
        id: serverId,
        name: data.name,
        announcement: data.description || '',
        icon: req.file
          ? `/uploads/serverAvatars/${req.file.filename}`
          : '/logo_server_def.png',
        lobbyId: lobbyId,
        level: 0,
        createdAt: Date.now(),
        ownerId: userId,
        settings: {
          allowDirectMessage: true,
          defaultChannelId: lobbyId,
        },
      };

      // 創建伺服器成員關係
      serverMembers[membershipId] = {
        id: membershipId,
        serverId: serverId,
        userId: userId,
        nickname: user.name,
        color: '#FF5733',
        permission: 6, // 創建擁有者
        managedChannels: [lobbyId],
        contribution: 0,
        joinedAt: Date.now(),
      };

      // 創建大廳頻道
      channelList[lobbyId] = {
        id: lobbyId,
        serverId: serverId,
        name: '大廳',
        type: 'text',
        permission: 'public',
        allowedUsers: [],
        isLobby: true,
        parentId: null,
        settings: {
          slowMode: false,
          topic: '歡迎來到大廳',
        },
      };

      await db.set('serverList', serverList);
      await db.set('serverMembers', serverMembers);
      await db.set('channelList', channelList);

      sendSuccess(res, {
        message: '伺服器創建成功',
        server: serverList[serverId],
      });
    });
  }

  if (req.method === 'PATCH' && req.url === '/userData') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // Get database
        const usersList = (await db.get(`usersList`)) || {};

        // Validate data
        if (!data.name || !data.gender) {
          sendError(res, 400, 'Missing required fields');
          return;
        }
        const exists = Object.values(usersList).find(
          (user) => user.id === data.id,
        );
        if (!exists) {
          sendError(res, 401, '找不到此帳號');
          return;
        }

        usersList[data.id] = {
          ...usersList[data.id],
          name: data.name,
          gender: data.gender,
        };

        // Save to database
        await db.set(`usersList`, usersList);

        new Logger('User').success(`User data updated: ${data.id}`);

        // Return success with user info (excluding password)
        const { password, ...userInfo } = user;
        sendSuccess(res, {
          message: 'Update successful',
          user: userInfo,
        });
      } catch (error) {
        new Logger('User').error(`Update error: ${error.message}`);
        sendError(res, 500, '更新失敗');
      }
    });
    return;
  }

  if (req.method == 'POST' && req.url == '/login') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // 驗證資料
        if (!data.account || !data.password) {
          sendError(res, 400, 'Missing credentials');
          return;
        }

        // 獲取資料庫
        const userList = (await db.get('userList')) || {};
        const serverMembers = (await db.get('serverMembers')) || {};
        const friendships = (await db.get('friendships')) || {};

        // 檢查帳號
        const user = Object.values(userList).find(
          (user) => user.account === data.account,
        );
        if (!user) {
          sendError(res, 401, '找不到此帳號');
          return;
        }
        if (user.password !== data.password) {
          sendError(res, 401, '密碼錯誤');
          return;
        }

        // 獲取用戶的伺服器成員資格
        const userMemberships = Object.values(serverMembers).filter(
          (member) => member.userId === user.id,
        );

        // 獲取好友關係
        const userFriendships = Object.values(friendships).filter(
          (fs) => fs.userId1 === user.id || fs.userId2 === user.id,
        );

        // 建立用戶狀態
        const presenceId = `presence_${user.id}`;
        const userPresence = {
          id: presenceId,
          userId: user.id,
          currentServerId: null,
          currentChannelId: null,
          status: 'online',
          customStatus: '',
          lastActiveAt: Date.now(),
          updatedAt: Date.now(),
        };

        await db.set(`userPresence.${presenceId}`, userPresence);

        // 回傳成功
        const { password, ...userInfo } = user;
        sendSuccess(res, {
          message: 'Login successful',
          user: {
            ...userInfo,
            memberships: userMemberships,
            friendships: userFriendships,
            presence: userPresence,
          },
        });
      } catch (error) {
        sendError(res, 500, 'Login failed');
      }
    });
  }

  if (req.method == 'POST' && req.url == '/register') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // 驗證資料
        if (!data.account || !data.password || !data.username) {
          sendError(res, 400, 'Missing required fields');
          return;
        }

        // 獲取資料庫
        const userList = (await db.get('userList')) || {};

        // 檢查帳號是否已存在
        const exists = Object.values(userList).find(
          (user) => user.account === data.account,
        );
        console.log(exists);
        if (exists) {
          sendError(res, 409, '此帳號已被註冊');
          return;
        }

        // 創建新用戶
        const userId = uuidv4();
        const user = {
          id: userId,
          name: data.username,
          account: data.account,
          password: data.password,
          gender: data.gender || 'unknown',
          level: 0,
          state: 'online',
          signature: '',
          createdAt: Date.now(),
          settings: {
            theme: 'light',
            notifications: true,
          },
        };

        // 創建用戶狀態
        const presenceId = `presence_${userId}`;
        const userPresence = {
          id: presenceId,
          userId: userId,
          currentServerId: null,
          currentChannelId: null,
          status: 'online',
          customStatus: '',
          lastActiveAt: Date.now(),
          updatedAt: Date.now(),
        };

        // 儲存到資料庫
        userList[userId] = user;
        await db.set('userList', userList);
        await db.set(`userPresence.${presenceId}`, userPresence);

        // 回傳成功
        const { password, ...userInfo } = user;
        sendSuccess(res, {
          message: 'Registration successful',
          user: {
            ...userInfo,
            memberships: [],
            friendships: [],
            presence: userPresence,
          },
        });
      } catch (error) {
        sendError(res, 500, 'Registration failed');
      }
    });
  }
});

const getRecommendedServers = async (userId, limit = 10) => {
  if (!userId) return {};

  const serverList = (await db.get('serverList')) || {};
  const serverMembers = (await db.get('serverMembers')) || {};

  // 找出用戶已加入的伺服器ID
  const userJoinedServerIds = Object.values(serverMembers)
    .filter((member) => member.userId === userId)
    .map((member) => member.serverId);

  // 過濾出未加入的伺服器
  const notJoinedServers = Object.values(serverList).filter(
    (server) => !userJoinedServerIds.includes(server.id),
  );

  // 隨機取樣
  const sampledServers = _.sampleSize(notJoinedServers, limit);

  return sampledServers.reduce((acc, server) => {
    acc[server.id] = server;
    return acc;
  }, {});
};

const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
  },
});
io.on('connection', async (socket) => {
  socket.on('disconnect', () => {});

  socket.on('connectUser', async (data) => {
    try {
      // 獲取資料庫
      const userList = (await db.get('userList')) || {};
      const serverList = (await db.get('serverList')) || {};
      const serverMembers = (await db.get('serverMembers')) || {};
      const friendships = (await db.get('friendships')) || {};
      const userPresence = (await db.get('userPresence')) || {};

      // 驗證用戶
      const user = userList[data.userId];
      if (!user) {
        socket.emit('error', {
          message: `User not found`,
          part: 'CONNECTUSER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }

      // 獲取用戶的伺服器成員資格
      const userMemberships = Object.values(serverMembers).filter(
        (member) => member.userId === user.id,
      );

      // 獲取已加入的伺服器
      const joinedServers = userMemberships.reduce((acc, member) => {
        const server = serverList[member.serverId];
        if (server) {
          acc[server.id] = {
            ...server,
            membership: member,
          };
        }
        return acc;
      }, {});

      // 獲取推薦的伺服器
      const recommendedServers = await getRecommendedServers(user.id);

      // 獲取用戶的好友分類和好友資料
      const userFriendships = Object.values(friendships)
        .filter((category) => category.userId === user.id)
        .map((category) => {
          // 獲取該分類中所有好友的詳細資料
          const friends = category.friendIds
            .map((friendId) => {
              const friend = userList[friendId];
              const presence = userPresence[`presence_${friendId}`];
              if (!friend) return null;

              return {
                id: friend.id,
                name: friend.name,
                gender: friend.gender,
                level: friend.level,
                signature: friend.signature,
                presence: presence || {
                  status: 'offline',
                  currentServerId: null,
                  currentChannelId: null,
                  customStatus: '',
                  lastActiveAt: null,
                },
              };
            })
            .filter((friend) => friend !== null); // 過濾掉不存在的用戶

          return {
            id: category.id,
            name: category.name,
            order: category.order,
            friends: friends,
          };
        });

      // 獲取或創建用戶狀態
      let presence = userPresence[`presence_${user.id}`];
      if (!presence) {
        presence = {
          id: `presence_${user.id}`,
          userId: user.id,
          currentServerId: null,
          currentChannelId: null,
          status: 'online',
          customStatus: '',
          lastActiveAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.set(`userPresence.${presence.id}`, presence);
      }

      // 構建回應
      const userResponse = {
        ...user,
        memberships: userMemberships,
        joinedServers,
        recommendedServers,
        friendships: userFriendships, // 包含分類和好友詳細資料
        presence,
      };

      // 發送資料
      io.to(socket.id).emit('user', userResponse);
      io.to(socket.id).emit('serverList', serverList);

      new Logger('WebSocket').success(`User(${user.id}) connected`);
    } catch (error) {
      socket.emit('error', {
        message: error.message,
        part: 'CONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('connectServer', async (data) => {
    try {
      const serverList = (await db.get('serverList')) || {};
      const serverMembers = (await db.get('serverMembers')) || {};
      const channelList = (await db.get('channelList')) || {};
      const userList = (await db.get('userList')) || {};
      const userPresence = (await db.get('userPresence')) || {};
      const messageList = (await db.get('messageList')) || {};

      const server = serverList[data.serverId];
      if (!server) {
        socket.emit('error', {
          message: `Server not found`,
          part: 'CONNECTSERVER',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }

      // 檢查用戶是否為伺服器成員
      const membership = Object.values(serverMembers).find(
        (member) =>
          member.serverId === data.serverId && member.userId === data.userId,
      );

      if (!membership) {
        // 創建新成員關係
        const membershipId = uuidv4();
        serverMembers[membershipId] = {
          id: membershipId,
          serverId: data.serverId,
          userId: data.userId,
          nickname: userList[data.userId].name,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          permission: 1,
          managedChannels: [],
          contribution: 0,
          joinedAt: Date.now(),
        };
      }

      // 更新用戶狀態
      const presenceId = `presence_${data.userId}`;
      userPresence[presenceId] = {
        id: presenceId,
        userId: data.userId,
        currentServerId: data.serverId,
        currentChannelId: server.lobbyId,
        status: 'online',
        customStatus: '',
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      };

      // 獲取伺服器的頻道列表，並整合當前在線成員和訊息資訊
      const serverChannels = Object.values(channelList)
        .filter((channel) => channel.serverId === server.id)
        .map((channel) => {
          // 找出當前在這個頻道的成員
          const channelMembers = Object.values(serverMembers)
            .filter((m) => m.serverId === server.id)
            .filter((member) => {
              const presence = userPresence[`presence_${member.userId}`];
              return presence && presence.currentChannelId === channel.id;
            })
            .map((member) => {
              const user = userList[member.userId];
              const presence = userPresence[`presence_${member.userId}`];

              return {
                ...member,
                user: {
                  id: user.id,
                  name: user.name,
                  gender: user.gender,
                  level: user.level,
                  signature: user.signature,
                },
                presence: presence,
              };
            });

          // 獲取頻道的訊息記錄
          const channelMessages = Object.values(messageList)
            .filter((msg) => msg.channelId === channel.id)
            .map((message) => {
              const sender = userList[message.senderId];
              return {
                ...message,
                sender: sender
                  ? {
                      id: sender.id,
                      name: sender.name,
                      gender: sender.gender,
                      level: sender.level,
                    }
                  : null,
              };
            })
            .sort((a, b) => a.createdAt - b.createdAt); // 按時間排序

          return {
            ...channel,
            currentMembers: channelMembers,
            messages: channelMessages,
          };
        });

      // 獲取當前在伺服器中的成員列表（不分頻道）
      const onlineMembers = Object.values(serverMembers)
        .filter((m) => m.serverId === server.id)
        .filter((member) => {
          const presence = userPresence[`presence_${member.userId}`];
          return presence && presence.currentServerId === server.id;
        })
        .map((member) => {
          const user = userList[member.userId];
          const presence = userPresence[`presence_${member.userId}`];

          return {
            ...member,
            user: {
              id: user.id,
              name: user.name,
              gender: user.gender,
              level: user.level,
              signature: user.signature,
            },
            presence: presence,
          };
        });

      await db.set('serverMembers', serverMembers);
      await db.set('userPresence', userPresence);

      socket.join(`server_${server.id}`);
      socket.join(`server_${server.id}_${server.lobbyId}`);

      // 發送更新的資料
      io.to(socket.id).emit('server', {
        ...server,
        members: Object.values(serverMembers).filter(
          (m) => m.serverId === server.id,
        ),
        onlineMembers,
        channels: serverChannels, // 現在包含了頻道成員和訊息記錄
        presence: userPresence[presenceId],
      });
    } catch (error) {
      socket.emit('error', {
        message: error.message,
        part: 'CONNECTSERVER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('disconnectServer', async (data) => {
    try {
      // 獲取資料庫
      const serverList = (await db.get('serverList')) || {};
      const userList = (await db.get('userList')) || {};
      const serverMembers = (await db.get('serverMembers')) || {};
      const userPresence = (await db.get('userPresence')) || {};
      const channelList = (await db.get('channelList')) || {};

      // 驗證資料
      const server = serverList[data.serverId];
      const user = userList[data.userId];

      if (!server || !user) {
        socket.emit('error', {
          message: 'Invalid server or user',
          part: 'DISCONNECTSERVER',
          tag: 'VALIDATION_ERROR',
          status_code: 400,
        });
        return;
      }

      // 更新用戶狀態
      const presenceId = `presence_${data.userId}`;
      const oldPresence = userPresence[presenceId];

      // 離開舊頻道和伺服器
      if (oldPresence?.currentChannelId) {
        socket.leave(`server_${server.id}_${oldPresence.currentChannelId}`);
      }
      socket.leave(`server_${server.id}`);

      // 更新狀態
      userPresence[presenceId] = {
        ...oldPresence,
        currentServerId: null,
        currentChannelId: null,
        updatedAt: Date.now(),
      };

      // 保存更新
      await db.set('userPresence', userPresence);

      // 發送更新給當前用戶
      io.to(socket.id).emit('server', null);
      io.to(socket.id).emit('user_presence', userPresence[presenceId]);

      // 通知伺服器中的其他用戶
      io.to(`server_${server.id}`).emit('server_state', {
        serverId: server.id,
        channels: Object.values(channelList)
          .filter((ch) => ch.serverId === server.id)
          .map((ch) => {
            const channelMembers = Object.values(serverMembers)
              .filter((m) => m.serverId === server.id)
              .filter((member) => {
                const presence = userPresence[`presence_${member.userId}`];
                return presence && presence.currentChannelId === ch.id;
              })
              .map((member) => {
                const user = userList[member.userId];
                const presence = userPresence[`presence_${member.userId}`];
                return {
                  ...member,
                  user: {
                    id: user.id,
                    name: user.name,
                    gender: user.gender,
                    level: user.level,
                  },
                  presence: presence,
                };
              });

            return {
              ...ch,
              currentMembers: channelMembers,
            };
          }),
        onlineMembers: Object.values(serverMembers)
          .filter((m) => m.serverId === server.id)
          .filter((member) => {
            const presence = userPresence[`presence_${member.userId}`];
            return presence && presence.currentServerId === server.id;
          })
          .map((member) => {
            const user = userList[member.userId];
            const presence = userPresence[`presence_${member.userId}`];
            return {
              ...member,
              user: {
                id: user.id,
                name: user.name,
                gender: user.gender,
                level: user.level,
              },
              presence: presence,
            };
          }),
        members: Object.values(serverMembers)
          .filter((m) => m.serverId === server.id)
          .map((member) => ({
            ...member,
            presence: userPresence[`presence_${member.userId}`],
          })),
      });
    } catch (error) {
      socket.emit('error', {
        message: error.message,
        part: 'DISCONNECTSERVER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('chatMessage', async (data) => {
    try {
      // Get database
      const messageList = (await db.get('messageList')) || {};
      const serverList = (await db.get('serverList')) || {};
      const channelList = (await db.get('channelList')) || {};
      const usersList = (await db.get('usersList')) || {};

      // Validate data
      const message = data.message;
      if (!message) {
        new Logger('WebSocket').error('Invalid data (message missing)');
        socket.emit('error', {
          message: 'Invalid data (message missing)',
          part: 'CHATMESSAGE',
          tag: 'MESSAGE_ERROR',
          status_code: 400,
        });
        return;
      }
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
          part: 'CHATMESSAGE',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = usersList[data.userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${data.userId}) not found`);
        socket.emit('error', {
          message: `User(${data.userId}) not found`,
          part: 'CHATMESSAGE',
          tag: 'USER_ERROR',
          status_code: 404,
        });
      }
      const channel = channelList[user.currentChannelId];
      if (!channel) {
        new Logger('WebSocket').error(
          `Channel(${user.currentChannelId}) not found`,
        );
        socket.emit('error', {
          message: `Channel(${user.currentChannelId}) not found`,
          part: 'CHATMESSAGE',
          tag: 'CHANNEL_ERROR',
          status_code: 404,
        });
        return;
      }

      message.id = uuidv4();
      message.timestamp = Date.now().valueOf();
      messageList[message.id] = message;
      channel.messageIds.push(message.id);

      // Save updated data
      await db.set('channelList', channelList);
      await db.set('messageList', messageList);

      // Emit updated data
      const channels = getChannels(channelList, server);
      const messages = getMessages(messageList, channel);
      io.to(`server_${server.id}`).emit('channels', channels);
      io.to(`server_${server.id}_${channel.id}`).emit('messages', messages);

      new Logger('WebSocket').info(
        `User(${message.senderId}) sent ${message.content} to channel(${channel.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(error.message);
      socket.emit('error', {
        message: `Error sending message from server: ${error.message}`,
        part: 'CHATMESSAGE',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('addChannel', async (data) => {
    try {
      // Get database
      const channelList = (await db.get('channelList')) || {};
      const serverList = (await db.get('serverList')) || {};

      // Validate data
      const channel = data.channel;
      if (!channel) {
        new Logger('WebSocket').error('Invalid data (channel missing)');
        socket.emit('error', {
          message: 'Invalid data (channel missing)',
          part: 'ADDCHANNEL',
          tag: 'CHANNEL_ERROR',
          status_code: 400,
        });
        return;
      }
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
          part: 'ADDCHANNEL',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }

      channel.id = uuidv4();
      channelList[channel.id] = channel;
      server.channelIds.push(channel.id);

      // Save updated data
      await db.set('serverList', serverList);
      await db.set('channelList', channelList);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit(
        'channels',
        getChannels(channelList, server),
      );

      new Logger('WebSocket').info(
        `Adding new channel(${channel.id}) to server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(error.message);
      socket.emit('error', {
        message: `Error adding from server: ${error.message}`,
        part: 'ADDCHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('editChannel', async (data) => {
    try {
      // Get database
      const channelList = (await db.get('channelList')) || {};
      const serverList = (await db.get('serverList')) || {};

      // Validate data
      const channel = data.channel;
      if (!channel) {
        new Logger('WebSocket').error('Invalid data (channel missing)');
        socket.emit('error', {
          message: 'Invalid data (channel missing)',
          part: 'EDITCHANNEL',
          tag: 'CHANNEL_ERROR',
          status_code: 400,
        });
        return;
      }
      const oldChannel = channelList[data.channelId];
      if (!oldChannel) {
        new Logger('WebSocket').error(`Channel(${data.channelId}) not found`);
        socket.emit('error', {
          message: `Channel(${data.channelId}) not found`,
          part: 'EDITCHANNEL',
          tag: 'CHANNEL_ERROR',
          status_code: 404,
        });
        return;
      }
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
          part: 'EDITCHANNEL',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }

      channelList[data.channelId] = channel;

      // Save updated data
      await db.set('serverList', serverList);
      await db.set('channelList', channelList);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit(
        'channels',
        getChannels(channelList, server),
      );

      new Logger('WebSocket').info(
        `Edit channel(${channel.id}) in server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(error.message);
      socket.emit('error', {
        message: `Error editing channel from server: ${error.message}`,
        part: 'EDITCHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('deleteChannel', async (data) => {
    try {
      // Get database
      const channelList = (await db.get('channelList')) || {};
      const serverList = (await db.get('serverList')) || {};

      // Validate data
      const channel = channelList[data.channelId];
      if (!channel) {
        new Logger('WebSocket').error(`Channel(${data.channelId}) not found`);
        socket.emit('error', {
          message: `Channel(${data.channelId}) not found`,
          part: 'DELETECHANNEL',
          tag: 'CHANNEL_ERROR',
          status_code: 404,
        });
        return;
      }
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
          part: 'DELETECHANNEL',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }

      delete channelList[channel.id];
      server.channelIds = server.channelIds.filter(
        (channelId) => channelId != channel.id,
      );

      // Save updated data
      await db.set('serverList', serverList);
      await db.set('channelList', channelList);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit(
        'channels',
        getChannels(channelList, server),
      );

      new Logger('WebSocket').info(
        `Remove channel(${channel.id}) from server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(error.message);
      socket.emit('error', {
        message: `Error deleting channle from server: ${error.message}`,
        part: 'DELETECHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('joinChannel', async (data) => {
    try {
      // 獲取資料庫
      const serverList = (await db.get('serverList')) || {};
      const channelList = (await db.get('channelList')) || {};
      const messageList = (await db.get('messageList')) || {};
      const userList = (await db.get('userList')) || {};
      const serverMembers = (await db.get('serverMembers')) || {};
      const userPresence = (await db.get('userPresence')) || {};

      // 驗證資料
      const server = serverList[data.serverId];
      const channel = channelList[data.channelId];
      const user = userList[data.userId];

      if (!server || !channel || !user) {
        socket.emit('error', {
          message: 'Invalid server, channel or user',
          part: 'JOINCHANNEL',
          tag: 'VALIDATION_ERROR',
          status_code: 400,
        });
        return;
      }

      // 檢查用戶是否為伺服器成員
      const membership = Object.values(serverMembers).find(
        (member) =>
          member.serverId === data.serverId && member.userId === data.userId,
      );

      if (!membership) {
        socket.emit('error', {
          message: 'User is not a member of this server',
          part: 'JOINCHANNEL',
          tag: 'PERMISSION_ERROR',
          status_code: 403,
        });
        return;
      }

      // 檢查頻道權限
      if (
        channel.permission === 'private' &&
        !channel.allowedUsers.includes(data.userId)
      ) {
        socket.emit('error', {
          message: 'No permission to join this channel',
          part: 'JOINCHANNEL',
          tag: 'PERMISSION_ERROR',
          status_code: 403,
        });
        return;
      }

      // 更新用戶狀態
      const presenceId = `presence_${data.userId}`;
      const oldPresence = userPresence[presenceId];

      // 離開舊頻道
      if (oldPresence?.currentChannelId) {
        socket.leave(`server_${server.id}_${oldPresence.currentChannelId}`);
      }

      // 更新狀態
      userPresence[presenceId] = {
        ...oldPresence,
        currentServerId: server.id,
        currentChannelId: channel.id,
        updatedAt: Date.now(),
      };

      // 加入新頻道
      socket.join(`server_${server.id}_${channel.id}`);

      // 獲取頻道訊息
      const channelMessages = Object.values(messageList)
        .filter((msg) => msg.channelId === channel.id)
        .map((message) => {
          const sender = userList[message.senderId];
          return {
            ...message,
            sender: sender
              ? {
                  id: sender.id,
                  name: sender.name,
                  gender: sender.gender,
                  level: sender.level,
                }
              : null,
          };
        })
        .sort((a, b) => a.createdAt - b.createdAt);

      // 保存更新
      await db.set('userPresence', userPresence);

      // 發送更新的資料給當前用戶
      io.to(socket.id).emit('messages', channelMessages);
      io.to(socket.id).emit('user_presence', userPresence[presenceId]);

      io.to(`server_${server.id}`).emit('channel_join');
      // 獲取所有頻道的當前狀態
      const updatedChannels = Object.values(channelList)
        .filter((ch) => ch.serverId === server.id)
        .map((ch) => {
          // 找出當前在這個頻道的成員
          const channelMembers = Object.values(serverMembers)
            .filter((m) => m.serverId === server.id)
            .filter((member) => {
              const presence = userPresence[`presence_${member.userId}`];
              return presence && presence.currentChannelId === ch.id;
            })
            .map((member) => {
              const user = userList[member.userId];
              const presence = userPresence[`presence_${member.userId}`];
              return {
                ...member,
                user: {
                  id: user.id,
                  name: user.name,
                  gender: user.gender,
                  level: user.level,
                },
                presence: presence,
              };
            });

          return {
            ...ch,
            currentMembers: channelMembers,
          };
        });

      // 獲取當前在線成員
      const onlineMembers = Object.values(serverMembers)
        .filter((m) => m.serverId === server.id)
        .filter((member) => {
          const presence = userPresence[`presence_${member.userId}`];
          return presence && presence.currentServerId === server.id;
        })
        .map((member) => {
          const user = userList[member.userId];
          const presence = userPresence[`presence_${member.userId}`];
          return {
            ...member,
            user: {
              id: user.id,
              name: user.name,
              gender: user.gender,
              level: user.level,
            },
            presence: presence,
          };
        });

      // 通知所有在伺服器中的用戶最新狀態
      io.to(`server_${server.id}`).emit('server_state', {
        serverId: server.id,
        channels: updatedChannels,
        onlineMembers,
        members: Object.values(serverMembers)
          .filter((m) => m.serverId === server.id)
          .map((member) => ({
            ...member,
            presence: userPresence[`presence_${member.userId}`],
          })),
      });
    } catch (error) {
      socket.emit('error', {
        message: error.message,
        part: 'JOINCHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });
});

// Error Handling
server.on('error', (error) => {
  new Logger('Server').error(`Server error: ${error.message}`);
});

process.on('uncaughtException', (error) => {
  new Logger('Server').error(`Uncaught Exception: ${error.message}`);
});

process.on('unhandledRejection', (error) => {
  new Logger('Server').error(`Unhandled Rejection: ${error.message}`);
});

// Start Server
server.listen(port, () => {
  new Logger('Server').success(`Server is running on port ${port}`);
});

// Functions
const getServerUserList = (usersList, server) => {
  return (
    server?.userIds
      .map((userId) => usersList[userId])
      .filter((_) => _)
      .reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {}) ?? {}
  );
};
const getChannels = (channelList, server) => {
  return (
    server?.channelIds
      .map((channelId) => channelList[channelId])
      .filter((_) => _) ?? []
  );
};
const getMessages = (messageList, channel) => {
  return (
    channel?.messageIds
      .map((messageId) => messageList[messageId])
      .filter((_) => _) ?? []
  );
};
const getFriendList = (usersList, user) => {
  return (
    user?.friendIds
      .map((friendId) => usersList[friendId])
      .filter((_) => _)
      .reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {}) ?? {}
  );
};
const generateUniqueDisplayId = (serverList, baseId = 20000000) => {
  let displayId = baseId + Object.keys(serverList).length;

  while (
    Object.values(serverList).some((server) => server.displayId === displayId)
  ) {
    displayId++;
  }

  return displayId;
};

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
    try {
      upload.single('avatar')(req, res, async function (err) {
        if (err) {
          sendError(res, 400, err.message);
          return;
        }

        try {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            const userId = req.headers['userid'];
            if (!userId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: '缺少用戶 ID' }));
              return;
            }

            const data = JSON.parse(body);

            // 驗證必要欄位
            if (!data.name || !userId) {
              sendError(res, 400, '缺少必要欄位');
              return;
            }

            // 獲取資料庫
            const serverList = (await db.get('serverList')) || {};
            const channelList = (await db.get('channelList')) || {};
            const usersList = (await db.get('usersList')) || {};

            // 檢查用戶是否存在
            const user = usersList[userId];
            if (!user) {
              sendError(res, 404, '用戶不存在');
              return;
            }

            // 檢查用戶創建的伺服器數量
            const userServers = Object.values(serverList).filter(
              (server) => server.ownerId === userId,
            );
            if (userServers.length >= 3) {
              sendError(res, 400, '已達到最大創建伺服器數量限制');
              return;
            }

            // 創建新伺服器
            const serverId = uuidv4();
            const lobbyId = uuidv4();

            // 創建新伺服器
            const newServer = {
              id: serverId,
              displayId: generateUniqueDisplayId(serverList),
              name: data.name,
              announcement: data.description || '',
              icon: req.file
                ? `/uploads/serverAvatars/${req.file.filename}`
                : '/logo_server_def.png',
              userIds: [userId],
              channelIds: [lobbyId],
              lobbyId: lobbyId,
              permissions: {
                [userId]: 6, // 6 = 群組擁有者
              },
              contributions: {
                [userId]: 0,
              },
              joinDate: {
                [userId]: Date.now().valueOf(),
              },
              applications: {},
              nicknames: {},
              level: 0,
              createdAt: Date.now().valueOf(),
            };

            // 保存到資料庫
            serverList[serverId] = newServer;
            channelList[lobbyId] = {
              id: lobbyId,
              name: '大廳',
              permission: 'public',
              isLobby: true,
              isCategory: false,
              userIds: [],
              messageIds: [],
              parentId: null,
            };

            await db.set('serverList', serverList);
            await db.set('channelList', channelList);

            new Logger('Websocket').success(
              `New server created: ${serverId} by user ${userId}`,
            );

            // 返回成功
            sendSuccess(res, {
              message: '伺服器創建成功',
              server: newServer,
            });
          });
        } catch (error) {
          new Logger('Server').error(`Create server error: ${error.message}`);
          sendError(res, 500, '伺服器創建失敗');
        }
      });
    } catch (error) {
      new Logger('Server').error(`Create server error: ${error.message}`);
      sendError(res, 500, '伺服器創建失敗');
    }
    return;
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

        // Get database from database
        const usersList = (await db.get(`usersList`)) || {};

        // Validate data
        if (!data.account || !data.password) {
          sendError(res, 400, 'Missing credentials');
          return;
        }
        const user = Object.values(usersList).find(
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

        // Generate session token
        // const sessionToken = uuidv4();
        // userSessions.set(sessionToken, user.id);

        new Logger('Auth').success(`User logged in: ${data.account}`);

        // Return success with user id and token
        const { password, ..._user } = user;
        sendSuccess(res, {
          message: 'Login successful',
          user: _user,
          // token: sessionToken,
        });
      } catch (error) {
        new Logger('Auth').error(`Login error: ${error.message}`);
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

        // Get database
        const usersList = (await db.get(`usersList`)) || {};

        // Validate data
        if (!data.account || !data.password || !data.username) {
          sendError(res, 400, 'Missing required fields');
          return;
        }
        const exists = Object.values(usersList).find(
          (user) => user.account === data.account,
        );
        if (exists) {
          sendError(res, 409, '此帳號已被註冊');
          return;
        }

        const userId = uuidv4();
        const user = {
          id: userId,
          name: data.username,
          account: data.account,
          password: data.password,
          currentChannelId: null,
          gender: data.gender,
          level: 0,
          createdAt: Date.now().valueOf(),
        };
        usersList[userId] = user;

        // Save to database
        await db.set(`usersList`, usersList);

        new Logger('Auth').success(`New user registered: ${data.account}`);

        // Return success with user id
        const { password, ..._user } = user;
        sendSuccess(res, {
          message: 'Registration successful',
          user: _user,
        });
      } catch (error) {
        new Logger('Auth').error(`Registration error: ${error.message}`);
        sendError(res, 500, 'Registration failed');
      }
    });
  }
});

const getRecommendedServers = (serverList = {}, currentUserId, limit = 10) => {
  if (!serverList || !currentUserId) return {};
  const notJoinedServers = Object.entries(serverList).reduce(
    (acc, [id, server]) => {
      if (server && !server.userIds?.includes(currentUserId)) {
        acc[id] = server;
      }
      return acc;
    },
    {},
  );

  const sampledServers = _.sampleSize(Object.values(notJoinedServers), limit);
  if (!sampledServers || sampledServers.length === 0) return {};

  return sampledServers.reduce((acc, server) => {
    if (server && server.id) {
      acc[server.id] = server;
    }
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
      // Get database
      const usersList = (await db.get(`usersList`)) || {};

      // Validate data
      const user = usersList[data.userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${data.userId}) not found`);
        socket.emit('error', {
          message: `User(${data.userId}) not found`,
          part: 'CONNECTUSER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }

      const serverList = (await db.get('serverList')) || {};
      const recommendedServers = getRecommendedServers(serverList, user.id);
      const joinedServers = Object.entries(serverList).reduce(
        (acc, [id, server]) => {
          if (server.userIds.includes(user.id)) {
            acc[id] = server;
          }
          return acc;
        },
        {},
      );

      const userResponse = {
        ...user,
        recommendedServers,
        joinedServers,
      };

      // Emit updated data (only to the user)
      io.to(socket.id).emit('user', userResponse);
      io.to(socket.id).emit('serverList', serverList);
      io.to(socket.id).emit('friendList', getFriendList(usersList, user));

      new Logger('WebSocket').success(`User(${user.id}) connected`);
    } catch (error) {
      new Logger('WebSocket').error(
        `Error getting user data: ${error.message}`,
      );
      socket.emit('error', {
        message: `Error getting user data: ${error.message}`,
        part: 'CONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('connectServer', async (data) => {
    try {
      // Get database
      const usersList = (await db.get(`usersList`)) || {};
      const channelList = (await db.get('channelList')) || {};
      const messageList = (await db.get('messageList')) || {};
      const serverList = (await db.get('serverList')) || {};

      // Validate data
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
          part: 'CONNECTSERVER',
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
          part: 'CONNECTSERVER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }

      if (!server.userIds.includes(user.id)) {
        server.userIds.push(user.id);
        new Logger('WebSocket').info(
          `User(${user.id}) has been added to server(${server.id})`,
        );

        if (!server.permissions[user.id]) {
          server.permissions[user.id] = 1;
          new Logger('WebSocket').info(
            `User(${user.id}) has been set Permission(1) in server(${server.id})`,
          );
        }
      }

      // if (!server.permissions) {
      user.currentChannelId = channelList[server.lobbyId].id;
      channelList[server.lobbyId].userIds.push(user.id);

      // Save updated data
      await db.set('serverList', serverList);
      await db.set('usersList', usersList);
      await db.set('channelList', channelList);

      const recommendedServers = getRecommendedServers(serverList, user.id);
      const joinedServers = Object.entries(serverList).reduce(
        (acc, [id, server]) => {
          if (server.userIds.includes(user.id)) {
            acc[id] = server;
          }
          return acc;
        },
        {},
      );

      const userResponse = {
        ...user,
        recommendedServers,
        joinedServers,
      };

      // Join server and lobby channel
      if (user.currentChannelId)
        socket.join(`server_${server.id}_${server.lobbyId}`);
      socket.join(`server_${server.id}`);

      // Emit updated data (only to the user)
      io.to(socket.id).emit('server', server);
      io.to(socket.id).emit('channels', getChannels(channelList, server));
      io.to(socket.id).emit('users', getServerUserList(usersList, server));
      io.to(socket.id).emit(
        'messages',
        getMessages(messageList, channelList[server.lobbyId]),
      );
      io.to(socket.id).emit('user', userResponse);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit(
        'users',
        getServerUserList(usersList, server),
      );
      io.to(`server_${server.id}`).emit(
        'channels',
        getChannels(channelList, server),
      );
      io.to(`server_${server.id}`).emit('server', server);

      new Logger('WebSocket').success(
        `User(${user.id}) connected to server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(
        `Error getting server data: ${error.message}`,
      );
      socket.emit('error', {
        message: `Error getting server data: ${error.message}`,
        part: 'CONNECTSERVER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('disconnectServer', async (data) => {
    try {
      // Get database
      const usersList = (await db.get(`usersList`)) || {};
      const serverList = (await db.get('serverList')) || {};
      const channelList = (await db.get('channelList')) || {};

      // Validate data
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
          part: 'DISCONNECTSERVER',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = usersList[data.userId];
      if (!server) {
        new Logger('WebSocket').error(`User(${data.userId}) not found`);
        socket.emit('error', {
          message: `User(${data.userId}) not found`,
          part: 'DISCONNECTSERVER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }

      // Leave server and channel
      if (user.currentChannelId)
        socket.leave(`server_${server.id}_${user.currentChannelId}`);
      socket.leave(`server_${server.id}`);

      const prevChannel = channelList[user.currentChannelId];
      if (prevChannel)
        prevChannel.userIds = prevChannel.userIds.filter(
          (userId) => userId != user.id,
        );
      user.currentChannelId = null;
      server.userIds = server.userIds.filter((userId) => userId != user.id);

      // Save updated data
      await db.set('serverList', serverList);
      await db.set('usersList', usersList);
      await db.set('channelList', channelList);

      // Emit updated data (only to the user)
      io.to(socket.id).emit('server', null);
      io.to(socket.id).emit('channels', []);
      io.to(socket.id).emit('users', {});
      io.to(socket.id).emit('messages', []);
      io.to(socket.id).emit('user', user);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('server', server);
      io.to(`server_${server.id}`).emit(
        'users',
        getServerUserList(usersList, server),
      );
      io.to(`server_${server.id}`).emit(
        'channels',
        getChannels(channelList, server),
      );

      new Logger('WebSocket').success(
        `User(${user.id}) disconnected from server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(
        `Error disconnecting from server: ${error.message}`,
      );
      socket.emit('error', {
        message: `Error disconnecting from server: ${error.message}`,
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
      // Get database
      const channelList = (await db.get('channelList')) || {};
      const serverList = (await db.get('serverList')) || {};
      const usersList = (await db.get('usersList')) || {};
      const messageList = (await db.get('messageList')) || {};

      // Validate data
      const channel = channelList[data.channelId];
      if (!channel && data.channelId) {
        new Logger('WebSocket').error(`Channel(${data.channelId}) not found`);
        socket.emit('error', {
          message: `Channel(${data.channelId}) not found`,
          part: 'JOINCHANNEL',
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
          part: 'JOINCHANNEL',
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
          part: 'JOINCHANNEL',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      if (user.currentChannelId === channel?.id) return;

      if (user.currentChannelId) {
        socket.leave(`server_${server.id}_${user.currentChannelId}`);
        io.to(`server_${server.id}_${user.currentChannelId}`).emit(
          'channel_leave',
        );
      }

      const prevChannel = channelList[user.currentChannelId];
      if (prevChannel)
        prevChannel.userIds = prevChannel.userIds.filter(
          (userId) => userId != user.id,
        );
      user.currentChannelId = channel?.id ?? null;
      if (channel) channel.userIds.push(user.id);

      // Save updated data
      await db.set('channelList', channelList);
      await db.set('usersList', usersList);

      // Join channel
      if (user.currentChannelId) {
        socket.join(`server_${server.id}_${user.currentChannelId}`);
        io.to(`server_${server.id}_${user.currentChannelId}`).emit(
          'channel_join',
        );
      }

      // Emit updated data (only to the user)
      io.to(socket.id).emit(
        'messages',
        getMessages(messageList, channelList[user.currentChannelId]),
      );
      io.to(socket.id).emit('user', user);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit(
        'channels',
        getChannels(channelList, server),
      );
      io.to(`server_${server.id}`).emit(
        'users',
        getServerUserList(usersList, server),
      );

      new Logger('WebSocket').info(
        `User(${user.id}) joined channel(${channel.id}) in server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(error.message);
      socket.emit('error', {
        message: `Error joining channel from server: ${error.message}`,
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

const http = require('http');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { Server } = require('socket.io');
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');
const formidable = require('formidable');
const path = require('path');
const _ = require('lodash');
const fs = require('fs').promises;

// TODO: Separate disconnect logic to avoid code duplication (disconnectUser, disconnectServer, disconnectChannel)

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
// const MessageTypes = {
//   CHAT: 'chat',
//   VOICE_STATE: 'voice_state',
//   USER_STATUS: 'user_status',
//   CHANNEL_JOIN: 'channel_join',
//   CHANNEL_LEAVE: 'channel_leave',
//   USER_JOIN: 'user_join',
//   USER_LEAVE: 'user_leave',
//   FETCH: 'fetch',
// };

// User Sessions
const userSessions = new Map(); // sessionToken -> userId

// User Socket Connections
const userSockets = new Map(); // socket.id -> userId

// User Contributions Interval
const contributionInterval = new Map(); // socket.id -> interval

// File Upload
const uploadDir = path.join(__dirname, 'uploads/serverAvatars');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Send Error/Success Response
const sendError = (res, statusCode, message) => {
  res.writeHead(statusCode, CONTENT_TYPE_JSON);
  res.end(JSON.stringify({ error: message }));
};

const sendSuccess = (res, data) => {
  res.writeHead(200, CONTENT_TYPE_JSON);
  res.end(JSON.stringify(data));
};

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

// Update upload directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(console.error);

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

  if (req.method === 'GET' && req.url.startsWith('/uploads/')) {
    try {
      // Get the file path relative to uploads directory
      const relativePath = req.url.replace('/uploads/', '');
      const filePath = path.join(UPLOADS_DIR, relativePath);

      // Validate file path to prevent directory traversal
      if (!filePath.startsWith(UPLOADS_DIR)) {
        sendError(res, 403, '無權限存取此檔案');
        return;
      }

      // Get file extension and MIME type
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      // Read and serve the file
      fs.readFile(filePath)
        .then((data) => {
          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            'Access-Control-Allow-Origin': '*', // 允許跨域存取
          });
          res.end(data);
        })
        .catch((error) => {
          if (error.code === 'ENOENT') {
            sendError(res, 404, '找不到檔案');
          } else {
            sendError(res, 500, '讀取檔案失敗');
          }
        });
      return;
    } catch (error) {
      sendError(res, 500, '伺服器錯誤');
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/servers') {
    const form = new formidable.IncomingForm({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 限制 5MB
      multiples: false,
      allowEmptyFiles: false,
    });

    form.parse(req, async (err, fields, files) => {
      // 用於追蹤上傳的檔案路徑
      let uploadedFilePath = null;

      try {
        if (err) {
          sendError(res, 400, '檔案上傳失敗');
          return;
        }

        // 保存上傳的檔案路徑以便需要時刪除
        if (files.icon && files.icon[0]) {
          uploadedFilePath = files.icon[0].filepath;
        }

        // 處理頭像路徑
        let iconPath = null;
        if (uploadedFilePath) {
          iconPath = `/uploads/serverAvatars/${path.basename(
            uploadedFilePath,
          )}`;
        }

        const _userId = fields.userId;
        const userId = _userId ? _userId.toString() : null;
        if (!userId) {
          throw new Error('缺少使用者ID');
        }

        const name = fields.name
          ? fields.name.toString().trim().substring(0, 30)
          : 'Untitled Server';
        const description = fields.description
          ? fields.description.toString().substring(0, 200)
          : '';

        // 驗證必要欄位
        if (!name || !userId) {
          throw new Error('缺少必要欄位');
        }

        // 獲取資料庫
        const servers = (await db.get('servers')) || {};
        const users = (await db.get('users')) || {};

        // 檢查用戶是否存在
        const user = users[userId];
        if (!user) {
          throw new Error('用戶不存在');
        }

        // 檢查用戶創建的伺服器數量
        const userOwnedServerCount = Object.values(servers).filter(
          (server) => server.ownerId === userId,
        ).length;
        if (userOwnedServerCount >= 3) {
          throw new Error('已達到最大擁有伺服器數量限制');
        }

        // Create new server and channel
        const serverId = uuidv4();
        const channelId = uuidv4();
        const server = {
          id: serverId,
          name: name,
          iconUrl: iconPath,
          level: 0,
          announcement: description || '',
          channelIds: [channelId],
          displayId: generateUniqueDisplayId(servers),
          lobbyId: channelId,
          ownerId: userId,
          settings: {
            allowDirectMessage: true,
            visibility: 'public',
            defaultChannelId: channelId,
          },
          createdAt: Date.now().valueOf(),
        };
        await db.set(`servers.${serverId}`, server);

        const channel = {
          id: channelId,
          name: '大廳',
          messageIds: [],
          serverId: serverId,
          parentId: null,
          userIds: [],
          isCategory: false,
          isLobby: true,
          settings: {
            bitrate: 64000,
            slowmode: false,
            userLimit: -1,
            visibility: 'public',
          },
          createdAt: Date.now().valueOf(),
        };
        await db.set(`channels.${channelId}`, channel);

        // Create new member
        const memberId = uuidv4();
        const member = {
          id: memberId,
          nickname: user.name,
          serverId: serverId,
          userId: userId,
          contribution: 0,
          managedChannels: [],
          permissionLevel: 6,
          joinedAt: Date.now().valueOf(),
        };
        await db.set(`members.${memberId}`, member);

        new Logger('Server').success(
          `New server created: ${serverId} by user ${userId}`,
        );

        sendSuccess(res, {
          message: 'success',
          data: {
            serverId: serverId,
          },
        });
      } catch (error) {
        // 刪除上傳的檔案
        if (uploadedFilePath) {
          fs.unlink(uploadedFilePath).catch((err) => {
            new Logger('Server').error(`Error deleting file: ${err.message}`);
          });
        }

        new Logger('Server').error(`Create server error: ${error.message}`);
        sendError(
          res,
          error.message === '用戶不存在' ? 404 : 400,
          error.message,
        );
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/user/friends') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        // data = {
        //  "sessionId": "123456",
        // }

        // Get database
        const users = (await db.get('users')) || {};

        // Validate data
        const userId = userSessions.get(data.sessionId);
        if (!userId) {
          throw new Error('Invalid session ID');
        }
        const user = users[userId];
        if (!user) {
          throw new Error('User not found');
        }

        sendSuccess(res, {
          message: '獲取好友成功',
          data: { friendCategories: await getFriendCategories(userId) },
        });
        new Logger('Friends').success(`User(${userId}) friends fetched`);
      } catch (error) {
        sendError(res, 500, `獲取好友時發生錯誤: ${error.message}`);
        new Logger('Friends').error(`Fetch friends error: ${error.message}`);
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/user/servers') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        // data = {
        //   "sessionId": "123456",
        // }
        // console.log(data);

        // Get database
        const users = (await db.get('users')) || {};

        // Validate data
        const userId = userSessions.get(data.sessionId);
        if (!userId) {
          throw new Error('Invalid session ID');
        }
        const user = users[userId];
        if (!user) {
          throw new Error('User not found');
        }

        sendSuccess(res, {
          message: '獲取伺服器成功',
          data: { ...(await getJoinRecServers(userId)) },
        });
        new Logger('Servers').success(`User(${userId}) servers fetched`);
      } catch (error) {
        sendError(res, 500, `獲取伺服器時發生錯誤: ${error.message}`);
        new Logger('Servers').error(`Fetch servers error: ${error.message}`);
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
        // data = {
        //   "password": "123456",
        //   "account": "test",
        // }
        // console.log(data);

        // Get database
        const userAccPwdList = (await db.get(`account_password`)) || {};
        const users = (await db.get(`users`)) || {};
        const presenceStates = (await db.get(`presenceStates`)) || {};

        // Validate data
        const account = data.account;
        const password = data.password;
        if (!account || !password) {
          throw new Error('無效的帳號或密碼');
        }
        const exist = userAccPwdList[account];
        if (!exist) {
          throw new Error('帳號或密碼錯誤');
        }
        if (password !== userAccPwdList[account]) {
          throw new Error('帳號或密碼錯誤');
        }
        const user = Object.values(users).find(
          (user) => user.account === account,
        );
        if (!user) {
          throw new Error('用戶不存在');
        }
        const presence = presenceStates[`presence_${user.id}`];
        if (!presence) {
          throw new Error('用戶狀態不存在');
        }

        // Update user presence
        presenceStates[presence.id] = {
          ...presence,
          status: 'online',
          lastActiveAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.set(
          `presenceStates.${presence.id}`,
          presenceStates[presence.id],
        );

        // Generate session id
        const sessionId = uuidv4();
        userSessions.set(sessionId, user.id);

        sendSuccess(res, {
          message: '登入成功',
          data: {
            sessionId: sessionId,
          },
        });
        new Logger('Auth').success(`User logged in: ${account}`);
      } catch (error) {
        sendError(res, 500, `登入時發生錯誤: ${error.message}`);
        new Logger('Auth').error(`Login error: ${error.message}`);
      }
    });
    return;
  }

  if (req.method == 'POST' && req.url == '/register') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        // data = {
        //   "account": "test",
        //   "password": "123456",
        //   "username": "test",
        // }
        // console.log(data);

        // Get database
        const userAccPwdList = (await db.get(`account_password`)) || {};
        const presenceStates = (await db.get(`presenceStates`)) || {};

        // Validate data
        const account = data.account;
        const password = data.password;
        if (!account || !password) {
          throw new Error('無效的帳號或密碼');
        }
        const username = data.username;
        if (!username) {
          throw new Error('無效的使用者名稱');
        }
        const exists = userAccPwdList[data.account];
        if (exists) {
          throw new Error('帳號已存在');
        }

        // Create user data
        const userId = uuidv4();
        const user = {
          id: userId,
          name: username,
          account: account,
          gender: data.gender || 'Male',
          level: 1,
          signature: '',
          badgeIds: ['nerd'],
          ownedServerIds: [],
          settings: {
            theme: 'light',
            notifications: true,
          },
          createdAt: Date.now(),
        };
        await db.set(`users.${userId}`, user);

        // Create user presence
        const presenceId = `presence_${userId}`;
        const presence = {
          id: presenceId,
          userId: userId,
          currentServerId: null,
          currentChannelId: null,
          status: 'gn',
          customStatus: '',
          lastActiveAt: Date.now(),
          updatedAt: Date.now(),
        };
        presenceStates[presenceId] = presence;
        await db.set(`presenceStates.${presenceId}`, presence);

        // Create account password list
        await db.set(`account_password.${account}`, password);

        sendSuccess(res, { message: '註冊成功' });
        new Logger('Auth').success(`User registered: ${account}`);
      } catch (error) {
        sendError(res, 500, `註冊時發生錯誤: ${error.message}`);
        new Logger('Auth').error(`Register error: ${error.message}`);
      }
    });
    return;
  }

  sendSuccess(res, { message: 'Hello World!' });
  return;
});

const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
  },
});
io.on('connection', async (socket) => {
  socket.on('disconnect', async () => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      const userId = userSockets.get(socket.id);
      if (!userId) {
        throw new Error('Invalid socket ID');
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }
      const presence = presenceStates[`presence_${userId}`];
      if (!presence) {
        throw new Error(`Presence(${`presence_${userId}`}) not found`);
      }
      const channel = channels[presence.currentChannelId];
      if (!channel) {
        new Logger('WebSocket').warn(
          `Channel(${presence.currentChannelId}) not found. Won't disconnect channel.`,
        );
      }
      const server = servers[presence.currentServerId];
      if (!server) {
        new Logger('WebSocket').warn(
          `Server(${presence.currentServerId}) not found. Won't disconnect server.`,
        );
      }

      // Clear user contribution interval
      clearContributionInterval(socket.id);

      // Remove user socket connection
      userSockets.delete(socket.id);

      // Update user presence
      presenceStates[presence.id] = {
        ...presence,
        currentServerId: null,
        currentChannelId: null,
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.set(
        `presenceStates.${presence.id}`,
        presenceStates[presence.id],
      );

      if (channel) {
        // Update channel
        channel.userIds = channel.userIds.filter((id) => id !== userId);
        await db.set(`channels.${channel.id}`, channel);

        // Emit data (to all users in the channel)
        io.to(`server_${server.id}`).emit('serverUpdate', {
          ...(await getServer(server.id)),
        });
      }

      new Logger('WebSocket').success(`User(${userId}) disconnected`);
    } catch (error) {
      socket.emit('error', {
        message: `斷線時發生錯誤: ${error.message}`,
        part: 'DISCONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error(
        `Error disconnecting user: ${error.message}`,
      );
    }
  });

  socket.on('connectUser', async (data) => {
    // data = {
    //   sessionId: '123456',
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};

    try {
      // Validate data
      const sessionId = data.sessionId;
      if (!sessionId) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error('Invalid session ID');
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }

      // Check if user is already connected
      for (const [key, value] of userSockets) {
        if (value === userId) {
          // Remove user socket connection
          userSockets.delete(key);

          // Emit force disconnect event
          io.to(key).emit('forceDisconnect');

          new Logger('WebSocket').warn(
            `User(${userId}) already connected from another socket. Force disconnecting...`,
          );
        }
      }

      // Save user socket connection
      userSockets.set(socket.id, userId);

      // Emit data (only to the user)
      io.to(socket.id).emit('userConnect', {
        ...(await getUser(userId)),
        members: await getUserMembers(userId),
      });

      new Logger('WebSocket').success(`User(${userId}) connected`);
    } catch (error) {
      // Emit error data (only to the user)
      io.to(socket.id).emit('userDisconnect', null);
      io.to(socket.id).emit('error', {
        message: `取得使用者時發生錯誤: ${error.message}`,
        part: 'CONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error(
        `Error getting user data: ${error.message}`,
      );
    }
  });

  socket.on('disconnectUser', async (data) => {
    // data = {
    //   sessionId: '123456',
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      const sessionId = data.sessionId;
      if (!sessionId) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error('Invalid session ID');
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }
      const presence = presenceStates[`presence_${userId}`];
      if (!presence) {
        throw new Error(`Presence(${`presence_${userId}`}) not found`);
      }
      const server = servers[presence.currentServerId];
      if (!server) {
        new Logger('WebSocket').warn(
          `Server(${presence.currentServerId}) not found. Won't disconnect server.`,
        );
      }
      const channel = channels[presence.currentChannelId];
      if (!channel) {
        new Logger('WebSocket').warn(
          `Channel(${presence.currentChannelId}) not found. Won't disconnect channel.`,
        );
      }

      // Remove user socket connection
      userSockets.delete(socket.id);

      // Update user presence
      presenceStates[presence.id] = {
        ...presence,
        currentServerId: null,
        currentChannelId: null,
        status: 'gn',
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.set(
        `presenceStates.${presence.id}`,
        presenceStates[presence.id],
      );

      if (channel) {
        // Clear user contribution interval
        clearContributionInterval(socket.id);

        // Update channel
        channel.userIds = channel.userIds.filter((id) => id !== userId);
        await db.set(`channels.${channel.id}`, channel);

        // leave the channel
        socket.leave(`channel_${channel.id}`);

        // Emit data (only to the user)
        io.to(socket.id).emit('channelDisconnect');

        // Emit data (to all users in the channel)
        io.to(`server_${server.id}`).emit('serverUpdate', {
          ...(await getServer(server.id)),
        });
      }

      if (server) {
        // leave the server
        socket.leave(`server_${server.id}`);

        // Emit data (only to the user)
        io.to(socket.id).emit('serverDisconnect');
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('userDisconnect');

      new Logger('WebSocket').success(`User(${userId}) disconnected`);
    } catch (error) {
      io.to(socket.id).emit('error', {
        message: `登出時發生錯誤: ${error.message}`,
        part: 'DISCONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error(
        `Error disconnecting user: ${error.message}`,
      );
    }
  });

  socket.on('updateUser', async (data) => {
    // data = {
    //   sessionId
    //   user: {
    //     name:
    //     gender:
    //     signature:
    //     ...
    //   }
    // }

    // Get database
    const users = (await db.get('users')) || {};

    try {
      // Validate data
      const sessionId = data.sessionId;
      const editedUser = data.user;
      if (!sessionId || !editedUser) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error(`Invalid session ID(${sessionId})`);
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }

      // Update user data
      users[userId] = {
        ...user,
        ...editedUser,
      };
      await db.set(`users.${userId}`, users[userId]);

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', {
        ...editedUser,
      });

      new Logger('WebSocket').success(`User(${userId}) updated`);
    } catch (error) {
      io.to(socket.id).emit('error', {
        message: `更新使用者時發生錯誤: ${error.message}`,
        part: 'UPDATEUSER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error(`Error updating user: ${error.message}`);
    }
  });

  socket.on('updatePresence', async (data) => {
    // data = {
    //   sessionId
    //   presence: {
    //     status:
    //     customStatus:
    //     ...
    //   }
    // }

    // Get database
    const users = (await db.get('users')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      const sessionId = data.sessionId;
      const editedPresence = data.presence;
      if (!sessionId || !editedPresence) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error(`Invalid session ID(${sessionId})`);
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }
      const presence = presenceStates[`presence_${userId}`];
      if (!presence) {
        throw new Error(`Presence(${`presence_${userId}`}) not found`);
      }

      // Update user presence
      presenceStates[presence.id] = {
        ...presence,
        ...editedPresence,
        updatedAt: Date.now(),
      };
      await db.set(
        `presenceStates.${presence.id}`,
        presenceStates[presence.id],
      );

      // Emit data (only to the user)
      io.to(socket.id).emit('userPresenceUpdate', {
        ...editedPresence,
      });

      new Logger('WebSocket').success(`User(${userId}) presence updated`);
    } catch (error) {
      io.to(socket.id).emit('error', {
        message: `更新狀態時發生錯誤: ${error.message}`,
        part: 'UPDATEPRESENCE',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error(
        `Error updating presence: ${error.message}`,
      );
    }
  });

  socket.on('connectServer', async (data) => {
    // data = {
    //   sessionId:
    //   serverId:
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const members = (await db.get('members')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      const sessionId = data.sessionId;
      const serverId = data.serverId;
      if (!sessionId || !serverId) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error(`Invalid session ID(${sessionId})`);
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }
      const presence = presenceStates[`presence_${userId}`];
      if (!presence) {
        throw new Error(`Presence(${`presence_${userId}`}) not found`);
      }
      const server = servers[serverId];
      if (!server) {
        throw new Error(`Server(${serverId}) not found`);
      }

      // Check if user is already exists in the server
      const exists = Object.values(members).find(
        (member) => member.serverId === server.id && member.userId === userId,
      );
      if (!exists) {
        // Create new membership
        const memberId = uuidv4();
        const member = {
          id: memberId,
          serverId: server.id,
          userId: user.id,
          nickname: user.name,
          permissionLevel: 1,
          managedChannels: [],
          contribution: 0,
          joinedAt: Date.now(),
        };
        members[memberId] = member;
        await db.set(`members.${memberId}`, member);
      }

      // Update user presence
      presenceStates[presence.id] = {
        ...presence,
        currentServerId: server.id,
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.set(
        `presenceStates.${presence.id}`,
        presenceStates[presence.id],
      );

      // Join the server
      socket.join(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('serverConnect', {
        ...(await getServer(server.id)),
      });
      io.to(socket.id).emit('userPresenceUpdate', {
        ...(await getPresenceState(userId)),
      });

      new Logger('WebSocket').success(
        `User(${userId}) connected to server(${server.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      io.to(socket.id).emit('serverDisconnect');
      io.to(socket.id).emit('error', {
        message: `加入伺服器時發生錯誤: ${error.message}`,
        part: 'CONNECTSERVER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error(
        `Error getting server data: ${error.message}`,
      );
    }
  });

  socket.on('disconnectServer', async (data) => {
    // data = {
    //   sessionId: '123456',
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      const sessionId = data.sessionId;
      if (!sessionId) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error(`Invalid session ID(${sessionId})`);
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }
      const presence = presenceStates[`presence_${userId}`];
      if (!presence) {
        throw new Error(`Presence(${`presence_${userId}`}) not found`);
      }
      const server = servers[presence.currentServerId];
      if (!server) {
        throw new Error(`Server(${presence.currentServerId}) not found`);
      }
      const channel = channels[presence.currentChannelId];
      if (!channel) {
        new Logger('WebSocket').warn(
          `Channel(${presence.currentChannelId}) not found. Won't disconnect channel.`,
        );
      }

      // Update user presence
      presenceStates[presence.id] = {
        ...presence,
        currentServerId: null,
        currentChannelId: null,
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.set(
        `presenceStates.${presence.id}`,
        presenceStates[presence.id],
      );

      if (channel) {
        // Clear user contribution interval
        clearContributionInterval(socket.id);

        // Update channel
        channel.userIds = channel.userIds.filter((id) => id !== userId);
        await db.set(`channels.${channel.id}`, channel);

        // leave the channel
        socket.leave(`channel_${channel.id}`);

        // Emit data (only to the user)
        io.to(socket.id).emit('channelDisconnect');

        // Emit data (to all users in the channel)
        io.to(`server_${server.id}`).emit('serverUpdate', {
          ...(await getServer(server.id)),
        });
      }

      // Leave the server
      socket.leave(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('serverDisconnect');
      io.to(socket.id).emit('userPresenceUpdate', {
        ...(await getPresenceState(userId)),
      });

      new Logger('WebSocket').success(
        `User(${userId}) disconnected from server(${server.id})`,
      );
    } catch (error) {
      socket.emit('error', {
        message: `離開伺服器時發生錯誤: ${error.message}`,
        part: 'DISCONNECTSERVER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error(
        `Error disconnecting from server: ${error.message}`,
      );
    }
  });

  socket.on('connectChannel', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   channelId: '123456',
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // validate data
      const sessionId = data.sessionId;
      const channelId = data.channelId;
      if (!sessionId || !channelId) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error(`Invalid session ID(${sessionId})`);
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }
      const presence = presenceStates[`presence_${userId}`];
      if (!presence) {
        throw new Error(`Presence(${`presence_${userId}`}) not found`);
      }
      const server = servers[presence.currentServerId];
      if (!server) {
        throw new Error(`Server(${presence.currentServerId}) not found`);
      }
      const channel = channels[channelId];
      if (!channel && channelId) {
        throw new Error(`Channel(${channelId}) not found`);
      }
      if (channel.permission === 'private') {
        throw new Error(`Permission denied`);
      }
      const prevChannel = channels[presence.currentChannelId];

      // check if user is already in a channel, if so, disconnect the channel
      if (prevChannel) {
        // Update Channel
        prevChannel.userIds = prevChannel.userIds.filter((id) => id !== userId);
        await db.set(`channels.${prevChannel.id}`, prevChannel);

        // Leave the channel
        socket.leave(`channel_${prevChannel.id}`);

        // Play sound
        io.to(`channel_${prevChannel.id}`).emit('playSound', 'leave');
      } else {
        // Setup user interval for accumulate contribution
        setupContributionInterval(socket.id, userId);
      }

      // Update user presence
      presenceStates[presence.id] = {
        ...presence,
        currentServerId: server.id,
        currentChannelId: channel.id,
        updatedAt: Date.now(),
      };
      await db.set(
        `presenceStates.${presence.id}`,
        presenceStates[presence.id],
      );

      // Update channel
      if (!channel.userIds.includes(userId)) {
        channel.userIds.push(userId);
        await db.set(`channels.${channel.id}`, channel);
      }

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'join');

      // Join the channel
      socket.join(`channel_${channel.id}`);

      // Emit updated data (only to the user)
      io.to(socket.id).emit('channelConnect');
      io.to(socket.id).emit('userPresenceUpdate', {
        ...(await getPresenceState(userId)),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        ...(await getServer(server.id)),
      });

      new Logger('WebSocket').success(
        `User(${user.id}) connected to channel(${channel.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      io.to(socket.id).emit('channelDisconnect');
      io.to(socket.id).emit('error', {
        message: `加入頻道時失敗: ${error.message}`,
        part: 'JOINCHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error(
        `Error connecting to channel: ${error.message}`,
      );
    }
  });

  socket.on('disconnectChannel', async (data) => {
    // data = {
    //   sessionId: '123456',
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      const sessionId = data.sessionId;
      if (!sessionId) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error(`Invalid session ID(${sessionId})`);
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }
      const presence = presenceStates[`presence_${userId}`];
      if (!presence) {
        throw new Error(`Presence(${`presence_${userId}`}) not found`);
      }
      const server = servers[presence.currentServerId];
      if (!server) {
        throw new Error(`Server(${presence.currentServerId}) not found`);
      }
      const channel = channels[presence.currentChannelId];
      if (!channel) {
        throw new Error(`Channel(${presence.currentChannelId}) not found`);
      }

      // Clear user contribution interval
      clearContributionInterval(socket.id);

      // Update user presence
      presenceStates[presence.id] = {
        ...presence,
        currentChannelId: null,
        updatedAt: Date.now(),
      };
      await db.set(
        `presenceStates.${presence.id}`,
        presenceStates[presence.id],
      );

      // Update channel
      channel.userIds = channel.userIds.filter((id) => id !== user.id);
      await db.set(`channels.${channel.id}`, channel);

      // Leave the channel
      socket.leave(`channel_${channel.id}`);

      // Emit updated data (only to the user)
      io.to(socket.id).emit('channelDisconnect');
      io.to(socket.id).emit('userPresenceUpdate', {
        ...(await getPresenceState(user.id)),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        ...(await getServer(server.id)),
      });

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'leave');

      new Logger('WebSocket').success(
        `User(${user.id}) disconnected from channel(${channel.id})`,
      );
    } catch (error) {
      io.to(socket.id).emit('error', {
        message: `離開頻道時發生錯誤: ${error.message}`,
        part: 'DISCONNECTCHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error(
        `Error disconnecting from channel: ${error.message}`,
      );
    }
  });

  socket.on('chatMessage', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   message: {
    //     senderId: "",
    //     content: "",
    //   }
    // };
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const messages = (await db.get('messages')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      const sessionId = data.sessionId;
      const newMessage = data.message;
      if (!sessionId || !newMessage) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error(`Invalid session ID(${sessionId})`);
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }
      const presence = presenceStates[`presence_${userId}`];
      if (!presence) {
        throw new Error(`Presence(${`presence_${userId}`}) not found`);
      }
      const channel = channels[presence.currentChannelId];
      if (!channel) {
        throw new Error(`Channel(${presence.currentChannelId}) not found`);
      }
      const server = servers[presence.currentServerId];
      if (!server) {
        throw new Error(`Server(${presence.currentServerId}) not found`);
      }

      // Create new message
      const messageId = uuidv4();
      const message = {
        ...newMessage,
        id: messageId,
        timestamp: Date.now().valueOf(),
      };
      messages[messageId] = message;
      await db.set(`messages.${messageId}`, message);

      // Add message to channel
      channel.messageIds.push(messageId);
      await db.set(`channels.${channel.id}`, channel);

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channel.id}`).emit('serverUpdate', {
        ...(await getServer(server.id)),
      });

      new Logger('WebSocket').info(
        `User(${user.id}) sent ${message.content} to channel(${channel.id})`,
      );
    } catch (error) {
      io.to(socket.id).emit('error', {
        message: `傳送訊息時發生錯誤: ${error.message}`,
        part: 'CHATMESSAGE',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error('Error sending message: ' + error.message);
    }
  });

  socket.on('addChannel', async (data) => {
    // d = {
    //   sessionId: '123456',
    //   channel: {
    //     name: '',
    //     permission: 'public',
    //     isLobby: false,
    //     isCategory: false,
    //     ...
    //   },
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      const sessionId = data.sessionId;
      const newChannel = data.channel;
      if (!sessionId || !newChannel) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error(`Invalid session ID(${sessionId})`);
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }
      const presence = presenceStates[`presence_${userId}`];
      if (!presence) {
        throw new Error(`Presence(${`presence_${userId}`}) not found`);
      }
      const server = servers[presence.currentServerId];
      if (!server) {
        throw new Error(`Server(${presence.currentServerId}) not found`);
      }

      // Create new channel
      const channelId = uuidv4();
      const channel = {
        ...newChannel,
        id: channelId,
        createdAt: Date.now().valueOf(),
      };
      channels[channelId] = channel;
      await db.set(`channels.${channelId}`, channel);

      // Add channel to server
      server.channelIds.push(channel.id);
      await db.set(`servers.${server.id}`, server);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        ...(await getServer(server.id)),
      });

      new Logger('WebSocket').info(
        `Adding new channel(${channel.id}) to server(${server.id})`,
      );
    } catch (error) {
      io.to(socket.id).emit('error', {
        message: `新增頻道時發生錯誤: ${error.message}`,
        part: 'ADDCHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error('Error adding channel: ' + error.message);
    }
  });

  socket.on('editChannel', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   channel: {
    //     id:
    //     name:
    //     permission:
    //     isCategory:
    //     ...
    //   },
    // };
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      const sessionId = data.sessionId;
      const editedChannel = data.channel;
      if (!sessionId || !channel) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error(`Invalid session ID(${sessionId})`);
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }
      const presence = presenceStates[`presence_${userId}`];
      if (!presence) {
        throw new Error(`Presence(${`presence_${userId}`}) not found`);
      }
      const server = servers[presence.currentServerId];
      if (!server) {
        throw new Error(`Server(${presence.currentServerId}) not found`);
      }
      const channel = channels[editedChannel.id];
      if (!channel) {
        throw new Error(`Channel(${editedChannel.id}) not found`);
      }

      // Update channel
      channels[channel.id] = {
        ...channel,
        ...editedChannel,
      };
      await db.set(`channels.${channel.id}`, channels[channel.id]);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        ...(await getServer(server.id)),
      });

      new Logger('WebSocket').info(
        `Edit channel(${channel.id}) in server(${server.id})`,
      );
    } catch (error) {
      io.to(socket.id).emit('error', {
        message: `編輯頻道時發生錯誤: ${error.message}`,
        part: 'EDITCHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error('Error editing channel: ' + error.message);
    }
  });

  socket.on('deleteChannel', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   channelId: '123456',
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      const sessionId = data.sessionId;
      const channelId = data.channelId;
      if (!sessionId || !channelId) {
        throw new Error('Missing required fields');
      }
      const userId = userSessions.get(sessionId);
      if (!userId) {
        throw new Error(`Invalid session ID(${sessionId})`);
      }
      const user = users[userId];
      if (!user) {
        throw new Error(`User(${userId}) not found`);
      }
      const presence = presenceStates[`presence_${userId}`];
      if (!presence) {
        throw new Error(`Presence(${`presence_${userId}`}) not found`);
      }
      const server = servers[presence.currentServerId];
      if (!server) {
        throw new Error(`Server(${presence.currentServerId}) not found`);
      }
      const channel = channels[channelId];
      if (!channel) {
        throw new Error(`Channel(${channelId}) not found`);
      }

      // Delete channel
      server.channelIds = server.channelIds.filter(
        (channelId) => channelId != channel.id,
      );
      await db.set(`servers.${server.id}`, server);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        ...(await getServer(server.id)),
      });

      new Logger('WebSocket').info(
        `Remove channel(${channel.id}) from server(${server.id})`,
      );
    } catch (error) {
      io.to(socket.id).emit('error', {
        message: `刪除頻道時發生錯誤: ${error.message}`,
        part: 'DELETECHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });

      new Logger('WebSocket').error('Error deleting channel: ' + error.message);
    }
  });
});

// Functions
const setupContributionInterval = (socketId, userId) => {
  try {
    const interval = setInterval(async () => {
      // Get database
      const user = (await db.get(`users.${userId}`)) || {};

      // Update user level per minute
      user.level += 1;
      await db.set(`users.${user.id}`, user);

      // Emit updated data (only to the user)
      io.to(socketId).emit('userUpdate', {
        level: user.level,
      });

      new Logger('WebSocket').info(
        `User(${user.id}) level up to ${user.level}`,
      );
    }, 10000);
    contributionInterval.set(socketId, interval);
  } catch (error) {
    clearContributionInterval(socketId);
    new Logger('WebSocket').error(
      'Error setting up contribution interval: ' + error.message,
    );
  }
};
const clearContributionInterval = (socketId) => {
  clearInterval(contributionInterval.get(socketId));
  contributionInterval.delete(socketId);
};
const setupCleanupInterval = async () => {
  const cleanupUnusedAvatars = async () => {
    try {
      // Get all avatar files from directory
      const files = await fs.readdir(uploadDir);

      // Get all servers from database
      const servers = (await db.get('servers')) || {};

      // Get list of active avatar URLs
      const activeAvatars = new Set(
        Object.values(servers)
          .map((server) => server.iconUrl)
          .filter((url) => url && !url.includes('logo_server_def.png'))
          .map((url) => path.basename(url)),
      );

      // Find unused avatar files
      const unusedFiles = files.filter((file) => {
        // Skip non-image files
        if (!Object.keys(MIME_TYPES).some((ext) => file.endsWith(ext))) {
          return false;
        }
        // Check if file is not used by any server
        return !activeAvatars.has(file);
      });

      // Delete unused files
      for (const file of unusedFiles) {
        try {
          await fs.unlink(path.join(uploadDir, file));
          new Logger('Cleanup').success(`Deleted unused avatar: ${file}`);
        } catch (error) {
          new Logger('Cleanup').error(
            `Error deleting file ${file}: ${error.message}`,
          );
        }
      }

      new Logger('Cleanup').info(
        `Cleanup complete. Removed ${unusedFiles.length} unused avatar files`,
      );
    } catch (error) {
      new Logger('Cleanup').error(`Avatar cleanup failed: ${error.message}`);
    }
  };

  // Run cleanup every 24 hours
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  setInterval(cleanupUnusedAvatars, CLEANUP_INTERVAL);

  // Run initial cleanup on setup
  cleanupUnusedAvatars().catch(console.error);
};
// Get Functions
const getServer = async (serverId) => {
  const servers = (await db.get('servers')) || {};
  const server = servers[serverId];
  if (!server) return null;
  return {
    ...server,
    members: await getServerMembers(serverId),
    channels: (
      await Promise.all(
        server.channelIds.map(
          async (channelId) => await getChannels(channelId),
        ),
      )
    ).filter((channel) => channel),
    lobby: await getChannels(server.lobbyId),
    owner: await getUser(server.ownerId),
  };
};
const getChannels = async (channelId) => {
  const _channels = (await db.get('channels')) || {};
  const channel = _channels[channelId];
  if (!channel) return null;
  return {
    ...channel,
    users: (
      await Promise.all(
        channel.userIds.map(async (userId) => await getUser(userId)),
      )
    ).filter((user) => user),
    messages: (
      await Promise.all(
        channel.messageIds.map(
          async (messageId) => await getMessages(messageId),
        ),
      )
    ).filter((message) => message),
  };
};
const getMessages = async (messageId) => {
  const _messages = (await db.get('messages')) || {};
  const message = _messages[messageId];
  if (!message) return null;
  return {
    ...message,
    sender: await getUser(message.senderId),
  };
};
const getUser = async (userId) => {
  const _users = (await db.get('users')) || {};
  const user = _users[userId];
  if (!user) return null;
  const { account, ...restUser } = user;
  return {
    ...restUser,
    badges: await getUserBadges(userId),
    presence: await getPresenceState(userId),
  };
};
const getUserBadges = async (userId) => {
  const _users = (await db.get('users')) || {};
  const _badges = (await db.get('badgeList')) || {};
  const userBadges = _users[userId].badgeIds
    .map((badgeId) => _badges[badgeId])
    .filter((badge) => badge);
  if (!userBadges) return null;
  return [...userBadges];
};
const getPresenceState = async (userId) => {
  const _presenceStates = (await db.get('presenceStates')) || {};
  const userPresenceState = Object.values(_presenceStates).find(
    (presence) => presence.userId === userId,
  );
  if (!userPresenceState) return null;
  return {
    ...userPresenceState,
  };
};
const getUserMembers = async (userId) => {
  const _members = (await db.get('members')) || {};
  const members = Object.values(_members).reduce((result, member) => {
    if (member?.userId === userId) {
      result[member.serverId] = member;
    }
    return result;
  }, {});
  if (!members) return null;
  return {
    ...members,
  };
};
const getServerMembers = async (serverId) => {
  const _members = (await db.get('members')) || {};
  const members = Object.values(_members).reduce((result, member) => {
    if (member?.serverId === serverId) {
      result[member.userId] = member;
    }
    return result;
  }, {});
  if (!members) return null;
  return {
    ...members,
  };
};
const getFriendCategories = async (userId) => {
  const _friendCategories = (await db.get('friendCategories')) || {};
  const userFriendCategories = Object.values(_friendCategories).filter(
    (fs) => fs.userId === userId,
  );
  if (!userFriendCategories) return null;
  return [
    ...(
      await Promise.all(
        userFriendCategories.map(
          async (category) => await getFriendCategory(category.id),
        ),
      )
    ).filter((category) => category),
  ];
};
const getFriendCategory = async (categoryId) => {
  const _friendCategories = (await db.get('friendCategories')) || {};
  const category = _friendCategories[categoryId];
  if (!category) return null;
  return {
    ...category,
    friends: (
      await Promise.all(
        category.friendIds.map(async (friendId) => await getUser(friendId)),
      )
    ).filter((friend) => friend),
  };
};
const getJoinRecServers = async (userId, limit = 10) => {
  const [_servers, _members] = await Promise.all([
    db.get('servers') || {},
    db.get('members') || {},
  ]);
  const userServerIds = new Set(
    Object.values(_members)
      .filter((member) => member.userId === userId)
      .map((member) => member.serverId),
  );
  const { joinedServers, notJoinedServers } = Object.values(_servers).reduce(
    (result, server) => {
      if (userServerIds.has(server.id)) result.joinedServers.push(server);
      else result.notJoinedServers.push(server);
      return result;
    },
    { joinedServers: [], notJoinedServers: [] },
  );
  const recommendedServers = _.sampleSize(notJoinedServers, limit) ?? [];

  return {
    joinedServers,
    recommendedServers,
  };
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
  setupCleanupInterval();
});

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
const userSessions = new Map();

// User Socket Connections
const userSockets = new Map();

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
        let iconPath = '/logo_server_def.png';
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

        // 創建新伺服器
        const serverId = uuidv4();
        const channelId = uuidv4();
        const membershipId = uuidv4();

        const server = {
          id: serverId,
          displayId: generateUniqueDisplayId(servers),
          name: name,
          announcement: description || '',
          icon: iconPath,
          userIds: [],
          channelIds: [channelId],
          lobbyId: channelId,
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

        // 儲存到資料庫
        const channel = {
          id: channelId,
          name: '大廳',
          permission: 'public',
          isLobby: true,
          isCategory: false,
          userIds: [],
          messageIds: [],
          parentId: null,
        };

        // 更新用戶的伺服器成員資格
        const member = {
          id: membershipId,
          serverId: serverId,
          userId: userId,
          nickname: user.name,
          permission: 6,
          managedChannels: [],
          contribution: 0,
          joinedAt: Date.now().valueOf(),
        };

        await db.set(`servers.${serverId}`, server);
        await db.set(`channels.${channelId}`, channel);
        await db.set(`members.${membershipId}`, member);

        new Logger('Server').success(
          `New server created: ${serverId} by user ${userId}`,
        );

        sendSuccess(res, {
          message: 'success',
          serverId: serverId,
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

  if (req.method === 'PATCH' && req.url === '/userData') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // Get database
        const users = (await db.get(`users`)) || {};

        // Validate data
        if (!data.name || !data.gender) {
          sendError(res, 400, 'Missing required fields');
          return;
        }
        const exists = Object.values(users).find((user) => user.id === data.id);
        if (!exists) {
          sendError(res, 401, '找不到此帳號');
          return;
        }

        users[data.id] = {
          ...users[data.id],
          name: data.name,
          gender: data.gender,
        };

        // Save to database
        await db.set(`users`, users);

        new Logger('User').success(`User data updated: ${data.id}`);
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
          sendError(res, 400, '無效的帳號或密碼');
          return;
        }
        const exist = userAccPwdList[account];
        if (!exist) {
          sendError(res, 401, '帳號或密碼錯誤');
          return;
        }
        if (password !== userAccPwdList[account]) {
          sendError(res, 401, '帳號或密碼錯誤');
          return;
        }

        const user = Object.values(users).find(
          (user) => user.account === account,
        );

        // Create user presence
        const presenceId = `presence_${user.id}`;
        const presence = {
          ...presenceStates[presenceId],
          status: 'online',
          lastActiveAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.set(`presenceStates.${presenceId}`, presence);

        // Generate session token
        const sessionToken = uuidv4();
        userSessions.set(sessionToken, user.id);

        new Logger('Auth').success(`User logged in: ${account}`);
        sendSuccess(res, {
          message: '登入成功',
          token: sessionToken,
        });
      } catch (error) {
        sendError(res, 500, 'Login failed');
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
          sendError(res, 400, '無效的帳號或密碼');
          return;
        }
        const username = data.username;
        if (!username) {
          sendError(res, 400, '無效的使用者名稱');
          return;
        }
        const exists = userAccPwdList[data.account];
        if (exists) {
          sendError(res, 400, '帳號已存在');
          return;
        }

        // Create user data
        const userId = uuidv4();
        const user = {
          id: userId,
          name: username,
          account: account,
          password: password,
          gender: data.gender || 'unknown',
          level: 1,
          signature: '',
          createdAt: Date.now(),
          badges: [
            {
              id: 'nerd',
              name: '超級書呆子',
              description: '官方認證的超級書呆子',
            },
          ],
          settings: {
            theme: 'light',
            notifications: true,
          },
        };
        await db.set(`users.${userId}`, user);

        // Create user presence
        const presenceId = `presence_${user.id}`;
        const presence = {
          id: presenceId,
          userId: user.id,
          currentServerId: null,
          currentChannelId: null,
          status: 'offline',
          customStatus: '',
          lastActiveAt: Date.now(),
          updatedAt: Date.now(),
        };
        presenceStates[presenceId] = presence;
        await db.set(`presenceStates.${presenceId}`, presence);

        // Save to database
        await db.set(`account_password.${account}`, password);

        new Logger('Auth').success(`User registered: ${account}`);
        sendSuccess(res, { message: '註冊成功' });
      } catch (error) {
        new Logger('Auth').error(`Register error: ${error.message}`);
        sendError(res, 500, '註冊失敗');
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
    // FIXME: Handle user disconnection

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      const userId = userSockets.get(socket.id);
      if (!userId) {
        new Logger('WebSocket').error(`Invalid session ID(${userSessions})`);
        socket.emit('error', {
          message: `無效的 socket ID`,
          part: 'CONNECTUSER', // FIXME: Change to 'DISCONNECTUSER'
          tag: 'USER_ERROR', // FIXME: Change to 'SOCKET_ERROR'
          status_code: 404,
        });
        return;
      }
      const user = users[userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${userId}) not found`);
        socket.emit('error', {
          message: `使用者不存在`,
          part: 'CONNECTUSER', // FIXME: Change to 'DISCONNECTUSER'
          tag: 'USER_ERROR', // FIXME: Change to 'SOCKET_ERROR'
          status_code: 404,
        });
        return;
      }
      const server =
        servers[presenceStates[`presence_${user.id}`].currentServerId];
      if (!server) {
        new Logger('WebSocket').error(
          `Server(${
            presenceStates[`presence_${user.id}`].currentServerId
          }) not found`,
        );
        socket.emit('error', {
          message: `伺服器不存在`,
          part: 'DISCONNECTSERVER',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
      }
      const channel =
        channels[presenceStates[`presence_${user.id}`].currentChannelId];
      if (!channel) {
        new Logger('WebSocket').error(
          `Channel(${
            presenceStates[`presence_${user.id}`].currentChannelId
          }) not found`,
        );
        socket.emit('error', {
          message: `頻道不存在`,
          part: 'DISCONNECTCHANNEL',
          tag: 'CHANNEL_ERROR',
          status_code: 404,
        });
      }

      // Remove user socket connection
      userSockets.delete(socket.id);

      // Update user presence
      const presenceId = `presence_${user.id}`;
      const presence = {
        ...presenceStates[presenceId],
        currentServerId: null,
        currentChannelId: null,
        status: 'offline',
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      };
      presenceStates[presenceId] = presence;
      await db.set(`userPresence.${presenceId}`, presence);

      if (channel) {
        // Update channel
        channel.userIds = channel.userIds.filter((id) => id !== user.id);
        await db.set(`channels.${channel.id}`, channel);

        // Emit data (to all users in the channel)
        io.to(`server_${server.id}`).emit('serverUpdate', {
          ...(await getServer(server.id)),
        });
      }

      new Logger('WebSocket').success(`User(${user.id}) disconnected`);
    } catch (error) {
      new Logger('WebSocket').error(
        `Error disconnecting user: ${error.message}`,
      );
      socket.emit('error', {
        message: `斷線時發生錯誤: ${error.message}`,
        part: 'DISCONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('connectUser', async (data) => {
    // Get database
    const users = (await db.get('users')) || {};

    try {
      // data = {
      //   sessionId: '123456',
      // }
      // console.log(data);

      // Validate data
      const userId = userSessions.get(data.sessionId);
      if (!userId) {
        // Emit error data (only to the user)
        io.to(socket.id).emit('disconnectUser');

        new Logger('WebSocket').error(`Invalid session ID(${userSessions})`);
        socket.emit('error', {
          message: `無效的 session ID`,
          part: 'CONNECTUSER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = users[userId];
      if (!user) {
        // Emit error data (only to the user)
        io.to(socket.id).emit('disconnectUser', null);

        new Logger('WebSocket').error(`User(${userId}) not found`);
        socket.emit('error', {
          message: `使用者不存在`,
          part: 'CONNECTUSER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }

      // Check if user is already connected
      for (const [key, value] of userSockets) {
        if (value === user.id) {
          new Logger('WebSocket').error(
            `User(${user.id}) already connected from another socket`,
          );
          io.to(key).emit('forceDisconnect');
          userSockets.delete(key);
          break;
        }
      }

      // Save user socket connection
      userSockets.set(socket.id, user.id);

      // Emit data (only to the user)
      io.to(socket.id).emit('connectUser', {
        ...(await getUser(user.id)),
        ...(await getJoinRecServers(user.id)),
        friendCategories: await getFriendCategories(user.id),
        members: await getUserMembers(user.id),
      });

      new Logger('WebSocket').success(`User(${user.id}) connected`);
    } catch (error) {
      // Emit error data (only to the user)
      io.to(socket.id).emit('disconnectUser', null);

      new Logger('WebSocket').error(
        `Error getting user data: ${error.message}`,
      );
      socket.emit('error', {
        message: `取得使用者時發生錯誤: ${error.message}`,
        part: 'CONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('disconnectUser', async (data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      // data = {
      //   sessionId: '123456',
      // }
      // console.log(data);

      const userId = userSessions.get(data.sessionId);
      if (!userId) {
        new Logger('WebSocket').error(`Invalid session ID(${userSessions})`);
        socket.emit('error', {
          message: `無效的 session ID`,
          part: 'CONNECTUSER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = users[userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${userId}) not found`);
        socket.emit('error', {
          message: `使用者不存在`,
          part: 'DISCONNECTUSER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const server =
        servers[presenceStates[`presence_${user.id}`].currentServerId];
      if (!server) {
        new Logger('WebSocket').error(
          `Server(${
            presenceStates[`presence_${user.id}`].currentServerId
          }) not found`,
        );
        socket.emit('error', {
          message: `伺服器不存在`,
          part: 'DISCONNECTSERVER',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
      }
      const channel =
        channels[presenceStates[`presence_${user.id}`].currentChannelId];
      if (!channel) {
        new Logger('WebSocket').error(
          `Channel(${
            presenceStates[`presence_${user.id}`].currentChannelId
          }) not found`,
        );
        socket.emit('error', {
          message: `頻道不存在`,
          part: 'DISCONNECTCHANNEL',
          tag: 'CHANNEL_ERROR',
          status_code: 404,
        });
      }

      // Remove user socket connection
      userSockets.delete(socket.id);

      // Update user presence
      const presenceId = `presence_${user.id}`;
      const presence = {
        ...presenceStates[presenceId],
        currentServerId: null,
        currentChannelId: null,
        status: 'offline',
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      };
      presenceStates[presenceId] = presence;
      await db.set(`userPresence.${presenceId}`, presence);

      if (channel) {
        // Update channel
        channel.userIds = channel.userIds.filter((id) => id !== user.id);
        await db.set(`channels.${channel.id}`, channel);

        // leave the channel
        socket.leave(`channel_${channel.id}`);

        // Emit data (only to the user)
        io.to(socket.id).emit('disconnectChannel');

        // Emit data (to all users in the channel)
        io.to(`server_${server.id}`).emit('serverUpdate', {
          ...(await getServer(server.id)),
        });
      }

      if (server) {
        // leave the server
        socket.leave(`server_${server.id}`);

        // Emit data (only to the user)
        io.to(socket.id).emit('disconnectServer');
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('disconnectUser');

      new Logger('WebSocket').success(`User(${user.id}) disconnected`);
    } catch (error) {
      new Logger('WebSocket').error(
        `Error disconnecting user: ${error.message}`,
      );
      socket.emit('error', {
        message: `登出時發生錯誤: ${error.message}`,
        part: 'DISCONNECTUSER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('connectServer', async (data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const members = (await db.get('members')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      // data = {
      //   sessionId:
      //   serverId:
      // }
      // console.log(data);

      const userId = userSessions.get(data.sessionId);
      if (!userId) {
        // Emit error data (only to the user)
        io.to(socket.id).emit('disconnectServer');

        new Logger('WebSocket').error(`Invalid session ID(${data.sessionId})`);
        socket.emit('error', {
          message: `無效的 session ID`,
          part: 'CONNECTSERVER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = users[userId];
      if (!user) {
        // Emit error data (only to the user)
        io.to(socket.id).emit('disconnectServer');

        new Logger('WebSocket').error(`User(${userId}) not found`);
        socket.emit('error', {
          message: `使用者不存在`,
          part: 'CONNECTSERVER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const server = servers[data.serverId];
      if (!server) {
        // Emit error data (only to the user)
        io.to(socket.id).emit('disconnectServer');

        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `伺服器不存在`,
          part: 'CONNECTSERVER',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }

      // Check if user is already exists in the server
      const exists = Object.values(members).find(
        (member) => member.serverId === server.id && member.userId === user.id,
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
      const presenceId = `presence_${user.id}`;
      const presence = {
        ...presenceStates[presenceId],
        currentServerId: server.id,
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      };
      presenceStates[presenceId] = presence;
      await db.set(`presenceStates.${presenceId}`, presence);

      // Join the server
      socket.join(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('connectServer', {
        ...(await getServer(server.id)),
      });
      io.to(socket.id).emit('userPresenceUpdate', {
        ...(await getPresenceState(user.id)),
      });

      new Logger('WebSocket').success(
        `User(${user.id}) connected to server(${server.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      io.to(socket.id).emit('disconnectServer');

      new Logger('WebSocket').error(
        `Error getting server data: ${error.message}`,
      );
      socket.emit('error', {
        message: `加入伺服器時發生錯誤: ${error.message}`,
        part: 'CONNECTSERVER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('disconnectServer', async (data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      // data = {
      //   sessionId: '123456',
      // }
      // console.log(data);

      const userId = userSessions.get(data.sessionId);
      if (!userId) {
        new Logger('WebSocket').error(`Invalid session ID(${data.sessionId})`);
        socket.emit('error', {
          message: `無效的 session ID`,
          part: 'DISCONNECTSERVER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = users[userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${userId}) not found`);
        socket.emit('error', {
          message: `使用者不存在`,
          part: 'DISCONNECTSERVER',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const server =
        servers[presenceStates[`presence_${user.id}`].currentServerId];
      if (!server) {
        new Logger('WebSocket').error(
          `Server(${
            presenceStates[`presence_${user.id}`].currentServerId
          }) not found`,
        );
        socket.emit('error', {
          message: `伺服器不存在`,
          part: 'DISCONNECTSERVER',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }
      const channel =
        channels[presenceStates[`presence_${user.id}`].currentChannelId];
      if (!channel) {
        new Logger('WebSocket').error(
          `Channel(${
            presenceStates[`presence_${user.id}`].currentChannelId
          }) not found`,
        );
        socket.emit('error', {
          message: `頻道不存在`,
          part: 'DISCONNECTSERVER',
          tag: 'CHANNEL_ERROR',
          status_code: 404,
        });
        return;
      }

      // Update user presence
      const presenceId = `presence_${user.id}`;
      const presence = {
        ...presenceStates[presenceId],
        currentServerId: null,
        currentChannelId: null,
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      };
      presenceStates[presenceId] = presence;
      await db.set(`userPresence.${presenceId}`, presence);

      if (channel) {
        // Update channel
        channel.userIds = channel.userIds.filter((id) => id !== user.id);
        await db.set(`channels.${channel.id}`, channel);

        // leave the channel
        socket.leave(`channel_${channel.id}`);

        // Emit data (only to the user)
        io.to(socket.id).emit('disconnectChannel');

        // Emit data (to all users in the channel)
        io.to(`server_${server.id}`).emit('serverUpdate', {
          ...(await getServer(server.id)),
        });
      }

      // Leave the server
      socket.leave(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('disconnectServer');
      io.to(socket.id).emit('userPresenceUpdate', {
        ...(await getPresenceState(user.id)),
      });

      new Logger('WebSocket').success(
        `User(${user.id}) disconnected from server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(
        `Error disconnecting from server: ${error.message}`,
      );
      socket.emit('error', {
        message: `離開伺服器時發生錯誤: ${error.message}`,
        part: 'DISCONNECTSERVER',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('chatMessage', async (data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const messages = (await db.get('messages')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      // data = {
      //   sessionId: '123456',
      //   message: {
      //     senderId: "",
      //     content: "",
      //   }
      // };
      // console.log(data);

      const _message = data.message;
      if (!_message) {
        new Logger('WebSocket').error('Invalid data (message missing)');
        socket.emit('error', {
          message: '無效的訊息資料',
          part: 'CHATMESSAGE',
          tag: 'MESSAGE_ERROR',
          status_code: 400,
        });
        return;
      }
      const userId = userSessions.get(data.sessionId);
      if (!userId) {
        new Logger('WebSocket').error(`Invalid session ID(${data.sessionId})`);
        socket.emit('error', {
          message: `無效的 session ID`,
          part: 'CHATMESSAGE',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = users[userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${userId}) not found`);
        socket.emit('error', {
          message: `使用者不存在`,
          part: 'CHATMESSAGE',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const channel =
        channels[presenceStates[`presence_${user.id}`].currentChannelId];
      if (!channel) {
        new Logger('WebSocket').error(
          `Channel(${
            presenceStates[`presence_${user.id}`].currentChannelId
          }) not found`,
        );
        socket.emit('error', {
          message: `頻道不存在`,
          part: 'CHATMESSAGE',
          tag: 'CHANNEL_ERROR',
          status_code: 404,
        });
        return;
      }
      const server =
        servers[presenceStates[`presence_${user.id}`].currentServerId];
      if (!server) {
        new Logger('WebSocket').error(
          `Server(${
            presenceStates[`presence_${user.id}`].currentServerId
          }) not found`,
        );
        socket.emit('error', {
          message: `伺服器不存在`,
          part: 'ADDCHANNEL',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }

      // Create new message
      const messageId = uuidv4();
      const message = {
        ..._message,
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
      new Logger('WebSocket').error(error.message);
      socket.emit('error', {
        message: `傳送訊息時發生錯誤: ${error.message}`,
        part: 'CHATMESSAGE',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('addChannel', async (data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      // d = {
      //   sessionId: '123456',
      //   channel: {
      //     name: '',
      //     permission: 'public',
      //     isLobby: false,
      //     isCategory: false,
      //   },
      // }
      // console.log(data);

      const _channel = data.channel;
      if (!_channel) {
        new Logger('WebSocket').error('Invalid data (channel missing)');
        socket.emit('error', {
          message: '無效的頻道資料',
          part: 'ADDCHANNEL',
          tag: 'CHANNEL_ERROR',
          status_code: 400,
        });
        return;
      }
      const userId = userSessions.get(data.sessionId);
      if (!userId) {
        new Logger('WebSocket').error(`Invalid session ID(${data.sessionId})`);
        socket.emit('error', {
          message: `無效的 session ID`,
          part: 'CHATMESSAGE',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = users[userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${userId}) not found`);
        socket.emit('error', {
          message: `使用者不存在`,
          part: 'CHATMESSAGE',
          tag: 'USER_ERROR',
          status_code: 404,
        });
      }
      const server =
        servers[presenceStates[`presence_${user.id}`].currentServerId];
      if (!server) {
        new Logger('WebSocket').error(
          `Server(${
            presenceStates[`presence_${user.id}`].currentServerId
          }) not found`,
        );
        socket.emit('error', {
          message: `伺服器不存在`,
          part: 'ADDCHANNEL',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }

      // Create new channel
      const channelId = uuidv4();
      const channel = {
        ..._channel,
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
      new Logger('WebSocket').error(error.message);
      socket.emit('error', {
        message: `新增頻道時發生錯誤: ${error.message}`,
        part: 'ADDCHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('editChannel', async (data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};
    const servers = (await db.get('servers')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      // data = {
      //   sessionId: '123456',
      //   channel: {
      //     id:
      //     name:
      //     permission:
      //     isCategory:
      //   },
      // };
      // console.log(data);

      const channel = data.channel;
      if (!channel) {
        new Logger('WebSocket').error('Invalid data (channel missing)');
        socket.emit('error', {
          message: '無效的頻道資料',
          part: 'EDITCHANNEL',
          tag: 'CHANNEL_ERROR',
          status_code: 400,
        });
        return;
      }
      const userId = userSessions.get(data.sessionId);
      if (!userId) {
        new Logger('WebSocket').error(`Invalid session ID(${data.sessionId})`);
        socket.emit('error', {
          message: `無效的 session ID`,
          part: 'CHATMESSAGE',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = users[userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${userId}) not found`);
        socket.emit('error', {
          message: `使用者不存在`,
          part: 'CHATMESSAGE',
          tag: 'USER_ERROR',
          status_code: 404,
        });
      }
      const server =
        servers[presenceStates[`presence_${user.id}`].currentServerId];
      if (!server) {
        new Logger('WebSocket').error(
          `Server(${
            presenceStates[`presence_${user.id}`].currentServerId
          }) not found`,
        );
        socket.emit('error', {
          message: `伺服器不存在`,
          part: 'EDITCHANNEL',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }

      // Update channel
      await db.set(`channel.${channel.id}`, channel);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        ...(await getServer(server.id)),
      });

      new Logger('WebSocket').info(
        `Edit channel(${channel.id}) in server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(error.message);
      socket.emit('error', {
        message: `編輯頻道時發生錯誤: ${error.message}`,
        part: 'EDITCHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('deleteChannel', async (data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};
    const servers = (await db.get('servers')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      // data = {
      //   sessionId: '123456',
      //   channelId: '123456',
      // }
      // console.log(data);

      const channel = channels[data.channelId];
      if (!channel) {
        new Logger('WebSocket').error(`Channel(${data.channelId}) not found`);
        socket.emit('error', {
          message: `頻道不存在`,
          part: 'DELETECHANNEL',
          tag: 'CHANNEL_ERROR',
          status_code: 404,
        });
        return;
      }
      const userId = userSessions.get(data.sessionId);
      if (!userId) {
        new Logger('WebSocket').error(`Invalid session ID(${data.sessionId})`);
        socket.emit('error', {
          message: `無效的 session ID`,
          part: 'CHATMESSAGE',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = users[userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${userId}) not found`);
        socket.emit('error', {
          message: `使用者不存在`,
          part: 'CHATMESSAGE',
          tag: 'USER_ERROR',
          status_code: 404,
        });
      }
      const server =
        servers[presenceStates[`presence_${user.id}`].currentServerId];
      if (!server) {
        new Logger('WebSocket').error(
          `Server(${
            presenceStates[`presence_${user.id}`].currentServerId
          }) not found`,
        );
        socket.emit('error', {
          message: `伺服器不存在`,
          part: 'EDITCHANNEL',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
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
      new Logger('WebSocket').error(error.message);
      socket.emit('error', {
        message: `Error deleting channle from server: ${error.message}`,
        part: 'DELETECHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('connectChannel', async (data) => {
    // Get database
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const users = (await db.get('users')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // validate data
      // data = {
      //   sessionId: '123456',
      //   channelId: '123456',
      // }
      // console.log(data);

      const channel = channels[data.channelId];
      if (!channel && data.channelId) {
        new Logger('WebSocket').error(`Channel(${data.channelId}) not found`);
        socket.emit('error', {
          message: `頻道不存在`,
          part: 'JOINCHANNEL',
          tag: 'CHANNEL_ERROR',
          status_code: 404,
        });
        return;
      }
      const userId = userSessions.get(data.sessionId);
      if (!userId) {
        new Logger('WebSocket').error(`Invalid session ID(${data.sessionId})`);
        socket.emit('error', {
          message: `無效的 session ID`,
          part: 'CHATMESSAGE',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = users[userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${userId}) not found`);
        socket.emit('error', {
          message: `使用者不存在`,
          part: 'CHATMESSAGE',
          tag: 'USER_ERROR',
          status_code: 404,
        });
      }
      const server =
        servers[presenceStates[`presence_${user.id}`].currentServerId];
      if (!server) {
        new Logger('WebSocket').error(
          `Server(${
            presenceStates[`presence_${user.id}`].currentServerId
          }) not found`,
        );
        socket.emit('error', {
          message: `伺服器不存在`,
          part: 'EDITCHANNEL',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }
      if (channel.permission === 'private') {
        new Logger('WebSocket').error(`Permission denied`);
        socket.emit('error', {
          message: '權限不足',
          part: 'JOINCHANNEL',
          tag: 'PERMISSION_ERROR',
          status_code: 403,
        });
        return;
      }

      // check if user is already in a channel, if so, disconnect the channel
      const oldChannelId =
        presenceStates[`presence_${user.id}`]?.currentChannelId;
      if (oldChannelId && channels[oldChannelId]) {
        const oldChannel = channels[oldChannelId];
        oldChannel.userIds = oldChannel.userIds.filter((id) => id !== user.id);
        await db.set(`channels.${oldChannel.id}`, oldChannel);
        socket.leave(`channel_${oldChannel.id}`);
        io.to(`channel_${oldChannel.id}`).emit('playSound', 'leave');
      }

      // Update user presence
      const presenceId = `presence_${user.id}`;
      const presence = {
        ...presenceStates[presenceId],
        currentServerId: server.id,
        currentChannelId: channel.id,
        updatedAt: Date.now(),
      };
      presenceStates[presenceId] = presence;
      await db.set(`presenceStates.${presenceId}`, presence);

      // Update channel
      if (!channel.userIds.includes(user.id)) {
        channel.userIds.push(user.id);
        await db.set(`channels.${channel.id}`, channel);
      }

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'join');

      // Join the channel
      socket.join(`channel_${channel.id}`);

      // Emit updated data (only to the user)
      io.to(socket.id).emit('connectChannel', {});
      io.to(socket.id).emit('userPresenceUpdate', {
        ...(await getPresenceState(user.id)),
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
      io.to(socket.id).emit('disconnectChannel');

      new Logger('WebSocket').error(
        `Error connecting to channel: ${error.message}`,
      );
      socket.emit('error', {
        message: `加入頻道失敗`,
        part: 'JOINCHANNEL',
        tag: 'EXCEPTION_ERROR',
        status_code: 500,
      });
    }
  });

  socket.on('disconnectChannel', async (data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};
    const servers = (await db.get('servers')) || {};
    const presenceStates = (await db.get('presenceStates')) || {};

    try {
      // Validate data
      // data = {
      //   sessionId: '123456',
      // }
      // console.log(data);

      const userId = userSessions.get(data.sessionId);
      if (!userId) {
        new Logger('WebSocket').error(`Invalid session ID(${data.sessionId})`);
        socket.emit('error', {
          message: `無效的 session ID`,
          part: 'DISCONNECTCHANNEL',
          tag: 'USER_ERROR',
          status_code: 404,
        });
        return;
      }
      const user = users[userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${userId}) not found`);
        socket.emit('error', {
          message: `使用者不存在`,
          part: 'DISCONNECTCHANNEL',
          tag: 'USER_ERROR',
          status_code: 404,
        });
      }
      const channel =
        channels[presenceStates[`presence_${user.id}`].currentChannelId];
      if (!channel) {
        new Logger('WebSocket').error(
          `Channel(${
            presenceStates[`presence_${user.id}`].currentChannelId
          }) not found`,
        );
        socket.emit('error', {
          message: `頻道不存在`,
          part: 'DISCONNECTCHANNEL',
          tag: 'CHANNEL_ERROR',
          status_code: 404,
        });
        return;
      }
      const server =
        servers[presenceStates[`presence_${user.id}`].currentServerId];
      if (!server) {
        new Logger('WebSocket').error(
          `Server(${
            presenceStates[`presence_${user.id}`].currentServerId
          }) not found`,
        );
        socket.emit('error', {
          message: `伺服器不存在`,
          part: 'DISCONNECTCHANNEL',
          tag: 'SERVER_ERROR',
          status_code: 404,
        });
        return;
      }

      // Update user presence
      const presenceId = `presence_${user.id}`;
      const presence = {
        ...presenceStates[presenceId],
        currentChannelId: null,
        updatedAt: Date.now(),
      };
      presenceStates[presenceId] = presence;
      await db.set(`presenceStates.${presenceId}`, presence);

      // Update channel
      channel.userIds = channel.userIds.filter((id) => id !== user.id);
      await db.set(`channels.${channel.id}`, channel);

      // Leave the channel
      socket.leave(`channel_${channel.id}`);

      // Emit updated data (only to the user)
      io.to(socket.id).emit('disconnectChannel');
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
      new Logger('WebSocket').error(
        `Error disconnecting from channel: ${error.message}`,
      );
      socket.emit('error', {
        message: `離開頻道時發生錯誤: ${error.message}`,
        part: 'DISCONNECTCHANNEL',
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
const getServer = async (serverId) => {
  const servers = (await db.get('servers')) || {};
  const server = servers[serverId];
  if (!server) return null;
  const members = await getServerMembers(serverId);
  const channels = (
    await Promise.all(
      server.channelIds.map(async (channelId) => await getChannels(channelId)),
    )
  ).filter((channel) => channel);
  const lobby = await getChannels(server.lobbyId);
  const owner = await getUser(server.ownerId);
  return {
    ...server,
    members: members,
    channels: channels,
    lobby: lobby,
    owner: owner,
  };
};
const getChannels = async (channelId) => {
  const _channels = (await db.get('channels')) || {};
  const channel = _channels[channelId];
  if (!channel) return null;
  const users = (
    await Promise.all(
      channel.userIds.map(async (userId) => await getUser(userId)),
    )
  ).filter((user) => user);
  const messages = (
    await Promise.all(
      channel.messageIds.map(async (messageId) => await getMessages(messageId)),
    )
  ).filter((message) => message);
  return {
    ...channel,
    users: users,
    messages: messages,
  };
};
const getMessages = async (messageId) => {
  const _messages = (await db.get('messages')) || {};
  const message = _messages[messageId];
  if (!message) return null;
  const sender = await getUser(message.senderId);
  return {
    ...message,
    sender: sender,
  };
};
const getUser = async (userId) => {
  const _users = (await db.get('users')) || {};
  const user = _users[userId];
  if (!user) return null;
  const presence = await getPresenceState(userId);
  const badges = await getUserBadges(userId);

  return {
    id: user.id,
    name: user.name,
    gender: user.gender,
    level: user.level,
    signature: user.signature,
    badges,
    presence,
  };
};
const getUserBadges = async (userId) => {
  const _badges = (await db.get('badgeList')) || {};
  const userBadges = Object.values(_badges)
    .filter((badge) => badge.ownedBy.includes(userId))
    .map(({ ownedBy, ...badgeWithoutOwners }) => badgeWithoutOwners);

  return userBadges;
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
  // if (!members) return null;
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
  // if (!members) return null;
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
  const friendCategories = (
    await Promise.all(
      userFriendCategories.map(
        async (category) => await getFriendCategory(category.id),
      ),
    )
  ).filter((category) => category);
  return [...friendCategories];
};
const getFriendCategory = async (categoryId) => {
  const _friendCategories = (await db.get('friendCategories')) || {};
  const category = _friendCategories[categoryId];
  if (!category) return null;
  const friends = (
    await Promise.all(
      category.friendIds.map(async (friendId) => await getUser(friendId)),
    )
  ).filter((friend) => friend);
  return {
    ...category,
    friends: friends,
  };
};
const getJoinRecServers = async (userId, limit = 10) => {
  try {
    const [_servers = {}, _members = {}] = await Promise.all([
      db.get('servers'),
      db.get('members'),
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
  } catch (error) {
    console.error('Error in getJoinRecServers:', error);
    throw new Error('Failed to get recommended servers');
  }
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

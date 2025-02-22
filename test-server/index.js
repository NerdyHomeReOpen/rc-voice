/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');
const utils = require('./utils');
const Logger = utils.logger;
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const _ = require('lodash');
const fs = require('fs').promises;

// TODO: Separate disconnect logic to avoid code duplication (disconnectUser, disconnectServer, disconnectChannel)

// XP System Constants
const XP_SYSTEM = {
  BASE_XP: 5, // Base XP required for level 2
  GROWTH_RATE: 1.02, // XP requirement increases by 2% per level
  XP_PER_HOUR: 1, // XP gained per hour in voice channel
  INTERVAL_MS: 60 * 60 * 1000, // 1 hour in milliseconds
};

const PORT = 4500;
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };

// Send Error/Success Response
const sendError = (res, statusCode, message) => {
  res.writeHead(statusCode, CONTENT_TYPE_JSON);
  res.end(JSON.stringify({ error: message }));
};

//socket error

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

  // if (req.method === 'GET' && req.url.startsWith('/uploads/')) {
  //   try {
  //     // Get the file path relative to uploads directory
  //     const relativePath = req.url.replace('/uploads/', '');
  //     const filePath = path.join(UPLOADS_DIR, relativePath);

  //     // Validate file path to prevent directory traversal
  //     if (!filePath.startsWith(UPLOADS_DIR)) {
  //       sendError(res, 403, '無權限存取此檔案');
  //       return;
  //     }

  //     // Get file extension and MIME type
  //     const ext = path.extname(filePath).toLowerCase();
  //     const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  //     // Read and serve the file
  //     fs.readFile(filePath)
  //       .then((data) => {
  //         res.writeHead(200, {
  //           'Content-Type': contentType,
  //           'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
  //           'Access-Control-Allow-Origin': '*', // 允許跨域存取
  //         });
  //         res.end(data);
  //       })
  //       .catch((error) => {
  //         if (error.code === 'ENOENT') {
  //           sendError(res, 404, '找不到檔案');
  //         } else {
  //           sendError(res, 500, '讀取檔案失敗');
  //         }
  //       });
  //     return;
  //   } catch (error) {
  //     sendError(res, 500, '伺服器錯誤');
  //     return;
  //   }
  // }

  // if (req.method === 'POST' && req.url === '/servers') {
  //   const form = new formidable.IncomingForm({
  //     uploadDir: uploadDir,
  //     keepExtensions: true,
  //     maxFileSize: 5 * 1024 * 1024, // 限制 5MB
  //     multiples: false,
  //     allowEmptyFiles: false,
  //   });

  //   form.parse(req, async (err, fields, files) => {
  //     // 用於追蹤上傳的檔案路徑
  //     let uploadedFilePath = null;

  //     try {
  //       if (err) {
  //         sendError(res, 400, '檔案上傳失敗');
  //         return;
  //       }

  //       // 保存上傳的檔案路徑以便需要時刪除
  //       if (files.icon && files.icon[0]) {
  //         uploadedFilePath = files.icon[0].filepath;
  //       }

  //       // 處理頭像路徑
  //       let iconPath = null;
  //       if (uploadedFilePath) {
  //         iconPath = `/uploads/serverAvatars/${path.basename(
  //           uploadedFilePath,
  //         )}`;
  //       }

  //       const _userId = fields.userId;
  //       const userId = _userId ? _userId.toString() : null;
  //       if (!userId) {
  //         throw new Error('缺少使用者ID');
  //       }

  //       const name = fields.name
  //         ? fields.name.toString().trim().substring(0, 30)
  //         : 'Untitled Server';
  //       const description = fields.description
  //         ? fields.description.toString().substring(0, 200)
  //         : '';

  //       // 驗證必要欄位
  //       if (!name || !userId) {
  //         throw new Error('缺少必要欄位');
  //       }

  //       // 獲取資料庫
  //       const servers = (await db.get('servers')) || {};
  //       const users = (await db.get('users')) || {};

  //       // 檢查用戶是否存在
  //       const user = users[userId];
  //       if (!user) {
  //         throw new Error('用戶不存在');
  //       }

  //       // 檢查用戶創建的伺服器數量
  //       const userOwnedServerCount = user.ownedServerIds.length;
  //       if (userOwnedServerCount >= 3) {
  //         throw new Error('已達到最大擁有伺服器數量限制');
  //       }

  //       // Create main channel
  //       const channelId = uuidv4();
  //       const channel = {
  //         id: channelId,
  //         name: '大廳',
  //         messageIds: [],
  //         parentId: null,
  //         userIds: [],
  //         isCategory: false,
  //         isLobby: true,
  //         settings: {
  //           bitrate: 64000,
  //           slowmode: false,
  //           userLimit: -1,
  //           visibility: 'public',
  //         },
  //         createdAt: Date.now().valueOf(),
  //         order: 0,
  //       };
  //       await db.set(`channels.${channelId}`, channel);

  //       // Create new server
  //       const displayId = await getDisplayId();
  //       const serverId = uuidv4();
  //       const server = {
  //         id: serverId,
  //         name: name,
  //         iconUrl: iconPath,
  //         level: 0,
  //         announcement: description || '',
  //         channelIds: [channelId],
  //         displayId: displayId,
  //         lobbyId: channelId,
  //         ownerId: userId,
  //         settings: {
  //           allowDirectMessage: true,
  //           visibility: 'public',
  //           defaultChannelId: channelId,
  //         },
  //         createdAt: Date.now().valueOf(),
  //       };
  //       await db.set(`servers.${serverId}`, server);

  //       // Create new member
  //       const memberId = uuidv4();
  //       const member = {
  //         id: memberId,
  //         nickname: user.name,
  //         serverId: serverId,
  //         userId: userId,
  //         contribution: 0,
  //         managedChannels: [],
  //         permissionLevel: 6,
  //         joinedAt: Date.now().valueOf(),
  //       };
  //       await db.set(`members.${memberId}`, member);

  //       // Update user data
  //       user.ownedServerIds.push(serverId);
  //       await db.set(`users.${userId}`, user);

  //       new Logger('Server').success(
  //         `New server created: ${serverId} by user ${userId}`,
  //       );

  //       sendSuccess(res, {
  //         message: 'success',
  //         data: {
  //           serverId: serverId,
  //         },
  //       });
  //     } catch (error) {
  //       // 刪除上傳的檔案
  //       if (uploadedFilePath) {
  //         fs.unlink(uploadedFilePath).catch((err) => {
  //           new Logger('Server').error(`Error deleting file: ${err.message}`);
  //         });
  //       }

  //       new Logger('Server').error(`Create server error: ${error.message}`);
  //       sendError(
  //         res,
  //         error.message === '用戶不存在' ? 404 : 400,
  //         error.message,
  //       );
  //     }
  //   });
  //   return;
  // }

  // if (req.method === 'POST' && req.url === '/user/friends') {
  //   let body = '';
  //   req.on('data', (chunk) => {
  //     body += chunk.toString();
  //   });
  //   req.on('end', async () => {
  //     try {
  //       const data = JSON.parse(body);
  //       // data = {
  //       //  "sessionId": "123456",
  //       // }

  //       // Get database
  //       const users = (await db.get('users')) || {};

  //       // Validate data
  //       const userId = userSessions.get(data.sessionId);
  //       if (!userId) {
  //         throw new Error('Invalid session ID');
  //       }
  //       const user = users[userId];
  //       if (!user) {
  //         throw new Error('User not found');
  //       }

  //       sendSuccess(res, {
  //         message: '獲取好友成功',
  //         data: { friendCategories: await getFriendCategories(userId) },
  //       });
  //       new Logger('Friends').success(`User(${userId}) friends fetched`);
  //     } catch (error) {
  //       sendError(res, 500, `獲取好友時發生錯誤: ${error.message}`);
  //       new Logger('Friends').error(`Fetch friends error: ${error.message}`);
  //     }
  //   });
  //   return;
  // }

  // if (req.method === 'POST' && req.url === '/user/directMessage') {
  //   let body = '';
  //   req.on('data', (chunk) => {
  //     body += chunk.toString();
  //   });
  //   req.on('end', async () => {
  //     try {
  //       const data = JSON.parse(body);
  //       // data = {
  //       //   "sessionId": "123456",
  //       //   "friendId": "789123",
  //       // }

  //       // Get database
  //       const users = (await db.get('users')) || {};

  //       // Validate data
  //       const sessionId = data.sessionId;
  //       const friendId = data.friendId;
  //       if (!sessionId || !friendId) {
  //         throw new Error('Missing required fields');
  //       }
  //       const userId = userSessions.get(sessionId);
  //       if (!userId) {
  //         throw new Error(`Invalid session ID(${sessionId})`);
  //       }
  //       const user = users[userId];
  //       if (!user) {
  //         throw new Error(`User(${userId}) not found`);
  //       }
  //       const friend = users[friendId];
  //       if (!friend) {
  //         throw new Error(`Friend(${friendId}) not found`);
  //       }

  //       sendSuccess(res, {
  //         message: '獲取私人訊息成功',
  //         data: { messages: await getDirectMessages(userId, friend.id) },
  //       });
  //       new Logger('DirectMessage').success(
  //         `User(${userId}) direct message fetched`,
  //       );
  //     } catch (error) {
  //       sendError(res, 500, `獲取私人訊息時發生錯誤: ${error.message}`);
  //       new Logger('DirectMessage').error(
  //         `Fetch direct message error: ${error.message}`,
  //       );
  //     }
  //   });
  //   return;
  // }

  // if (req.method == 'POST' && req.url == '/validateToken') {
  //   let body = '';
  //   req.on('data', (chunk) => {
  //     body += chunk.toString();
  //   });
  //   req.on('end', async () => {
  //     try {
  //       const data = JSON.parse(body);
  //       // data = {
  //       //   "sessionId": "123456",
  //       // }

  //       // Validate data
  //       const sessionId = data.sessionId;
  //       if (!sessionId) {
  //         throw new Error('Missing required fields');
  //       }
  //       const isValid = userSessions.has(sessionId);
  //       if (!isValid) {
  //         throw new Error('Invalid session ID');
  //       }

  //       sendSuccess(res, { message: 'Token validated' });
  //     } catch (error) {
  //       sendError(res, 500, `Token validation error: ${error.message}`);
  //       new Logger('Auth').error(`Token validation error: ${error.message}`);
  //     }
  //   });
  //   return;
  // }

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
        const accountPasswords = (await db.get(`accountPasswords`)) || {};
        const accountUserIds = (await db.get(`accountUserIds`)) || {};
        const users = (await db.get(`users`)) || {};

        console.log(users);

        // Validate data
        const account = data.account;
        const password = data.password;
        if (!account || !password) {
          throw new Error('無效的帳號或密碼');
        }
        const exist = accountPasswords[account];
        if (!exist) {
          throw new Error('帳號或密碼錯誤');
        }
        if (password !== accountPasswords[account]) {
          throw new Error('帳號或密碼錯誤');
        }
        const user = Object.values(users).find(
          (user) => user.id === accountUserIds[account],
        );
        if (!user) {
          throw new Error('用戶不存在');
        }

        // Update user
        users[user.id] = {
          ...user,
          status: 'online',
          lastActiveAt: Date.now(),
        };
        await db.set(`users.${user.id}`, users[user.id]);

        // Generate session id
        const sessionId = uuidv4();
        utils.map.userSessions.set(sessionId, user.id);

        sendSuccess(res, {
          message: '登入成功',
          data: {
            sessionId: sessionId,
            user: await utils.get.user(user.id),
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
        const accountPasswords = (await db.get(`accountPasswords`)) || {};
        const users = (await db.get(`users`)) || {};

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
        const exists = accountPasswords[data.account];
        if (exists) {
          throw new Error('帳號已存在');
        }

        // Create user data
        const userId = uuidv4();
        users[userId] = {
          id: userId,
          gender: 'Male',
          status: 'offline',
          name: username,
          signature: '',
          avatarUrl: '',
          level: 1,
          xp: 0,
          requiredXp: XP_SYSTEM.BASE_XP,
          progress: 0,
          currentChannelId: null,
          currentServerId: null,
          customStatus: '',
          lastActiveAt: Date.now(),
          createdAt: Date.now(),
        };
        await db.set(`users.${userId}`, users[userId]);

        // Create account password list
        await db.set(`accountPasswords.${account}`, password);
        await db.set(`accountUserIds.${account}`, userId);

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

// Yeci fix here

// socket.on('getMembers', async (data) => {
//   // data = {
//   //   sessionId
//   //   serverId
//   // }
//   // console.log(data);

//   // Get database
//   const users = (await db.get('users')) || {};
//   const servers = (await db.get('servers')) || {};
//   const members = (await db.get('members')) || {};

//   try {
//     // Validate data
//     const sessionId = data.sessionId;
//     const serverId = data.serverId;
//     if (!sessionId || !serverId) {
//       throw new SocketError(
//         'Missing required fields',
//         'GETMEMBERS',
//         'DATA',
//         400,
//       );
//     }

//     const userId = userSessions.get(sessionId);
//     if (!userId) {
//       throw new SocketError(
//         `Invalid session ID(${sessionId})`,
//         'GETMEMBERS',
//         'USER_ID',
//         400,
//       );
//     }

//     const user = users[userId];
//     if (!user) {
//       throw new SocketError(
//         `User(${userId}) not found`,
//         'GETMEMBERS',
//         'USER',
//         404,
//       );
//     }

//     const server = servers[serverId];
//     if (!server) {
//       throw new SocketError(
//         `Server(${serverId}) not found`,
//         'GETMEMBERS',
//         'SERVER',
//         404,
//       );
//     }

//     // Check if user has permission to view members
//     const userPermission = await getPermissionLevel(userId, server.id);
//     if (userPermission < 5) {
//       throw new SocketError(
//         'Insufficient permissions',
//         'GETMEMBERS',
//         'USER_PERMISSION',
//         403,
//       );
//     }

//     // Get all members for this server
//     const serverMembers = Object.values(members)
//       .filter((member) => member.serverId === serverId)
//       .map(async (member) => ({
//         ...member,
//       }));

//     const resolvedMembers = await Promise.all(serverMembers);

//     socket.emit('members', resolvedMembers);

//     new Logger('Members').success(`Members fetched for server(${serverId})`);
//   } catch (error) {
//     if (error instanceof SocketError) {
//       io.to(socket.id).emit('error', {
//         message: error.message,
//         part: error.part,
//         tag: error.tag,
//         status_code: error.status_code,
//       });
//     } else {
//       io.to(socket.id).emit('error', {
//         message: `獲取成員時發生無法預期的錯誤: ${error.message}`,
//         part: 'GETMEMBERS',
//         tag: 'EXCEPTION_ERROR',
//         status_code: 500,
//       });
//     }
//     new Logger('Members').error(`Error getting members: ${error.message}`);

//     // Emit error data (only to the user)
//     io.to(socket.id).emit('members', []);
//   }
// });

// socket.on('getApplications', async (data) => {
//   const users = (await db.get('users')) || {};
//   const servers = (await db.get('servers')) || {};
//   const applications = (await db.get('serverApplications')) || {};

//   try {
//     const { sessionId, serverId } = data;
//     if (!sessionId || !serverId) {
//       throw new SocketError(
//         'Missing required fields',
//         'GETAPPLICATIONS',
//         'DATA',
//         400,
//       );
//     }

//     const userId = userSessions.get(sessionId);
//     if (!userId) {
//       throw new SocketError(
//         `Invalid session ID(${sessionId})`,
//         'GETAPPLICATIONS',
//         'USER_ID',
//         400,
//       );
//     }

//     const user = users[userId];
//     if (!user) {
//       throw new SocketError(
//         `User(${userId}) not found`,
//         'GETAPPLICATIONS',
//         'USER',
//         404,
//       );
//     }

//     const server = servers[serverId];
//     if (!server) {
//       throw new SocketError(
//         `Server(${serverId}) not found`,
//         'GETAPPLICATIONS',
//         'SERVER',
//         404,
//       );
//     }

//     // Check if user has permission to view applications
//     const userPermission = await getPermissionLevel(userId, server.id);
//     if (userPermission < 5) {
//       throw new SocketError(
//         'Insufficient permissions',
//         'GETAPPLICATIONS',
//         'USER_PERMISSION',
//         403,
//       );
//     }

//     // Get all applications for this server
//     const serverApplications = Object.values(applications)
//       .filter((app) => app.serverId === serverId)
//       .map(async (app) => ({
//         ...app,
//         user: await getUser(app.userId),
//       }));

//     const resolvedApplications = await Promise.all(serverApplications);

//     socket.emit('applications', resolvedApplications);

//     new Logger('Applications').success(
//       `Applications fetched for server(${serverId})`,
//     );
//   } catch (error) {
//     if (error instanceof SocketError) {
//       io.to(socket.id).emit('error', {
//         message: error.message,
//         part: error.part,
//         tag: error.tag,
//         status_code: error.status_code,
//       });
//     } else {
//       io.to(socket.id).emit('error', {
//         message: `獲取申請列表時發生無法預期的錯誤: ${error.message}`,
//         part: 'GETAPPLICATIONS',
//         tag: 'EXCEPTION_ERROR',
//         status_code: 500,
//       });
//     }
//     new Logger('Applications').error(
//       `Error getting applications: ${error.message}`,
//     );
//   }
// });

// socket.on('handleApplication', async (data) => {
//   const users = (await db.get('users')) || {};
//   const servers = (await db.get('servers')) || {};
//   const members = (await db.get('members')) || {};
//   const applications = (await db.get('serverApplications')) || {};

//   try {
//     const { sessionId, serverId, applicationId, action } = data;
//     if (!sessionId || !serverId || !applicationId || !action) {
//       throw new SocketError(
//         'Missing required fields',
//         'HANDLEAPPLICATION',
//         'DATA',
//         400,
//       );
//     }

//     const userId = userSessions.get(sessionId);
//     if (!userId) {
//       throw new SocketError(
//         `Invalid session ID(${sessionId})`,
//         'HANDLEAPPLICATION',
//         'USER_ID',
//         400,
//       );
//     }

//     const user = users[userId];
//     if (!user) {
//       throw new SocketError(
//         `User(${userId}) not found`,
//         'HANDLEAPPLICATION',
//         'USER',
//         404,
//       );
//     }

//     const server = servers[serverId];
//     if (!server) {
//       throw new SocketError(
//         `Server(${serverId}) not found`,
//         'HANDLEAPPLICATION',
//         'SERVER',
//         404,
//       );
//     }

//     // Check if user has permission to handle applications
//     const userPermission = await getPermissionLevel(userId, server.id);
//     if (userPermission < 5) {
//       throw new SocketError(
//         'Insufficient permissions',
//         'HANDLEAPPLICATION',
//         'USER_PERMISSION',
//         403,
//       );
//     }

//     const application = applications[applicationId];
//     if (!application) {
//       throw new SocketError(
//         `Application(${applicationId}) not found`,
//         'HANDLEAPPLICATION',
//         'APPLICATION',
//         404,
//       );
//     }

//     if (action === 'accept') {
//       // Create new membership if it doesn't exist
//       const exists = Object.values(members).find(
//         (member) =>
//           member.serverId === server.id &&
//           member.userId === application.userId,
//       );

//       if (!exists) {
//         const memberId = uuidv4();
//         const member = {
//           id: memberId,
//           serverId: server.id,
//           userId: application.userId,
//           nickname: users[application.userId].name,
//           permissionLevel: 2,
//           managedChannels: [],
//           contribution: 0,
//           joinedAt: Date.now(),
//         };
//         await db.set(`members.${memberId}`, member);
//       } else {
//         // Update existing membership
//         exists.joinedAt = Date.now();
//         if (exists.permissionLevel < 2) exists.permissionLevel = 2;
//         await db.set(`members.${exists.id}`, exists);
//       }
//     }

//     // Delete application
//     await db.delete(`serverApplications.${applicationId}`);

//     // Emit updated applications list to admin
//     const updatedApplications = await getServerApplications(serverId);
//     socket.emit('applications', updatedApplications);

//     if (action === 'accept') {
//       // emit server update to all users
//       io.to(`server_${serverId}`).emit('serverUpdate', {
//         ...(await getServer(serverId)),
//       });

//       // emit user update to the user
//       const targetSocketId = userToSocket.get(application.userId);
//       if (targetSocketId) {
//         const sockets = await io.fetchSockets();
//         for (const socket of sockets)
//           if (socket.id == targetSocketId)
//             io.to(socket.id).emit('userConnect', {
//               ...(await getUser(application.userId)),
//               members: await getUserMembers(application.userId),
//             });
//       }
//     }

//     new Logger('Applications').success(
//       `Application(${applicationId}) ${action}ed for server(${serverId})`,
//     );
//   } catch (error) {
//     if (error instanceof SocketError) {
//       io.to(socket.id).emit('error', {
//         message: error.message,
//         part: error.part,
//         tag: error.tag,
//         status_code: error.status_code,
//       });
//     } else {
//       io.to(socket.id).emit('error', {
//         message: `處理申請時發生無法預期的錯誤: ${error.message}`,
//         part: 'HANDLEAPPLICATION',
//         tag: 'EXCEPTION_ERROR',
//         status_code: 500,
//       });
//     }
//     new Logger('Applications').error(
//       `Error handling application: ${error.message}`,
//     );
//   }
// });

// socket.on('applyServerMembership', async (data) => {
//   // Get database
//   const users = (await db.get('users')) || {};
//   const servers = (await db.get('servers')) || {};
//   const applications = (await db.get('serverApplications')) || {};

//   try {
//     // Validate data
//     const { sessionId, serverId, application } = data;
//     if (!sessionId || !serverId || !application) {
//       throw new SocketError(
//         'Missing required fields',
//         'APPLYSERVERMEMBERSHIP',
//         'DATA',
//         400,
//       );
//     }

//     const userId = userSessions.get(sessionId);
//     if (!userId) {
//       throw new SocketError(
//         `Invalid session ID(${sessionId})`,
//         'APPLYSERVERMEMBERSHIP',
//         'USER_ID',
//         400,
//       );
//     }

//     const user = users[userId];
//     if (!user) {
//       throw new SocketError(
//         `User(${userId}) not found`,
//         'APPLYSERVERMEMBERSHIP',
//         'USER',
//         404,
//       );
//     }

//     const server = servers[serverId];
//     if (!server) {
//       throw new SocketError(
//         `Server(${serverId}) not found`,
//         'APPLYSERVERMEMBERSHIP',
//         'SERVER',
//         404,
//       );
//     }

//     // Check if user already has a pending application
//     const existingApplication = Object.values(applications).find(
//       (app) => app.userId === userId && app.serverId === serverId,
//     );
//     if (existingApplication) {
//       throw new SocketError(
//         '您已經有一個待審核的申請，請等待管理員審核',
//         'APPLYSERVERMEMBERSHIP',
//         'APPLICATION',
//         400,
//       );
//     }

//     // Create new application
//     const applicationId = uuidv4();
//     const newApplication = {
//       id: applicationId,
//       userId: userId,
//       serverId: serverId,
//       description: application.description || '',
//       createdAt: Date.now().valueOf(),
//     };

//     // Save to database
//     applications[applicationId] = newApplication;
//     await db.set(`serverApplications.${applicationId}`, newApplication);

//     // Send success response
//     socket.emit('applicationResponse', {
//       success: true,
//       message: '申請已送出，請等待管理員審核',
//     });

//     new Logger('Application').success(
//       `User(${userId}) applied to server(${serverId})`,
//     );
//   } catch (error) {
//     io.to(socket.id).emit('applicationResponse', {
//       success: false,
//       message: `申請失敗: ${error.message}`,
//     });
//   }
// });

// socket.on('userAddFriend', async (data) => {
//   const users = (await db.get('users')) || {};
//   const servers = (await db.get('servers')) || {};
//   const messages = (await db.get('messages')) || {};
//   const friends = (await db.get('friends')) || {};

//   try {
//     const { sessionId, serverId, userId, targetId } = data;
//     if (!sessionId || !serverId || !userId || !targetId) {
//       throw new Error('Missing required fields');
//     }

//     const user = users[userId];
//     const target = users[targetId];
//     if (!user || !target) {
//       throw new Error(`User(${userId} or ${targetId}) not found`);
//     }

//     const server = servers[serverId];
//     if (!server) {
//       throw new Error(`Server(${serverId}) not found`);
//     }

//     // Find direct message and update (if not exists, create one)
//     const friend = await getFriend(userId, targetId);
//     if (!friend) {
//       // Create new message
//       const messageId = uuidv4();
//       const messageTemp = {
//         id: messageId,
//         timestamp: Date.now().valueOf(),
//       };
//       messages[messageId] = messageTemp;
//       await db.set(`messages.${messageId}`, messageTemp);

//       const friendId = uuidv4();
//       friends[friendId] = {
//         id: friendId,
//         status: 'pending',
//         userIds: [userId, targetId],
//         messageIds: [messageId],
//         createdAt: Date.now(),
//       };
//       await db.set(`friends.${friendId}`, friends[friendId]);
//     } else if (friend) {
//       throw new Error(`target friend(${targetId}) is found`);
//     }

//     new Logger('WebSocket').success(
//       `User(${targetId}) add friend from server(${server.id}) by user(${userId})`,
//     );
//   } catch (error) {
//     io.to(socket.id).emit('error', {
//       message: `新增好友時發生錯誤: ${error.message}`,
//       part: 'ADDFRIENDFROMCHANNEL',
//       tag: 'EXCEPTION_ERROR',
//       status_code: 500,
//     });

//     new Logger('WebSocket').error(
//       `Error add friend from channel: ${error.message}`,
//     );
//   }
// });

// socket.on('updateChannelOrder', async (data) => {
//   const users = (await db.get('users')) || {};
//   const servers = (await db.get('servers')) || {};
//   const channels = (await db.get('channels')) || {};

//   try {
//     const userId = userSessions.get(data.sessionId);
//     if (!userId) {
//       throw new SocketError(
//         `Invalid session ID(${data.sessionId})`,
//         'UPDATECHANNELORDER',
//         'USER_ID',
//         400,
//       );
//     }

//     const user = users[userId];
//     if (!user) {
//       throw new SocketError(
//         `User(${userId}) not found`,
//         'UPDATECHANNELORDER',
//         'USER',
//         404,
//       );
//     }

//     const server = servers[data.serverId];
//     if (!server) {
//       throw new SocketError(
//         `Server(${data.serverId}) not found`,
//         'UPDATECHANNELORDER',
//         'SERVER',
//         404,
//       );
//     }

//     const userPermission = await getPermissionLevel(userId, server.id);
//     if (userPermission < 5) {
//       throw new SocketError(
//         'Insufficient permissions',
//         'UPDATECHANNELORDER',
//         'USER_PERMISSION',
//         403,
//       );
//     }

//     for (const updatedChannel of data.updatedChannels) {
//       const channel = channels[updatedChannel.id];
//       if (channel) {
//         const hasChildren = Object.values(channels).some(
//           (c) => c.parentId === channel.id,
//         );

//         channels[channel.id] = {
//           ...channel,
//           order: updatedChannel.order,
//           parentId: updatedChannel.parentId,
//           isCategory: hasChildren,
//         };

//         await db.set(`channels.${channel.id}`, channels[channel.id]);
//       }
//     }

//     const serverChannels = server.channelIds
//       .map((id) => channels[id])
//       .filter((channel) => channel)
//       .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

//     server.channelIds = serverChannels.map((c) => c.id);
//     await db.set(`servers.${server.id}`, server);

//     io.to(`server_${server.id}`).emit('serverUpdate', {
//       ...(await getServer(server.id)),
//     });

//     new Logger('WebSocket').success(
//       `Channels reordered in server(${server.id})`,
//     );
//   } catch (error) {
//     if (error instanceof SocketError) {
//       io.to(socket.id).emit('error', {
//         message: error.message,
//         part: error.part,
//         tag: error.tag,
//         status_code: error.status_code,
//       });
//     } else {
//       io.to(socket.id).emit('error', {
//         message: `更新頻道順序時發生無法預期的錯誤: ${error.message}`,
//         part: 'UPDATECHANNELORDER',
//         tag: 'EXCEPTION_ERROR',
//         status_code: 500,
//       });
//     }
//     new Logger('WebSocket').error(
//       `Error updating channel order: ${error.message}`,
//     );
//   }
// });

// socket.on('getServers', async (data) => {
//   const users = (await db.get('users')) || {};
//   const servers = (await db.get('servers')) || {};
//   const members = (await db.get('members')) || {};

//   try {
//     const { sessionId, searchQuery } = data;

//     if (!sessionId) {
//       throw new SocketError(
//         'Missing required fields',
//         'GETSERVERS',
//         'DATA',
//         400,
//       );
//     }

//     const userId = userSessions.get(sessionId);
//     if (!userId) {
//       throw new SocketError(
//         `Invalid session ID(${sessionId})`,
//         'GETSERVERS',
//         'USER_ID',
//         400,
//       );
//     }

//     const user = users[userId];
//     if (!user) {
//       throw new SocketError(
//         `User(${userId}) not found`,
//         'GETSERVERS',
//         'USER',
//         404,
//       );
//     }

//     // Get user's joined server IDs
//     const userServerIds = new Set(
//       Object.values(members)
//         .filter((member) => member.userId === userId)
//         .map((member) => member.serverId),
//     );

//     if (searchQuery) {
//       // Get all servers for searching
//       const allServers = Object.values(servers);
//       const normalizedQuery = searchQuery.toLowerCase().trim();

//       // Handle search
//       let searchResults = allServers.filter((server) => {
//         // ID 完全匹配時允許看到不可見伺服器
//         if (server.displayId.toString() === normalizedQuery) {
//           return true;
//         }

//         // 名稱搜尋時只搜尋可見伺服器
//         if (
//           server.settings.visibility === 'invisible' &&
//           !userServerIds.has(server.id)
//         ) {
//           return false;
//         }

//         // 模糊名稱匹配
//         const normalizedName = server.name.toLowerCase().trim();
//         return (
//           normalizedName.includes(normalizedQuery) ||
//           calculateSimilarity(normalizedName, normalizedQuery) > 0.6
//         );
//       });

//       // Sort by relevance and limit to 10 results
//       searchResults = searchResults
//         .sort((a, b) => {
//           const aName = a.name.toLowerCase();
//           const bName = b.name.toLowerCase();
//           const aSimilarity = calculateSimilarity(aName, normalizedQuery);
//           const bSimilarity = calculateSimilarity(bName, normalizedQuery);
//           return bSimilarity - aSimilarity;
//         })
//         .slice(0, 10);

//       socket.emit('serversUpdate', {
//         recommendedServers: [],
//         joinedServers: searchResults,
//       });
//       return;
//     }

//     // Normal view (no search)
//     // Get all joined servers
//     const joinedServers = Object.values(servers).filter((server) =>
//       userServerIds.has(server.id),
//     );

//     // Get recommended servers (public servers not joined by user)
//     const availableForRecommendation = Object.values(servers).filter(
//       (server) =>
//         !userServerIds.has(server.id) &&
//         server.settings.visibility !== 'invisible',
//     );

//     const recommendedServers = _.sampleSize(availableForRecommendation, 10);

//     socket.emit('serversUpdate', {
//       recommendedServers,
//       joinedServers,
//     });
//   } catch (error) {
//     if (error instanceof SocketError) {
//       io.to(socket.id).emit('error', {
//         message: error.message,
//         part: error.part,
//         tag: error.tag,
//         status_code: error.status_code,
//       });
//     } else {
//       io.to(socket.id).emit('error', {
//         message: `搜尋伺服器時發生無法預期的錯誤: ${error.message}`,
//         part: 'SEARCHSERVERS',
//         tag: 'EXCEPTION_ERROR',
//         status_code: 500,
//       });
//     }
//   }
// });

// socket.on('ManageUserAction', async (data) => {
//   // Get database
//   const users = (await db.get('users')) || {};
//   const servers = (await db.get('servers')) || {};
//   const channels = (await db.get('channels')) || {};
//   const presenceStates = (await db.get('presenceStates')) || {};

//   try {
//     // Common validation
//     const { sessionId, serverId, targetId, type } = data;
//     if (!sessionId || !serverId || !targetId || !type) {
//       throw new SocketError(
//         'Missing required fields',
//         'MANAGEUSERACTION',
//         'DATA',
//         400,
//       );
//     }

//     const userId = userSessions.get(sessionId);
//     if (!userId) {
//       throw new SocketError(
//         `Invalid session ID(${sessionId})`,
//         'MANAGEUSERACTION',
//         'USER_ID',
//         400,
//       );
//     }

//     const user = users[userId];
//     const target = users[targetId];
//     if (!user || !target) {
//       throw new SocketError(
//         `User(${userId} or ${targetId}) not found`,
//         'MANAGEUSERACTION',
//         'USER',
//         404,
//       );
//     }

//     const server = servers[serverId];
//     if (!server) {
//       throw new SocketError(
//         `Server(${serverId}) not found`,
//         'MANAGEUSERACTION',
//         'SERVER',
//         404,
//       );
//     }

//     const targetPresence = presenceStates[`presence_${targetId}`];
//     if (!targetPresence) {
//       throw new SocketError(
//         `Target presence not found`,
//         'MANAGEUSERACTION',
//         'PRESENCE',
//         404,
//       );
//     }

//     const selfPresence = presenceStates[`presence_${userId}`];
//     if (!selfPresence) {
//       throw new SocketError(
//         `Self presence not found`,
//         'MANAGEUSERACTION',
//         'PRESENCE',
//         404,
//       );
//     }

//     // Check required permission level based on action type
//     const userPermission = await getPermissionLevel(userId, server.id);
//     const requiredPermission = type === 'move' ? 3 : 5;

//     if (userPermission < requiredPermission) {
//       throw new SocketError(
//         'Insufficient permissions',
//         'MANAGEUSERACTION',
//         'PERMISSION',
//         403,
//       );
//     }

//     // Special validation for kick/block
//     if (type === 'kick' || type === 'block') {
//       // Check if target is the owner
//       if (server.ownerId === targetId) {
//         throw new SocketError(
//           'Cannot perform action on server owner',
//           'MANAGEUSERACTION',
//           'OWNER',
//           400,
//         );
//       }

//       if (type === 'block') {
//         const members = Object.values(await db.get('members')) || [];
//         const serverBlockedUsers =
//           members.filter(
//             (member) => member.serverId === serverId && member.isBlocked,
//           ) || [];

//         if (serverBlockedUsers.includes(targetId)) {
//           throw new SocketError(
//             'User is already blocked',
//             'MANAGEUSERACTION',
//             'BLOCKED',
//             400,
//           );
//         }

//         server.blockedUserIds =
//           serverBlockedUsers.map((member) => member.userId) || [];
//       }
//     }

//     // Get target's socket and current channel if they're connected
//     const targetSocketId = userToSocket.get(targetId);
//     const targetCurrentChannel = channels[targetPresence.currentChannelId];

//     switch (type) {
//       case 'move': {
//         // Additional move validation
//         if (
//           selfPresence.currentServerId !== targetPresence.currentServerId ||
//           !selfPresence.currentChannelId ||
//           !targetPresence.currentChannelId
//         ) {
//           throw new SocketError(
//             'Users must be in same server and channels',
//             'MANAGEUSERACTION',
//             'CHANNEL',
//             400,
//           );
//         }

//         const destinationChannel = channels[selfPresence.currentChannelId];
//         if (!destinationChannel) {
//           throw new SocketError(
//             'Destination channel not found',
//             'MANAGEUSERACTION',
//             'CHANNEL',
//             404,
//           );
//         }

//         // Remove from current channel
//         if (targetCurrentChannel) {
//           targetCurrentChannel.userIds = targetCurrentChannel.userIds.filter(
//             (id) => id !== targetId,
//           );
//           await db.set(
//             `channels.${targetCurrentChannel.id}`,
//             targetCurrentChannel,
//           );
//         }

//         // Add to destination channel
//         if (!destinationChannel.userIds.includes(targetId)) {
//           destinationChannel.userIds.push(targetId);
//           await db.set(
//             `channels.${destinationChannel.id}`,
//             destinationChannel,
//           );
//         }

//         // Update presence
//         targetPresence.currentChannelId = destinationChannel.id;
//         targetPresence.updatedAt = Date.now();
//         await db.set(`presenceStates.${targetPresence.id}`, targetPresence);

//         // Handle socket operations
//         if (targetSocketId) {
//           const sockets = await io.fetchSockets();
//           for (const socket of sockets) {
//             if (socket.id === targetSocketId) {
//               if (targetCurrentChannel) {
//                 socket.leave(`channel_${targetCurrentChannel.id}`);
//               }
//               socket.join(`channel_${destinationChannel.id}`);
//             }
//           }

//           // Play sound in destination channel
//           io.to(`channel_${destinationChannel.id}`).emit('playSound', 'join');

//           // Notify target
//           io.to(targetSocketId).emit('userPresenceUpdate', {
//             ...(await getPresenceState(targetId)),
//           });
//         }

//         break;
//       }

//       case 'kick': {
//         // Remove from channel if connected
//         if (targetCurrentChannel) {
//           targetCurrentChannel.userIds = targetCurrentChannel.userIds.filter(
//             (id) => id !== targetId,
//           );
//           await db.set(
//             `channels.${targetCurrentChannel.id}`,
//             targetCurrentChannel,
//           );
//         }

//         // Clear contribution interval if exists
//         if (targetSocketId) {
//           clearContributionInterval(targetSocketId);
//         }

//         // Update presence
//         targetPresence.currentServerId = null;
//         targetPresence.currentChannelId = null;
//         targetPresence.updatedAt = Date.now();
//         await db.set(`presenceStates.${targetPresence.id}`, targetPresence);

//         // Remove member permission
//         const member = await getMember(targetId, serverId);
//         if (member) {
//           member.permissionLevel = 0;
//           await db.set(`members.${member.id}`, member);
//         }

//         // Handle socket operations
//         if (targetSocketId) {
//           const sockets = await io.fetchSockets();
//           for (const socket of sockets) {
//             if (socket.id === targetSocketId) {
//               if (targetCurrentChannel) {
//                 socket.leave(`channel_${targetCurrentChannel.id}`);
//               }
//               socket.leave(`server_${serverId}`);
//             }
//           }

//           // Notify target
//           io.to(targetSocketId).emit('channelDisconnect');
//           io.to(targetSocketId).emit('serverDisconnect');
//           io.to(targetSocketId).emit('userPresenceUpdate', {
//             ...(await getPresenceState(targetId)),
//           });
//         }

//         break;
//       }

//       case 'block': {
//         // First kick the user if they're connected
//         if (targetCurrentChannel) {
//           targetCurrentChannel.userIds = targetCurrentChannel.userIds.filter(
//             (id) => id !== targetId,
//           );
//           await db.set(
//             `channels.${targetCurrentChannel.id}`,
//             targetCurrentChannel,
//           );
//         }

//         if (targetSocketId) {
//           clearContributionInterval(targetSocketId);
//         }

//         // Update presence
//         targetPresence.currentServerId = null;
//         targetPresence.currentChannelId = null;
//         targetPresence.updatedAt = Date.now();
//         await db.set(`presenceStates.${targetPresence.id}`, targetPresence);

//         // Remove member permission change isBlocked to true
//         const member = await getMember(targetId, serverId);
//         if (member) {
//           member.permissionLevel = 0;
//           member.isBlocked = true;
//           await db.set(`members.${member.id}`, member);
//         }

//         // Handle socket operations
//         if (targetSocketId) {
//           const sockets = await io.fetchSockets();
//           for (const socket of sockets) {
//             if (socket.id === targetSocketId) {
//               if (targetCurrentChannel) {
//                 socket.leave(`channel_${targetCurrentChannel.id}`);
//               }
//               socket.leave(`server_${serverId}`);
//             }
//           }

//           // Notify target
//           io.to(targetSocketId).emit('channelDisconnect');
//           io.to(targetSocketId).emit('serverDisconnect');
//           io.to(targetSocketId).emit('userPresenceUpdate', {
//             ...(await getPresenceState(targetId)),
//           });
//           // Update user's blocked status
//           io.to(socket.id).emit('userConnect', {
//             ...(await getUser(userId)),
//             members: await getUserMembers(userId),
//           });
//         }

//         break;
//       }

//       default:
//         throw new SocketError(
//           'Invalid action type',
//           'MANAGEUSERACTION',
//           'TYPE',
//           400,
//         );
//     }

//     // Update all clients with new server state
//     io.to(`server_${serverId}`).emit('serverUpdate', {
//       ...(await getServer(serverId)),
//     });

//     new Logger('WebSocket').success(
//       `User(${targetId}) ${type} action performed by user(${userId}) in server(${serverId})`,
//     );
//   } catch (error) {
//     if (error instanceof SocketError) {
//       io.to(socket.id).emit('error', {
//         message: error.message,
//         part: error.part,
//         tag: error.tag,
//         status_code: error.status_code,
//       });
//     } else {
//       io.to(socket.id).emit('error', {
//         message: `處理用戶操作時發生無法預期的錯誤: ${error.message}`,
//         part: 'MANAGEUSERACTION',
//         tag: 'EXCEPTION_ERROR',
//         status_code: 500,
//       });
//     }
//     new Logger('WebSocket').error(
//       `Error performing user action: ${error.message}`,
//     );
//   }
// });

require('./socket/index')(io, db);

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
server.listen(PORT, () => {
  new Logger('Server').success(`Server is running on port ${PORT}`);
  utils.interval.setupCleanupInterval();
});

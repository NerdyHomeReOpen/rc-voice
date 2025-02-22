/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');
const {
  PORT,
  CONTENT_TYPE_JSON,
  UPLOADS_DIR,
  MIME_TYPES,
} = require('./constant');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const utils = require('./utils');
const Logger = utils.logger;
const Set = utils.set;

// TODO: Separate disconnect logic to avoid code duplication (disconnectUser, disconnectServer, disconnectChannel)

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
      console.log(error);
      sendError(res, 500, '伺服器錯誤');
      return;
    }
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
        const accountPasswords = (await db.get(`accountPasswords`)) || {};
        const accountUserIds = (await db.get(`accountUserIds`)) || {};
        const users = (await db.get(`users`)) || {};

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
        await Set.user(user.id, {
          ...user,
          status: 'online',
          lastActiveAt: Date.now(),
        });

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
        await Set.user(userId, { name: username });

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

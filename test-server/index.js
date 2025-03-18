/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('./utils');
const StandardizedError = utils.standardizedError;
const Logger = utils.logger;
const Func = utils.func;
const Set = utils.set;
const Get = utils.get;
const JWT = utils.jwt;

const {
  PORT,
  CONTENT_TYPE_JSON,
  // UPLOADS_DIR,
  // MIME_TYPES,
} = require('./constant');

// Send Error/Success Response
const sendError = (res, statusCode, message) => {
  res.writeHead(statusCode, CONTENT_TYPE_JSON);
  res.end(JSON.stringify({ error: message }));
};
const sendSuccess = (res, data) => {
  res.writeHead(200, CONTENT_TYPE_JSON);
  res.end(JSON.stringify(data));
};

// HTTP Server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
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
        const accountPasswords = (await db.get(`accountPasswords`)) || {};
        const accountUserIds = (await db.get(`accountUserIds`)) || {};
        const users = (await db.get(`users`)) || {};

        // Validate data
        const account = data.account;
        const password = data.password;
        if (!account || !password) {
          throw new StandardizedError(
            '無效的帳號或密碼',
            'ValidationError',
            'LOGIN',
            'INVALID_ACCOUNT_OR_PASSWORD',
            401,
          );
        }
        const exist = accountPasswords[account];
        if (!exist) {
          throw new StandardizedError(
            '帳號或密碼錯誤',
            'ValidationError',
            'LOGIN',
            'INVALID_ACCOUNT_OR_PASSWORD',
            401,
          );
        }
        if (password !== accountPasswords[account]) {
          throw new StandardizedError(
            '帳號或密碼錯誤',
            'ValidationError',
            'LOGIN',
            'INVALID_ACCOUNT_OR_PASSWORD',
            401,
          );
        }
        const user = Object.values(users).find(
          (user) => user.id === accountUserIds[account],
        );
        if (!user) {
          throw new StandardizedError(
            '用戶不存在',
            'ValidationError',
            'LOGIN',
            'USER_NOT_FOUND',
            404,
          );
        }

        // Update user
        await Set.user(user.id, {
          status: 'online',
          lastActiveAt: Date.now(),
        });

        // Generate JWT token
        const token = JWT.generateToken({
          userId: user.id,
        });

        sendSuccess(res, {
          message: '登入成功',
          data: {
            token: token,
            user: await Get.user(user.id),
          },
        });
        new Logger('Auth').success(`User logged in: ${account}`);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `登入時發生預期外的錯誤: ${error.message}`,
            'ServerError',
            'LOGIN',
            'SERVER_ERROR',
            500,
          );
        }

        sendError(res, error.statusCode, error.error_message);
        new Logger('Auth').error(`Login error: ${error.error_message}`);
      }
    });
    return;
  }

  // if (req.method == 'GET' && req.url == '/refresh-token') {
  //   // Get the authorization header
  //   const authHeader = req.headers.authorization;
  //   if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //     return sendError(res, 401, 'No token provided');
  //   }

  //   const sessionId = authHeader.split(' ')[1];

  //   // Verify current token
  //   const result = JWT.verifyToken(sessionId);
  //   if (!result.valid) {
  //     return sendError(res, 401, 'Invalid token');
  //   }

  //   const newToken = JWT.generateToken(result.userId);

  //   // Update the user sessions map
  //   utils.map.sessionToUser.set(newToken, result.userId);

  //   sendSuccess(res, {
  //     message: 'Token refreshed',
  //     data: {
  //       sessionId: newToken,
  //     },
  //   });
  // }

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
        const account = data.account.trim();
        const password = data.password.trim();
        if (!account || !password) {
          throw new StandardizedError(
            '無效的帳號或密碼',
            'ValidationError',
            'REGISTER',
            'INVALID_ACCOUNT_OR_PASSWORD',
            401,
          );
        }
        const username = data.username;
        if (!username) {
          throw new StandardizedError(
            '無效的使用者名稱',
            'ValidationError',
            'REGISTER',
            'INVALID_USERNAME',
            401,
          );
        }
        const exists = accountPasswords[data.account];
        if (exists) {
          throw new StandardizedError(
            '帳號已存在',
            'ValidationError',
            'REGISTER',
            'ACCOUNT_ALREADY_EXISTS',
            401,
          );
        }

        const accountError = Func.validateAccount(account);
        if (accountError) {
          throw new StandardizedError(
            accountError,
            'ValidationError',
            'REGISTER',
            'INVALID_ACCOUNT',
            401,
          );
        }
        const passwordError = Func.validatePassword(password);
        if (passwordError) {
          throw new StandardizedError(
            passwordError,
            'ValidationError',
            'REGISTER',
            'INVALID_PASSWORD',
            401,
          );
        }
        const usernameError = Func.validateUsername(username);
        if (usernameError) {
          throw new StandardizedError(
            usernameError,
            'ValidationError',
            'REGISTER',
            'INVALID_USERNAME',
            401,
          );
        }

        // Create user data
        const userId = uuidv4();
        await Set.user(userId, { name: username });

        // Create account password list
        await db.set(`accountPasswords.${account}`, password);
        await db.set(`accountUserIds.${account}`, userId);

        sendSuccess(res, {
          message: '註冊成功',
          data: {
            // user: await Get.user(user.id),
          },
        });
        new Logger('Auth').success(`User registered: ${account}`);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `註冊時發生預期外的錯誤: ${error.message}`,
            'ServerError',
            'REGISTER',
            'SERVER_ERROR',
            500,
          );
        }

        sendError(res, error.statusCode, error.error_message);
        new Logger('Auth').error(`Register error: ${error.error_message}`);
      }
    });
    return;
  }

  sendSuccess(res, { message: 'Hello World!' });
  return;
});

// Socket Server
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
  },
});

require('./socket/index')(io, db);

// Error Handling
server.on('error', (error) => {
  if (!(error instanceof StandardizedError)) {
    error = new StandardizedError(
      `伺服器發生預期外的錯誤: ${error.message}`,
      'ServerError',
      'SERVER_ERROR',
      'SERVER_ERROR',
    );
  }
  new Logger('Server').error(`Server error: ${error.error_message}`);
});
process.on('uncaughtException', (error) => {
  if (!(error instanceof StandardizedError)) {
    error = new StandardizedError(
      `未處理的例外: ${error.message}`,
      'ServerError',
      'UNCAUGHT_EXCEPTION',
      'SERVER_ERROR',
    );
  }
  new Logger('Server').error(`Uncaught Exception: ${error.error_message}`);
});
process.on('unhandledRejection', (error) => {
  if (!(error instanceof StandardizedError)) {
    error = new StandardizedError(
      `未處理的拒絕: ${error.message}`,
      'ServerError',
      'UNHANDLED_REJECTION',
      'SERVER_ERROR',
    );
  }
  new Logger('Server').error(`Unhandled Rejection: ${error.error_message}`);
});

// Start Server
server.listen(PORT, () => {
  new Logger('Server').success(`Server is running on port ${PORT}`);
  // utils.interval.setupCleanupInterval();
});

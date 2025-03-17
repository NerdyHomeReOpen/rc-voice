const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const Logger = utils.logger;
const Map = utils.map;
const Get = utils.get;
const Interval = utils.interval;
const Func = utils.func;
const Set = utils.set;
const JWT = utils.jwt;
// Socket error
const StandardizedError = require('../standardizedError');
// Handlers
const serverHandler = require('./server');
const channelHandler = require('./channel');

const userHandler = {
  connectUser: async (io, socket) => {
    // Get database
    const users = (await db.get('users')) || {};

    try {
      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'ValidationError',
          'CONNECTUSER',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'ValidationError',
          'CONNECTUSER',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'ValidationError',
          'CONNECTUSER',
          'TOKEN_INVALID',
          401,
        );
      }
      const userId = result.userId;
      if (!userId) {
        throw new StandardizedError(
          '無效的 token',
          'ValidationError',
          'CONNECTUSER',
          'TOKEN_INVALID',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${userId})不存在`,
          'ValidationError',
          'CONNECTUSER',
          'USER',
          404,
        );
      }

      // Check if user is already connected
      for (const [_socketId, _userId] of Map.socketToUser) {
        if (_userId === userId) {
          // FIXME: cant not disconnect exist socket connection
          io.to(_socketId).emit('userDisconnect', null);
        }
      }

      // Save user session connection
      Map.createUserIdSessionIdMap(user.id, sessionId);

      // Save user socket connection
      Map.createUserIdSocketIdMap(user.id, socket.id);

      // Emit data (only to the user)
      io.to(socket.id).emit('userConnect', await Get.user(user.id));

      new Logger('WebSocket').success(
        `User(${user.id}) connected with socket(${socket.id})`,
      );
    } catch (error) {
      if (!error instanceof StandardizedError) {
        error = new StandardizedError(
          `取得使用者時發生無法預期的錯誤: ${error.error_message}`,
          'ServerError',
          'CONNECTUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('userDisconnect', null);
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error connecting user: ${error.error_message}`,
      );
    }
  },
  disconnectUser: async (io, socket) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'ValidationError',
          'DISCONNECTUSER',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'ValidationError',
          'DISCONNECTUSER',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'ValidationError',
          'DISCONNECTUSER',
          'TOKEN_INVALID',
          401,
        );
      }
      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new StandardizedError(
          `無效的 session ID(${sessionId})`,
          'ValidationError',
          'UPDATEUSER',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${userId})不存在`,
          'ValidationError',
          'DISCONNECTUSER',
          'USER',
          404,
        );
      }

      if (user.currentServerId) {
        await serverHandler.disconnectServer(io, socket, {
          serverId: user.currentServerId,
        });
      } else if (user.currentChannelId) {
        await channelHandler.disconnectChannel(io, socket, {
          channelId: user.currentChannelId,
        });
      }

      // Remove user session connection
      Map.deleteUserIdSessionIdMap(userId, sessionId);

      // Remove user socket connection
      Map.deleteUserIdSocketIdMap(userId, socket.id);

      // Update user
      const update = {
        status: 'gn',
        lastActiveAt: Date.now(),
      };
      await Set.user(userId, update);

      new Logger('WebSocket').success(`User(${userId}) disconnected`);
    } catch (error) {
      if (!error instanceof StandardizedError) {
        error = new StandardizedError(
          `斷開使用者時發生無法預期的錯誤: ${error.error_message}`,
          'ServerError',
          'DISCONNECTUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error disconnecting user: ${error.error_message}`,
      );
    }
  },
  updateUser: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};

    try {
      // data = {
      //   user: {
      //     ...
      //   }
      // }

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'ValidationError',
          'UPDATEUSER',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'ValidationError',
          'UPDATEUSER',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'ValidationError',
          'UPDATEUSER',
          'TOKEN_INVALID',
          401,
        );
      }
      const { user: editedUser } = data;
      if (!editedUser) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEUSER',
          'DATA_INVALID',
          401,
        );
      }
      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new StandardizedError(
          `無效的 session ID(${sessionId})`,
          'ValidationError',
          'UPDATEUSER',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${userId})不存在`,
          'ValidationError',
          'UPDATEUSER',
          'USER',
          404,
        );
      }

      if (editedUser.name) {
        const nameError = Func.validateUsername(editedUser.name);
        if (nameError) {
          throw new StandardizedError(
            nameError,
            'ValidationError',
            'UPDATEUSER',
            'USERNAME',
            401,
          );
        }
      }
      if (editedUser.signature) {
        const signatureError = Func.validateSignature(editedUser.signature);
        if (signatureError) {
          throw new StandardizedError(
            signatureError,
            'ValidationError',
            'UPDATEUSER',
            'SIGNATURE',
            401,
          );
        }
      }

      // Update user data
      await Set.user(userId, editedUser);

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', editedUser);

      new Logger('WebSocket').success(`User(${userId}) updated`);
    } catch (error) {
      if (!error instanceof StandardizedError) {
        error = new StandardizedError(
          `更新使用者時發生無法預期的錯誤: ${error.error_message}`,
          'ServerError',
          'UPDATEUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error updating user: ${error.error_message}`,
      );
    }
  },
  refreshUser: async (io, socket) => {
    const users = (await db.get('users')) || {};

    try {
      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'ValidationError',
          'REFRESHUSER',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'ValidationError',
          'REFRESHUSER',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'ValidationError',
          'REFRESHUSER',
          'TOKEN_INVALID',
          401,
        );
      }

      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new StandardizedError(
          `無效的 session ID(${sessionId})`,
          'ValidationError',
          'REFRESHUSER',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${userId})不存在`,
          'ValidationError',
          'REFRESHUSER',
          'USER',
          404,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', await Get.user(userId));
    } catch (error) {
      if (!error instanceof StandardizedError) {
        error = new StandardizedError(
          `刷新使用者時發生無法預期的錯誤: ${error.error_message}`,
          'ServerError',
          'REFRESHUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error refreshing user: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...userHandler };

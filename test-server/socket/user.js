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
// Socket error
const SocketError = require('./socketError');
// Handlers
const serverHandler = require('./server');
const channelHandler = require('./channel');

const userHandler = {
  connectUser: async (io, socket, sessionId, userId) => {
    // Get database
    const users = (await db.get('users')) || {};

    try {
      // Validate data
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
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
      // Emit disconnect event (only to the user)
      io.to(socket.id).emit('userDisconnect', null);

      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `取得使用者時發生無法預期的錯誤: ${error.message}`,
          part: 'CONNECTUSER',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(`Error connecting user: ${error.message}`);
    }
  },
  disconnectUser: async (io, socket, sessionId) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'UPDATEUSER',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'DISCONNECTUSER',
          'USER',
          404,
        );
      }
      const server = servers[user.currentServerId];
      if (!server) {
        new Logger('WebSocket').warn(
          `Server(${user.currentServerId}) not found. Won't disconnect server.`,
        );
      }
      const channel = channels[user.currentChannelId];
      if (!channel) {
        new Logger('WebSocket').warn(
          `Channel(${user.currentChannelId}) not found. Won't disconnect channel.`,
        );
      }

      if (server) {
        await serverHandler.disconnectServer(io, socket, sessionId, server.id);
      } else if (channel) {
        await channelHandler.disconnectChannel(
          io,
          socket,
          sessionId,
          channel.id,
        );
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
      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `登出時發生無法預期的錯誤: ${error.message}`,
          part: 'DISCONNECTUSER',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(
        `Error disconnecting user: ${error.message}`,
      );
    }
  },
  updateUser: async (io, socket, sessionId, editedUser) => {
    // Get database
    const users = (await db.get('users')) || {};

    try {
      // Validate data
      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'UPDATEUSER',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'UPDATEUSER',
          'USER',
          404,
        );
      }

      // Update user data
      await Set.user(userId, editedUser);

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', editedUser);

      new Logger('WebSocket').success(`User(${userId}) updated`);
    } catch (error) {
      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `更新使用者時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATEUSER',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(`Error updating user: ${error.message}`);
    }
  },
};

module.exports = { ...userHandler };

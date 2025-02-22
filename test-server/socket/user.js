const utils = require('../utils');
const Logger = utils.logger;
const Map = utils.map;
const Get = utils.get;
const SocketError = require('./socketError');

module.exports = (io, socket, db) => {
  socket.on('connectUser', async (data) => {
    // data = {
    //   sessionId: '123456',
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};

    console.log(Map);

    try {
      // Validate data
      const { sessionId } = data;
      if (!sessionId) {
        throw new SocketError(
          'Missing required fields',
          'CONNECTUSER',
          'DATA',
          400,
        );
      }
      const userId = Map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'CONNECTUSER',
          'SESSION_EXPIRED',
          401,
        );
      }
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
      for (const [key, value] of Map.socketToUser) {
        if (value === userId) {
          // Remove user socket connection
          if (!Map.deleteUserIdSocketIdMap(value, key)) {
            throw new SocketError(
              'Cannot delete user socket connection',
              'CONNECTUSER',
              'DELETE_USER_SOCKET_MAP',
              500,
            );
          }

          // Emit force disconnect event
          io.to(key).disconnectSockets(true);
          // io.to(key).emit('forceDisconnect'); //TODO: Change to 'userDisconnect' event

          new Logger('WebSocket').warn(
            `User(${userId}) already connected from another socket. Force disconnecting...`,
          );
        }
      }

      // Save user socket connection
      if (!Map.createUserIdSocketIdMap(user.id, socket.id)) {
        throw new SocketError(
          'Cannot create user socket connection',
          'CONNECTUSER',
          'CREATE_USER_SOCKET_MAP',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('userConnect', {
        ...(await Get.user(user.id)),
      });

      new Logger('WebSocket').success(`User(${user.id}) connected`);
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

    try {
      // Validate data
      const { sessionId } = data;
      if (!sessionId) {
        throw new SocketError(
          'Missing required fields',
          'DISCONNECTUSER',
          'DATA',
          400,
        );
      }
      const userId = Map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'DISCONNECTUSER',
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

      // Remove user socket connection
      if (!Map.deleteUserIdSocketIdMap(userId, socket.id)) {
        throw new SocketError(
          'Cannot delete user socket connection',
          'DISCONNECTUSER',
          'DELETE_USER_SOCKET_MAP',
          500,
        );
      }

      // Update user
      users[user.id] = {
        ...user,
        currentServerId: null,
        currentChannelId: null,
        status: 'gn',
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.set(`users.${user.id}`, users[user.id]);

      if (channel) {
        // Clear user contribution interval
        utils.interval.clearContributionInterval(socket.id);

        // leave the channel
        socket.leave(`channel_${channel.id}`);

        // Emit data (only to the user)
        io.to(socket.id).emit('channelDisconnect', null);

        // Emit data (to all users in the channel)
        io.to(`server_${channel.serverId}`).emit('serverUpdate', {
          channels: (await Get.server(channel.serverId)).channels,
        });
      }

      if (server) {
        // leave the server
        socket.leave(`server_${server.id}`);

        // Emit data (only to the user)
        io.to(socket.id).emit('serverDisconnect', null);
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('userDisconnect', null);

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
  });

  socket.on('updateUser', async (data) => {
    // data = {
    //   sessionId
    //   user: {
    //     ...
    //   }
    // }

    // Get database
    const users = (await db.get('users')) || {};

    try {
      // Validate data
      const { sessionId, user: editedUser } = data;
      if (!sessionId || !editedUser) {
        throw new SocketError(
          'Missing required fields',
          'UPDATEUSER',
          'DATA',
          400,
        );
      }
      const userId = Map.userSessions.get(sessionId);
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
  });
};

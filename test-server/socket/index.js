const utils = require('../utils');
const Logger = utils.logger;
const SocketError = require('./socketError');

const userHandler = require('./user');
const serverHandler = require('./server');
const channelHandler = require('./channel');

module.exports = (io, db) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handlers
    userHandler(io, socket, db);
    serverHandler(io, socket, db);
    channelHandler(io, socket, db);

    socket.on('disconnect', async () => {
      // Get database
      const users = (await db.get('users')) || {};
      const servers = (await db.get('servers')) || {};
      const channels = (await db.get('channels')) || {};

      try {
        // Validate data
        const userId = socketToUser.get(socket.id);
        if (!userId) {
          throw new SocketError(
            'Invalid socket ID',
            'DISCONNECT',
            'USER_ID',
            400,
          );
        }
        const user = users[userId];
        if (!user) {
          throw new SocketError(
            `User(${userId}) not found`,
            'DISCONNECT',
            'USER',
            404,
          );
        }
        const channel = channels[user.currentChannelId];
        if (!channel) {
          new Logger('WebSocket').warn(
            `Channel(${user.currentChannelId}) not found. Won't disconnect channel.`,
          );
        }
        const server = servers[user.currentServerId];
        if (!server) {
          new Logger('WebSocket').warn(
            `Server(${user.currentServerId}) not found. Won't disconnect server.`,
          );
        }

        // Clear user contribution interval
        utils.interval.clearContributionInterval(socket.id);

        // Remove user socket connection
        if (!utils.map.deleteUserIdSocketIdMap(userId, socket.id)) {
          throw new SocketError(
            'Cannot delete user socket connection',
            'DISCONNECT',
            'DELETE_ID_FUNCTION',
            500,
          );
        }

        // Update user
        user[user.id] = {
          ...user,
          currentServerId: null,
          currentChannelId: null,
          lastActiveAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.set(`users.${user.id}`, users[user.id]);

        if (channel) {
          const server = await getServer(server.id);

          // Emit data (to all users in the channel)
          io.to(`server_${server.id}`).emit('serverUpdate', {
            channels: server.channels,
          });
        }

        new Logger('WebSocket').success(`User(${userId}) disconnected`);
      } catch (error) {
        if (error instanceof SocketError) {
          io.to(socket.id).emit('error', {
            message: error.message,
            part: error.part,
            tag: error.tag,
            status_code: error.status_code,
          });
        } else {
          io.to(socket.id).emit('error', {
            message: `斷線時發生無法預期的錯誤: ${error.message}`,
            part: 'DISCONNECT',
            tag: 'EXCEPTION_ERROR',
            status_code: 500,
          });
        }

        new Logger('WebSocket').error(
          `Error disconnecting user: ${error.message}`,
        );
      }
    });
  });
};

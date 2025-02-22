const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const Logger = utils.logger;
const Map = utils.map;
const Get = utils.get;
const Interval = utils.interval;
const Set = utils.set;
// Socket error
const SocketError = require('./socketError');

const channelHandler = {
  connectChannel: async (io, socket, sessionId, channelId) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // validate data
      const userId = Map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'CONNECTCHANNEL',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'CONNECTCHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[channelId];
      if (!channel && channelId) {
        throw new SocketError(
          `Channel(${channelId}) not found`,
          'CONNECTCHANNEL',
          'CHANNEL',
          404,
        );
      }
      if (channel.settings.visibility === 'private') {
        throw new SocketError(
          'Insufficient permissions',
          'CONNECTCHANNEL',
          'CHANNEL_VISIBILITY',
          403,
        );
      }
      const prevChannel = channels[user.currentChannelId];

      // check if user is already in a channel, if so, disconnect the channel
      if (prevChannel) {
        // Leave the channel
        socket.leave(`channel_${prevChannel.id}`);

        // Play sound
        io.to(`channel_${prevChannel.id}`).emit('playSound', 'leave');
      } else {
        // Setup user interval for accumulate contribution
        Interval.setupObtainXpInterval(socket.id, userId);
      }

      // Update user presence
      const update = {
        currentChannelId: channel.id,
        lastActiveAt: Date.now(),
      };
      await Set.user(userId, { ...user, ...update });

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'join');

      // Join the channel
      socket.join(`channel_${channel.id}`);

      // Emit updated data (only to the user)
      io.to(socket.id).emit('userUpdate', update);
      io.to(socket.id).emit('channelConnect', {
        ...(await Get.channel(channel.id)),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        users: await Get.serverUsers(channel.serverId),
      });

      new Logger('WebSocket').success(
        `User(${user.id}) connected to channel(${channel.id})`,
      );
    } catch (error) {
      // Emit data (only to the user)
      io.to(socket.id).emit('channelDisconnect', null);

      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `加入頻道時發生無法預期的錯誤: ${error.message}`,
          part: 'JOINCHANNEL',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      console.log(error);
      new Logger('WebSocket').error(
        `Error connecting to channel: ${error.message}`,
      );
    }
  },
  disconnectChannel: async (io, socket, sessionId, channelId) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const userId = Map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'DISCONNECTCHANNEL',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'DISCONNECTCHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[channelId];
      if (!channel) {
        throw new SocketError(
          `Channel(${channelId}) not found`,
          'DISCONNECTCHANNEL',
          'CHANNEL',
          404,
        );
      }

      // Update user presence
      const update = {
        currentChannelId: null,
        lastActiveAt: Date.now(),
      };
      await Set.user(userId, { ...user, ...update });

      // Clear user contribution interval
      Interval.clearObtainXpInterval(socket.id);

      // Leave the channel
      socket.leave(`channel_${channel.id}`);

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'leave');

      // Emit updated data (only to the user)
      io.to(socket.id).emit('userUpdate', update);
      io.to(socket.id).emit('channelDisconnect', null);

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        users: await Get.serverUsers(channel.serverId),
      });

      new Logger('WebSocket').success(
        `User(${user.id}) disconnected from channel(${channel.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `離開頻道時發生無法預期的錯誤: ${error.message}`,
          part: 'DISCONNECTCHANNEL',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(
        `Error disconnecting from channel: ${error.message}`,
      );
    }
  },
  createChannel: async (io, socket, sessionId, serverId, channel) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};

    try {
      // Validate data
      const userId = Map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'CREATECHANNEL',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'CREATECHANNEL',
          'USER',
          404,
        );
      }
      const server = servers[serverId];
      if (!server) {
        throw new SocketError(
          `Server(${serverId}) not found`,
          'CREATECHANNEL',
          'SERVER',
          404,
        );
      }
      // Check permissions
      const userPermission = Get.userPermissionInServer(userId, serverId);
      if (userPermission < 5) {
        throw new SocketError(
          'Insufficient permissions',
          'CREATECHANNEL',
          'USER_PERMISSION',
          403,
        );
      }

      // Create new channel
      const channelId = uuidv4();
      Set.channel(channelId, {
        ...channel,
        id: channelId,
        serverId: server.id,
        order: server.channelIds.length,
        createdAt: Date.now().valueOf(),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        channels: await Get.serverChannels(server.id),
      });

      new Logger('WebSocket').info(
        `Adding new channel(${channel.id}) to server(${server.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `新增頻道時發生無法預期的錯誤: ${error.message}`,
          part: 'CREATECHANNEL',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error('Error adding channel: ' + error.message);
    }
  },
  updateChannel: async (io, socket, sessionId, channelId, editedChannel) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const userId = Map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'UPDATECHANNEL',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'UPDATECHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[channelId];
      if (!channel) {
        throw new SocketError(
          `Channel(${channelId}) not found`,
          'UPDATECHANNEL',
          'CHANNEL',
          404,
        );
      }

      // Check permissions
      const userPermission = await Get.userPermissionInServer(
        user.id,
        channel.serverId,
      );
      if (userPermission < 4) {
        throw new SocketError(
          'Insufficient permissions',
          'UPDATECHANNEL',
          'USER_PERMISSION',
          403,
        );
      }

      // Update channel
      await Set.channel(channelId, {
        ...channel,
        ...editedChannel,
      });

      // Emit updated data (to all users in the Channel)
      io.to(`channel_${channelId}`).emit('channelUpdate', {
        ...editedChannel,
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        channels: await Get.serverChannels(channel.serverId),
      });

      new Logger('WebSocket').info(
        `User(${user.id}) updated channel(${channel.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `編輯頻道時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATECHANNEL',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error('Error updating channel: ' + error.message);
    }
  },
  deleteChannel: async (io, socket, sessionId, channelId) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const userId = Map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'DELETECHANNEL',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'DELETECHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[channelId];
      if (!channel) {
        throw new SocketError(
          `Channel(${channelId}) not found`,
          'DELETECHANNEL',
          'CHANNEL',
          404,
        );
      }

      // Update channel
      await Set.channel(channelId, {
        ...channel,
        serverId: null,
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        channels: await Get.serverChannels(channel.serverId),
      });

      new Logger('WebSocket').info(
        `User(${user.id}) deleted channel(${channel.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `刪除頻道時發生無法預期的錯誤: ${error.message}`,
          part: 'DELETECHANNEL',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error('Error deleting channel: ' + error.message);
    }
  },
};

module.exports = { ...channelHandler };

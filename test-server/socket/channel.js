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
const JWT = utils.jwt;
// Socket error
const StandardizedError = require('../standardizedError');
// Handlers
const rtcHandler = require('./rtc');
const Func = require('../utils/func');

const channelHandler = {
  connectChannel: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // data = {
      //   channelId:
      // }
      // console.log(data);

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'ValidationError',
          'CONNECTCHANNEL',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'ValidationError',
          'CONNECTCHANNEL',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'ValidationError',
          'CONNECTCHANNEL',
          'TOKEN_INVALID',
          401,
        );
      }
      const { channelId } = data;
      if (!channelId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CONNECTCHANNEL',
          'DATA_INVALID',
          401,
        );
      }
      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new StandardizedError(
          `Invalid session ID(${sessionId})`,
          'CONNECTCHANNEL',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `User(${userId}) not found`,
          'CONNECTCHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[channelId];
      if (!channel && channelId) {
        throw new StandardizedError(
          `Channel(${channelId}) not found`,
          'CONNECTCHANNEL',
          'CHANNEL',
          404,
        );
      }
      if (channel.settings.visibility === 'private') {
        throw new StandardizedError(
          'Insufficient permissions',
          'CONNECTCHANNEL',
          'CHANNEL_VISIBILITY',
          403,
        );
      }

      // check if user is already in a channel, if so, disconnect the channel
      if (user.currentChannelId) {
        await channelHandler.disconnectChannel(io, socket, {
          channelId: user.currentChannelId,
        });
      }

      // Update user
      const update = {
        currentChannelId: channel.id,
        lastActiveAt: Date.now(),
      };
      await Set.user(userId, update);

      // Setup user interval for accumulate contribution
      Interval.setupObtainXpInterval(socket);

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'join');

      // Join the channel
      // socket.join(`channel_${channel.id}`);
      await rtcHandler.join(io, socket, { channelId: channel.id });

      // Emit updated data (only to the user)
      io.to(socket.id).emit('userUpdate', update);
      io.to(socket.id).emit('channelConnect', await Get.channel(channel.id));

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
      if (error instanceof StandardizedError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `加入頻道時發生無法預期的錯誤: ${error.error_message}`,
          part: 'JOINCHANNEL',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(
        `Error connecting to channel: ${error.error_message}`,
      );
    }
  },
  disconnectChannel: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // data = {
      //   channelId:
      // }
      // console.log(data);

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'ValidationError',
          'DISCONNECTCHANNEL',
          'INVALID_TOKEN',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'ValidationError',
          'DISCONNECTCHANNEL',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'ValidationError',
          'DISCONNECTCHANNEL',
          'TOKEN_INVALID',
          401,
        );
      }
      const { channelId } = data;
      if (!channelId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DISCONNECTCHANNEL',
          'DATA_INVALID',
          401,
        );
      }
      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new StandardizedError(
          `Invalid session ID(${sessionId})`,
          'DISCONNECTCHANNEL',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `User(${userId}) not found`,
          'DISCONNECTCHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[channelId];
      if (!channel) {
        throw new StandardizedError(
          `Channel(${channelId}) not found`,
          'DISCONNECTCHANNEL',
          'CHANNEL',
          404,
        );
      }

      // Update user
      const update = {
        currentChannelId: null,
        lastActiveAt: Date.now(),
      };
      await Set.user(userId, update);

      // Clear user contribution interval
      Interval.clearObtainXpInterval(socket);

      // Leave the channel
      // socket.leave(`channel_${channel.id}`);
      await rtcHandler.leave(io, socket, { channelId: channel.id });

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
      if (error instanceof StandardizedError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `離開頻道時發生無法預期的錯誤: ${error.error_message}`,
          part: 'DISCONNECTCHANNEL',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(
        `Error disconnecting from channel: ${error.error_message}`,
      );
    }
  },
  createChannel: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};

    try {
      // data = {
      //   channel: {
      //     ...
      //   },
      // }
      // console.log(data);

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'CREATECHANNEL',
          'ValidationError',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'CREATECHANNEL',
          'ValidationError',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'CREATECHANNEL',
          'ValidationError',
          'TOKEN_INVALID',
          401,
        );
      }
      const { channel } = data;
      if (!channel) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATECHANNEL',
          'DATA_INVALID',
          401,
        );
      }
      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new StandardizedError(
          `Invalid session ID(${sessionId})`,
          'CREATECHANNEL',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `User(${userId}) not found`,
          'CREATECHANNEL',
          'USER',
          404,
        );
      }
      const server = servers[channel.serverId];
      if (!server) {
        throw new StandardizedError(
          `Server(${channel.serverId}) not found`,
          'CREATECHANNEL',
          'SERVER',
          404,
        );
      }
      const members = await Get.serverMembers(server.id);
      if (!members[user.id]) {
        throw new StandardizedError(
          `User(${user.id}) not found in server(${server.id})`,
          'UPDATECHANNEL',
          'MEMBER',
          404,
        );
      }
      const userPermission = members[user.id].permissionLevel;
      if (!userPermission || userPermission < 4) {
        throw new StandardizedError(
          'Insufficient permissions',
          'UPDATECHANNEL',
          'USER_PERMISSION',
          403,
        );
      }

      // Validate channel name
      const nameError = Func.validateChannelName(channel.name);
      if (nameError) {
        throw new StandardizedError(
          nameError,
          'ValidationError',
          'CREATECHANNEL',
          'NAME',
          400,
        );
      }

      // Create new channel
      const channelId = uuidv4();
      await Set.channel(channelId, {
        name: channel.name,
        serverId: channel.serverId,
        order: await Get.serverChannels(server.id).length,
        createdAt: Date.now().valueOf(),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        channels: await Get.serverChannels(server.id),
      });

      new Logger('WebSocket').info(
        `Adding new channel(${channelId}) to server(${server.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (error instanceof StandardizedError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `新增頻道時發生無法預期的錯誤: ${error.error_message}`,
          part: 'CREATECHANNEL',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(
        'Error adding channel: ' + error.error_message,
      );
    }
  },
  updateChannel: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // data = {
      //   channel: {
      //     ...
      //   },
      // };
      // console.log(data);

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'UPDATECHANNEL',
          'ValidationError',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'UPDATECHANNEL',
          'ValidationError',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'UPDATECHANNEL',
          'ValidationError',
          'TOKEN_INVALID',
          401,
        );
      }
      const { channel: editedChannel } = data;
      if (!editedChannel) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATECHANNEL',
          'DATA_INVALID',
          401,
        );
      }
      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new StandardizedError(
          `Invalid session ID(${sessionId})`,
          'UPDATECHANNEL',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `User(${userId}) not found`,
          'UPDATECHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[editedChannel.id];
      if (!channel) {
        throw new StandardizedError(
          `Channel(${editedChannel.id}) not found`,
          'UPDATECHANNEL',
          'CHANNEL',
          404,
        );
      }
      const server = servers[channel.serverId];
      if (!server) {
        throw new StandardizedError(
          `Server(${channel.serverId}) not found`,
          'UPDATECHANNEL',
          'SERVER',
          404,
        );
      }
      const members = await Get.serverMembers(server.id);
      if (!members[user.id]) {
        throw new StandardizedError(
          `User(${user.id}) not found in server(${server.id})`,
          'UPDATECHANNEL',
          'MEMBER',
          404,
        );
      }
      const userPermission = members[user.id].permissionLevel;
      if (!userPermission || userPermission < 4) {
        throw new StandardizedError(
          'Insufficient permissions',
          'UPDATECHANNEL',
          'USER_PERMISSION',
          403,
        );
      }

      // Validate channel name
      const nameError = Func.validateChannelName(editedChannel.name);
      if (nameError) {
        throw new StandardizedError(
          nameError,
          'ValidationError',
          'UPDATECHANNEL',
          'NAME',
          400,
        );
      }

      // Validate channel visibility
      if (editedChannel.settings?.visibility) {
        const visibilityError = Func.validateChannelVisibility(
          editedChannel.settings.visibility,
        );
        if (visibilityError) {
          throw new StandardizedError(
            visibilityError,
            'ValidationError',
            'UPDATECHANNEL',
            'VISIBILITY',
            400,
          );
        }
      }

      // Validate user limit
      if (typeof editedChannel.settings?.userLimit !== 'undefined') {
        const userLimitError = Func.validateUserLimit(
          editedChannel.settings.userLimit,
        );
        if (userLimitError) {
          throw new StandardizedError(
            userLimitError,
            'ValidationError',
            'UPDATECHANNEL',
            'USER_LIMIT',
            400,
          );
        }
      }

      // Update channel
      await Set.channel(channel.id, editedChannel);

      // Emit updated data (to all users in the Channel)
      io.to(`channel_${channel.id}`).emit('channelUpdate', {
        ...editedChannel,
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        channels: await Get.serverChannels(server.id),
      });

      new Logger('WebSocket').info(
        `User(${user.id}) updated channel(${channel.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (error instanceof StandardizedError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `編輯頻道時發生無法預期的錯誤: ${error.error_message}`,
          part: 'UPDATECHANNEL',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(
        'Error updating channel: ' + error.error_message,
      );
    }
  },
  deleteChannel: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // data = {
      //   channelId:
      // }
      // console.log(data);

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'DELETECHANNEL',
          'ValidationError',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'DELETECHANNEL',
          'ValidationError',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'DELETECHANNEL',
          'ValidationError',
          'TOKEN_INVALID',
          401,
        );
      }
      const { channelId } = data;
      if (!channelId) {
        throw new StandardizedError(
          '無效的資料',
          'DELETECHANNEL',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }
      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new StandardizedError(
          `Invalid session ID(${sessionId})`,
          'DELETECHANNEL',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `User(${userId}) not found`,
          'DELETECHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[channelId];
      if (!channel) {
        throw new StandardizedError(
          `Channel(${channelId}) not found`,
          'DELETECHANNEL',
          'CHANNEL',
          404,
        );
      }

      // Update channel
      await Set.channel(channelId, { serverId: null });

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        channels: await Get.serverChannels(channel.serverId),
      });

      new Logger('WebSocket').info(
        `User(${user.id}) deleted channel(${channel.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (error instanceof StandardizedError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `刪除頻道時發生無法預期的錯誤: ${error.error_message}`,
          part: 'DELETECHANNEL',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(
        'Error deleting channel: ' + error.error_message,
      );
    }
  },
};

module.exports = { ...channelHandler };

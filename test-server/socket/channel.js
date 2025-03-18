/* eslint-disable @typescript-eslint/no-require-imports */
const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const StandardizedError = require('../utils/standardizedError');
const Logger = utils.logger;
const Get = utils.get;
const Set = utils.set;
const Func = utils.func;
const Interval = utils.interval;
// Handlers
const rtcHandler = require('./rtc');

const channelHandler = {
  refreshChannel: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // data = {
      //   channelId:
      // }
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'REFRESHCHANNEL',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { channelId } = data;
      if (!channelId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'REFRESHCHANNEL',
          'DATA_INVALID',
          401,
        );
      }
      const channel = channels[channelId];
      if (!channel) {
        throw new StandardizedError(
          `頻道(${channelId})不存在`,
          'ValidationError',
          'REFRESHCHANNEL',
          'CHANNEL',
          404,
        );
      }

      // Emit updated data (only to the user)
      io.to(socket.id).emit('channelUpdate', await Get.channel(channel.id));
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刷新頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'REFRESHCHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error refreshing channel: ${error.error_message}`,
      );
    }
  },
  connectChannel: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // data = {
      //   userId: string
      //   channelId:
      // }
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'CONNECTCHANNEL',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { userId, channelId } = data;
      if (!userId || !channelId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CONNECTCHANNEL',
          'DATA_INVALID',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${userId})不存在`,
          'ValidationError',
          'CONNECTCHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[channelId];
      if (!channel) {
        throw new StandardizedError(
          `頻道(${channelId})不存在`,
          'ValidationError',
          'CONNECTCHANNEL',
          'CHANNEL',
          404,
        );
      }
      if (channel.settings.visibility === 'private') {
        throw new StandardizedError(
          '無足夠的權限',
          'ValidationError',
          'CONNECTCHANNEL',
          'CHANNEL_VISIBILITY',
          403,
        );
      }

      // Disconnect the user from the current channel
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
      await rtcHandler.join(io, socket, { channelId: channel.id });

      // Emit updated data (only to the user)
      io.to(socket.id).emit('userUpdate', update);
      io.to(socket.id).emit('channelUpdate', await Get.channel(channel.id));

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        users: await Get.serverUsers(channel.serverId),
      });

      new Logger('WebSocket').success(
        `User(${user.id}) connected to channel(${channel.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `加入頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CONNECTCHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);
      io.to(socket.id).emit('channelUpdate', null);

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
      //   userId: string
      //   channelId: string
      // }
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'DISCONNECTCHANNEL',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { userId, channelId } = data;
      if (!userId || !channelId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DISCONNECTCHANNEL',
          'DATA_INVALID',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${userId})不存在`,
          'ValidationError',
          'DISCONNECTCHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[channelId];
      if (!channel) {
        throw new StandardizedError(
          `頻道(${channelId})不存在`,
          'ValidationError',
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
      await rtcHandler.leave(io, socket, { channelId: channel.id });

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'leave');

      // Emit updated data (only to the user)
      io.to(socket.id).emit('userUpdate', update);
      io.to(socket.id).emit('channelUpdate', null);

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        users: await Get.serverUsers(channel.serverId),
      });

      new Logger('WebSocket').success(
        `User(${user.id}) disconnected from channel(${channel.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `離開頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DISCONNECTCHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);
      io.to(socket.id).emit('channelUpdate', null);

      new Logger('WebSocket').error(
        `Error disconnecting from channel: ${error.error_message}`,
      );
    }
  },
  createChannel: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const members = (await db.get('members')) || {};

    try {
      // data = {
      //   userId: string
      //   channel: {
      //     ...
      //   },
      // }
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'CREATECHANNEL',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { channel: newChannel, userId } = data;
      if (!newChannel || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATECHANNEL',
          'DATA_INVALID',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${userId})不存在`,
          'ValidationError',
          'CREATECHANNEL',
          'USER',
          404,
        );
      }
      const server = servers[newChannel.serverId];
      if (!server) {
        throw new StandardizedError(
          `伺服器(${newChannel.serverId})不存在`,
          'ValidationError',
          'CREATECHANNEL',
          'SERVER',
          404,
        );
      }
      const member = members[`mb_${server.id}_${user.id}`];
      if (!member) {
        throw new StandardizedError(
          `使用者(${user.id})不存在於伺服器(${server.id})`,
          'ValidationError',
          'CREATECHANNEL',
          'MEMBER',
          404,
        );
      }
      const permission = member.permissionLevel;
      if (!permission || permission < 4) {
        throw new StandardizedError(
          '無足夠的權限',
          'ValidationError',
          'CREATECHANNEL',
          'USER_PERMISSION',
          403,
        );
      }
      // Validate channel name
      const nameError = Func.validateChannelName(newChannel.name);
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
        name: newChannel.name,
        serverId: server.id,
        order: await Get.serverChannels(server.id).length,
        createdAt: Date.now().valueOf(),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        channels: await Get.serverChannels(server.id),
      });

      new Logger('WebSocket').info(
        `User(${user.id}) created channel(${channelId}) in server(${server.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `新增頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATECHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        'Error creating channel: ' + error.error_message,
      );
    }
  },
  updateChannel: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};
    const members = (await db.get('members')) || {};

    try {
      // data = {
      //   userId: string
      //   channel: {
      //     ...
      //   },
      // };
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'UPDATECHANNEL',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { userId, channel: editedChannel } = data;
      if (!userId || !editedChannel) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATECHANNEL',
          'DATA_INVALID',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${userId})不存在`,
          'ValidationError',
          'UPDATECHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[editedChannel.id];
      if (!channel) {
        throw new StandardizedError(
          `頻道(${editedChannel.id})不存在`,
          'ValidationError',
          'UPDATECHANNEL',
          'CHANNEL',
          404,
        );
      }
      const server = servers[channel.serverId];
      if (!server) {
        throw new StandardizedError(
          `伺服器(${channel.serverId})不存在`,
          'ValidationError',
          'UPDATECHANNEL',
          'SERVER',
          404,
        );
      }
      const userMember = members[`mb_${server.id}_${user.id}`];
      if (!userMember) {
        throw new StandardizedError(
          `使用者(${user.id})不存在於伺服器(${server.id})`,
          'ValidationError',
          'USER',
          404,
        );
      }
      const permission = userMember.permissionLevel;
      if (!permission || permission < 4) {
        throw new StandardizedError(
          '無足夠的權限',
          'ValidationError',
          'UPDATECHANNEL',
          'USER_PERMISSION',
          403,
        );
      }
      // TODO: change to Func.validate,channel
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

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channel.id}`).emit('channelUpdate', editedChannel);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        channels: await Get.serverChannels(server.id),
      });

      new Logger('WebSocket').info(
        `User(${user.id}) updated channel(${channel.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `編輯頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATECHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);

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
      //   userId: string
      //   channelId: string
      // }
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'DELETECHANNEL',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { channelId, userId } = data;
      if (!channelId || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'DELETECHANNEL',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${userId})不存在`,
          'ValidationError',
          'DELETECHANNEL',
          'USER',
          404,
        );
      }
      const channel = channels[channelId];
      if (!channel) {
        throw new StandardizedError(
          `頻道(${channelId})不存在`,
          'ValidationError',
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
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刪除頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DELETECHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        'Error deleting channel: ' + error.error_message,
      );
    }
  },
};

module.exports = { ...channelHandler };

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
const XP = utils.xp;
// Handlers
const rtcHandler = require('./rtc');

const channelHandler = {
  refreshChannel: async (io, socket, data) => {
    // Get database
    const channels = (await db.get('channels')) || {};

    try {
      // data = {
      //   channelId:
      // }
      // console.log(data);

      // Validate data
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
      const channel = await Func.validate.channel(channels[channelId]);

      // Validate operation
      await Func.validate.socket(socket);

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
      const user = await Func.validate.user(users[userId]);
      const channel = await Func.validate.channel(channels[channelId]);

      // Validate operation
      await Func.validate.socket(socket);

      // Disconnect the user from the current channel
      if (user.currentChannelId) {
        await channelHandler.disconnectChannel(io, socket, {
          channelId: user.currentChannelId,
          userId: user.id,
        });
      }

      // Update user
      const update = {
        currentChannelId: channel.id,
        lastActiveAt: Date.now(),
      };
      await Set.user(userId, update);

      // Setup user interval for accumulate contribution
      XP.setup(socket);

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'join');

      // Join the channel
      await rtcHandler.join(io, socket, { channelId: channel.id });

      // Emit updated data (only to the user)
      io.to(socket.id).emit('userUpdate', update);
      io.to(socket.id).emit('channelUpdate', await Get.channel(channel.id));

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        members: await Get.serverMembers(channel.serverId),
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
      const user = await Func.validate.user(users[userId]);
      const channel = await Func.validate.channel(channels[channelId]);

      // Validate operation
      await Func.validate.socket(socket);

      // Update user
      const update = {
        currentChannelId: null,
        lastActiveAt: Date.now(),
      };
      await Set.user(userId, update);

      // Clear user contribution interval
      XP.clear(socket);

      // Leave the channel
      await rtcHandler.leave(io, socket, { channelId: channel.id });

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'leave');

      // Emit updated data (only to the user)
      io.to(socket.id).emit('userUpdate', update);
      io.to(socket.id).emit('channelUpdate', null);

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        members: await Get.serverMembers(channel.serverId),
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

    try {
      // data = {
      //   userId: string
      //   channel: {
      //     ...
      //   },
      // }
      // console.log(data);

      // Validate data
      const { channel: _newChannel, userId } = data;
      if (!_newChannel || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATECHANNEL',
          'DATA_INVALID',
          401,
        );
      }
      const user = await Func.validate.user(users[userId]);
      const newChannel = await Func.validate.channel(_newChannel);
      const server = await Func.validate.server(servers[newChannel.serverId]);

      // Validate operation
      await Func.validate.socket(socket);

      // const member = await Func.validate.member(
      //   members[`mb_${user.id}-${server.id}`],
      // );

      // const permission = member.permissionLevel;
      // if (!permission || permission < 4) {
      //   throw new StandardizedError(
      //     '無足夠的權限',
      //     'ValidationError',
      //     'CREATECHANNEL',
      //     'USER_PERMISSION',
      //     403,
      //   );
      // }

      // Create new channel
      const channelId = uuidv4();
      await Set.channel(channelId, {
        ...newChannel,
        serverId: server.id,
        order: await Get.serverChannels(server.id).length,
        createdAt: Date.now().valueOf(),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        channels: await Get.serverChannels(server.id),
      });

      new Logger('WebSocket').success(
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
    const channels = (await db.get('channels')) || {};
    // const members = (await db.get('members')) || {};

    try {
      // data = {
      //   userId: string
      //   channel: {
      //     ...
      //   },
      // };
      // console.log(data);

      // Validate data
      const { userId, channel: _editedChannel } = data;
      if (!userId || !_editedChannel) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATECHANNEL',
          'DATA_INVALID',
          401,
        );
      }
      const user = await Func.validate.user(users[userId]);
      const editedChannel = await Func.validate.channel(_editedChannel);
      const channel = await Func.validate.channel(channels[editedChannel.id]);

      // Validate operation
      await Func.validate.socket(socket);

      // const member = await Func.validate.member(
      //   members[`mb_${user.id}-${server.id}`],
      // );

      // const permission = member.permissionLevel;
      // if (!permission || permission < 4) {
      //   throw new StandardizedError(
      //     '無足夠的權限',
      //     'ValidationError',
      //     'UPDATECHANNEL',
      //     'USER_PERMISSION',
      //     403,
      //   );
      // }

      // Update channel
      await Set.channel(channel.id, editedChannel);

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channel.id}`).emit('channelUpdate', editedChannel);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        channels: await Get.serverChannels(server.id),
      });

      new Logger('WebSocket').success(
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
    // const members = (await db.get('members')) || {};

    try {
      // data = {
      //   userId: string
      //   channelId: string
      // }
      // console.log(data);

      // Validate data
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
      const user = await Func.validate.user(users[userId]);
      const channel = await Func.validate.channel(channels[channelId]);

      // Validate operation
      await Func.validate.socket(socket);

      // const member = await Func.validate.member(
      //   members[`mb_${user.id}-${server.id}`],
      // );

      // const permission = member.permissionLevel;
      // if (!permission || permission < 4) {
      //   throw new StandardizedError(
      //     '無足夠的權限',
      //     'ValidationError',
      //     'DELETECHANNEL',
      //     'USER_PERMISSION',
      //     403,
      //   );
      // }

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

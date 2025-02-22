const utils = require('../utils');
const Logger = utils.logger;
const SocketError = require('./socketError');

module.exports = (io, socket, db) => {
  socket.on('connectChannel', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   channelId: '123456',
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // validate data
      const { sessionId, channelId } = data;
      if (!sessionId || !channelId) {
        throw new SocketError(
          'Missing required fields',
          'CONNECTCHANNEL',
          'DATA',
          400,
        );
      }
      const userId = utils.map.userSessions.get(sessionId);
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
        utils.interval.setupContributionInterval(socket.id, userId);
      }

      // Update user presence
      user[user.id] = {
        ...user,
        currentChannelId: channel.id,
        updatedAt: Date.now(),
      };
      await db.set(`users.${user.id}`, users[user.id]);

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'join');

      // Join the channel
      socket.join(`channel_${channel.id}`);

      // Emit updated data (only to the user)
      io.to(socket.id).emit('channelConnect', {
        ...(await utils.get.channel(channel.id)),
      });
      io.to(socket.id).emit('userUpdate', {
        ...(await utils.get.user(user.id)),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        channels: (await utils.get.server(channel.serverId)).channels,
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

      new Logger('WebSocket').error(
        `Error connecting to channel: ${error.message}`,
      );
    }
  });

  socket.on('disconnectChannel', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   channelId: '123456',
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const { sessionId, channelId } = data;
      if (!sessionId) {
        throw new SocketError(
          'Missing required fields',
          'DISCONNECTCHANNEL',
          'DATA',
          400,
        );
      }
      const userId = utils.map.userSessions.get(sessionId);
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
      users[user.id] = {
        ...user,
        currentChannelId: null,
        updatedAt: Date.now(),
      };
      await db.set(`users.${user.id}`, users[user.id]);

      // Clear user contribution interval
      utils.interval.clearContributionInterval(socket.id);

      // Leave the channel
      socket.leave(`channel_${channel.id}`);

      // Play sound
      io.to(`channel_${channel.id}`).emit('playSound', 'leave');

      // Emit updated data (only to the user)
      io.to(socket.id).emit('channelDisconnect', null);
      io.to(socket.id).emit('userUpdate', {
        ...(await utils.get.user(user.id)),
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        channels: (await utils.get.server(channel.serverId)).channels,
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
  });

  socket.on('createChannel', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   serverId: '123456',
    //   channel: {
    //     ...
    //   },
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const { sessionId, serverId, channel } = data;
      if (!sessionId || !channel) {
        throw new SocketError(
          'Missing required fields',
          'CREATECHANNEL',
          'DATA',
          400,
        );
      }
      const userId = utils.map.userSessions.get(sessionId);
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
      const userPermission = await getPermissionLevel(userId, serverId);
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
      channels[channelId] = {
        ...channel,
        id: channelId,
        serverId: server.id,
        createdAt: Date.now().valueOf(),
        order: server.channelIds.length,
      };
      await db.set(`channels.${channelId}`, channels[channelId]);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('serverUpdate', {
        channels: (await utils.get.server(server.id)).channels,
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
  });

  socket.on('updateChannel', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   channelId: '123456',
    //   channel: {
    //     ...
    //   },
    // };
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const { sessionId, channelId, channel: editedChannel } = data;
      if (!sessionId || !channelId || !editedChannel) {
        throw new SocketError(
          'Missing required fields',
          'UPDATECHANNEL',
          'DATA',
          400,
        );
      }
      const userId = utils.map.userSessions.get(sessionId);
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
      const userPermission = await getPermissionLevel(userId, channel.serverId);
      if (userPermission < 4) {
        throw new SocketError(
          'Insufficient permissions',
          'UPDATECHANNEL',
          'USER_PERMISSION',
          403,
        );
      }

      // Update channel
      channels[channel.id] = {
        ...channel,
        ...editedChannel,
      };
      await db.set(`channels.${channel.id}`, channels[channel.id]);

      // Emit updated data (to all users in the Channel)
      io.to(`channel_${channelId}`).emit('channelUpdate', {
        ...editedChannel,
      });

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        channels: (await utils.get.server(channel.serverId)).channels,
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
  });

  socket.on('deleteChannel', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   channelId: '123456',
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const { sessionId, channelId } = data;
      if (!sessionId || !channelId) {
        throw new SocketError(
          'Missing required fields',
          'DELETECHANNEL',
          'DATA',
          400,
        );
      }
      const userId = utils.map.userSessions.get(sessionId);
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
      channels[channelId] = {
        ...channel,
        serverId: null,
      };

      // Emit updated data (to all users in the server)
      io.to(`server_${channel.serverId}`).emit('serverUpdate', {
        channels: (await utils.get.server(channel.serverId)).channels,
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
  });
};

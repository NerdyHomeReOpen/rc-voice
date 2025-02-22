const utils = require('../utils');
const Logger = utils.logger;
const SocketError = require('./socketError');

module.exports = (io, socket, db) => {
  socket.on('connectServer', async (data) => {
    // data = {
    //   sessionId:
    //   serverId:
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const members = (await db.get('members')) || {};

    try {
      // Validate data
      const { sessionId, serverId } = data;
      if (!sessionId || !serverId) {
        throw new SocketError(
          'Missing required fields',
          'CONNECTSERVER',
          'DATA',
          400,
        );
      }
      const userId = utils.map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'CONNECTSERVER',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'CONNECTSERVER',
          'USER',
          404,
        );
      }
      const server = servers[serverId];
      if (!server) {
        throw new SocketError(
          `Server(${serverId}) not found`,
          'CONNECTSERVER',
          'SERVER',
          404,
        );
      }

      // Check if user is already exists in the server
      const member = Object.values(members).find(
        (member) => member.serverId === server.id && member.userId === user.id,
      );
      if (!member) {
        // Create new membership
        const memberId = uuidv4();
        members[memberId] = {
          id: memberId,
          isBlocked: false,
          nickname: user.name,
          serverId: server.id,
          userId: user.id,
          contribution: 0,
          permissionLevel: 1,
          createdAt: Date.now(),
        };
        await db.set(`members.${memberId}`, members[memberId]);
      }

      // Check if server is invisible and user is not a member
      if (
        member &&
        server.settings.visibility === 'invisible' &&
        member.permissionLevel < 2
      ) {
        throw new SocketError(
          'Server is invisible or you are not a member',
          'CONNECTSERVER',
          'VISIBILITY',
          403,
        );
      }
      // Check user is blocked from the server
      if (member && member.isBlocked) {
        throw new SocketError(
          'You are blocked from the server',
          'CONNECTSERVER',
          'BLOCKED',
          403,
        );
      }

      // Update user presence
      users[user.id] = {
        ...user,
        currentServerId: server.id,
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
      };
      await db.set(`users.${user.id}`, users[user.id]);

      // Join the server
      socket.join(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('serverConnect', {
        ...(await utils.get.server(server.id)),
        applications: await utils.get.serverApplications(server.id),
      });
      io.to(socket.id).emit('userUpdate', {
        ...(await utils.get.user(user.id)),
      });

      new Logger('WebSocket').success(
        `User(${user.id}) connected to server(${server.id})`,
      );
    } catch (error) {
      // Emit data (only to the user)
      io.to(socket.id).emit('serverDisconnect', null);

      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `加入伺服器時發生無法預期的錯誤: ${error.message}`,
          part: 'CONNECTSERVER',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(
        `Error connecting server: ${error.message}`,
      );
    }
  });

  socket.on('disconnectServer', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   serverId: '{serverId}',
    // }
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const { sessionId, serverId } = data;
      if (!sessionId) {
        throw new SocketError(
          'Missing required fields',
          'DISCONNECTSERVER',
          'DATA',
          400,
        );
      }
      const userId = utils.map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'DISCONNECTSERVER',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'DISCONNECTSERVER',
          'USER',
          404,
        );
      }
      const server = servers[serverId];
      if (!server) {
        throw new SocketError(
          `Server(${serverId}) not found`,
          'DISCONNECTSERVER',
          'SERVER',
          404,
        );
      }
      const channel = channels[user.currentChannelId];
      if (!channel) {
        new Logger('WebSocket').warn(
          `Channel(${user.currentChannelId}) not found. Won't disconnect channel.`,
        );
      }

      // Update user presence
      users[user.id] = {
        ...user,
        currentServerId: null,
        currentChannelId: null,
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
        io.to(`server_${server.id}`).emit('serverUpdate', {
          channels: (await utils.get.server(server.id)).channels,
        });
      }

      // Leave the server
      socket.leave(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('serverDisconnect', null);
      io.to(socket.id).emit('userUpdate', {
        ...(await utils.get.user(user.id)),
      });

      new Logger('WebSocket').success(
        `User(${user.id}) disconnected from server(${server.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `離開伺服器時發生無法預期的錯誤: ${error.message}`,
          part: 'DISCONNECTSERVER',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(
        `Error disconnecting from server: ${error.message}`,
      );
    }
  });

  socket.on('updateServer', async (data) => {
    // data = {
    //   sessionId
    //   serverId
    //   server: {
    //     ...
    //   }

    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};

    let uploadedFilePath = null;

    try {
      // Validate data
      const { sessionId, serverId, server: editedServer } = data;
      if (!sessionId || !serverId || !editedServer) {
        throw new SocketError(
          'Missing required fields',
          'UPDATESERVER',
          'DATA',
          400,
        );
      }
      const userId = utils.map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'UPDATESERVER',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'UPDATESERVER',
          'USER',
          404,
        );
      }
      const server = servers[serverId];
      if (!server) {
        throw new SocketError(
          `Server(${serverId}) not found`,
          'UPDATESERVER',
          'SERVER',
          404,
        );
      }
      const userPermission = await getPermissionLevel(userId, server.id);
      if (userPermission < 5) {
        throw new SocketError(
          'Insufficient permissions',
          'UPDATESERVER',
          'PERMISSION',
          403,
        );
      }

      // FIX ME: Update server data

      if (editedServer.fileData && editedServer.fileType) {
        // Create file with unique name
        const ext = updates.fileType.split('/')[1];
        const fileName = `${uuidv4()}.${ext}`;
        uploadedFilePath = path.join(uploadDir, fileName);

        // Save file
        const buffer = Buffer.from(updates.fileData, 'base64');
        await fs.writeFile(uploadedFilePath, buffer);

        // Create icon path
        const iconPath = `/uploads/serverAvatars/${fileName}`;

        // Delete old icon if exists
        if (server.iconUrl && !server.iconUrl.includes('logo_server_def.png')) {
          const oldPath = path.join(
            UPLOADS_DIR,
            server.iconUrl.replace('/uploads/', ''),
          );
          try {
            await fs.unlink(oldPath);
          } catch (error) {
            new Logger('Server').warn(
              `Error deleting old icon: ${error.message}`,
            );
          }
        }

        // Add icon URL to updates
        updates.iconUrl = iconPath;
      }

      // Remove file data from updates before saving
      const { fileData, fileType, ...serverUpdates } = updates;

      // Validate specific fields
      if (
        serverUpdates.name &&
        (serverUpdates.name.length > 30 || !serverUpdates.name.trim())
      ) {
        throw new SocketError(
          'Invalid server name',
          'UPDATESERVER',
          'NAME',
          400,
        );
      }
      if (serverUpdates.description && serverUpdates.description.length > 200) {
        throw new SocketError(
          'Invalid server description',
          'UPDATESERVER',
          'DESCRIPTION',
          400,
        );
      }

      // Create new server object with only allowed updates
      const updatedServer = {
        ...server,
        ..._.pick(serverUpdates, [
          'name',
          'slogan',
          'description',
          'iconUrl',
          'announcement',
        ]),
        settings: {
          ...server.settings,
          ..._.pick(serverUpdates.settings || {}, ['visibility']),
        },
      };

      // Update in database
      await db.set(`servers.${serverId}`, servers[serverId]);

      // Emit updated data to all users in the server
      io.to(`server_${serverId}`).emit('serverUpdate', {
        ...editedServer,
      });

      new Logger('Server').success(
        `Server(${server.id}) updated by user(${user.id})`,
      );
    } catch (error) {
      // Delete uploaded file if error occurs
      if (uploadedFilePath) {
        fs.unlink(uploadedFilePath).catch(console.error);
      }
      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `更新伺服器時發生無法預期的錯誤: ${error.message}`,
          part: 'UPDATESERVER',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('Server').error(`Error updating server: ${error.message}`);
    }
  });
};

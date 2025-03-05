const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const fs = require('fs').promises;
const path = require('path');
const _ = require('lodash');
const formidable = require('formidable');
// Constants
const {
  UPLOADS_PATH,
  SERVER_AVATAR_PATH,
  UPLOADS_DIR,
  SERVER_AVATAR_DIR,
} = require('../constant');
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
const channelHandler = require('./channel');

const serverHandler = {
  connectServer: async (io, socket, sessionId, serverId) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const members = (await db.get('members')) || {};

    try {
      // Validate data
      const userId = Map.sessionToUser.get(sessionId);
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
      const member = Object.values(members).find(
        (member) => member.serverId === server.id && member.userId === user.id,
      );
      if (
        server.settings.visibility === 'invisible' &&
        !(member?.permissionLevel > 1)
      ) {
        throw new SocketError(
          'Server is invisible and you are not a member',
          'CONNECTSERVER',
          'VISIBILITY',
          403,
        );
      }
      if (member?.isBlocked) {
        throw new SocketError(
          'You are blocked from the server',
          'CONNECTSERVER',
          'BLOCKED',
          403,
        );
      }

      // Create new membership if there isn't one
      if (!member) {
        const memberId = uuidv4();
        await Set.member(memberId, {
          nickname: user.name,
          serverId: server.id,
          userId: user.id,
          createdAt: Date.now(),
        });
      }

      // Leave prev server
      if (user.currentServerId) {
        await serverHandler.disconnectServer(
          io,
          socket,
          sessionId,
          user.currentServerId,
        );
      }

      // Connect to the server's lobby channel
      await channelHandler.connectChannel(
        io,
        socket,
        sessionId,
        server.lobbyId,
      );

      // Update user
      const update = {
        currentServerId: server.id,
        lastActiveAt: Date.now(),
      };
      await Set.user(user.id, update);

      // Join the server
      socket.join(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', update);
      io.to(socket.id).emit('serverConnect', await Get.server(server.id));

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
  },
  disconnectServer: async (io, socket, sessionId, serverId) => {
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

      // Leave prev channel
      if (channel) {
        await channelHandler.disconnectChannel(
          io,
          socket,
          sessionId,
          channel.id,
        );
      }

      // Update user presence
      const update = {
        currentServerId: null,
        lastActiveAt: Date.now(),
      };
      await Set.user(user.id, update);

      // Leave the server
      socket.leave(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', update);
      io.to(socket.id).emit('serverDisconnect', null);

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
  },
  createServer: async (io, socket, sessionId, server) => {
    // Get database
    const users = (await db.get('users')) || {};
    let uploadedFilePath = null;

    try {
      // Validate data
      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'CREATESERVER',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'CREATESERVER',
          'USER',
          404,
        );
      }
      if (!server.name || server.name.length > 30 || !server.name.trim()) {
        throw new SocketError(
          'Invalid server name',
          'CREATESERVER',
          'NAME',
          400,
        );
      }
      const userOwnedServers = await Get.userOwnedServers(userId);
      if (userOwnedServers.length >= 3) {
        throw new SocketError(
          'You have reached the maximum number of servers you can own',
          'CREATESERVER',
          'LIMIT',
          403,
        );
      }

      // Handle avatar upload if provided
      let avatarPath = null;
      if (server.avatar) {
        const matches = server.avatar.match(/^data:image\/(.*?);base64,/);
        if (!matches) {
          throw new Error('無效的圖片格式');
        }

        const imageType = matches[1];
        if (!['png', 'jpeg', 'gif', 'webp'].includes(imageType)) {
          throw new Error('無效的圖片格式');
        }
        const base64Data = server.avatar.replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        const buffer = Buffer.from(base64Data, 'base64');

        // Check file size (5MB limit)
        if (buffer.length > 5 * 1024 * 1024) {
          throw new Error('圖片大小超過限制');
        }

        // Create file with unique name
        const fileName = `${uuidv4()}.${imageType}`;
        uploadedFilePath = path.join(SERVER_AVATAR_DIR, fileName);

        // Save file
        await fs.writeFile(uploadedFilePath, buffer);
        avatarPath = `/${SERVER_AVATAR_PATH}/${fileName}`;
      }

      // Create server / main channel (lobby) / member (owner)
      const serverId = uuidv4();
      const channelId = uuidv4();
      const memberId = uuidv4();
      await Set.server(serverId, {
        name: server.name.toString().trim().substring(0, 30),
        description: server.description.toString().substring(0, 200),
        avatarUrl: avatarPath,
        displayId: await Func.generateUniqueDisplayId(),
        lobbyId: channelId,
        ownerId: userId,
        settings: {
          visibility: server.settings.visibility || 'public',
          defaultChannelId: channelId,
        },
        createdAt: Date.now(),
      });
      await Set.channel(channelId, {
        name: '大廳',
        isLobby: true,
        isMain: true,
        serverId: serverId,
        settings: {
          visibility: 'public',
          slowmode: false,
          userLimit: -1,
        },
        createdAt: Date.now(),
      });
      await Set.member(memberId, {
        permissionLevel: 6,
        nickname: user.name,
        serverId: serverId,
        userId: userId,
        createdAt: Date.now(),
      });

      // Join the server
      await serverHandler.connectServer(io, socket, sessionId, serverId);

      new Logger('Server').success(
        `New server(${serverId}) created by user(${userId})`,
      );
    } catch (error) {
      // Clean up uploaded file if error
      if (uploadedFilePath) {
        fs.unlink(uploadedFilePath).catch((err) => {
          new Logger('Server').error(`Error deleting file: ${err.message}`);
        });
      }

      // Error response
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `建立伺服器時發生無法預期的錯誤: ${error.message}`,
          part: 'CREATESERVER',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('Server').error(`Error creating server: ${error.message}`);
    }
  },
  updateServer: async (io, socket, sessionId, editedServer) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};

    let uploadedFilePath = null;

    try {
      // Validate data
      const userId = Map.sessionToUser.get(sessionId);
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
      const server = servers[editedServer.id];
      if (!server) {
        throw new SocketError(
          `Server(${editedServer.id}) not found`,
          'UPDATESERVER',
          'SERVER',
          404,
        );
      }
      const members = await Get.serverMembers(server.id);
      if (!members[user.id]) {
        throw new SocketError(
          `User(${user.id}) not found in server(${server.id})`,
          'UPDATECHANNEL',
          'MEMBER',
          404,
        );
      }
      const userPermission = members[user.id].permission;
      if (userPermission < 4) {
        throw new SocketError(
          'Insufficient permissions',
          'UPDATECHANNEL',
          'USER_PERMISSION',
          403,
        );
      }

      // FIXME: Unable change server avatar
      let avatarPath = null;
      if (editedServer.avatar) {
        const matches = editedServer.avatar.match(/^data:image\/(.*?);base64,/);
        if (!matches) {
          throw new Error('無效的圖片格式');
        }

        const imageType = matches[1];
        if (!['png', 'jpeg', 'gif', 'webp'].includes(imageType)) {
          throw new Error('無效的圖片格式');
        }
        const base64Data = editedServer.avatar.replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        const buffer = Buffer.from(base64Data, 'base64');

        // Check file size (5MB limit)
        if (buffer.length > 5 * 1024 * 1024) {
          throw new Error('圖片大小超過限制');
        }

        // Create file with unique name
        const fileName = `${uuidv4()}.${imageType}`;
        uploadedFilePath = path.join(SERVER_AVATAR_DIR, fileName);
        avatarPath = `/${SERVER_AVATAR_PATH}/${fileName}`;

        // Delete old avatar if exists and is not default
        if (
          server.avatarUrl &&
          !server.avatarUrl.includes('logo_server_def.png')
        ) {
          try {
            const oldFileName = server.avatarUrl.split('/').pop();
            const oldPath = path.join(SERVER_AVATAR_DIR, oldFileName);
            await fs.unlink(oldPath);
          } catch (error) {
            new Logger('Server').warn(`無法刪除舊頭像: ${error.message}`);
          }
        }

        // Save new file
        await fs.writeFile(uploadedFilePath, buffer);
        editedServer.avatarUrl = avatarPath;
      }

      // Validate specific fields
      if (
        editedServer.name &&
        (editedServer.name.length > 30 || !editedServer.name.trim())
      ) {
        throw new SocketError(
          'Invalid server name',
          'UPDATESERVER',
          'NAME',
          400,
        );
      }
      if (editedServer.description && editedServer.description.length > 200) {
        throw new SocketError(
          'Invalid server description',
          'UPDATESERVER',
          'DESCRIPTION',
          400,
        );
      }

      // Create new server object with only allowed updates
      await Set.server(server.id, {
        ...server,
        ..._.pick(editedServer, [
          'name',
          'slogan',
          'description',
          'iconUrl',
          'announcement',
        ]),
        settings: {
          ...server.settings,
          ..._.pick(editedServer.settings || {}, ['visibility']),
        },
      });

      // Emit updated data to all users in the server
      io.to(`server_${server.id}`).emit('serverUpdate', editedServer);

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
  },
};

module.exports = { ...serverHandler };

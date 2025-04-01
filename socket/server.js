/* eslint-disable @typescript-eslint/no-require-imports */
const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const {
  standardizedError: StandardizedError,
  logger: Logger,
  get: Get,
  set: Set,
  func: Func,
  specialUsers,
} = utils;
// Handlers
const channelHandler = require('./channel');

const serverHandler = {
  searchServer: async (io, socket, data) => {
    try {
      // data = {
      //   query:
      // }

      // Validate data
      const { query } = data;
      if (!query) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'SEARCHSERVER',
          'DATA_INVALID',
          401,
        );
      }

      // Validate operation
      await Func.validate.socket(socket);

      io.to(socket.id).emit('serverSearch', await Get.searchServer(query));
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `搜尋群組時發生錯誤: ${error.message}`,
          'ServerError',
          'SEARCHSERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }
      io.to(socket.id).emit('error', error);
      new Logger('WebSocket').error(
        `Error searching servers: ${error.error_message}`,
      );
    }
  },

  connectServer: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};

    try {
      // data = {
      //   userId:
      //   serverId:
      // }

      // Validate data
      const { userId, serverId } = data;
      if (!userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CONNECTSERVER',
          'DATA_INVALID',
          401,
        );
      }
      const user = await Func.validate.user(users[userId]);
      const server = await Func.validate.server(servers[serverId]);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);
      const operator = await Func.validate.user(users[operatorId]);
      // TODO: Add validation for operator

      // Create new membership if there isn't one
      const member = await Get.member(user.id, server.id);
      const specialPermissionLevel = specialUsers.getSpecialPermissionLevel(
        user.id,
      );
      if (
        !specialPermissionLevel &&
        server.visibility == 'invisible' &&
        (!member || member.permissionLevel < 2)
      ) {
        io.to(socket.id).emit('openPopup', {
          popupType: 'applyMember',
          initialData: {
            serverId: server.id,
            userId: user.id,
          },
        });
        return;
      }

      if (!member) {
        await Set.member(`mb_${user.id}-${server.id}`, {
          serverId: server.id,
          userId: user.id,
          permissionLevel: specialPermissionLevel || 1,
          createdAt: Date.now(),
        });
      }

      // Leave prev server
      if (user.currentServerId) {
        await serverHandler.disconnectServer(io, socket, {
          serverId: user.currentServerId,
          userId: user.id,
        });
      }

      // Connect to the server's lobby channel
      await channelHandler.connectChannel(io, socket, {
        channelId: server.lobbyId,
        userId: user.id,
      });

      // Update user-server
      await Set.userServer(`us_${user.id}-${server.id}`, {
        userId: user.id,
        serverId: server.id,
        recent: true,
        timestamp: Date.now(),
      });

      // Update user
      const user_update = {
        currentServerId: server.id,
        lastActiveAt: Date.now(),
      };
      await Set.user(user.id, user_update);

      // Join the server
      socket.join(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', user_update);
      io.to(socket.id).emit('serverUpdate', await Get.server(server.id));

      new Logger('WebSocket').success(
        `User(${user.id}) connected to server(${server.id}) by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `連接群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CONNECTSERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('serverUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error connecting server: ${error.error_message}`,
      );
    }
  },

  disconnectServer: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};

    try {
      // data = {
      //   userId:
      //   serverId:
      // }

      // Validate data
      const { userId, serverId } = data;
      if (!userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DISCONNECTSERVER',
          'DATA_INVALID',
          401,
        );
      }
      const user = await Func.validate.user(users[userId]);
      const server = await Func.validate.server(servers[serverId]);

      // Validate data
      const operatorId = await Func.validate.socket(socket);
      const operator = await Func.validate.user(users[operatorId]);
      // TODO: Add validation for operator

      // Leave prev channel
      if (user.currentChannelId) {
        await channelHandler.disconnectChannel(io, socket, {
          channelId: user.currentChannelId,
          userId: user.id,
        });
      }

      // Update user presence
      const user_update = {
        currentServerId: null,
        lastActiveAt: Date.now(),
      };
      await Set.user(user.id, user_update);

      // Leave the server
      socket.leave(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', user_update);
      io.to(socket.id).emit('serverUpdate', null);

      new Logger('WebSocket').success(
        `User(${user.id}) disconnected from server(${server.id}) by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `斷開群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DISCONNECTSERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('serverUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error disconnecting from server: ${error.error_message}`,
      );
    }
  },

  createServer: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};

    try {
      // data = {
      //   server: {
      //     ...
      //   }
      // }

      // Validate data
      const { server: _newServer } = data;
      if (!_newServer) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATESERVER',
          'DATA_INVALID',
          401,
        );
      }
      const newServer = await Func.validate.server(_newServer);

      // Validate data
      const operatorId = await Func.validate.socket(socket);
      const operator = await Func.validate.user(users[operatorId]);
      // TODO: Add validation for operator

      const userOwnedServers = await Get.userOwnedServers(operator.id);
      const userLevel = (await Get.user(operator.id)).level;
      const MAX_GROUPS =
        userLevel >= 16 ? 5 : userLevel >= 6 && userLevel < 16 ? 4 : 3;

      if (userOwnedServers.length >= MAX_GROUPS) {
        throw new StandardizedError(
          '你已經創建了最大數量的群組',
          'ValidationError',
          'CREATESERVER',
          'SERVER_LIMIT',
          403,
        );
      }

      // Create Ids
      const serverId = uuidv4();
      const channelId = uuidv4();

      // Create server
      const server = await Set.server(serverId, {
        ...newServer,
        name: newServer.name.trim(),
        description: newServer.description.trim(),
        displayId: await Func.generateUniqueDisplayId(),
        lobbyId: channelId,
        ownerId: operator.id,
        createdAt: Date.now(),
      });

      // Create channel (lobby)
      await Set.channel(channelId, {
        name: '大廳',
        isLobby: true,
        isRoot: true,
        serverId: server.id,
        createdAt: Date.now(),
      });

      // Create member
      const specialPermissionLevel = specialUsers.getSpecialPermissionLevel(
        operator.id,
      );
      await Set.member(`mb_${operator.id}-${server.id}`, {
        permissionLevel: specialPermissionLevel || 6,
        userId: operator.id,
        serverId: server.id,
        createdAt: Date.now(),
      });

      // Create user-server
      await Set.userServer(`us_${operator.id}-${server.id}`, {
        recent: true,
        owned: true,
        userId: operator.id,
        serverId: server.id,
        timestamp: Date.now(),
      });

      // Join the server
      await serverHandler.connectServer(io, socket, {
        serverId: server.id,
        userId: operator.id,
      });

      new Logger('Server').success(
        `Server(${server.id}) created by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `創建群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATESERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error creating server: ${error.error_message}`,
      );
    }
  },

  updateServer: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};

    try {
      // data = {
      //   serverId:
      //   server: {
      //     ...
      //   }
      // }

      // Validate data
      const { server: _editedServer, serverId } = data;
      if (!_editedServer || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATESERVER',
          'DATA_INVALID',
          401,
        );
      }
      const server = await Func.validate.server(servers[serverId]);
      const editedServer = await Func.validate.server(_editedServer);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);
      const operator = await Func.validate.user(users[operatorId]);
      // TODO: Add validation for operator

      const member = await Get.member(operator.id, server.id);
      const permission = member.permissionLevel;
      if (!permission || permission < 5) {
        throw new StandardizedError(
          '你沒有權限更新群組',
          'ValidationError',
          'UPDATESERVER',
          'USER_PERMISSION',
          403,
        );
      }

      // Update server
      await Set.server(server.id, editedServer);

      // Emit updated data to all users in the server
      io.to(`server_${server.id}`).emit('serverUpdate', editedServer);

      new Logger('Server').success(
        `Server(${server.id}) updated by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATESERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error updating server: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...serverHandler };

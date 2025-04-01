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
const memberHandler = require('./member');

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

      // Validate socket
      await Func.validate.socket(socket);

      io.to(socket.id).emit('serverSearch', await Get.searchServer(query));
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `搜尋群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'SEARCHSERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error searching servers: ${error.error_message}`,
      );
    }
  },

  connectServer: async (io, socket, data) => {
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

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const server = await Get.server(serverId);
      const operatorMember = await Get.member(operator.id, server.id);
      const userSocket = Object.values(io.sockets.sockets).find(
        (s) => s.userId === user.id,
      );

      // Validate operation
      if (operator.id !== user.id) {
        throw new StandardizedError(
          '無法移動其他用戶的群組',
          'ValidationError',
          'CONNECTSERVER',
          'PERMISSION_DENIED',
          403,
        );
      } else {
        if (
          server.visibility === 'invisible' &&
          operatorMember.permissionLevel < 2
        ) {
          io.to(userSocket.id).emit('openPopup', {
            popupType: 'applyMember',
            initialData: {
              serverId: server.id,
              userId: user.id,
            },
          });
          return;
        }
      }

      // Create new membership if there isn't one
      if (!operatorMember) {
        await memberHandler.createMember(io, socket, {
          userId: user.id,
          serverId: server.id,
          member: {
            permissionLevel:
              specialUsers.getSpecialPermissionLevel(user.id) || 1,
          },
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
      userSocket.join(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(userSocket.id).emit('userUpdate', user_update);
      io.to(userSocket.id).emit('serverUpdate', await Get.server(server.id));

      new Logger('Server').success(
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

      // Emit data (to the operator)
      io.to(socket.id).emit('serverUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error connecting server: ${error.error_message}`,
      );
    }
  },

  disconnectServer: async (io, socket, data) => {
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

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const server = await Get.server(serverId);
      const operatorMember = await Get.member(operator.id, server.id);
      const userSocket = Object.values(io.sockets.sockets).find(
        (s) => s.userId === user.id,
      );

      // Validate operation
      if (operator.id !== user.id) {
        if (server.id !== user.currentServerId) {
          throw new StandardizedError(
            '無法踢出不在該群組的用戶',
            'ValidationError',
            'DISCONNECTSERVER',
            'PERMISSION_DENIED',
            403,
          );
        }
        if (operatorMember.permissionLevel < 5) {
          throw new StandardizedError(
            '你沒有足夠的權限踢出其他用戶',
            'ValidationError',
            'DISCONNECTSERVER',
            'PERMISSION_DENIED',
            403,
          );
        }
      }

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
      userSocket.leave(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(userSocket.id).emit('userUpdate', user_update);
      io.to(userSocket.id).emit('serverUpdate', null);

      new Logger('Server').success(
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

      // Emit data (to the operator)
      io.to(socket.id).emit('serverUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error disconnecting from server: ${error.error_message}`,
      );
    }
  },

  createServer: async (io, socket, data) => {
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

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const MAX_GROUPS = Math.min(3 + operator.level / 5, 10);

      // Validate operation
      if (operator.ownedServers.length >= MAX_GROUPS) {
        throw new StandardizedError(
          '可擁有群組數量已達上限',
          'ValidationError',
          'CREATESERVER',
          'LIMIT_REACHED',
          403,
        );
      }

      // Create Ids
      const serverId = uuidv4();
      const channelId = uuidv4();

      // Create server
      await Set.server(serverId, {
        ...newServer,
        name: newServer.name.trim(),
        slogan: newServer.slogan.trim(),
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
        serverId: serverId,
        createdAt: Date.now(),
      });

      // Create member
      const specialPermissionLevel = specialUsers.getSpecialPermissionLevel(
        operator.id,
      );
      await memberHandler.createMember(io, socket, {
        userId: operator.id,
        serverId: serverId,
        member: {
          permissionLevel: specialPermissionLevel || 6,
        },
      });

      // Create user-server
      await Set.userServer(`us_${operator.id}-${serverId}`, {
        recent: true,
        owned: true,
        userId: operator.id,
        serverId: serverId,
        timestamp: Date.now(),
      });

      // Join the server
      await serverHandler.connectServer(io, socket, {
        serverId: serverId,
        userId: operator.id,
      });

      new Logger('Server').success(
        `Server(${serverId}) created by User(${operator.id})`,
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

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error creating server: ${error.error_message}`,
      );
    }
  },

  updateServer: async (io, socket, data) => {
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
      const editedServer = await Func.validate.server(_editedServer);

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const server = await Get.server(serverId);
      const operatorMember = await Get.member(operator.id, server.id);

      // Validate operation
      if (operatorMember.permissionLevel < 5) {
        throw new StandardizedError(
          '你沒有足夠的權限更新該群組',
          'ValidationError',
          'UPDATESERVER',
          'PERMISSION_DENIED',
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

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error updating server: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...serverHandler };

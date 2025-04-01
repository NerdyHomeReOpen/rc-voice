/* eslint-disable @typescript-eslint/no-require-imports */
// Utils
const utils = require('../utils');
const {
  standardizedError: StandardizedError,
  logger: Logger,
  map: Map,
  get: Get,
  set: Set,
  func: Func,
} = utils;
// Handlers
const serverHandler = require('./server');
const channelHandler = require('./channel');

const userHandler = {
  searchUser: async (io, socket, data) => {
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
          'SEARCHUSER',
          'DATA_INVALID',
          401,
        );
      }

      // Validate socket
      await Func.validate.socket(socket);

      // Emit data (to the operator)
      io.to(socket.id).emit('userSearch', await Get.searchUser(query));
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `搜尋使用者時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'SEARCHUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error searching user: ${error.error_message}`,
      );
    }
  },

  connectUser: async (io, socket) => {
    try {
      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);

      // Check if user is already connected
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === operator.id && _socket.id !== socket.id) {
          io.to(_socket.id).emit('openPopup', {
            popupType: 'anotherDeviceLogin',
          });
          _socket.disconnect();
        }
        console.log(`io.sockets.sockets: ${JSON.stringify(Array.from(io.sockets.sockets))}`);
      });
      console.log(`io.sockets.sockets: ${JSON.stringify(Array.from(io.sockets.sockets))}`);

      // Emit data (to the operator)
      io.to(socket.id).emit('userUpdate', operator);

      new Logger('WebSocket').success(
        `User(${operator.id}) connected with socket(${socket.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `連接使用者時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CONNECTUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('userUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error connecting user: ${error.error_message}`,
      );
    }
  },

  disconnectUser: async (io, socket) => {
    try {
      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);

      // Disconnect server or channel
      if (user.currentServerId) {
        await serverHandler.disconnectServer(io, socket, {
          serverId: operator.currentServerId,
          userId: operator.id,
        });
      } else if (user.currentChannelId) {
        await channelHandler.disconnectChannel(io, socket, {
          channelId: operator.currentChannelId,
          userId: operator.id,
        });
      }

      // Remove maps
      Map.deleteUserIdSessionIdMap(operator.id, socket.sessionId);
      Map.deleteUserIdSocketIdMap(operator.id, socket.id);

      // Update user
      const user_update = {
        lastActiveAt: Date.now(),
      };
      await Set.user(operator.id, user_update);

      // Emit data (to the operator)
      io.to(socket.id).emit('userUpdate', user_update);

      new Logger('WebSocket').success(`User(${operator.id}) disconnected`);
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `斷開使用者時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DISCONNECTUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('userUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error disconnecting user: ${error.error_message}`,
      );
    }
  },

  updateUser: async (io, socket, data) => {
    try {
      // Validate data
      const { user: _editedUser, userId } = data;
      if (!_editedUser || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEUSER',
          'DATA_INVALID',
          401,
        );
      }
      const editedUser = await Func.validate.user(_editedUser);

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const userSocket = Object.values(io.sockets.sockets).find(
        (s) => s.userId === user.id,
      );

      // Validate operation
      if (operator.id !== user.id) {
        throw new StandardizedError(
          '無法更新其他使用者的資料',
          'ValidationError',
          'UPDATEUSER',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Update user data
      await Set.user(user.id, editedUser);

      // Emit data (to the operator)
      io.to(userSocket.id).emit('userUpdate', editedUser);

      new Logger('WebSocket').success(
        `User(${user.id}) updated by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新使用者時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEUSER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error updating user: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...userHandler };

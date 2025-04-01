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
} = utils;

const friendGroupHandler = {
  createFriendGroup: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string,
      //   group: {
      //     ...
      //   },
      // }

      // Validate data
      const { group: _newFriendGroup, userId } = data;
      if (!_newFriendGroup || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATEFRIENDGROUP',
          'DATA_INVALID',
          401,
        );
      }
      const newFriendGroup = await Func.validate.friendGroup(_newFriendGroup);

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
          '你沒有權限新增非自己的好友群組',
          'ValidationError',
          'CREATEFRIENDGROUP',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Create friend group
      const friendGroupId = uuidv4();
      await Set.friendGroup(friendGroupId, {
        ...newFriendGroup,
        userId: user.id,
        createdAt: Date.now(),
      });

      // Emit updated data (to the user)
      io.to(userSocket.id).emit('userUpdate', {
        friendGroups: await Get.userFriendGroups(user.id),
      });

      new Logger('FriendGroup').success(
        `FriendGroup(${friendGroupId}) of User(${user.id}) created by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `新增好友群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATEFRIENDGROUP',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendGroup').error(
        `Error creating friend group: ${error.error_message}`,
      );
    }
  },

  updateFriendGroup: async (io, socket, data) => {
    try {
      // data = {
      //   friendGroupId: string,
      //   group: {
      //     ...
      //   },
      // }

      // Validate data
      const { friendGroupId, group: _editedFriendGroup } = data;
      if (!friendGroupId || !_editedFriendGroup) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEFRIENDGROUP',
          'DATA_INVALID',
          401,
        );
      }
      const editedFriendGroup = await Func.validate.friendGroup(
        _editedFriendGroup,
      );

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const friendGroup = await Get.friendGroup(friendGroupId);
      const user = await Get.user(friendGroup.userId);
      const userSocket = Object.values(io.sockets.sockets).find(
        (s) => s.userId === friendGroup.userId,
      );

      // Validate operation
      if (operator.id !== friendGroup.userId) {
        throw new StandardizedError(
          '你沒有權限修改非自己的好友群組',
          'ValidationError',
          'UPDATEFRIENDGROUP',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Update friend group
      await Set.friendGroup(friendGroup.id, editedFriendGroup);

      // Emit updated data (to the user)
      io.to(userSocket.id).emit('userUpdate', {
        friendGroups: await Get.userFriendGroups(user.id),
      });

      new Logger('FriendGroup').success(
        `FriendGroup(${friendGroup.id}) of User(${user.id}) updated by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新好友群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEFRIENDGROUP',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendGroup').error(
        `Error updating friend group: ${error.error_message}`,
      );
    }
  },

  deleteFriendGroup: async (io, socket, data) => {
    try {
      // data = {
      //   friendGroupId: string,
      // }

      // Validate data
      const { friendGroupId } = data;
      if (!friendGroupId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DELETEFRIENDGROUP',
          'DATA_INVALID',
          401,
        );
      }

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const friendGroup = await Get.friendGroup(friendGroupId);
      const user = await Get.user(friendGroup.userId);
      const userSocket = Object.values(io.sockets.sockets).find(
        (s) => s.userId === friendGroup.userId,
      );

      // Validate operation
      if (operator.id !== friendGroup.userId) {
        throw new StandardizedError(
          '你沒有權限刪除非自己的好友群組',
          'ValidationError',
          'DELETEFRIENDGROUP',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Delete friend group
      await db.delete(`friendGroups.${friendGroup.id}`);

      // Emit updated data (to the user)
      io.to(userSocket.id).emit('userUpdate', {
        friendGroups: await Get.userFriendGroups(user.id),
      });

      new Logger('FriendGroup').success(
        `FriendGroup(${friendGroup.id}) of User(${user.id}) deleted by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刪除好友群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DELETEFRIENDGROUP',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('FriendGroup').error(
        `Error deleting friend group: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...friendGroupHandler };

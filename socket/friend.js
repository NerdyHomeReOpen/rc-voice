/* eslint-disable @typescript-eslint/no-require-imports */
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

const friendHandler = {
  createFriend: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string;
      //   targetId: string;
      //   friend: {
      //     ...
      //   },
      // }

      // Validate data
      const { friend: _newFriend, userId, targetId } = data;
      if (!_newFriend || !userId || !targetId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATEFRIEND',
          'DATA_INVALID',
          401,
        );
      }
      const newFriend = await Func.validate.friend(_newFriend);

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const target = await Get.user(targetId);
      let userSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === user.id) {
          userSocket = _socket;
          userSocket.id = _socket.userId;
          console.log(`userSocket.id: ${userSocket.id}`);
        }
      });
      let targetSocket;
      io.sockets.sockets.forEach((_socket) => {
        if (_socket.userId === target.id) {
          targetSocket = _socket;
          targetSocket.id = _socket.userId;
          console.log(`targetSocket.id: ${targetSocket.id}`);
        }
      });

      // Validate operation
      if (operator.id !== user.id) {
        throw new StandardizedError(
          '無法新增非自己的好友',
          'ValidationError',
          'CREATEFRIEND',
          'PERMISSION_DENIED',
          403,
        );
      }
      if (user.id === target.id) {
        throw new StandardizedError(
          '無法將自己加入好友',
          'ValidationError',
          'CREATEFRIEND',
          'SELF_OPERATION',
          403,
        );
      }

      // Create friend
      const friendId = `fd_${userId}-${targetId}`;
      await Set.friend(friendId, {
        ...newFriend,
        userId: user.id,
        targetId: target.id,
        createdAt: Date.now(),
      });

      // Create reverse friend
      const friend_ = `fd_${targetId}-${userId}`;
      await Set.friend(friend_, {
        ...newFriend,
        friendGroupId: '',
        userId: target.id,
        targetId: user.id,
        createdAt: Date.now(),
      });

      // Emit data (to the user and target)
      io.to(userSocket.id).emit('userUpdate', {
        friends: await Get.userFriends(user.id),
      });
      io.to(targetSocket.id).emit('userUpdate', {
        friends: await Get.userFriends(target.id),
      });

      new Logger('Friend').success(
        `Friend(${friendId}) and Friend(${friend_}) of User(${user.id}) and User(${target.id}) created by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `建立好友時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATEFRIEND',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Friend').error(
        `Error creating friend: ${error.error_message}`,
      );
    }
  },

  updateFriend: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string
      //   targetId: string
      //   friend: {
      //     ...
      //   }
      // }

      // Validate data
      const { friend: _editedFriend, userId, targetId } = data;
      if (!_editedFriend || !userId || !targetId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEFRIEND',
          'DATA_INVALID',
          401,
        );
      }
      const editedFriend = await Func.validate.friend(_editedFriend);

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const target = await Get.user(targetId);
      const friend = await Get.friend(userId, targetId);
      const userSocket = Object.values(io.sockets.sockets).find(
        (s) => s.userId === user.id,
      );
      const targetSocket = Object.values(io.sockets.sockets).find(
        (s) => s.userId === target.id,
      );

      // Validate operation
      if (operator.id !== user.id) {
        throw new StandardizedError(
          '無法修改非自己的好友',
          'ValidationError',
          'UPDATEFRIEND',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Update friend
      await Set.friend(friend.id, editedFriend);

      // Emit data (to the user and target)
      io.to(userSocket.id).emit('friendUpdate', editedFriend);
      io.to(userSocket.id).emit('userUpdate', {
        friends: await Get.userFriends(userId),
      });
      io.to(targetSocket.id).emit('friendUpdate', editedFriend);
      io.to(targetSocket.id).emit('userUpdate', {
        friends: await Get.userFriends(targetId),
      });

      new Logger('Friend').success(
        `Friend(${friend.id}) of User(${user.id}) and User(${target.id}) updated by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新好友時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEFRIEND',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('Friend').error(
        `Error updating friend: ${error.error_message}`,
      );
    }
  },
  deleteFriend: async (io, socket, data) => {
    try {
      // data = {
      //   userId: string
      //   targetId: string
      // }

      // Validate data
      const { userId, targetId } = data;
      if (!userId || !targetId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DELETEFRIEND',
          'DATA_INVALID',
          401,
        );
      }

      // Validate socket
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const user = await Get.user(userId);
      const target = await Get.user(targetId);
      const friend = await Get.friend(userId, targetId);
      const friend_ = await Get.friend(targetId, userId);
      const userSocket = Object.values(io.sockets.sockets).find(
        (s) => s.userId === user.id,
      );
      const targetSocket = Object.values(io.sockets.sockets).find(
        (s) => s.userId === target.id,
      );

      // Validate operation
      if (operator.id !== user.id) {
        throw new StandardizedError(
          '無法刪除非自己的好友',
          'ValidationError',
          'DELETEFRIEND',
          'PERMISSION_DENIED',
          403,
        );
      }

      await db.delete(`friends.${`fd_${friend.userId}-${friend.targetId}`}`);
      await db.delete(`friends.${`fd_${friend_.userId}-${friend_.targetId}`}`);

      // Emit data (to the user and target)
      io.to(userSocket.id).emit('userUpdate', {
        friends: await Get.userFriends(userId),
      });
      io.to(targetSocket.id).emit('userUpdate', {
        friends: await Get.userFriends(targetId),
      });

      new Logger('Friend').success(
        `Friend(${friend.id}) and Friend(${friend_.id}) of User(${user.id}) and User(${target.id}) deleted by User(${operator.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刪除好友時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DELETEFRIEND',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Friend').error(
        `Error deleting friend: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...friendHandler };

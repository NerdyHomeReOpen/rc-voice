/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const StandardizedError = utils.standardizedError;
const Logger = utils.logger;
const Func = utils.func;
const Get = utils.get;
const Set = utils.set;

const friendHandler = {
  refreshFriend: async (io, socket, data) => {
    // Get database
    const friends = (await db.get('friends')) || {};

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
          'REFRESHFRIEND',
          'DATA_INVALID',
          401,
        );
      }
      const friend = await Func.validate.friend(
        friends[`fd_${userId}_${targetId}`] ||
          friends[`fd_${targetId}_${userId}`],
      );

      // Validate operation
      await Func.validate.socket(socket);

      // Emit data (only to the user)
      io.to(socket.id).emit(
        'friendUpdate',
        await Get.friend(friend.user1Id, friend.user2Id),
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刷新好友列表時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'REFRESHFRIEND',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('Friend').error(
        `Error refreshing friend list: ${error.error_message}`,
      );
    }
  },
  updateFriend: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const friends = (await db.get('friends')) || {};

    try {
      // data = {
      //   userId: string
      //   friend: {
      //     ...
      //   }
      // }
      const { friend: _editedFriend, userId } = data;
      if (!_editedFriend || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEFRIEND',
          'DATA_INVALID',
          401,
        );
      }
      const user = await Func.validate.user(users[userId]);
      const editedFriend = await Func.validate.friend(_editedFriend);
      const friend = await Func.validate.friend(friends[editedFriend.id]);

      // Validate operation
      await Func.validate.socket(socket);

      // const userFriend = friends[`fd_${userId}_${friend.id}`];
      // if (!userFriend) {
      //   throw new StandardizedError(
      //     `你不是此使用者的好友`,
      //     'ValidationError',
      //     'UPDATEFRIEND',
      //     'OPERATOR_NOT_FRIEND',
      //     403,
      //   );
      // }

      // Update friend
      await Set.friend(friend.id, editedFriend);

      // Emit data (only to the user)
      io.to(socket.id).emit('friendUpdate', editedFriend);

      new Logger('Friend').info(`Friend(${friend.id}) updated`);
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
};

module.exports = { ...friendHandler };

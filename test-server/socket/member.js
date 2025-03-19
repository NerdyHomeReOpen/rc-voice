/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const StandardizedError = utils.standardizedError;
const Logger = utils.logger;
const Get = utils.get;
const Set = utils.set;
const Func = utils.func;

const memberHandler = {
  refreshMember: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const members = (await db.get('members')) || {};

    try {
      // data = {
      //   userId: string;
      //   serverId: string;
      // }
      // console.log(data);

      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'REFRESHMEMBER',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { userId, serverId } = data;
      if (!userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'REFRESHMEMBER',
          'DATA_INVALID',
          401,
        );
      }
      const member = members[`mb_${userId}-${serverId}`];
      if (!member) {
        throw new StandardizedError(
          `成員(mb_${userId}-${serverId})不存在`,
          'ValidationError',
          'REFRESHMEMBER',
          'MEMBER_NOT_FOUND',
          404,
        );
      }

      // Emit updated data to the user
      io.to(socket.id).emit(
        'memberUpdate',
        await Get.member(member.userId, member.serverId),
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新成員時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'REFRESHMEMBER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error refreshing member: ${error.error_message}`,
      );
    }
  },
  updateMember: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const members = (await db.get('members')) || {};

    try {
      // data = {
      //   userId: string;
      //   member: {
      //     ...
      //   },
      // }
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'UPDATEMEMBER',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { member: editedMember, userId } = data;
      if (!editedMember || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEMEMBER',
          'DATA_INVALID',
          401,
        );
      }
      const member = members[editedMember.id];
      if (!member) {
        throw new StandardizedError(
          `成員(${editedMember.id})不存在`,
          'ValidationError',
          'UPDATEMEMBER',
          'MEMBER_NOT_FOUND',
          404,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${userId})不存在`,
          'ValidationError',
          'UPDATEMEMBER',
          'USER_NOT_FOUND',
          404,
        );
      }
      const userMember = members[`mb_${userId}-${member.serverId}`];
      if (!userMember) {
        throw new StandardizedError(
          `你不是此群組的成員`,
          'ValidationError',
          'UPDATEMEMBER',
          'OPERATOR_NOT_MEMBER',
          403,
        );
      }
      if (userMember.permissionLevel < member.permissionLevel) {
        throw new StandardizedError(
          '你沒有權限更改此成員的權限',
          'ValidationError',
          'UPDATEMEMBER',
          'PERMISSION_DENIED',
          403,
        );
      }
      if (userMember.id === member.id) {
        throw new StandardizedError(
          '無法更改自己的權限',
          'ValidationError',
          'UPDATEMEMBER',
          'PERMISSION_DENIED',
          403,
        );
      }

      // Update member
      await Set.member(member.id, editedMember);

      // Emit updated data to all users in the server
      io.to(socket.id).emit('memberUpdate', editedMember);

      new Logger('Server').info(`Member(${member.id}) updated`);
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新成員時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATEMEMBER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error updating member: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...memberHandler };

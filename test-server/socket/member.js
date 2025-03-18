const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const Logger = utils.logger;
const Map = utils.map;
const Get = utils.get;
const Interval = utils.interval;
const Func = utils.func;
const Set = utils.set;
const JWT = utils.jwt;
// Socket error
const StandardizedError = require('../standardizedError');

const memberHandler = {
  refreshMember: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const members = (await db.get('members')) || {};
  },
  updateMember: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const members = (await db.get('members')) || {};

    try {
      // data = {
      //   serverId:
      // }
      // console.log(data);

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'ValidationError',
          'UPDATEMEMBER',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'ValidationError',
          'UPDATEMEMBER',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'ValidationError',
          'UPDATEMEMBER',
          'TOKEN_INVALID',
          401,
        );
      }
      const { serverId, targetMember } = data;
      if (!serverId || !targetMember) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATEMEMBER',
          'DATA_INVALID',
          401,
        );
      }
      const userId = Map.sessionToUser.get(sessionId);
      if (!userId) {
        throw new StandardizedError(
          `無效的 session ID(${sessionId})`,
          'ValidationError',
          'CONNECTSERVER',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${userId})不存在`,
          'ValidationError',
          'CONNECTSERVER',
          'USER',
          404,
        );
      }
      const server = servers[serverId];
      if (!server) {
        throw new StandardizedError(
          `群組(${serverId})不存在`,
          'ValidationError',
          'CONNECTSERVER',
          'SERVER',
          404,
        );
      }
      const member = members[targetMember.id];
      if (!member) {
        throw new StandardizedError(
          `成員(${targetMember.id})不存在`,
          'ValidationError',
          'CONNECTSERVER',
          'MEMBER',
          404,
        );
      }
      if (member.permissionLevel > user.permissionLevel) {
        throw new StandardizedError(
          '權限不足',
          'ValidationError',
          'CONNECTSERVER',
          'PERMISSION_DENIED',
          401,
        );
      }

      // Check if the update data contains permissionLevel or isBlocked
      if (targetMember.permissionLevel) {
        if (targetMember.userId === user.id) {
          throw new StandardizedError(
            '無法更改自己的權限',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            401,
          );
        }
        if (targetMember.permissionLevel > user.permissionLevel) {
          throw new StandardizedError(
            '無法更改比自己權限高的使用者',
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION_DENIED',
            401,
          );
        }
      }
      if (targetMember.isBlocked && targetMember.userId === user.id) {
        throw new StandardizedError(
          '無法封鎖自己',
          'ValidationError',
          'UPDATEMEMBER',
          'PERMISSION_DENIED',
          401,
        );
      }

      // Validate additional data
      if (targetMember.nickname) {
        const nicknameError = Func.validateNickname(targetMember.nickname);
        if (nicknameError) {
          throw new StandardizedError(
            nicknameError,
            'ValidationError',
            'UPDATEMEMBER',
            'NICKNAME',
            400,
          );
        }
      }

      if (typeof targetMember.permissionLevel !== 'undefined') {
        const permissionError = Func.validatePermissionLevel(
          targetMember.permissionLevel,
        );
        if (permissionError) {
          throw new StandardizedError(
            permissionError,
            'ValidationError',
            'UPDATEMEMBER',
            'PERMISSION',
            400,
          );
        }
      }

      // Update member
      await Set.member(`${targetMember.id}`, targetMember);

      // Emit updated data to all users in the server
      io.to(serverId).emit('serverUpdate', await Get.server(serverId));

      new Logger('Server').info(
        `User ${userId} updated member ${targetMember.id} in server ${serverId}`,
      );
    } catch (error) {
      if (!error instanceof StandardizedError) {
        error = new StandardizedError(
          `更新使用者時發生無法預期的錯誤: ${error.error_message}`,
          'MemberError',
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

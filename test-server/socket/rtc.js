/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const StandardizedError = utils.standardizedError;
const Logger = utils.logger;
const Func = utils.func;

const rtcHandler = {
  offer: async (io, socket, data) => {
    // Get database
    const users = await db.get('users');

    try {
      // data = {
      //   to:
      //   offer: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'SENDRTCOFFER',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { to, offer } = data;
      if (!to || !offer) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'SENDRTCOFFER',
          'DATA_INVALID',
          401,
        );
      }

      socket.to(to).emit('RTCOffer', {
        from: socket.id,
        offer: offer,
      });

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) sent RTC offer to user(socket-id: ${to})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `傳送 RTC offer 時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'SENDRTCOFFER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('RTC').error(
        `Error sending RTC offer to user(socket-id: ${to}): ${error.error_message}`,
      );
    }
  },
  answer: async (io, socket, data) => {
    // Get database
    const users = await db.get('users');

    try {
      // data = {
      //   to:
      //   answer: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'SENDRTCANSWER',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { to, answer } = data;
      if (!to || !answer) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'SENDRTCANSWER',
          'DATA_INVALID',
          401,
        );
      }

      socket.to(to).emit('RTCAnswer', {
        from: socket.id,
        answer: answer,
      });

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) sent RTC answer to user(socket-id: ${to})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `傳送 RTC answer 時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'SENDRTCANSWER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('RTC').error(
        `Error sending RTC answer to user(socket-id: ${to}): ${error.error_message}`,
      );
    }
  },
  candidate: async (io, socket, data) => {
    // Get database
    const users = await db.get('users');

    try {
      // data = {
      //   to:
      //   candidate: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'SENDRTCCANDIDATE',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { to, candidate } = data;
      if (!to || !candidate) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'SENDRTCCANDIDATE',
          'DATA_INVALID',
          401,
        );
      }

      socket.to(to).emit('RTCIceCandidate', {
        from: socket.id,
        candidate: candidate,
      });

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) sent RTC ICE candidate to user(socket-id: ${to})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `傳送 RTC ICE candidate 時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'SENDRTCICECANDIDATE',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('RTC').error(
        `Error sending RTC ICE candidate user(socket-id: ${to}): ${error.error_message}`,
      );
    }
  },
  join: async (io, socket, data) => {
    // Get database
    const users = await db.get('users');

    try {
      // data = {
      //   channelId:
      // };
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'JOINRTCCHANNEL',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { channelId } = data;
      if (!channelId) {
        throw new StandardizedError(
          '無效的資料',
          'JOINRTCCHANNEL',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }

      socket.join(`channel_${channelId}`);

      // Emit RTC join event (To all users)
      socket.to(`channel_${channelId}`).emit('RTCJoin', socket.id);

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) joined RTC channel(${channelId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `加入 RTC 頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'JOINRTCCHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('RTC').error(
        `Error joining RTC channel(${channelId}): ${error.error_message}`,
      );
    }
  },
  leave: async (io, socket, data) => {
    // Get database
    const users = await db.get('users');

    try {
      // data = {
      //   channelId:
      // };
      // console.log(data);

      // Validate data
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'LEAVERTCCHANNEL',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { channelId } = data;
      if (!channelId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'LEAVERTCCHANNEL',
          'DATA_INVALID',
          401,
        );
      }

      socket.leave(`channel_${channelId}`);

      // Emit RTC leave event (To all users)
      socket.to(`channel_${channelId}`).emit('RTCLeave', socket.id);

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) left RTC channel(${channelId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `離開 RTC 頻道時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'LEAVERTCCHANNEL',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('RTC').error(
        `Error leaving RTC channel(${channelId}): ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...rtcHandler };

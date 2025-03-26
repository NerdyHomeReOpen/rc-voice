/* eslint-disable @typescript-eslint/no-require-imports */
// Utils
const utils = require('../utils');
const {
  standardizedError: StandardizedError,
  logger: Logger,
  func: Func,
} = utils;

const rtcHandler = {
  offer: async (io, socket, data) => {
    // Get database

    try {
      // data = {
      //   to:
      //   offer: {
      //     ...
      //   }
      // };

      // Validate data
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

      // Validate operation
      await Func.validate.socket(socket);
      // TODO: Add validation for operator

      socket.to(to).emit('RTCOffer', {
        from: socket.userId,
        offer: offer,
      });

      new Logger('RTC').success(
        `User(${socket.userId}) sent RTC offer to user(${to})`,
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
        `Error sending RTC offer to user(${to}): ${error.error_message}`,
      );
    }
  },

  answer: async (io, socket, data) => {
    // Get database

    try {
      // data = {
      //   to:
      //   answer: {
      //     ...
      //   }
      // };

      // Validate data
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

      // Validate operation
      await Func.validate.socket(socket);
      // TODO: Add validation for operator

      socket.to(to).emit('RTCAnswer', {
        from: socket.userId,
        answer: answer,
      });

      new Logger('RTC').success(
        `User(${socket.userId}) sent RTC answer to user(${to})`,
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
        `Error sending RTC answer to user(${to}): ${error.error_message}`,
      );
    }
  },

  candidate: async (io, socket, data) => {
    // Get database

    try {
      // data = {
      //   to:
      //   candidate: {
      //     ...
      //   }
      // };

      // Validate data
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

      // Validate operation
      await Func.validate.socket(socket);
      // TODO: Add validation for operator

      socket.to(to).emit('RTCIceCandidate', {
        from: socket.userId,
        candidate: candidate,
      });

      new Logger('RTC').success(
        `User(${socket.userId}) sent RTC ICE candidate to user(${to})`,
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
        `Error sending RTC ICE candidate to user(${to}): ${error.error_message}`,
      );
    }
  },

  join: async (io, socket, data) => {
    // Get database

    try {
      // data = {
      //   channelId:
      // };

      // Validate data
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

      // Validate operation
      await Func.validate.socket(socket);
      // TODO: Add validation for operator

      socket.join(`channel_${channelId}`);

      // Emit RTC join event (To all users)
      socket.to(`channel_${channelId}`).emit('RTCJoin', socket.userId);

      new Logger('RTC').success(
        `User(${socket.userId}) joined RTC channel(${channelId})`,
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

    try {
      // data = {
      //   channelId:
      // };

      // Validate data
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

      // Validate operation
      await Func.validate.socket(socket);
      // TODO: Add validation for operator

      socket.leave(`channel_${channelId}`);

      // Emit RTC leave event (To all users)
      socket.to(`channel_${channelId}`).emit('RTCLeave', socket.userId);

      new Logger('RTC').success(
        `User(${socket.userId}) left RTC channel(${channelId})`,
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

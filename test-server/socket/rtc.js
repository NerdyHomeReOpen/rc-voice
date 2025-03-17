const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const Logger = utils.logger;
const Map = utils.map;
const Get = utils.get;
const Interval = utils.interval;
const Set = utils.set;
const JWT = utils.jwt;
// Socket error
const StandardizedError = require('../standardizedError');

const rtcRooms = {};

const rtcHandler = {
  offer: async (io, socket, data) => {
    try {
      // data = {
      //   to:
      //   offer: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'SENDRTCOFFER',
          'ValidationError',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'SENDRTCOFFER',
          'ValidationError',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'SENDRTCOFFER',
          'ValidationError',
          'TOKEN_INVALID',
          401,
        );
      }
      const { to, offer } = data;
      if (!to || !offer) {
        throw new StandardizedError(
          '無效的資料',
          'SENDRTCOFFER',
          'ValidationError',
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
      if (!error instanceof StandardizedError) {
        error = new StandardizedError(
          `傳送 RTC offer 時發生無法預期的錯誤: ${error.error_message}`,
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
    try {
      // data = {
      //   to:
      //   answer: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'SENDRTCANSWER',
          'ValidationError',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'SENDRTCANSWER',
          'ValidationError',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'SENDRTCANSWER',
          'ValidationError',
          'TOKEN_INVALID',
          401,
        );
      }
      const { to, answer } = data;
      if (!to || !answer) {
        throw new StandardizedError(
          '無效的資料',
          'SENDRTCANSWER',
          'ValidationError',
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
      if (!error instanceof StandardizedError) {
        error = new StandardizedError(
          `傳送 RTC answer 時發生無法預期的錯誤: ${error.error_message}`,
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
    try {
      // data = {
      //   to:
      //   candidate: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'SENDRTCCANDIDATE',
          'ValidationError',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'SENDRTCCANDIDATE',
          'ValidationError',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'SENDRTCCANDIDATE',
          'ValidationError',
          'TOKEN_INVALID',
          401,
        );
      }
      const { to, candidate } = data;
      if (!to || !candidate) {
        throw new StandardizedError(
          '無效的資料',
          'SENDRTCCANDIDATE',
          'ValidationError',
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
      if (!error instanceof StandardizedError) {
        error = new StandardizedError(
          `傳送 RTC ICE candidate 時發生無法預期的錯誤: ${error.error_message}`,
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
    try {
      // data = {
      //   channelId:
      // };
      // console.log(data);

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'JOINRTCCHANNEL',
          'ValidationError',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'JOINRTCCHANNEL',
          'ValidationError',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'JOINRTCCHANNEL',
          'ValidationError',
          'TOKEN_INVALID',
          401,
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

      // NOT USED ANYMORE
      // if (!rtcRooms[channelId]) rtcRooms[channelId] = [];
      // rtcRooms[channelId].push(socket.id);

      // Emit RTC join event (To all users)
      socket.to(`channel_${channelId}`).emit('RTCJoin', socket.id);

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) joined RTC channel(${channelId})`,
      );
    } catch (error) {
      if (!error instanceof StandardizedError) {
        error = new StandardizedError(
          `加入 RTC 頻道時發生無法預期的錯誤: ${error.error_message}`,
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
    try {
      // data = {
      //   channelId:
      // };
      // console.log(data);

      // Validate data
      const jwt = socket.jwt;
      if (!jwt) {
        throw new StandardizedError(
          '無可用的 JWT',
          'LEAVERTCCHANNEL',
          'ValidationError',
          'TOKEN_MISSING',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new StandardizedError(
          '無可用的 session ID',
          'LEAVERTCCHANNEL',
          'ValidationError',
          'SESSION_MISSING',
          401,
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        throw new StandardizedError(
          '無效的 token',
          'LEAVERTCCHANNEL',
          'ValidationError',
          'TOKEN_INVALID',
          401,
        );
      }
      const { channelId } = data;
      if (!channelId) {
        throw new StandardizedError(
          '無效的資料',
          'LEAVERTCCHANNEL',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }

      socket.leave(`channel_${channelId}`);

      // NOT USED ANYMORE
      // if (!rtcRooms[channelId]) return;
      // rtcRooms[channelId] = rtcRooms[channelId].filter(
      //   (id) => id !== socket.id,
      // );

      // Emit RTC leave event (To all users)
      socket.to(`channel_${channelId}`).emit('RTCLeave', socket.id);

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) left RTC channel(${channelId})`,
      );
    } catch (error) {
      if (!error instanceof StandardizedError) {
        error = new StandardizedError(
          `離開 RTC 頻道時發生無法預期的錯誤: ${error.error_message}`,
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

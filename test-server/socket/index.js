const { v4: uuidv4 } = require('uuid');
// Utils
const utils = require('../utils');
const Logger = utils.logger;
const Map = utils.map;
const Get = utils.get;
const Interval = utils.interval;
const JWT = utils.jwt;
// Socket error
const StandardizedError = require('../standardizedError');
// Handlers
const userHandler = require('./user');
const serverHandler = require('./server');
const channelHandler = require('./channel');
const messageHandler = require('./message');
const rtcHandler = require('./rtc');

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const jwt = socket.handshake.query.jwt;
      if (!jwt) {
        return next(
          new StandardizedError(
            '無可用的 JWT',
            'ValidationError',
            'AUTH',
            'TOKEN_MISSING',
            401,
          ),
        );
      }
      const result = JWT.verifyToken(jwt);
      if (!result.valid) {
        return next(
          new StandardizedError(
            '無效的 token',
            'ValidationError',
            'AUTH',
            'TOKEN_INVALID',
            401,
          ),
        );
      }
      const userId = result.userId;
      if (!userId) {
        return next(
          new StandardizedError(
            '無效的 token',
            'ValidationError',
            'AUTH',
            'TOKEN_INVALID',
            401,
          ),
        );
      }

      // Generate a new session ID
      const sessionId = uuidv4();

      socket.jwt = jwt;
      socket.sessionId = sessionId;

      return next();
    } catch (error) {
      if (!error instanceof StandardizedError) {
        error = new StandardizedError(
          `驗證時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'AUTH',
          'EXCEPTION_ERROR',
          500,
        );
      }

      return next(error);
    }
  });

  // Connect
  io.on('connection', (socket) => {
    userHandler.connectUser(io, socket);
    // Disconnect
    socket.on('disconnect', () => userHandler.disconnectUser(io, socket));
    // User
    socket.on('updateUser', async (data) =>
      userHandler.updateUser(io, socket, data),
    );
    // Server
    socket.on('connectServer', async (data) =>
      serverHandler.connectServer(io, socket, data),
    );
    socket.on('disconnectServer', async (data) =>
      serverHandler.disconnectServer(io, socket, data),
    );
    socket.on('createServer', async (data) =>
      serverHandler.createServer(io, socket, data),
    );
    socket.on('updateServer', async (data) =>
      serverHandler.updateServer(io, socket, data),
    );
    socket.on('getSearchResult', async (data) => {
      serverHandler.getSearchResult(io, socket, data);
    });
    // Channel
    socket.on('connectChannel', async (data) =>
      channelHandler.connectChannel(io, socket, data),
    );
    socket.on('disconnectChannel', async (data) =>
      channelHandler.disconnectChannel(io, socket, data),
    );
    socket.on('createChannel', async (data) =>
      channelHandler.createChannel(io, socket, data),
    );
    socket.on('updateChannel', async (data) =>
      channelHandler.updateChannel(io, socket, data),
    );
    socket.on('deleteChannel', async (data) =>
      channelHandler.deleteChannel(io, socket, data),
    );
    // Message
    socket.on('message', async (data) =>
      messageHandler.sendMessage(io, socket, data),
    );
    socket.on('directMessage', async (data) =>
      messageHandler.sendDirectMessage(io, socket, data),
    );
    // RTC
    socket.on('RTCOffer', async (data) => rtcHandler.offer(io, socket, data));
    socket.on('RTCAnswer', async (data) => rtcHandler.answer(io, socket, data));
    socket.on('RTCIceCandidate', async (data) =>
      rtcHandler.candidate(io, socket, data),
    );
  });
};

const { v4: uuidv4 } = require('uuid');
// Utils
const utils = require('../utils');
const Logger = utils.logger;
const Map = utils.map;
const Get = utils.get;
const Interval = utils.interval;
const JWT = utils.jwt;
// Socket error
const SocketError = require('./socketError');
// Handlers
const userHandler = require('./user');
const serverHandler = require('./server');
const channelHandler = require('./channel');
const messageHandler = require('./message');
const rtcHandler = require('./rtc');

module.exports = (io) => {
  io.use((socket, next) => {
    const jwt = socket.handshake.query.jwt;
    if (!jwt) {
      return next(
        new SocketError(
          'No authentication token',
          'AUTH',
          'TOKEN_MISSING',
          401,
        ),
      );
    }
    const result = JWT.verifyToken(jwt);
    if (!result.valid) {
      return next(
        new SocketError('Invalid token', 'AUTH', 'TOKEN_INVALID', 401),
      );
    }
    const userId = result.userId;
    if (!userId) {
      return next(
        new SocketError('Invalid token', 'AUTH', 'TOKEN_INVALID', 401),
      );
    }

    // Generate a new session ID
    const sessionId = uuidv4();

    socket.jwt = jwt;
    socket.sessionId = sessionId;

    return next();
  });

  // Connect
  io.on('connection', (socket) => {
    // Validate data
    const result = JWT.verifyToken(socket.jwt);
    if (!result.valid) {
      throw new SocketError(
        'Invalid token',
        'CONNECTUSER',
        'TOKEN_INVALID',
        401,
      );
    }
    const userId = result.userId;
    if (!userId) {
      throw new SocketError(
        'Invalid token',
        'CONNECTUSER',
        'TOKEN_INVALID',
        401,
      );
    }
    const sessionId = socket.sessionId;
    if (!sessionId) {
      throw new SocketError(
        'Invalid session',
        'CONNECTUSER',
        'SESSION_INVALID',
        401,
      );
    }
    userHandler.connectUser(io, socket, sessionId, userId);
    // Disconnect
    socket.on('disconnect', () => {
      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'DISCONNECTUSER',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'DISCONNECTUSER',
          'SESSION_INVALID',
          401,
        );
      }
      userHandler.disconnectUser(io, socket, sessionId);
    });
    // User
    socket.on('updateUser', async (data) => {
      // data = {
      //   user: {
      //     ...
      //   }
      // }

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'UPDATEUSER',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'UPDATEUSER',
          'SESSION_INVALID',
          401,
        );
      }
      const { user: editedUser } = data;
      if (!editedUser) {
        throw new SocketError(
          'Missing required fields',
          'UPDATEUSER',
          'DATA',
          400,
        );
      }
      userHandler.updateUser(io, socket, sessionId, editedUser);
    });
    // Server
    socket.on('connectServer', async (data) => {
      // data = {
      //   serverId:
      // }
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'CONNECTSERVER',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'CONNECTSERVER',
          'SESSION_INVALID',
          401,
        );
      }
      const { serverId } = data;
      if (!serverId) {
        throw new SocketError(
          'Missing required fields',
          'CONNECTSERVER',
          'DATA',
          400,
        );
      }
      serverHandler.connectServer(io, socket, sessionId, serverId);
    });
    socket.on('disconnectServer', async (data) => {
      // data = {
      //   serverId:
      // }
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'DISCONNECTSERVER',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'DISCONNECTSERVER',
          'SESSION_INVALID',
          401,
        );
      }
      const { serverId } = data;
      if (!serverId) {
        throw new SocketError(
          'Missing required fields',
          'DISCONNECTSERVER',
          'DATA',
          400,
        );
      }
      serverHandler.disconnectServer(io, socket, sessionId, serverId);
    });
    socket.on('createServer', async (data) => {
      // data = {
      //   server: {
      //     ...
      //   }
      // }
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'CREATESERVER',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'CREATESERVER',
          'SESSION_INVALID',
          401,
        );
      }
      const { server } = data;
      if (!server) {
        throw new SocketError(
          'Missing required fields',
          'CREATESERVER',
          'DATA',
          400,
        );
      }
      serverHandler.createServer(io, socket, sessionId, server);
    });
    socket.on('updateServer', async (data) => {
      // data = {
      //   server: {
      //     ...
      //   }
      // }
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'UPDATESERVER',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'UPDATESERVER',
          'SESSION_INVALID',
          401,
        );
      }
      const { server: editedServer } = data;
      if (!editedServer) {
        throw new SocketError(
          'Missing required fields',
          'UPDATESERVER',
          'DATA',
          400,
        );
      }
      serverHandler.updateServer(io, socket, sessionId, editedServer);
    });
    // Channel
    socket.on('connectChannel', async (data) => {
      // data = {
      //   channelId:
      // }
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'CONNECTCHANNEL',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'CONNECTCHANNEL',
          'SESSION_INVALID',
          401,
        );
      }
      const { channelId } = data;
      if (!channelId) {
        throw new SocketError(
          'Missing required fields',
          'CONNECTCHANNEL',
          'DATA',
          400,
        );
      }
      channelHandler.connectChannel(io, socket, sessionId, channelId);
    });
    socket.on('disconnectChannel', async (data) => {
      // data = {
      //   channelId:
      // }
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'DISCONNECTCHANNEL',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'DISCONNECTCHANNEL',
          'SESSION_INVALID',
          401,
        );
      }
      const { channelId } = data;
      if (!channelId) {
        throw new SocketError(
          'Missing required fields',
          'DISCONNECTCHANNEL',
          'DATA',
          400,
        );
      }
      channelHandler.disconnectChannel(io, socket, sessionId, channelId);
    });
    socket.on('createChannel', async (data) => {
      // data = {
      //   channel: {
      //     ...
      //   },
      // }
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'CREATECHANNEL',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'CREATECHANNEL',
          'SESSION_INVALID',
          401,
        );
      }
      const { channel } = data;
      if (!channel) {
        throw new SocketError(
          'Missing required fields',
          'CREATECHANNEL',
          'DATA',
          400,
        );
      }
      channelHandler.createChannel(io, socket, sessionId, channel);
    });
    socket.on('updateChannel', async (data) => {
      // data = {
      //   channel: {
      //     ...
      //   },
      // };
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'UPDATECHANNEL',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'UPDATECHANNEL',
          'SESSION_INVALID',
          401,
        );
      }
      const { channel: editedChannel } = data;
      if (!editedChannel) {
        throw new SocketError(
          'Missing required fields',
          'UPDATECHANNEL',
          'DATA',
          400,
        );
      }
      channelHandler.updateChannel(io, socket, sessionId, editedChannel);
    });
    socket.on('deleteChannel', async (data) => {
      // data = {
      //   channelId:
      // }
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'DELETECHANNEL',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'DELETECHANNEL',
          'SESSION_INVALID',
          401,
        );
      }
      const { channelId } = data;
      if (!channelId) {
        throw new SocketError(
          'Missing required fields',
          'DELETECHANNEL',
          'DATA',
          400,
        );
      }
      channelHandler.deleteChannel(io, socket, sessionId, channelId);
    });
    // Message
    socket.on('message', async (data) => {
      // data = {
      //   message: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'SENDMESSAGE',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'SENDMESSAGE',
          'SESSION_INVALID',
          401,
        );
      }
      const { message } = data;
      if (!message) {
        throw new SocketError(
          'Missing required fields',
          'SENDMESSAGE',
          'DATA',
          400,
        );
      }
      messageHandler.sendMessage(io, socket, sessionId, message);
    });
    socket.on('directMessage', async (data) => {
      // data = {
      //   message: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'SENDDIRECTMESSAGE',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'SENDDIRECTMESSAGE',
          'SESSION_INVALID',
          401,
        );
      }
      const { message } = data;
      if (!message) {
        throw new SocketError(
          'Missing required fields',
          'SENDDIRECTMESSAGE',
          'DATA',
          400,
        );
      }
      messageHandler.sendDirectMessage(io, socket, sessionId, message);
    });
    // RTC
    socket.on('RTCOffer', async (data) => {
      // data = {
      //   to:
      //   offer: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'SENDRTCOFFER',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'SENDRTCOFFER',
          'SESSION_INVALID',
          401,
        );
      }
      const { to, offer } = data;
      if (!to || !offer) {
        throw new SocketError(
          'Missing required fields',
          'SENDRTCOFFER',
          'DATA',
          400,
        );
      }
      rtcHandler.offer(io, socket, sessionId, to, offer);
    });
    socket.on('RTCAnswer', async (data) => {
      // data = {
      //   to:
      //   answer: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'SENDRTCANSWER',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'SENDRTCANSWER',
          'SESSION_INVALID',
          401,
        );
      }
      const { to, answer } = data;
      if (!to || !answer) {
        throw new SocketError(
          'Missing required fields',
          'SENDRTCANSWER',
          'DATA',
          400,
        );
      }
      rtcHandler.answer(io, socket, sessionId, to, answer);
    });
    socket.on('RTCIceCandidate', async (data) => {
      // data = {
      //   to:
      //   candidate: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const result = JWT.verifyToken(socket.jwt);
      if (!result.valid) {
        throw new SocketError(
          'Invalid token',
          'SENDRTCCANDIDATE',
          'TOKEN_INVALID',
          401,
        );
      }
      const sessionId = socket.sessionId;
      if (!sessionId) {
        throw new SocketError(
          'Invalid session',
          'SENDRTCCANDIDATE',
          'SESSION_INVALID',
          401,
        );
      }
      const { to, candidate } = data;
      if (!to || !candidate) {
        throw new SocketError(
          'Missing required fields',
          'SENDRTCCANDIDATE',
          'DATA',
          400,
        );
      }
      rtcHandler.candidate(io, socket, sessionId, to, candidate);
    });
  });
};

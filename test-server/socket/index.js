const utils = require('../utils');
const Logger = utils.logger;
const Map = utils.map;
const Get = utils.get;
const Interval = utils.interval;

const SocketError = require('./socketError');
const userHandler = require('./user');
const serverHandler = require('./server');
const channelHandler = require('./channel');
const messageHandler = require('./message');
const rtcHandler = require('./rtc');

// let serverCall = new callHandler();

module.exports = (io, db) => {
  io.use((socket, next) => {
    console.log(socket.handshake.query.sessionId);
    const sessionId = socket.handshake.query.sessionId;
    if (!sessionId) {
      new Logger('Socket').error(`Invalid session ID: ${sessionId}`);
      return next(
        new SocketError('Invalid session ID', 'AUTH', 'SESSION_EXPIRED', 401),
      );
    }
    socket.sessionId = sessionId;
    return next();
  });

  io.on('connection', (socket) => {
    // Connect
    userHandler.connectUser(io, socket, socket.sessionId);
    // Disconnect
    socket.on('disconnect', () => {
      userHandler.disconnect(io, socket, socket.sessionId);
    });
    // User
    socket.on('updateUser', async (data) => {
      // data = {
      //   sessionId:
      //   user: {
      //     ...
      //   }
      // }

      // Validate data
      const { sessionId, user: editedUser } = data;
      if (!sessionId || !editedUser) {
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
      //   sessionId:
      //   serverId:
      // }
      // console.log(data);

      // Validate data
      const { sessionId, serverId } = data;
      if (!sessionId || !serverId) {
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
      //   sessionId:
      //   serverId:
      // }
      // console.log(data);

      // Validate data
      const { sessionId, serverId } = data;
      if (!sessionId || !serverId) {
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
      //   sessionId:
      //   server: {
      //     ...
      //   }
      // }
      console.log(data);

      // Validate data
      const { sessionId, server } = data;
      if (!sessionId || !server) {
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
      //   sessionId:
      //   server: {
      //     ...
      //   }
      // }
      // console.log(data);

      // Validate data
      const { sessionId, server: editedServer } = data;
      if (!sessionId || !editedServer) {
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
      //   sessionId:
      //   channelId:
      // }
      // console.log(data);

      // Validate data
      const { sessionId, channelId } = data;
      if (!sessionId || !channelId) {
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
      //   sessionId:
      //   channelId:
      // }
      // console.log(data);

      // Validate data
      const { sessionId, channelId } = data;
      if (!sessionId || !channelId) {
        throw new SocketError(
          'Missing required fields',
          'DISCONNECTCHANNEL',
          'DATA',
          400,
        );
      }
      channelHandler.disconnectChannel(io, socket, sessionId, channelId);
      serverCall.handleDisconnect(socket);
    });
    socket.on('createChannel', async (data) => {
      // data = {
      //   sessionId:
      //   channel: {
      //     ...
      //   },
      // }
      // console.log(data);

      // Validate data
      const { sessionId, channel } = data;
      if (!sessionId || !channel) {
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
      //   sessionId:
      //   channel: {
      //     ...
      //   },
      // };
      // console.log(data);

      // Validate data
      const { sessionId, channel: editedChannel } = data;
      if (!sessionId || !editedChannel) {
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
      //   sessionId:
      //   channelId:
      // }
      // console.log(data);

      // Validate data
      const { sessionId, channelId } = data;
      if (!sessionId || !channelId) {
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
      //   sessionId:
      //   message: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const { sessionId, message } = data;
      if (!sessionId || !message) {
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
      //   sessionId:
      //   message: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const { sessionId, message } = data;
      if (!sessionId || !message) {
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
      //   sessionId:
      //   to:
      //   offer: {
      //     ...
      //   }
      // };
      console.log(data);

      // Validate data
      const { sessionId, to, offer } = data;
      if (!sessionId || !to || !offer) {
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
      //   sessionId:
      //   to:
      //   answer: {
      //     ...
      //   }
      // };
      console.log(data);

      // Validate data
      const { sessionId, to, answer } = data;
      if (!sessionId || !to || !answer) {
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
      //   sessionId:
      //   to:
      //   candidate: {
      //     ...
      //   }
      // };
      console.log(data);

      // Validate data
      const { sessionId, to, candidate } = data;
      if (!sessionId || !to || !candidate) {
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

  // async function runServerCall() {
  //   const channels = (await db.get('channels')) || {};
  //   const CallLogger = new Logger('Call');
  //   serverCall = new callHandler(io, channels, CallLogger);
  // }
  // runServerCall();
};

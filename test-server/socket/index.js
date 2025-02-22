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

module.exports = (io, db) => {
  io.on('connection', (socket) => {
    // User
    socket.on('connectUser', async (data) => {
      // data = {
      //   sessionId:
      // }
      // console.log(data);

      // Validate data
      const { sessionId } = data;
      if (!sessionId) {
        throw new SocketError(
          'Missing required fields',
          'CONNECTUSER',
          'DATA',
          400,
        );
      }
      userHandler.connectUser(io, socket, sessionId);
    });
    socket.on('disconnectUser', async (data) => {
      // data = {
      //   sessionId:
      // }
      // console.log(data);

      // Validate data
      const { sessionId } = data;
      if (!sessionId) {
        throw new SocketError(
          'Missing required fields',
          'DISCONNECTUSER',
          'DATA',
          400,
        );
      }
      userHandler.disconnectUser(io, socket, sessionId);
    });
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
      // console.log(data);

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
      //   serverId:
      //   server: {
      //     ...
      //   }
      // }
      // console.log(data);

      // Validate data
      const { sessionId, serverId, server: editedServer } = data;
      if (!sessionId || !serverId || !editedServer) {
        throw new SocketError(
          'Missing required fields',
          'UPDATESERVER',
          'DATA',
          400,
        );
      }
      serverHandler.updateServer(io, socket, sessionId, serverId, editedServer);
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
    });
    socket.on('createChannel', async (data) => {
      // data = {
      //   sessionId:
      //   serverId:
      //   channel: {
      //     ...
      //   },
      // }
      // console.log(data);

      // Validate data
      const { sessionId, serverId, channel } = data;
      if (!sessionId || !serverId || !channel) {
        throw new SocketError(
          'Missing required fields',
          'CREATECHANNEL',
          'DATA',
          400,
        );
      }
      channelHandler.createChannel(io, socket, sessionId, serverId, channel);
    });
    socket.on('updateChannel', async (data) => {
      // data = {
      //   sessionId:
      //   channelId:
      //   channel: {
      //     ...
      //   },
      // };
      // console.log(data);

      // Validate data
      const { sessionId, channelId, channel: editedChannel } = data;
      if (!sessionId || !channelId || !editedChannel) {
        throw new SocketError(
          'Missing required fields',
          'UPDATECHANNEL',
          'DATA',
          400,
        );
      }
      channelHandler.updateChannel(
        io,
        socket,
        sessionId,
        channelId,
        editedChannel,
      );
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
    socket.on('sendMessage', async (data) => {
      // data = {
      //   sessionId:
      //   channelId:
      //   message: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const { sessionId, channelId, message } = data;
      if (!sessionId || !channelId || !message) {
        throw new SocketError(
          'Missing required fields',
          'SENDMESSAGE',
          'DATA',
          400,
        );
      }
      messageHandler.sendMessage(io, socket, sessionId, channelId, message);
    });
    socket.on('sendDirectMessage', async (data) => {
      // data = {
      //   sessionId:
      //   friendId:
      //   message: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const { sessionId, friendId, message } = data;
      if (!sessionId || !friendId || !message) {
        throw new SocketError(
          'Missing required fields',
          'SENDDIRECTMESSAGE',
          'DATA',
          400,
        );
      }
      messageHandler.sendDirectMessage(
        io,
        socket,
        sessionId,
        friendId,
        message,
      );
    });
    // Disconnect
    socket.on('disconnect', async () => {
      const sessionId = Map.socketIdSessionIdMap.get(socket.id);
      if (!sessionId) {
        throw new SocketError(
          'Missing required fields',
          'DISCONNECTUSER',
          'DATA',
          400,
        );
      }
      userHandler.disconnectUser(io, socket, sessionId);
    });
  });
};

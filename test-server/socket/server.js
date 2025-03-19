/* eslint-disable @typescript-eslint/no-require-imports */
const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const StandardizedError = utils.standardizedError;
const Logger = utils.logger;
const Get = utils.get;
const Set = utils.set;
const Func = utils.func;
// Handlers
const channelHandler = require('./channel');

const serverHandler = {
  searchServer: async (io, socket, data) => {
    const servers = (await db.get('servers')) || {};
    const members = (await db.get('members')) || {};

    try {
      // data = {
      //   query:
      // }

      // Validate data
      const { query } = data;
      if (!query) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'SEARCHSERVER',
          'DATA_INVALID',
          401,
        );
      }

      // Validate operation
      await Func.validate.socket(socket);

      // FIXME: search logic
      const isServerMatch = (server, query) => {
        const queryStr = query.trim().toLowerCase();
        return (
          String(server.displayId).trim().toLowerCase() === queryStr ||
          server.name.toLowerCase().includes(queryStr) ||
          Func.calculateSimilarity(server.name.toLowerCase(), queryStr) >= 0.6
        );
      };

      const maxResults = 20;

      const exactMatch = Object.values(servers).find(
        (server) =>
          String(server.displayId).trim().toLowerCase() ===
          query.trim().toLowerCase(),
      );

      const searchResults = exactMatch
        ? [exactMatch]
        : Object.values(servers)
            .filter(
              (server) =>
                isServerMatch(server, query) &&
                (server.settings.visibility === 'public' ||
                  server.settings.visibility === 'private' ||
                  server.ownerId === userId ||
                  members[`mb_${userId}-${server.id}`]?.permissionLevel > 1),
            )
            .slice(0, maxResults);
      const results = await Promise.all(
        searchResults.map(async (server) => ({
          ...server,
          avatar: server.avatarUrl
            ? `data:image/png;base64,${server.avatarUrl}`
            : null,
        })),
      );

      io.to(socket.id).emit('serverSearch', results);
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `搜尋群組時發生錯誤: ${error.message}`,
          'ServerError',
          'SEARCHSERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }
      io.to(socket.id).emit('error', error);
      new Logger('WebSocket').error(
        `Error searching servers: ${error.error_message}`,
      );
    }
  },
  refreshServer: async (io, socket, data) => {
    const servers = (await db.get('servers')) || {};

    try {
      // data = {
      //   serverId:
      // }

      // Validate data
      const { serverId } = data;
      if (!serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'REFRESHSERVER',
          'DATA_INVALID',
          401,
        );
      }
      const server = await Func.validate.server(servers[serverId]);

      // Validate operation
      await Func.validate.socket(socket);

      // Emit data (only to the user)
      io.to(socket.id).emit('serverUpdate', await Get.server(server.id));
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `刷新群組時發生錯誤: ${error.message}`,
          'ServerError',
          'REFRESHSERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error refreshing server: ${error.error_message}`,
      );
    }
  },
  connectServer: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    const members = (await db.get('members')) || {};

    try {
      // data = {
      //   userId:
      //   serverId:
      // }
      // console.log(data);

      // Validate data
      const { userId, serverId } = data;
      if (!userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CONNECTSERVER',
          'DATA_INVALID',
          401,
        );
      }
      const user = await Func.validate.user(users[userId]);
      const server = await Func.validate.server(servers[serverId]);
      const member = await Func.validate.member(
        members[`mb_${user.id}-${server.id}`],
      );

      // Validate operation
      await Func.validate.socket(socket);

      // if (
      //   server.settings.visibility === 'invisible' &&
      //   !(member?.permissionLevel > 1)
      // ) {
      //   throw new StandardizedError(
      //     '該群組為私人群組',
      //     'ValidationError',
      //     'CONNECTSERVER',
      //     'VISIBILITY',
      //     403,
      //   );
      // }
      // if (member?.isBlocked) {
      //   throw new StandardizedError(
      //     '您已被該群組封鎖',
      //     'ValidationError',
      //     'CONNECTSERVER',
      //     'BLOCKED',
      //     403,
      //   );
      // }

      // Create new membership if there isn't one
      if (!member) {
        await Set.member(`mb_${user.id}-${server.id}`, {
          nickname: user.name,
          serverId: server.id,
          userId: user.id,
          createdAt: Date.now(),
        });
      }

      // Leave prev server
      if (user.currentServerId) {
        await serverHandler.disconnectServer(io, socket, {
          serverId: user.currentServerId,
          userId: user.id,
        });
      }

      // Connect to the server's lobby channel
      await channelHandler.connectChannel(io, socket, {
        channelId: server.lobbyId,
        userId: user.id,
      });

      // Update user-server
      const update_userServer = {
        userId: user.id,
        serverId: server.id,
        recent: true,
        timestamp: Date.now(),
      };
      await Set.userServer(`us_${user.id}-${server.id}`, update_userServer);

      // Update user
      const update = {
        currentServerId: server.id,
        lastActiveAt: Date.now(),
      };
      await Set.user(user.id, update);

      // Join the server
      socket.join(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', update);
      io.to(socket.id).emit('serverUpdate', await Get.server(server.id));

      new Logger('WebSocket').success(
        `User(${user.id}) connected to server(${server.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `連接群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CONNECTSERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('serverUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error connecting server: ${error.error_message}`,
      );
    }
  },
  disconnectServer: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};

    try {
      // data = {
      //   userId:
      //   serverId:
      // }
      // console.log(data);

      // Validate data
      const { userId, serverId } = data;
      if (!userId || !serverId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'DISCONNECTSERVER',
          'DATA_INVALID',
          401,
        );
      }
      const user = await Func.validate.user(users[userId]);
      const server = await Func.validate.server(servers[serverId]);

      // Validate data
      await Func.validate.socket(socket);

      // Leave prev channel
      if (user.currentChannelId) {
        await channelHandler.disconnectChannel(io, socket, {
          channelId: user.currentChannelId,
          userId: user.id,
        });
      }

      // Update user presence
      const update = {
        currentServerId: null,
        lastActiveAt: Date.now(),
      };
      await Set.user(user.id, update);

      // Leave the server
      socket.leave(`server_${server.id}`);

      // Emit data (only to the user)
      io.to(socket.id).emit('userUpdate', update);
      io.to(socket.id).emit('serverUpdate', null);

      new Logger('WebSocket').success(
        `User(${user.id}) disconnected from server(${server.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `斷開群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'DISCONNECTSERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit data (only to the user)
      io.to(socket.id).emit('serverUpdate', null);
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        `Error disconnecting from server: ${error.error_message}`,
      );
    }
  },
  createServer: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};

    try {
      // data = {
      //   userId:
      //   server: {
      //     ...
      //   }
      // }
      // console.log(data);

      // Validate data
      const { server: _newServer, userId } = data;
      if (!_newServer || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'CREATESERVER',
          'DATA_INVALID',
          401,
        );
      }
      const user = await Func.validate.user(users[userId]);
      const newServer = await Func.validate.server(_newServer);

      // Validate data
      await Func.validate.socket(socket);

      // Create Ids
      const serverId = uuidv4();
      const channelId = uuidv4();

      // Create server
      await Set.server(serverId, {
        name: newServer.name.trim(),
        description: newServer.description.trim(),
        avatar: await Func.generateImageData(newServer.avatar),
        displayId: await Func.generateUniqueDisplayId(),
        lobbyId: channelId,
        ownerId: user.id,
        settings: {
          ...newServer.settings,
          defaultChannelId: channelId,
        },
        createdAt: Date.now(),
      });

      // Create channel (lobby)
      await Set.channel(channelId, {
        name: '大廳',
        isLobby: true,
        isMain: true,
        serverId: serverId,
        createdAt: Date.now(),
      });

      // Create member
      await Set.member(`mb_${user.id}-${serverId}`, {
        permissionLevel: 6,
        serverId: serverId,
        userId: user.id,
        createdAt: Date.now(),
      });

      // Create user-server
      await Set.userServer(`us_${user.id}-${serverId}`, {
        userId: user.id,
        serverId: serverId,
        recent: true,
        owned: true,
        timestamp: Date.now(),
      });

      // Join the server
      await serverHandler.connectServer(io, socket, {
        serverId: serverId,
        userId: user.id,
      });

      new Logger('Server').success(
        `User(${user.id}) created server(${serverId})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `創建群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'CREATESERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error creating server: ${error.error_message}`,
      );
    }
  },
  updateServer: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const servers = (await db.get('servers')) || {};
    // const members = (await db.get('members')) || {};

    try {
      // data = {
      //   userId:
      //   server: {
      //     ...
      //   }
      // }
      // console.log(data);

      // Validate data
      const { server: _editedServer, userId } = data;
      if (!_editedServer || !userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'UPDATESERVER',
          'DATA_INVALID',
          401,
        );
      }
      const user = await Func.validate.user(users[userId]);
      const editedServer = await Func.validate.server(_editedServer);
      const server = await Func.validate.server(servers[editedServer.id]);

      // Validate operation
      await Func.validate.socket(socket);

      // const member = await Func.validate.member(
      //   members[`mb_${user.id}-${server.id}`],
      // );

      // const permission = member.permissionLevel;
      // if (!permission || permission < 4) {
      //   throw new StandardizedError(
      //     '您沒有權限更新群組',
      //     'ValidationError',
      //     'UPDATESERVER',
      //     'USER_PERMISSION',
      //     403,
      //   );
      // }

      if (editedServer.avatar) {
        editedServer.avatar = await Func.generateImageData(editedServer.avatar);
      }

      // Update server
      await Set.server(server.id, editedServer);

      // Emit updated data to all users in the server
      io.to(`server_${server.id}`).emit('serverUpdate', editedServer);

      new Logger('Server').success(
        `User(${user.id}) updated server(${server.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `更新群組時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'UPDATESERVER',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('Server').error(
        `Error updating server: ${error.error_message}`,
      );
    }
  },
};

module.exports = { ...serverHandler };

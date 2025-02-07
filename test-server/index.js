const http = require('http');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const { Server } = require('socket.io');
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');

// Logger
class Logger {
  constructor(origin) {
    this.origin = origin;
  }
  info(message) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.cyan(
        `[${this.origin}]`,
      )} ${message}`,
    );
  }
  command(message) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.hex('#F3CCF3')(
        `[${this.origin}]`,
      )} ${message}`,
    );
  }
  success(message) {
    console.log(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.green(
        `[${this.origin}]`,
      )} ${message}`,
    );
  }
  warn(message) {
    console.warn(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.yellow(
        `[${this.origin}]`,
      )} ${message}`,
    );
  }
  error(message) {
    console.error(
      `${chalk.gray(new Date().toLocaleString())} ${chalk.red(
        `[${this.origin}]`,
      )} ${message}`,
    );
  }
}

const port = 4500;
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };

// Message Types
const MessageTypes = {
  CHAT: 'chat',
  VOICE_STATE: 'voice_state',
  USER_STATUS: 'user_status',
  CHANNEL_JOIN: 'channel_join',
  CHANNEL_LEAVE: 'channel_leave',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  FETCH: 'fetch',
};

// User Sessions
const userSessions = new Map();

// Send Error/Success Response
const sendError = (res, statusCode, message) => {
  res.writeHead(statusCode, CONTENT_TYPE_JSON);
  res.end(JSON.stringify({ error: message }));
};

const sendSuccess = (res, data) => {
  res.writeHead(200, CONTENT_TYPE_JSON);
  res.end(JSON.stringify(data));
};

// HTTP Server with CORS
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, PATCH');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, ngrok-skip-browser-warning',
  );

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'PATCH' && req.url === '/userData') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // Get database
        const usersList = (await db.get(`usersList`)) || {};

        // Validate data
        if (!data.name || !data.gender) {
          sendError(res, 400, 'Missing required fields');
          return;
        }
        const exists = Object.values(usersList).find(
          (user) => user.id === data.id,
        );
        if (!exists) {
          sendError(res, 401, '找不到此帳號');
          return;
        }

        usersList[data.id] = {
          ...usersList[data.id],
          name: data.name,
          gender: data.gender,
        };

        // Save to database
        await db.set(`usersList`, usersList);

        new Logger('User').success(`User data updated: ${data.id}`);

        // Return success with user info (excluding password)
        const { password, ...userInfo } = user;
        sendSuccess(res, {
          message: 'Update successful',
          user: userInfo,
        });
      } catch (error) {
        new Logger('User').error(`Update error: ${error.message}`);
        sendError(res, 500, '更新失敗');
      }
    });
    return;
  }

  if (req.method == 'POST' && req.url == '/login') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // Get database from database
        const usersList = (await db.get(`usersList`)) || {};

        // Validate data
        if (!data.account || !data.password) {
          sendError(res, 400, 'Missing credentials');
          return;
        }
        const user = Object.values(usersList).find(
          (user) => user.account === data.account,
        );
        if (!user) {
          sendError(res, 401, '找不到此帳號');
          return;
        }
        if (user.password !== data.password) {
          sendError(res, 401, '密碼錯誤');
          return;
        }

        // Generate session token
        // const sessionToken = uuidv4();
        // userSessions.set(sessionToken, user.id);

        new Logger('Auth').success(`User logged in: ${data.account}`);

        // Return success with user id and token
        const { password, ..._user } = user;
        sendSuccess(res, {
          message: 'Login successful',
          user: _user,
          // token: sessionToken,
        });
      } catch (error) {
        new Logger('Auth').error(`Login error: ${error.message}`);
        sendError(res, 500, 'Login failed');
      }
    });
  }

  if (req.method == 'POST' && req.url == '/register') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // Get database
        const usersList = (await db.get(`usersList`)) || {};

        // Validate data
        if (!data.account || !data.password || !data.username) {
          sendError(res, 400, 'Missing required fields');
          return;
        }
        const exists = Object.values(usersList).find(
          (user) => user.account === data.account,
        );
        if (exists) {
          sendError(res, 409, '此帳號已被註冊');
          return;
        }

        const userId = uuidv4();
        const user = {
          id: userId,
          name: data.username,
          account: data.account,
          password: data.password,
          currentChannelId: null,
          gender: data.gender,
          level: 0,
          createdAt: Date.now().valueOf(),
        };
        usersList[userId] = user;

        // Save to database
        await db.set(`usersList`, usersList);

        new Logger('Auth').success(`New user registered: ${data.account}`);

        // Return success with user id
        const { password, ..._user } = user;
        sendSuccess(res, {
          message: 'Registration successful',
          user: _user,
        });
      } catch (error) {
        new Logger('Auth').error(`Registration error: ${error.message}`);
        sendError(res, 500, 'Registration failed');
      }
    });
  }
});

const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
  },
});
io.on('connection', async (socket) => {
  socket.on('disconnect', () => {});

  socket.on('connectUser', async (data) => {
    try {
      // Get database
      const usersList = (await db.get(`usersList`)) || {};

      // Validate data
      if (!data.userId) {
        new Logger('WebSocket').error(`Invalid data`);
        socket.emit('error', { message: `Invalid data` });
        return;
      }
      const user = usersList[data.userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${data.userId}) not found`);
        socket.emit('error', {
          message: `User(${data.userId}) not found`,
        });
        return;
      }

      // Emit updated data
      socket.emit('user', user);

      new Logger('WebSocket').success(`User(${user.id}) connected`);
    } catch (error) {
      new Logger('WebSocket').error(`Error getting user data: ${error}`);
      socket.emit('error', {
        message: `Error getting user data: ${error}`,
      });
    }
  });

  socket.on('connectServer', async (data) => {
    try {
      // Get database
      const usersList = (await db.get(`usersList`)) || {};
      const channelList = (await db.get('channelList')) || {};
      const messageList = (await db.get('messageList')) || {};
      const serverList = (await db.get('serverList')) || {};

      // Validate data
      if (!data.userId | !data.serverId) {
        new Logger('WebSocket').error(`Invalid data`);
        socket.emit('error', { message: `Invalid data` });
        return;
      }
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
        });
        return;
      }
      const user = usersList[data.userId];
      if (!server) {
        new Logger('WebSocket').error(`User(${data.userId}) not found`);
        socket.emit('error', {
          message: `User(${data.userId}) not found`,
        });
        return;
      }

      if (!server.userIds.includes(user.id)) {
        server.userIds.push(user.id);
      }
      // if (!server.permissions) {
      user.currentChannelId = channelList[server.lobbyId].id;
      channelList[server.lobbyId].userIds.push(user.id);

      // Save updated data
      await db.set('serverList', serverList);
      await db.set('usersList', usersList);
      await db.set('channelList', channelList);

      // Join server and lobby channel
      if (user.currentChannelId)
        socket.join(`server_${server.id}_${server.lobbyId}`);
      socket.join(`server_${server.id}`);

      // Emit updated data (only to the user)
      socket.emit('server', server);
      socket.emit('channels', getChannels(channelList, server));
      socket.emit('users', getUsers(usersList, server));
      socket.emit(
        'messages',
        getMessages(messageList, channelList[server.lobbyId]),
      );
      socket.emit('user', user);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('users', getUsers(usersList, server));
      io.to(`server_${server.id}`).emit(
        'channels',
        getChannels(channelList, server),
      );
      io.to(`server_${server.id}`).emit('server', server);

      new Logger('WebSocket').success(
        `User(${user.id}) connected to server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(`Error getting server data: ${error}`);
      socket.emit('error', {
        message: `Error getting server data: ${error}`,
      });
    }
  });

  socket.on('disconnectServer', async (data) => {
    try {
      // Get database
      const usersList = (await db.get(`usersList`)) || {};
      const serverList = (await db.get('serverList')) || {};
      const channelList = (await db.get('channelList')) || {};

      // Validate data
      if (!data.userId | !data.serverId) {
        new Logger('WebSocket').error(`Invalid data`);
        socket.emit('error', { message: `Invalid data` });
        return;
      }
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
        });
        return;
      }
      const user = usersList[data.userId];
      if (!server) {
        new Logger('WebSocket').error(`User(${data.userId}) not found`);
        socket.emit('error', {
          message: `User(${data.userId}) not found`,
        });
        return;
      }

      console.log(user.currentChannelId);
      const prevChannel = channelList[user.currentChannelId];
      if (prevChannel)
        prevChannel.userIds = prevChannel.userIds.filter(
          (userId) => userId != user.id,
        );
      user.currentChannelId = null;
      server.userIds = server.userIds.filter((userId) => userId != user.id);

      // Save updated data
      await db.set('serverList', serverList);
      await db.set('usersList', usersList);
      await db.set('channelList', channelList);

      // Leave server and channel
      if (user.currentChannelId)
        socket.leave(`server_${server.id}_${user.currentChannelId}`);
      socket.leave(`server_${server.id}`);

      // Emit updated data (only to the user)
      io.to(socket.id).emit('server', null);
      io.to(socket.id).emit('channels', []);
      io.to(socket.id).emit('users', {});
      io.to(socket.id).emit('messages', []);
      io.to(socket.id).emit('user', user);

      // Emit updated data (to all users in the server)
      io.to(`server_${server.id}`).emit('users', getUsers(usersList, server));
      io.to(`server_${server.id}`).emit(
        'channels',
        getChannels(channelList, server),
      );
      io.to(`server_${server.id}`).emit('server', server);

      new Logger('WebSocket').success(
        `User(${user.id}) disconnected from server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(
        `Error disconnecting from server: ${error}`,
      );
      socket.emit('error', {
        message: `Error disconnecting from server: ${error}`,
      });
    }
  });

  socket.on('chatMessage', async (data) => {
    try {
      // Get database
      const messageList = (await db.get('messageList')) || {};
      const serverList = (await db.get('serverList')) || {};
      const channelList = (await db.get('channelList')) || {};

      // Validate data
      const message = data.message;
      if (!message.content || !message.senderId) {
        new Logger('WebSocket').error('Invalid message data');
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
        });
        return;
      }
      const channel = channelList[data.channelId];
      if (!channel) {
        new Logger('WebSocket').error('Invalid channel data');
        socket.emit('error', { message: 'Invalid channel data' });
        return;
      }

      message.id = uuidv4();
      message.timestamp = Date.now().valueOf();
      console.log(message);
      messageList[message.id] = message;
      channel.messageIds.push(message.id);

      // Save updated data
      await db.set('channelList', channelList);
      await db.set('messageList', messageList);

      // Emit updated data
      const channels = getChannels(channelList, server);
      const messages = getMessages(messageList, channel);
      io.to(`server_${server.id}`).emit('channels', channels);
      io.to(`server_${server.id}_${channel.id}`).emit('messages', messages);

      new Logger('WebSocket').info(
        `User(${message.senderId}) sent ${message.content} to channel(${channel.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(error.message);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('addChannel', async (data) => {
    try {
      // Get database
      const channelList = (await db.get('channelList')) || {};
      const serverList = (await db.get('serverList')) || {};

      // Validate data
      const channel = data.channel;
      if (!channel.name || !channel.permission) {
        new Logger('WebSocket').error('Invalid channel data');
        socket.emit('error', { message: 'Invalid channel data' });
        return;
      }
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
        });
        return;
      }

      channel.id = uuidv4();
      channelList[channel.id] = channel;
      server.channelIds.push(channel.id);

      // Save updated data
      await db.set('serverList', serverList);
      await db.set('channelList', channelList);

      // Emit updated data
      const channels = getChannels(channelList, server);
      io.to(`server_${server.id}`).emit('channels', channels);

      new Logger('WebSocket').info(
        `Adding new channel(${channel.id}) to server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(error.message);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('editChannel', async (data) => {
    try {
      // Get database
      const channelList = (await db.get('channelList')) || {};
      const serverList = (await db.get('serverList')) || {};

      // Validate data
      const channel = data.channel;
      if (!channel.name || !channel.permission) {
        new Logger('WebSocket').error('Invalid channel data');
        socket.emit('error', { message: 'Invalid channel data' });
        return;
      }
      const oldChannel = channelList[data.channelId];
      if (!oldChannel) {
        new Logger('WebSocket').error(`Channel(${data.channelId}) not found`);
        socket.emit('error', {
          message: `Channel(${data.channelId}) not found`,
        });
        return;
      }
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
        });
        return;
      }

      channelList[data.channelId] = channel;

      // Save updated data
      await db.set('serverList', serverList);
      await db.set('channelList', channelList);

      // Emit updated data
      const channels = getChannels(channelList, server);
      io.to(`server_${server.id}`).emit('channels', channels);

      new Logger('WebSocket').info(
        `Edit channel(${channel.id}) in server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(error.message);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('deleteChannel', async (data) => {
    try {
      // Get database
      const channelList = (await db.get('channelList')) || {};
      const serverList = (await db.get('serverList')) || {};

      // Validate data
      const channel = channelList[data.channelId];
      if (!channel) {
        new Logger('WebSocket').error(`Channel(${data.channelId}) not found`);
        socket.emit('error', {
          message: `Channel(${data.channelId}) not found`,
        });
        return;
      }
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
        });
        return;
      }

      delete channelList[channel.id];
      server.channelIds = server.channelIds.filter(
        (channelId) => channelId != channel.id,
      );

      // Save updated data
      await db.set('serverList', serverList);
      await db.set('channelList', channelList);

      // Emit updated data
      const channels = getChannels(channelList, server);
      io.to(`server_${server.id}`).emit('channels', channels);

      new Logger('WebSocket').info(
        `Remove channel(${channel.id}) from server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(error.message);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('joinChannel', async (data) => {
    try {
      // Get database
      const channelList = (await db.get('channelList')) || {};
      const serverList = (await db.get('serverList')) || {};
      const usersList = (await db.get('usersList')) || {};
      const messageList = (await db.get('messageList')) || {};

      // Validate data
      const channel = channelList[data.channelId];
      if (!channel && data.channelId) {
        new Logger('WebSocket').error(`Channel(${data.channelId}) not found`);
        socket.emit('error', {
          message: `Channel(${data.channelId}) not found`,
        });
        return;
      }
      const server = serverList[data.serverId];
      if (!server) {
        new Logger('WebSocket').error(`Server(${data.serverId}) not found`);
        socket.emit('error', {
          message: `Server(${data.serverId}) not found`,
        });
        return;
      }
      const user = usersList[data.userId];
      if (!user) {
        new Logger('WebSocket').error(`User(${data.userId}) not found`);
        socket.emit('error', {
          message: `User(${data.userId}) not found`,
        });
        return;
      }
      if (user.currentChannelId === channel?.id) return;

      if (user.currentChannelId)
        socket.leave(`server_${server.id}_${user.currentChannelId}`);

      const prevChannel = channelList[user.currentChannelId];
      if (prevChannel)
        prevChannel.userIds = prevChannel.userIds.filter(
          (userId) => userId != user.id,
        );
      user.currentChannelId = channel?.id ?? null;
      if (channel) channel.userIds.push(user.id);

      // Save updated data
      await db.set('channelList', channelList);
      await db.set('usersList', usersList);

      // Emit updated data
      const channels = getChannels(channelList, server);
      const users = getUsers(usersList, server);
      const messages = getMessages(
        messageList,
        channelList[user.currentChannelId],
      );
      if (user.currentChannelId)
        socket.join(`server_${server.id}_${user.currentChannelId}`);
      io.to(`server_${server.id}`).emit('channels', channels);
      io.to(`server_${server.id}`).emit('users', users);
      io.to(socket.id).emit('messages', messages);
      io.to(socket.id).emit('user', user);

      new Logger('WebSocket').info(
        `User(${user.id}) joined channel(${channel.id}) in server(${server.id})`,
      );
    } catch (error) {
      new Logger('WebSocket').error(error.message);
      socket.emit('error', { message: error.message });
    }
  });
});

// Error Handling
server.on('error', (error) => {
  new Logger('Server').error(`Server error: ${error.message}`);
});

process.on('uncaughtException', (error) => {
  new Logger('Server').error(`Uncaught Exception: ${error.message}`);
});

process.on('unhandledRejection', (error) => {
  new Logger('Server').error(`Unhandled Rejection: ${error.message}`);
});

// Start Server
server.listen(port, () => {
  new Logger('Server').success(`Server is running on port ${port}`);
});

// Functions
const getUsers = (usersList, server) => {
  return (
    server?.userIds
      .map((userId) => usersList[userId])
      .filter((_) => _)
      .reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {}) ?? {}
  );
};
const getChannels = (channelList, server) => {
  return (
    server?.channelIds
      .map((channelId) => channelList[channelId])
      .filter((_) => _) ?? []
  );
};
const getMessages = (messageList, channel) => {
  return (
    channel?.messageIds
      .map((messageId) => messageList[messageId])
      .filter((_) => _) ?? []
  );
};

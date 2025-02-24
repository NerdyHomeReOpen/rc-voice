const { v4: uuidv4 } = require('uuid');
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
// Socket error
const SocketError = require('./socketError');

const messageHandler = {
  sendMessage: async (io, socket, sessionId, channelId, message) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const userId = Map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'SENDMESSAGE',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'SENDMESSAGE',
          'USER',
          404,
        );
      }
      const channel = channels[channelId];
      if (!channel) {
        throw new SocketError(
          `Channel(${channelId}) not found`,
          'SENDMESSAGE',
          'CHANNEL',
          404,
        );
      }

      // Create new message
      const messageId = uuidv4();
      await Set.message(messageId, {
        id: messageId,
        content: message.content,
        permissionLevel: message.permissionLevel,
        channelId: channel.id,
        senderId: message.senderId,
        timestamp: Date.now().valueOf(),
      });

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channel.id}`).emit('channelUpdate', {
        messages: (await Get.channel(channelId)).messages,
      });

      new Logger('WebSocket').info(
        `User(${user.id}) sent ${message.content} to channel(${channel.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `傳送訊息時發生無法預期的錯誤: ${error.message}`,
          part: 'CHATMESSAGE',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error('Error sending message: ' + error.message);
    }
  },
  sendDirectMessage: async (io, socket, sessionId, friendId, directMessage) => {
    // Get database
    const users = (await db.get('users')) || {};
    const friends = (await db.get('friends')) || {};

    try {
      // Validate data
      const userId = Map.userSessions.get(sessionId);
      if (!userId) {
        throw new SocketError(
          `Invalid session ID(${sessionId})`,
          'SENDDIRECTMESSAGE',
          'SESSION_EXPIRED',
          401,
        );
      }
      const user = users[userId];
      if (!user) {
        throw new SocketError(
          `User(${userId}) not found`,
          'SENDDIRECTMESSAGE',
          'USER',
          404,
        );
      }
      const friend = friends[friendId];
      if (!friend) {
        throw new SocketError(
          `Friend(${friendId}) not found`,
          'SENDDIRECTMESSAGE',
          'FRIEND',
          404,
        );
      }

      // Create new message
      const directMessageId = uuidv4();
      await Set.directMessage(directMessageId, {
        id: directMessageId,
        content: directMessage.content,
        friendId: friend.id,
        senderId: directMessage.senderId,
        timestamp: Date.now().valueOf(),
      });

      new Logger('WebSocket').info(
        `User(${user.id}) sent ${directMessage.content} to direct message(${friend.id})`,
      );
    } catch (error) {
      // Emit error data (only to the user)
      if (error instanceof SocketError) {
        io.to(socket.id).emit('error', error);
      } else {
        io.to(socket.id).emit('error', {
          message: `傳送私訊時發生無法預期的錯誤: ${error.message}`,
          part: 'DIRECTMESSAGE',
          tag: 'EXCEPTION_ERROR',
          status_code: 500,
        });
      }

      new Logger('WebSocket').error(
        'Error sending direct message: ' + error.message,
      );
    }
  },
};

module.exports = { ...messageHandler };

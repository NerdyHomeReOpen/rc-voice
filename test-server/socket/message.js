/* eslint-disable @typescript-eslint/no-require-imports */
const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const {
  standardizedError: StandardizedError,
  logger: Logger,
  get: Get,
  set: Set,
  func: Func,
} = utils;

const messageHandler = {
  sendMessage: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // data = {
      //   channelId: string,
      //   message: {
      //     ...
      //   }
      // };

      // Validate data
      const { message: _newMessage, channelId } = data;
      if (!_newMessage || !channelId) {
        throw new StandardizedError(
          '無效的資料',
          'SENDMESSAGE',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }
      const channel = await Func.validate.channel(channels[channelId]);
      const newMessage = await Func.validate.message(_newMessage);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);
      const operator = await Func.validate.user(users[operatorId]);
      // TODO: Add validation for operator

      // Create new message
      const messageId = uuidv4();
      await Set.message(messageId, {
        ...newMessage,
        senderId: operator.id,
        channelId: channel.id,
        timestamp: Date.now().valueOf(),
      });

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channel.id}`).emit('channelUpdate', {
        messages: [
          ...(await Get.channelMessages(channel.id)),
          ...(await Get.channelInfoMessages(channel.id)),
        ],
      });

      new Logger('WebSocket').success(
        `User(${operator.id}) sent ${newMessage.content} to channel(${channel.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `傳送訊息時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'SENDMESSAGE',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        'Error sending message: ' + error.error_message,
      );
    }
  },

  sendDirectMessage: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const friends = (await db.get('friends')) || {};

    try {
      // data = {
      //   friendId: string,
      //   message: {
      //     ...
      //   }
      // };

      // Validate data
      const { directMessage: _newDirectMessage, friendId } = data;
      if (!_newDirectMessage || !friendId) {
        throw new StandardizedError(
          '無效的資料',
          'SENDDIRECTMESSAGE',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }
      const friend = await Func.validate.friend(friends[friendId]);
      const newDirectMessage = await Func.validate.message(_newDirectMessage);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);
      const operator = await Func.validate.user(users[operatorId]);
      // TODO: Add validation for operator

      // Create new message
      const directMessageId = uuidv4();
      await Set.directMessage(directMessageId, {
        ...newDirectMessage,
        senderId: operator.id,
        friendId: friend.id,
        timestamp: Date.now().valueOf(),
      });

      // Emit updated data (to all users in the friend)
      io.to(`friend_${friend.id}`).emit('friendUpdate', {
        directMessages: await Get.friendDirectMessages(friend.id),
      });

      new Logger('WebSocket').success(
        `User(${operator.id}) sent ${newDirectMessage.content} to User(${friend.id})`,
      );
    } catch (error) {
      if (!(error instanceof StandardizedError)) {
        error = new StandardizedError(
          `傳送私訊時發生無法預期的錯誤: ${error.message}`,
          'ServerError',
          'SENDDIRECTMESSAGE',
          'EXCEPTION_ERROR',
          500,
        );
      }

      // Emit error data (only to the user)
      io.to(socket.id).emit('error', error);

      new Logger('WebSocket').error(
        'Error sending direct message: ' + error.error_message,
      );
    }
  },
};

module.exports = { ...messageHandler };

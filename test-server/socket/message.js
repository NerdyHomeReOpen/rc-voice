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

const messageHandler = {
  sendMessage: async (io, socket, data) => {
    // Get database
    const users = (await db.get('users')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // data = {
      //   message: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const { message: _message } = data;
      if (!_message) {
        throw new StandardizedError(
          '無效的資料',
          'SENDMESSAGE',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }
      const message = await Func.validate.message(_message);
      const user = await Func.validate.user(users[message.senderId]);
      const channel = await Func.validate.channel(channels[message.channelId]);

      // Validate operation
      await Func.validate.socket(socket);

      // Create new message
      const messageId = uuidv4();
      await Set.message(messageId, {
        ...message,
        timestamp: Date.now().valueOf(),
      });

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channel.id}`).emit('channelUpdate', {
        messages: await Get.channelMessages(channel.id),
      });

      new Logger('WebSocket').success(
        `User(${user.id}) sent ${message.content} to channel(${channel.id})`,
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
      //   message: {
      //     ...
      //   }
      // };
      // console.log(data);

      // Validate data
      const { directMessage: _directMessage } = data;
      if (!_directMessage) {
        throw new StandardizedError(
          '無效的資料',
          'SENDDIRECTMESSAGE',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }
      const directMessage = await Func.validate.directMessage(_directMessage);
      const user = await Func.validate.user(users[directMessage.senderId]);
      const friend = await Func.validate.friend(
        friends[directMessage.friendId],
      );

      // Validate operation
      await Func.validate.socket(socket);

      // Create new message
      const directMessageId = uuidv4();
      await Set.directMessage(directMessageId, {
        ...directMessage,
        timestamp: Date.now().valueOf(),
      });

      // Emit updated data (to all users in the friend)
      io.to(`friend_${friend.id}`).emit('friendUpdate', {
        directMessages: await Get.friendDirectMessages(friend.id),
      });

      new Logger('WebSocket').success(
        `User(${user.id}) sent ${directMessage.content} to direct message(${friend.id})`,
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

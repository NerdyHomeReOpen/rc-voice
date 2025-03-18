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
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'SENDMESSAGE',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { message } = data;
      if (!message) {
        throw new StandardizedError(
          '無效的資料',
          'SENDMESSAGE',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }
      const user = users[message.senderId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${message.senderId})不存在`,
          'ValidationError',
          'SENDMESSAGE',
          'USER',
          404,
        );
      }
      const channel = channels[message.channelId];
      if (!channel) {
        throw new StandardizedError(
          `頻道(${message.channelId})不存在`,
          'ValidationError',
          'SENDMESSAGE',
          'CHANNEL',
          404,
        );
      }

      // Validate message content
      const messageError = Func.validateMessage(message.content);
      if (messageError) {
        throw new StandardizedError(
          messageError,
          'ValidationError',
          'SENDMESSAGE',
          'CONTENT',
          400,
        );
      }

      // Create new message
      const messageId = uuidv4();
      await Set.message(messageId, {
        content: message.content,
        channelId: message.channelId,
        senderId: message.senderId,
        timestamp: Date.now().valueOf(),
      });

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channel.id}`).emit('channelUpdate', {
        messages: (await Get.channel(channel.id)).messages,
      });

      new Logger('WebSocket').info(
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
      const operatorId = Func.validate.socket(socket);
      const operator = users[operatorId];
      if (!operator) {
        throw new StandardizedError(
          `無效的操作`,
          'ValidationError',
          'SENDDIRECTMESSAGE',
          'OPERATOR_NOT_FOUND',
          404,
        );
      }
      const { directMessage } = data;
      if (!directMessage) {
        throw new StandardizedError(
          '無效的資料',
          'SENDDIRECTMESSAGE',
          'ValidationError',
          'DATA_INVALID',
          401,
        );
      }
      const user = users[directMessage.senderId];
      if (!user) {
        throw new StandardizedError(
          `使用者(${directMessage.senderId})不存在`,
          'ValidationError',
          'SENDDIRECTMESSAGE',
          'USER',
          404,
        );
      }
      const friend = friends[directMessage.friendId];
      if (!friend) {
        throw new StandardizedError(
          `好友私訊頻道(${directMessage.friendId})不存在`,
          'ValidationError',
          'SENDDIRECTMESSAGE',
          'FRIEND',
          404,
        );
      }

      // Create new message
      const directMessageId = uuidv4();
      await Set.directMessage(directMessageId, {
        content: directMessage.content,
        friendId: directMessage.friendId,
        senderId: directMessage.senderId,
        timestamp: Date.now().valueOf(),
      });

      new Logger('WebSocket').info(
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

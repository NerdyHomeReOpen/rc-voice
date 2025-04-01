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
      const newMessage = await Func.validate.message(_newMessage);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const channel = await Get.channel(channelId);
      const server = await Get.server(channel.serverId);
      const operatorMember = await Get.member(operator.id, server.id);

      if (channel.forbidGuestUrl && operatorMember.permissionLevel === 1) {
        newMessage.content = newMessage.content.replace(
          /https?:\/\/[^\s]+/g,
          '{{GUEST_SEND_AN_EXTERNAL_LINK}}',
        );
      }

      // Create new message
      const messageId = uuidv4();
      await Set.message(messageId, {
        ...newMessage,
        senderId: operator.id,
        channelId: channel.id,
        timestamp: Date.now().valueOf(),
      });

      // Update member
      const member_update = {
        lastMessageTime: Date.now().valueOf(),
      };
      await Set.member(operatorMember.id, member_update);

      // Emit updated data (to the operator)
      io.to(socket.id).emit('memberUpdate', member_update);

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channel.id}`).emit('channelUpdate', {
        messages: [
          ...(await Get.channelMessages(channel.id)),
          ...(await Get.channelInfoMessages(channel.id)),
        ],
      });

      new Logger('Message').success(
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

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Message').error(
        'Error sending message: ' + error.error_message,
      );
    }
  },

  sendDirectMessage: async (io, socket, data) => {
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
      const newDirectMessage = await Func.validate.message(_newDirectMessage);

      // Validate operation
      const operatorId = await Func.validate.socket(socket);

      // Get data
      const operator = await Get.user(operatorId);
      const friend = await Get.friend(friendId);

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

      new Logger('Message').success(
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

      // Emit error data (to the operator)
      io.to(socket.id).emit('error', error);

      new Logger('Message').error(
        'Error sending direct message: ' + error.error_message,
      );
    }
  },
};

module.exports = { ...messageHandler };

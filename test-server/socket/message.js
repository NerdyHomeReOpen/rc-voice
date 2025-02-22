const utils = require('../utils');
const Logger = utils.logger;
const SocketError = require('./socketError');

module.exports = (io, socket, db) => {
  socket.on('sendMessage', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   channelId: '123456',
    //   message: {
    //     ...
    //   }
    // };
    // console.log(data);

    // Get database
    const users = (await db.get('users')) || {};
    const messages = (await db.get('messages')) || {};
    const channels = (await db.get('channels')) || {};

    try {
      // Validate data
      const { sessionId, channelId, message } = data;
      if (!sessionId || !message) {
        throw new SocketError(
          'Missing required fields',
          'SENDMESSAGE',
          'DATA',
          400,
        );
      }
      const userId = utils.map.userSessions.get(sessionId);
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
      messages[messageId] = {
        ...message,
        id: messageId,
        channelId: channel.id,
        timestamp: Date.now().valueOf(),
      };
      await db.set(`messages.${messageId}`, messages[messageId]);

      // Emit updated data (to all users in the channel)
      io.to(`channel_${channel.id}`).emit('channelUpdate', {
        messages: (await utils.get.channel(channelId)).messages,
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
  });

  socket.on('sendDirectMessage', async (data) => {
    // data = {
    //   sessionId: '123456',
    //   friendId: '123456',
    //   message: {
    //     ...
    //   }
    // };

    // Get database
    const users = (await db.get('users')) || {};
    const friends = (await db.get('friends')) || {};
    const directMessages = (await db.get('directMessages')) || {};

    try {
      // Validate data
      const { sessionId, friendId, directMessage } = data;
      if (!sessionId || !directMessage) {
        throw new SocketError(
          'Missing required fields',
          'SENDDIRECTMESSAGE',
          'DATA',
          400,
        );
      }
      const userId = utils.map.userSessions.get(sessionId);
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
      directMessages[directMessageId] = {
        ...directMessage,
        id: directMessageId,
        friendId: friend.id,
        timestamp: Date.now().valueOf(),
      };
      await db.set(
        `directMessages.${directMessageId}`,
        directMessages[directMessageId],
      );

      // FIX ME: Update friend data

      // Find direct message and update (if not exists, create one)
      // const friend = await getFriend(userId, recieverId);
      // if (!friend) {
      //   const friendId = uuidv4();
      //   friends[friendId] = {
      //     id: friendId,
      //     status: 'pending',
      //     userIds: [userId, recieverId],
      //     messageIds: [messageId],
      //     createdAt: Date.now(),
      //   };
      //   await db.set(`friends.${friendId}`, friends[friendId]);
      // } else {
      //   friend.messageIds.push(messageId);
      //   await db.set(`friends.${friend.id}`, friend);
      // }

      // const recieverSocketIds = [
      //   userToSocket.get(friend.user1Id),
      //   userToSocket.get(friend.user2Id),
      // ];

      // Emit updated data (to the user and reciever) THIS WILL BE CHANGED TO NOTIFICATION
      // io.to(socket.id).emit('directMessage', [
      //   ...(await getDirectMessages(userId, recieverId)),
      // ]);
      // io.to(recieverSocketId).emit('directMessage', [
      //   ...(await getDirectMessages(userId, recieverId)),
      // ]);

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
  });
};

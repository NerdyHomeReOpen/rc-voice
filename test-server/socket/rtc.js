const { v4: uuidv4 } = require('uuid');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
// Utils
const utils = require('../utils');
const Logger = utils.logger;
const Map = utils.map;
const Get = utils.get;
const Interval = utils.interval;
const Set = utils.set;
// Socket error
const SocketError = require('./socketError');

const rtcRooms = {};

const rtcHandler = {
  offer: async (io, socket, sessionId, to, offer) => {
    try {
      socket.to(to).emit('RTCOffer', { from: socket.id, offer });

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) sent offer to user(socket-id: ${to})`,
      );
    } catch {
      new Logger('RTC').error(
        `Error sending offer to user (socket-id: ${to}): ${error.message}`,
      );
    }
  },

  answer: async (io, socket, sessionId, to, answer) => {
    try {
      socket.to(to).emit('RTCAnswer', { from: socket.id, answer });

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) sent answer to user(socket-id: ${to})`,
      );
    } catch (error) {
      new Logger('RTC').error(
        `Error sending answer to user (socket-id: ${to}): ${error.message}`,
      );
    }
  },

  candidate: async (io, socket, sessionId, to, candidate) => {
    try {
      socket.to(to).emit('RTCIceCandidate', { from: socket.id, candidate });

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) sent ICE candidate to user(socket-id: ${to})`,
      );
    } catch (error) {
      new Logger('RTC').error(
        `Error sending ICE candidate user (socket-id: ${to}): ${error.message}`,
      );
    }
  },

  join: async (io, socket, sessionId, channelId) => {
    try {
      socket.join(`channel_${channelId}`);

      if (!rtcRooms[channelId]) rtcRooms[channelId] = [];
      rtcRooms[channelId].push(socket.id);

      // Emit RTC join event (To all users)
      socket.to(`channel_${channelId}`).emit('RTCJoin', socket.id);

      // Emit RTC join event (Only to the user)
      socket.emit(
        'RTCConnect',
        rtcRooms[channelId].filter((id) => id !== socket.id),
      );

      new Logger('RTC').info(`User(${sessionId}) joined channel(${channelId})`);
    } catch (error) {
      new Logger('RTC').error(
        `Error joining channel ${channelId}: ${error.message}`,
      );
    }
  },

  leave: async (io, socket, sessionId, channelId) => {
    try {
      socket.leave(`channel_${channelId}`);

      if (!rtcRooms[channelId]) return;
      rtcRooms[channelId] = rtcRooms[channelId].filter(
        (id) => id !== socket.id,
      );

      // Emit RTC leave event (To all users)
      socket.to(`channel_${channelId}`).emit('RTCLeave', socket.id);

      new Logger('RTC').info(`User(${sessionId}) left channel(${channelId})`);
    } catch (error) {
      new Logger('RTC').error(
        `Error leaving channel ${channelId}: ${error.message}`,
      );
    }
  },
};

module.exports = { ...rtcHandler };

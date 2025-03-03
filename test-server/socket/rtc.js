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
      console.log(`[RTC] Handle Offer: from ${socket.id} to ${to}`);

      // ensure offer is serializable
      const serializedOffer = offer
        ? {
            type: offer.type,
            sdp: offer.sdp,
          }
        : null;
      socket.to(to).emit('RTCOffer', {
        from: socket.id,
        offer: serializedOffer,
      });

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) sent offer to user(socket-id: ${to})`,
      );
      console.log(`[RTC] Offer forwarded`);
    } catch (error) {
      console.error(`[RTC] Handle Offer error:`, error);
      new Logger('RTC').error(
        `Error sending offer to user (socket-id: ${to}): ${error.message}`,
      );
    }
  },

  answer: async (io, socket, sessionId, to, answer) => {
    try {
      console.log(`[RTC] Handle Answer: from ${socket.id} to ${to}`);

      // ensure answer is serializable
      const serializedAnswer = answer
        ? {
            type: answer.type,
            sdp: answer.sdp,
          }
        : null;

      socket.to(to).emit('RTCAnswer', {
        from: socket.id,
        answer: serializedAnswer,
      });

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) sent answer to user(socket-id: ${to})`,
      );
      console.log(`[RTC] Answer forwarded`);
    } catch (error) {
      console.error(`[RTC] Handle Answer error:`, error);
      new Logger('RTC').error(
        `Error sending answer to user (socket-id: ${to}): ${error.message}`,
      );
    }
  },

  candidate: async (io, socket, sessionId, to, candidate) => {
    try {
      console.log(`[RTC] Handle ICE Candidate: from ${socket.id} to ${to}`);

      // ensure candidate is serializable
      const serializedCandidate = candidate
        ? {
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
            usernameFragment: candidate.usernameFragment,
          }
        : null;

      socket.to(to).emit('RTCIceCandidate', {
        from: socket.id,
        candidate: serializedCandidate,
      });

      new Logger('RTC').info(
        `User(socket-id: ${socket.id}) sent ICE candidate to user(socket-id: ${to})`,
      );
      console.log(`[RTC] ICE Candidate forwarded`);
    } catch (error) {
      console.error(`[RTC] Handle ICE Candidate error:`, error);
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
      const existingUsers = rtcRooms[channelId].filter(
        (id) => id !== socket.id,
      );
      socket.emit('RTCConnect', existingUsers);

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

module.exports = {
  userSessions: new Map(), // sessionToken -> userId
  userToSocket: new Map(), // userId -> socket.id
  socketToUser: new Map(), // socket.id -> userId
  contributionInterval: new Map(), // socket.id -> interval
  createUserIdSessionIdMap: (userId, sessionId) => {
    if (!userSessions.has(sessionId)) {
      userSessions.set(sessionId, userId);
      return true;
    }
    return false;
  },
  deleteUserIdSessionIdMap: (userId = null) => {
    if (userId && userSessions.has(userId)) {
      userSessions.delete(userId);
      return true;
    }
    return false;
  },
  createUserIdSocketIdMap: (userId, socketId) => {
    if (!socketToUser.has(socketId) && !userToSocket.has(userId)) {
      socketToUser.set(socketId, userId);
      userToSocket.set(userId, socketId);
      return true;
    }
    return false;
  },
  deleteUserIdSocketIdMap: (userId = null, socketId = null) => {
    if (userId && userToSocket.has(userId)) {
      socketId = userToSocket.get(userId);
      socketToUser.delete(socketId);
      userToSocket.delete(userId);
      return true;
    }
    if (socketId && socketToUser.has(socketId)) {
      userId = socketToUser.get(socketId);
      userToSocket.delete(userId);
      socketToUser.delete(socketId);
      return true;
    }
    return false;
  },
  createContributionIntervalMap: (socketId, intervalId) => {
    if (!contributionInterval.has(socketId)) {
      contributionInterval.set(socketId, intervalId);
      return true;
    }
    return false;
  },
  deleteContributionIntervalMap: (socketId) => {
    if (contributionInterval.has(socketId)) {
      contributionInterval.delete(socketId);
      return true;
    }
    return false;
  },
};

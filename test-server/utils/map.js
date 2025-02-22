const map = {
  userSessions: new Map(), // sessionToken -> userId
  userToSocket: new Map(), // userId -> socket.id
  socketToUser: new Map(), // socket.id -> userId
  contributionIntervalMap: new Map(), // socket.id -> interval
  userLastXpAwardedAt: new Map(),
  userElapsedTime: new Map(),
  createUserIdSessionIdMap: (userId, sessionId) => {
    if (!map.userSessions.has(sessionId)) {
      map.userSessions.set(sessionId, userId);
      return true;
    }
    return false;
  },
  deleteUserIdSessionIdMap: (userId = null) => {
    if (userId && map.userSessions.has(userId)) {
      map.userSessions.delete(userId);
      return true;
    }
    return false;
  },
  createUserIdSocketIdMap: (userId, socketId) => {
    if (!map.socketToUser.has(socketId) && !map.userToSocket.has(userId)) {
      map.socketToUser.set(socketId, userId);
      map.userToSocket.set(userId, socketId);
      return true;
    }
    return false;
  },
  deleteUserIdSocketIdMap: (userId = null, socketId = null) => {
    if (userId && map.userToSocket.has(userId)) {
      socketId = map.userToSocket.get(userId);
      map.socketToUser.delete(socketId);
      map.userToSocket.delete(userId);
      return true;
    }
    if (socketId && map.socketToUser.has(socketId)) {
      userId = map.socketToUser.get(socketId);
      map.userToSocket.delete(userId);
      map.socketToUser.delete(socketId);
      return true;
    }
    return false;
  },
  createContributionIntervalMap: (socketId, intervalId) => {
    if (!map.contributionIntervalMap.has(socketId)) {
      map.contributionIntervalMap.set(socketId, intervalId);
      return true;
    }
    return false;
  },
  deleteContributionIntervalMap: (socketId) => {
    if (map.contributionIntervalMap.has(socketId)) {
      map.contributionIntervalMap.delete(socketId);
      return true;
    }
    return false;
  },
};

module.exports = { ...map };

const map = {
  userToSession: new Map(), // userId -> sessionId
  sessionToUser: new Map(), // sessionId -> userId
  userToSocket: new Map(), // userId -> socketId
  socketToUser: new Map(), // socketId -> userId

  createUserIdSessionIdMap: (userId, sessionId) => {
    map.userToSession.set(userId, sessionId);
    map.sessionToUser.set(sessionId, userId);
  },
  deleteUserIdSessionIdMap: (userId = null, sessionId = null) => {
    if (userId && map.userToSession.has(userId)) {
      const _sessionId = map.userToSession.get(userId);
      if (sessionId == _sessionId) map.userToSession.delete(userId);
    }
    if (sessionId && map.sessionToUser.has(sessionId)) {
      const _userId = map.sessionToUser.get(sessionId);
      if (userId == _userId) map.sessionToUser.delete(sessionId);
    }
  },
  createUserIdSocketIdMap: (userId, socketId) => {
    map.userToSocket.set(userId, socketId);
    map.socketToUser.set(socketId, userId);
  },
  deleteUserIdSocketIdMap: (userId = null, socketId = null) => {
    if (userId && map.userToSocket.has(userId)) {
      const _socketId = map.userToSocket.get(userId);
      if (socketId == _socketId) map.userToSocket.delete(userId);
    }
    if (socketId && map.socketToUser.has(socketId)) {
      const _userId = map.socketToUser.get(socketId);
      if (userId == _userId) map.socketToUser.delete(socketId);
    }
  },
};

module.exports = { ...map };

const session = {
  userToSession: new Map(), // userId -> sessionId
  sessionToUser: new Map(), // sessionId -> userId

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
};

module.exports = { ...session };

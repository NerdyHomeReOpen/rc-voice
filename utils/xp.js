/* eslint-disable @typescript-eslint/no-require-imports */
// Constants
const { XP_SYSTEM } = require('../constant');
// Utils
const Logger = require('./logger');
const Get = require('./get');
const Set = require('./set');

const xpSystem = {
  timeFlag: new Map(), // socket -> timeFlag
  elapsedTime: new Map(), // userId -> elapsedTime

  create: (socket) => {
    xpSystem.timeFlag.set(socket, Date.now());
  },

  delete: (socket) => {
    xpSystem.timeFlag.delete(socket);
  },

  setup: () => {
    try {
      // Set up XP interval
      setInterval(async () => xpSystem.refreshAllUsers(), 60000);

      new Logger('XPSystem').info(`XP system setup complete`);
    } catch (error) {
      new Logger('XPSystem').error(
        `Error setting up XP system: ${error.message}`,
      );
    }
  },

  refreshAllUsers: async () => {
    for (const [socket, timeFlag] of xpSystem.timeFlag.entries()) {
      if (Date.now() - timeFlag >= XP_SYSTEM.INTERVAL_MS) {
        xpSystem.obtainXp(socket);
      }
      if (!xpSystem.elapsedTime.has(socket.userId)) {
        const elapsedTime = xpSystem.elapsedTime.get(socket.userId) || 0;
        const newElapsedTime =
          (elapsedTime + Date.now() - timeFlag) % XP_SYSTEM.INTERVAL_MS;
        xpSystem.elapsedTime.set(socket.userId, newElapsedTime);
      }
      xpSystem.timeFlag.set(socket, Date.now());
      new Logger('XPSystem').info(
        `XP interval refreshed for user(${socket.userId})(socket-id: ${socket.id})`,
      );
    }
    new Logger('XPSystem').info(
      `XP interval refreshed complete, ${xpSystem.timeFlag.size} users updated`,
    );
  },

  getRequiredXP: (level) => {
    return Math.ceil(
      XP_SYSTEM.BASE_XP * Math.pow(XP_SYSTEM.GROWTH_RATE, level),
    );
  },

  obtainXp: async (socket) => {
    try {
      const user = await Get.user(socket.userId);
      if (!user) {
        new Logger('XPSystem').warn(
          `User(${socket.userId}) not found, cannot obtain XP`,
        );
        return;
      }
      const server = await Get.server(user.currentServerId);
      if (!server) {
        new Logger('XPSystem').warn(
          `Server(${user.currentServerId}) not found, cannot obtain XP`,
        );
        return;
      }
      const member = await Get.member(user.id, server.id);
      if (!member) {
        new Logger('XPSystem').warn(
          `User(${user.id}) not found in server(${server.id}), cannot update contribution`,
        );
        return;
      }
      const vipBoost = user.vip ? 1 + user.vip * 0.2 : 1;

      // Process XP and level
      user.xp += XP_SYSTEM.XP_PER_HOUR * vipBoost;

      let requiredXp = 0;
      while (true) {
        requiredXp = xpSystem.getRequiredXP(user.level);
        if (user.xp < requiredXp) break;
        user.level += 1;
        user.xp -= requiredXp;
      }

      // Update user
      const userUpdate = {
        level: user.level,
        xp: user.xp,
        requiredXp: requiredXp,
        progress: user.xp / requiredXp,
      };
      await Set.user(user.id, userUpdate);

      // Update member contribution if in a server
      const memberUpdate = {
        contribution: member.contribution + XP_SYSTEM.XP_PER_HOUR * vipBoost,
      };
      await Set.member(member.id, memberUpdate);

      // Update server wealth
      const serverUpdate = {
        wealth: server.wealth + XP_SYSTEM.XP_PER_HOUR * vipBoost,
      };
      await Set.server(server.id, serverUpdate);

      // Emit update to client
      socket.emit('memberUpdate', memberUpdate);
      socket.emit('userUpdate', userUpdate);

      new Logger('XPSystem').info(
        `Server(${server.id}) gain ${XP_SYSTEM.XP_PER_HOUR * vipBoost} wealth`,
      );
      new Logger('XPSystem').info(
        `Member(${member.id}) gain ${
          XP_SYSTEM.XP_PER_HOUR * vipBoost
        } contribution`,
      );
      new Logger('XPSystem').info(
        `User(${user.id}) gain ${XP_SYSTEM.XP_PER_HOUR * vipBoost} XP. Level: ${
          user.level
        }`,
      );
    } catch (error) {
      new Logger('XPSystem').error(
        `Error obtaining user(${socket.userId})(socket-id: ${socket.id}) XP: ${error.message}`,
      );
    }
  },

  // contributionInterval: new Map(),
  // elapsedTime: new Map(),
  // timeFlag: new Map(),

  // createMap: (socketId, intervalId) => {
  //   xpSystem.contributionInterval.set(socketId, intervalId);
  // },

  // deleteMap: (socketId = null) => {
  //   if (!socketId) return;
  //   if (!xpSystem.contributionInterval.has(socketId)) return;
  //   xpSystem.contributionInterval.delete(socketId);
  // },

  // setElapseTime: (userId) => {
  //   if (!userId) return 0;
  //   const elapsedTime = xpSystem.elapsedTime.get(userId) || 0;
  //   const joinTime = xpSystem.timeFlag.get(userId) || Date.now();
  //   const leftTime = Date.now();
  //   const newElapsedTime =
  //     (elapsedTime + leftTime - joinTime) % XP_SYSTEM.INTERVAL_MS;
  //   xpSystem.elapsedTime.set(userId, newElapsedTime);
  //   return newElapsedTime;
  // },

  // getElapseTime: (userId) => {
  //   if (!userId) return 0;
  //   const elapsedTime = xpSystem.elapsedTime.get(userId) || 0;
  //   const joinTime = Date.now();
  //   xpSystem.timeFlag.set(userId, joinTime);
  //   return elapsedTime;
  // },

  // setup: async (socket) => {
  //   try {
  //     // Validate inputs
  //     if (!socket) {
  //       throw new Error('Socket not provided');
  //     }
  //     const userId = MapModule.socketToUser.get(socket.id);
  //     if (!userId) {
  //       throw new Error(`UserId not found for socket(${socket.id})`);
  //     }

  //     // Restore elapsed time than calculate left time
  //     const elapsedTime = xpSystem.getElapseTime(userId);
  //     const leftTime = XP_SYSTEM.INTERVAL_MS - elapsedTime;

  //     // Run interval every XP_SYSTEM.INTERVAL_MS
  //     const timeout = setTimeout(async () => {
  //       await xpSystem.obtainXp(socket, userId);
  //       xpSystem.deleteMap(socket.id);
  //       xpSystem.setup(socket);
  //     }, leftTime);

  //     // Create map
  //     xpSystem.createMap(socket.id, timeout);

  //     new Logger('XPSystem').info(
  //       `Obtain XP interval set up for user(${userId}) with left time: ${leftTime}`,
  //     );
  //   } catch (error) {
  //     new Logger('XPSystem').error(
  //       `Error setting up contribution interval: ${error.message}`,
  //     );
  //   }
  // },

  // clear: (socket) => {
  //   try {
  //     if (!socket) {
  //       throw new Error('Socket not provided');
  //     }
  //     const userId = MapModule.socketToUser.get(socket.id);
  //     if (!userId) {
  //       throw new Error(`UserId not found for socket(${socket.id})`);
  //     }
  //     const interval = xpSystem.contributionInterval.get(socket.id);
  //     if (!interval) {
  //       throw new Error(`Interval not found for socket(${socket.id})`);
  //     }

  //     // Set elapsed time to map
  //     const elapsedTime = xpSystem.setElapseTime(userId);

  //     // Clear interval
  //     clearTimeout(interval);

  //     // Delete map
  //     xpSystem.deleteMap(socket.id);

  //     new Logger('XPSystem').info(
  //       `Obtain XP interval cleared for user(${userId}) with elapsed time: ${elapsedTime}`,
  //     );
  //   } catch (error) {
  //     new Logger('XPSystem').error(
  //       `Error clearing contribution interval: ${error.message}`,
  //     );
  //   }
  // },
  // },
};

module.exports = { ...xpSystem };

const { QuickDB } = require('quick.db');
const db = new QuickDB();
const fs = require('fs').promises;
const path = require('path');
// Constants
const {
  XP_SYSTEM,
  UPLOADS_DIR,
  MIME_TYPES,
  CLEANUP_INTERVAL_MS,
} = require('../constant');
// Utils
const Logger = require('./logger');
const Map = require('./map');
const Get = require('./get');
const SetModule = require('./set');
const Func = require('./func');

const interval = {
  setupObtainXpInterval: async (socket) => {
    try {
      // Validate inputs
      if (!socket) {
        throw new Error('Socket not provided');
      }
      const userId = Map.socketToUser.get(socket.id);
      if (!userId) {
        throw new Error(`UserId not found for socket(${socket.id})`);
      }

      // Restore elapsed time than calculate left time
      const elapsedTime = restoreElapseTime(userId);
      const leftTime = XP_SYSTEM.INTERVAL_MS - elapsedTime;

      // Run interval every XP_SYSTEM.INTERVAL_MS
      const timeout = setTimeout(async () => {
        await obtainXp(socket, userId);

        Map.deleteContributionIntervalMap(socket.id);

        interval.setupObtainXpInterval(socket);
      }, leftTime);

      Map.createContributionIntervalMap(socket.id, timeout);

      new Logger('XPSystem').info(
        `Obtain XP interval set up for user(${userId}) with left time: ${leftTime}`,
      );
    } catch (error) {
      new Logger('XPSystem').error(
        'Error setting up contribution interval: ' + error.message,
      );
    }
  },

  clearObtainXpInterval: (socket) => {
    try {
      if (!socket) {
        throw new Error('Socket not provided');
      }
      const userId = Map.socketToUser.get(socket.id);
      if (!userId) {
        throw new Error(`UserId not found for socket(${socket.id})`);
      }
      const interval = Map.contributionIntervalMap.get(socket.id);
      if (!interval) {
        throw new Error(`Interval not found for socket(${socket.id})`);
      }

      // Initial elapsed time to map
      const elapsedTime = initialElapseTime(userId);

      Map.deleteContributionIntervalMap(socket.id);

      clearTimeout(interval);

      new Logger('XPSystem').info(
        `Obtain XP interval cleared for user(${userId}) with elapsed time: ${elapsedTime}`,
      );
    } catch (error) {
      new Logger('XPSystem').error(
        'Error clearing contribution interval: ' + error.message,
      );
    }
  },

  setupCleanupInterval: async () => {
    try {
      // Ensure uploads directory exists
      await fs.mkdir(UPLOADS_DIR, { recursive: true });

      // Run cleanup
      setInterval(cleanupUnusedAvatars, CLEANUP_INTERVAL_MS);

      // Run initial cleanup
      await cleanupUnusedAvatars();
    } catch (error) {
      new Logger('Cleanup').error(
        `Error setting up cleanup interval: ${error.message}`,
      );
    }
  },
};

const cleanupUnusedAvatars = async () => {
  try {
    // Get all avatar files from directory
    const files = await fs.readdir(UPLOADS_DIR);

    // Get all servers from database
    const servers = (await db.get('servers')) || {};

    // Get list of active avatar URLs
    const activeAvatars = new Set(
      Object.values(servers)
        .map((server) => server.avatarUrl)
        .filter((url) => url && !url.includes('logo_server_def.png'))
        .map((url) => path.basename(url)),
    );

    // Find unused avatar files
    const unusedFiles = files.filter((file) => {
      // Skip non-image files
      if (!Object.keys(MIME_TYPES).some((ext) => file.endsWith(ext))) {
        return false;
      }
      // Check if file is not used by any server
      return !activeAvatars.has(file);
    });

    // Delete unused files
    for (const file of unusedFiles) {
      try {
        await fs.unlink(path.join(UPLOADS_DIR, file));
        new Logger('Cleanup').success(`Deleted unused avatar: ${file}`);
      } catch (error) {
        new Logger('Cleanup').error(
          `Error deleting file ${file}: ${error.message}`,
        );
      }
    }

    if (!unusedFiles.length) {
      new Logger('Cleanup').info('No unused avatars to delete');
    } else {
      new Logger('Cleanup').info(
        `Deleted ${unusedFiles.length} unused avatars`,
      );
    }
  } catch (error) {
    new Logger('Cleanup').error(`Avatar cleanup failed: ${error.message}`);
  }
};

const obtainXp = async (socket, userId) => {
  try {
    const user = await Get.user(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Update user XP and level
    user.xp += XP_SYSTEM.XP_PER_HOUR;
    let requiredXP = Func.calculateRequiredXP(user.level);
    while (user.xp >= requiredXP) {
      user.level += 1;
      user.xp -= requiredXP;
      requiredXP = Func.calculateRequiredXP(user.level);
    }

    const userUpdate = {
      level: user.level,
      xp: user.xp,
      requiredXP,
      progress: user.xp / requiredXP,
    };
    await SetModule.user(user.id, userUpdate);

    // Update member contribution if in a server
    if (user.currentServerId) {
      const member = user.members[user.currentServerId];
      if (!member) {
        throw new Error(
          `User(${user.id}) not found in server(${user.currentServerId})`,
        );
      }

      member.contribution += XP_SYSTEM.XP_PER_HOUR;

      const memberUpdate = {
        contribution: member.contribution,
      };
      await SetModule.member(member.id, memberUpdate);
    }

    // Update last XP award time
    Map.userElapsedTime.set(userId, 0);

    // Emit update to client
    socket.emit('userUpdate', userUpdate);

    new Logger('XPSystem').info(
      `User(${user.id}) obatin XP. Level: ${user.level}`,
    );
  } catch (error) {
    new Logger('XPSystem').error(
      `Error obtaining user(${userId}) xp: ${error.message}`,
    );
  }
};

const initialElapseTime = (userId) => {
  if (!userId) return 0;
  const elapsedTime = Map.userElapsedTime.get(userId) || 0;
  const joinTime = Map.userTimeFlag.get(userId) || Date.now();
  const leftTime = Date.now();
  const newElapsedTime =
    (elapsedTime + leftTime - joinTime) % XP_SYSTEM.INTERVAL_MS;
  Map.userElapsedTime.set(userId, newElapsedTime);
  return newElapsedTime;
};

const restoreElapseTime = (userId) => {
  if (!userId) return 0;
  const elapsedTime = Map.userElapsedTime.get(userId) || 0;
  const joinTime = Date.now();
  Map.userTimeFlag.set(userId, joinTime);
  return elapsedTime;
};

module.exports = { ...interval };

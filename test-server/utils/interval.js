const { QuickDB } = require('quick.db');
const db = new QuickDB();
const fs = require('fs').promises;
const path = require('path');

const { XP_SYSTEM } = require('../constant');
const Logger = require('./logger');
const Map = require('./map');
const Get = require('./get');
const Func = require('./func');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const interval = {
  setupObtainXpInterval: async (socketId, userId = null) => {
    try {
      // Validate inputs
      if (!socketId) {
        throw new Error('Socket ID is required');
      }

      userId = userId ?? Map.socketToUser.get(socketId);
      if (!userId) {
        throw new Error('User ID not found for socket');
      }

      const leftTime = restoreTimer(userId);

      // Ensure leftTime is valid
      if (leftTime < 0) {
        initializeTimer(userId);
      }

      setTimeout(() => {
        // Set up interval
        obtainXp(socketId, userId);

        // Run interval every hour
        const intervalId = setInterval(
          () => obtainXp(socketId, userId),
          XP_SYSTEM.INTERVAL_MS,
        );

        Map.createContributionIntervalMap(socketId, intervalId);
      }, Math.max(0, leftTime));
    } catch (error) {
      new Logger('WebSocket').error(
        'Error setting up contribution interval: ' + error.message,
      );
    }
  },

  clearObtainXpInterval: (socketId, userId = null) => {
    try {
      if (!socketId) {
        throw new Error('Socket ID is required');
      }

      userId = userId ?? Map.socketToUser.get(socketId);
      if (!userId) {
        throw new Error('User ID not found for socket');
      }

      initializeTimer(userId);

      // Clear interval if exists
      const intervalId = Map.contributionIntervalMap.get(socketId);
      if (intervalId) {
        clearInterval(intervalId);
        Map.deleteContributionIntervalMap(socketId);
      }
    } catch (error) {
      new Logger('WebSocket').error(
        'Error clearing contribution interval: ' + error.message,
      );
    }
  },

  setupCleanupInterval: async () => {
    try {
      // Ensure uploads directory exists
      await fs.mkdir(UPLOADS_DIR, { recursive: true });

      // Run cleanup
      setInterval(cleanupUnusedAvatars, CLEANUP_INTERVAL);

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

const initializeTimer = (userId) => {
  if (!userId) return;

  const lastAwardedAt = Map.userLastXpAwardedAt.get(userId);
  if (!lastAwardedAt) {
    Map.userLastXpAwardedAt.set(userId, Date.now());
    Map.userElapsedTime.set(userId, 0);
    return;
  }

  const elapsedTime = Date.now() - lastAwardedAt;
  Map.userElapsedTime.set(userId, elapsedTime);
};

const restoreTimer = (userId) => {
  if (!userId) return XP_SYSTEM.INTERVAL_MS;

  const elapsedTime = Map.userElapsedTime.get(userId) || 0;
  return Math.max(0, XP_SYSTEM.INTERVAL_MS - elapsedTime);
};

// XP interval handler
const obtainXp = async (socketId, userId) => {
  try {
    if (!socketId || !userId) {
      throw new Error('Socket ID and User ID are required');
    }

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

    await db.set(`users.${userId}`, user);

    // Update member contribution if in a server
    if (user.currentServerId && user.members?.[user.currentServerId]) {
      const member = user.members[user.currentServerId];

      member.contribution += XP_SYSTEM.XP_PER_HOUR;

      await db.set(`members.${member.id}`, member);
    }

    // Update last XP award time
    Map.userLastXpAwardedAt.set(userId, Date.now());

    // Emit update to client
    io.to(socketId).emit('userUpdate', {
      level: user.level,
      xp: user.xp,
      requiredXP: Func.calculateRequiredXP(user.level),
    });

    new Logger('WebSocket').info(
      `User(${user.id}) earned XP. Level: ${user.level}`,
    );
  } catch (error) {
    new Logger('WebSocket').error(`Error in XP interval: ${error.message}`);
  }
};

module.exports = { ...interval };

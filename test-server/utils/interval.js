const { QuickDB } = require('quick.db');
const db = new QuickDB();
const Logger = require('./logger');
const fs = require('fs').promises;
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

module.exports = {
  setupContributionInterval: async (socketId, userId) => {
    try {
      // Get user data
      const user = (await db.get(`users.${userId}`)) || {};

      // Initialize xp if it doesn't exist
      if (user.xp === undefined) {
        user.xp = 0;
      }

      // Calculate catch-up XP if needed
      if (user.lastXpAwardedAt) {
        const timeSinceLastAward = Date.now() - user.lastXpAwardedAt;
        const hoursSinceLastAward = Math.floor(
          timeSinceLastAward / XP_SYSTEM.INTERVAL_MS,
        );

        if (hoursSinceLastAward > 0) {
          // Award catch-up XP
          const catchUpXp = hoursSinceLastAward * XP_SYSTEM.XP_PER_HOUR;
          user.xp += catchUpXp;

          // Add catch-up contribution to current server
          const presence = await getPresenceState(userId);
          if (presence.currentServerId) {
            const member = await getMember(userId, presence.currentServerId);
            if (member) {
              member.contribution += catchUpXp;
              await db.set(`members.${member.id}`, member);
            }
          }

          // Process any level ups
          while (user.xp >= calculateRequiredXP(user.level)) {
            const requiredXP = calculateRequiredXP(user.level);
            user.level += 1;
            user.xp -= requiredXP;
            new Logger('WebSocket').info(
              `User(${userId}) leveled up to ${user.level}`,
            );
          }

          // Update lastXpAwardedAt to align with hourly intervals
          user.lastXpAwardedAt += hoursSinceLastAward * XP_SYSTEM.INTERVAL_MS;
        }
      } else {
        // First time setup
        user.lastXpAwardedAt = Date.now();
      }

      // Save user changes
      await db.set(`users.${userId}`, user);

      // Calculate delay to align with next hour interval
      const timeUntilNextAward =
        XP_SYSTEM.INTERVAL_MS -
        ((Date.now() - user.lastXpAwardedAt) % XP_SYSTEM.INTERVAL_MS);

      // Setup initial timeout to align with hour intervals
      setTimeout(() => {
        // Start regular interval once aligned
        const interval = setInterval(async () => {
          try {
            const user = (await db.get(`users.${userId}`)) || {};

            // Add XP
            user.xp += XP_SYSTEM.XP_PER_HOUR;
            user.lastXpAwardedAt = Date.now();

            // Add contribution to current server
            const presence = await getPresenceState(userId);
            if (presence.currentServerId) {
              const member = await getMember(userId, presence.currentServerId);
              if (member) {
                member.contribution += XP_SYSTEM.XP_PER_HOUR;
                await db.set(`members.${member.id}`, member);
              }
            }

            // Check for level up
            const requiredXP = calculateRequiredXP(user.level);
            if (user.xp >= requiredXP) {
              user.level += 1;
              user.xp -= requiredXP;
              new Logger('WebSocket').info(
                `User(${userId}) leveled up to ${user.level}`,
              );
            }

            // Save changes
            await db.set(`users.${userId}`, user);

            // Emit updated data
            io.to(socketId).emit('userUpdate', {
              level: user.level,
              xp: user.xp,
              requiredXP: calculateRequiredXP(user.level),
            });
          } catch (error) {
            new Logger('WebSocket').error(
              `Error in XP interval: ${error.message}`,
            );
          }
        }, XP_SYSTEM.INTERVAL_MS);

        contributionInterval.set(socketId, interval);
      }, timeUntilNextAward);

      // Emit initial XP state
      io.to(socketId).emit('userUpdate', {
        level: user.level,
        xp: user.xp,
        requiredXP: calculateRequiredXP(user.level),
      });
    } catch (error) {
      clearContributionInterval(socketId);
      new Logger('WebSocket').error(
        'Error setting up contribution interval: ' + error.message,
      );
    }
  },
  clearContributionInterval: (socketId) => {
    clearInterval(contributionInterval.get(socketId));
    contributionInterval.delete(socketId);
  },
  setupCleanupInterval: async () => {
    // Ensure uploads directory exists
    fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(console.error);

    // Run cleanup
    setInterval(cleanupUnusedAvatars, CLEANUP_INTERVAL);

    // Run initial cleanup on setup
    cleanupUnusedAvatars().catch(console.error);
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
        .map((server) => server.iconUrl)
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
        await fs.unlink(path.join(uploadDir, file));
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

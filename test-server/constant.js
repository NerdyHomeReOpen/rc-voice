const XP_SYSTEM = {
  BASE_XP: 5, // Base XP required for level 2
  GROWTH_RATE: 1.02, // XP requirement increases by 2% per level
  XP_PER_HOUR: 1, // XP gained per hour in voice channel
  INTERVAL_MS: 60 * 60 * 1000, // 1 hour in milliseconds
};

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const PORT = 4500;
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };

module.exports = {
  XP_SYSTEM,
  CLEANUP_INTERVAL_MS,
  PORT,
  MIME_TYPES,
  CONTENT_TYPE_JSON,
};

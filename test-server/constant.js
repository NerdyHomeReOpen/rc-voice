const path = require('path');
const fs = require('fs').promises;

const XP_SYSTEM = {
  BASE_XP: 5, // Base XP required for level 2
  GROWTH_RATE: 1.02, // XP requirement increases by 2% per level
  XP_PER_HOUR: 1, // XP gained per hour in voice channel
  INTERVAL_MS: 60 * 60 * 1000, // 1 hour in milliseconds
};

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const PORT = 4500;
const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };

const UPLOADS_PATH = 'uploads';
const SERVER_AVATAR_PATH = 'uploads/serverAvatars';
const UPLOADS_DIR = path.join(__dirname, UPLOADS_PATH);
const SERVER_AVATAR_DIR = path.join(__dirname, SERVER_AVATAR_PATH);
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(console.error);
fs.mkdir(SERVER_AVATAR_DIR, { recursive: true }).catch(console.error);

module.exports = {
  XP_SYSTEM,
  PORT,
  MIME_TYPES,
  CONTENT_TYPE_JSON,
  UPLOADS_PATH,
  SERVER_AVATAR_PATH,
  UPLOADS_DIR,
  SERVER_AVATAR_DIR,
};

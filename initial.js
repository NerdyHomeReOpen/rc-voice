/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB({ filePath: './json.sqlite' });
const fs = require('fs/promises');
const path = require('path');

const accountPasswords = {};
const accountUserIds = {};
const users = {};
const badges = {};
const userBadges = {};
const userServers = {};
const servers = {};
const channels = {};
const friendGroups = {};
const channelRelations = {};
const members = {};
const memberApplications = {};
const friends = {};
const friendApplications = {};
const messages = {};
const directMessages = {};
const voicePresences = {};

const init = async () => {
  await db.deleteAll();
  await db.set('accountPasswords', accountPasswords);
  await db.set('accountUserIds', accountUserIds);
  await db.set('users', users);
  await db.set('badges', badges);
  await db.set('userBadges', userBadges);
  await db.set('userServers', userServers);
  await db.set('servers', servers);
  await db.set('channels', channels);
  await db.set('channelRelations', channelRelations);
  await db.set('friendGroups', friendGroups);
  await db.set('members', members);
  await db.set('memberApplications', memberApplications);
  await db.set('friends', friends);
  await db.set('friendApplications', friendApplications);
  await db.set('messages', messages);
  await db.set('directMessages', directMessages);
  await db.set('voicePresences', voicePresences);
  console.log('Database initialized');
};

const deleteExtraUploads = async () => {
  const serverAvatarDir = path.join(__dirname, 'uploads', 'serverAvatars');
  const userAvatarDir = path.join(__dirname, 'uploads', 'userAvatars');
  const defaultServerAvatar = 'uploads/serverAvatars/__default.png';
  const defaultUserAvatar = 'uploads/userAvatars/__default.png';

  try {
    const serverAvatarFiles = await fs.readdir(serverAvatarDir);
    for (const file of serverAvatarFiles) {
      const filePath = path.join(serverAvatarDir, file);
      const relativePath = path.relative(__dirname, filePath);
      if (relativePath !== defaultServerAvatar) {
        await fs.unlink(filePath);
        console.log(`Deleted: ${relativePath}`);
      }
    }
    console.log('Extra server avatars deleted.');
  } catch (error) {
    console.error('Error deleting extra server avatars:', error);
  }

  try {
    const userAvatarFiles = await fs.readdir(userAvatarDir);
    for (const file of userAvatarFiles) {
      const filePath = path.join(userAvatarDir, file);
      const relativePath = path.relative(__dirname, filePath);
      if (relativePath !== defaultUserAvatar) {
        await fs.unlink(filePath);
        console.log(`Deleted: ${relativePath}`);
      }
    }
    console.log('Extra user avatars deleted.');
  } catch (error) {
    console.error('Error deleting extra user avatars:', error);
  }

  const dbFilePath = path.join(__dirname, 'json.sqlite');
  try {
    await fs.unlink(dbFilePath);
    console.log('Previous database file (json.sqlite) removed.');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No previous database file (json.sqlite) found.');
    } else {
      console.error('Error removing previous database file:', error);
    }
  }
};

const deleteSqlite = async () => {
  const dbFilePath = path.join(__dirname, 'json.sqlite');
  try {
    await fs.unlink(dbFilePath);
    console.log('Previous database file (json.sqlite) removed.');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No previous database file (json.sqlite) found.');
    } else {
      console.error('Error removing previous database file:', error);
    }
  }
};

const main = async () => {
  await deleteExtraUploads();
  await deleteSqlite();
  await init();
};

main();
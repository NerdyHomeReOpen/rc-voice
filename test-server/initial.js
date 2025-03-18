/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();

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

init();

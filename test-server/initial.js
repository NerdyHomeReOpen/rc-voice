const { QuickDB } = require('quick.db');
const db = new QuickDB();

const accountPasswords = {};
const accountUserIds = {};
const users = {};
const friends = {};
const friendGroups = {};
const friendApplications = {};
const badges = {};
const userBadges = {};
const userServers = {};
const servers = {};
const serverApplications = {};
const members = {};
const channels = {};
const channelRelations = {};
const messages = {};
const directMessages = {};

const init = async () => {
  await db.deleteAll();
  await db.set('accountPasswords', accountPasswords);
  await db.set('accountUserIds', accountUserIds);
  await db.set('users', users);
  await db.set('friends', friends);
  await db.set('friendGroups', friendGroups);
  await db.set('friendApplications', friendApplications);
  await db.set('badges', badges);
  await db.set('userBadges', userBadges);
  await db.set('userServers', userServers);
  await db.set('servers', servers);
  await db.set('serverApplications', serverApplications);
  await db.set('members', members);
  await db.set('friends', friends);
  await db.set('channels', channels);
  await db.set('channelRelations', channelRelations);
  await db.set('messages', messages);
  await db.set('directMessages', directMessages);
  console.log('Database initialized');
};

init();

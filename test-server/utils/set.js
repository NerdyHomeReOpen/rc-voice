const { QuickDB } = require('quick.db');
const db = new QuickDB();

const func = require('./func');

const set = {
  user: async (id, data) => {
    const users = await db.get('users');
    users[id] = {
      name: '',
      avatar: null,
      avatarUrl: null,
      signature: '',
      status: 'offline',
      gender: 'Male',
      level: 1,
      xp: 0,
      requiredXp: func.calculateRequiredXP(1),
      progress: 0,
      currentChannelId: null,
      currentServerId: null,
      lastActiveAt: Date.now(),
      createdAt: 0,
      ...users[id],
      ...data,
      id,
    };
    await db.set(`users.${id}`, users[id]);
    return users[id];
  },
  server: async (id, data) => {
    const servers = await db.get('servers');
    servers[id] = {
      id,
      name: '',
      avatar: null,
      avatarUrl: null,
      announcement: '',
      description: '',
      displayId: await func.generateUniqueDisplayId(),
      slogan: '',
      level: 1,
      wealth: 0,
      ownerId: '',
      lobbyId: '',
      settings: {},
      createdAt: 0,
      ...servers[id],
      ...data,
      id,
    };
    await db.set(`servers.${id}`, servers[id]);
    return servers[id];
  },
  channel: async (id, data) => {
    const channels = await db.get('channels');
    channels[id] = {
      name: data.name,
      isRoot: true,
      isCategory: false,
      isLobby: false,
      order: 0,
      serverId: '',
      settings: {
        bitrate: 64000,
        slowMode: false,
        userLimit: 0,
        visibility: 'public',
      },
      createdAt: 0,
      ...channels[id],
      ...data,
      id,
    };
    await db.set(`channels.${id}`, channels[id]);
    return channels[id];
  },
  member: async (id, data) => {
    const members = await db.get('members');
    members[id] = {
      nickname: '',
      contribution: 0,
      permissionLevel: 0,
      serverId: '',
      userId: '',
      createdAt: 0,
      ...members[id],
      ...data,
      id,
    };
    await db.set(`members.${id}`, members[id]);
    return members[id];
  },
  message: async (id, data) => {
    const messages = await db.get('messages');
    messages[id] = {
      content: '',
      type: 'general',
      permissionLevel: 0,
      senderId: '',
      channelId: '',
      timestamp: 0,
      ...messages[id],
      ...data,
      id,
    };
    await db.set(`messages.${id}`, messages[id]);
    return messages;
  },
  directMessage: async (id, data) => {
    const directMessages = await db.get('directMessages');
    directMessages[id] = {
      content: '',
      type: 'general',
      permissionLevel: 0,
      senderId: '',
      friendId: '',
      timestamp: 0,
      ...directMessages[id],
      ...data,
      id,
    };
    await db.set(`directMessages.${id}`, directMessages[id]);
    return directMessages[id];
  },
};

module.exports = { ...set };

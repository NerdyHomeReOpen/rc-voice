/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();

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
      requiredXp: 0,
      progress: 0,
      currentChannelId: '',
      currentServerId: '',
      lastActiveAt: 0,
      createdAt: 0,
      ...users[id],
      ...data,
      lastActiveAt: Date.now(),
      id,
    };
    await db.set(`users.${id}`, users[id]);
    return users[id];
  },
  // `us_${userId}_${serverId}`
  userServer: async (id, data) => {
    const userServers = await db.get('userServers');
    userServers[id] = {
      userId: '',
      serverId: '',
      recent: false,
      owned: false,
      favorite: false,
      timestamp: 0,
      ...userServers[id],
      ...data,
      id,
    };
    await db.set(`userServers.${id}`, userServers[id]);
    return userServers[id];
  },
  // `ub_${userId}_${badgeId}`
  userBadge: async (id, data) => {
    const userBadges = await db.get('userBadges');
    userBadges[id] = {
      userId: '',
      badgeId: '',
      createdAt: 0,
      ...userBadges[id],
      ...data,
      id,
    };
    await db.set(`userBadges.${id}`, userBadges[id]);
    return userBadges[id];
  },
  server: async (id, data) => {
    const servers = await db.get('servers');
    servers[id] = {
      name: '',
      avatar: null,
      avatarUrl: null,
      announcement: '',
      description: '',
      displayId: '',
      slogan: '',
      level: 0,
      wealth: 0,
      ownerId: '',
      lobbyId: '',
      settings: {
        allowDirectMessage: false,
        visibility: 'public',
        defaultChannelId: '',
      },
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
      name: '',
      isRoot: true,
      isCategory: false,
      isLobby: false,
      voiceMode: 'free',
      chatMode: 'free',
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
  // `fd-${user1Id}_${user2Id}`
  friend: async (id, data) => {
    const friends = await db.get('friends');
    friends[id] = {
      user1Id: '',
      user2Id: '',
      createdAt: 0,
      ...friends[id],
      ...data,
      id,
    };
    await db.set(`friends.${id}`, friends[id]);
    return friends[id];
  },
  // `fa-${senderId}_${receiverId}`
  friendApplication: async (id, data) => {
    const applications = await db.get('friendApplications');
    applications[id] = {
      description: '',
      senderId: '',
      receiverId: '',
      createdAt: 0,
      ...applications[id],
      ...data,
      id,
    };
    await db.set(`friendApplications.${id}`, applications[id]);
    return applications[id];
  },
  // `mb-${userId}_${serverId}`
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
  // `ma-${userId}_${serverId}`
  memberApplications: async (id, data) => {
    const applications = await db.get('memberApplications');
    applications[id] = {
      userId: '',
      serverId: '',
      description: '',
      createdAt: 0,
      ...applications[id],
      ...data,
      id,
    };
    await db.set(`memberApplications.${id}`, applications[id]);
    return applications[id];
  },
  message: async (id, data) => {
    const messages = await db.get('messages');
    messages[id] = {
      content: '',
      type: 'general',
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

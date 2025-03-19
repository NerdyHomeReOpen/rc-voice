/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const set = {
  user: async (id, data) => {
    const users = await db.get('users');
    users[id] = {
      name: '',
      avatar: '',
      signature: '',
      status: 'online',
      gender: 'Male',
      level: 0,
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
      recent: false,
      owned: false,
      favorite: false,
      userId: '',
      serverId: '',
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
      avatar: '',
      announcement: '',
      description: '',
      slogan: '',
      type: 'other',
      visibility: 'public',
      allowDirectMessage: true,
      level: 0,
      wealth: 0,
      displayId: '',
      lobbyId: '',
      ownerId: '',
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
      type: 'channel',
      visibility: 'public',
      voiceMode: 'free',
      chatMode: 'free',
      isLobby: false,
      isRoot: false,
      slowmode: false,
      bitrate: 0,
      userLimit: 0,
      order: 0,
      serverId: '',
      categoryId: '',
      createdAt: 0,
      ...channels[id],
      ...data,
      id,
    };
    await db.set(`channels.${id}`, channels[id]);
    return channels[id];
  },
  // `fd_${user1Id}-${user2Id}`
  friend: async (id, data) => {
    const friends = await db.get('friends');
    friends[id] = {
      isBlocked: false,
      friendGroupId: '',
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
  // `fa_${senderId}-${receiverId}`
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
  // `mb_${userId}-${serverId}`
  member: async (id, data) => {
    const members = await db.get('members');
    members[id] = {
      isBlocked: false,
      nickname: null,
      contribution: 0,
      permissionLevel: 0,
      userId: '',
      serverId: '',
      createdAt: 0,
      ...members[id],
      ...data,
      id,
    };
    await db.set(`members.${id}`, members[id]);
    return members[id];
  },
  // `ma_${userId}-${serverId}`
  memberApplications: async (id, data) => {
    const applications = await db.get('memberApplications');
    applications[id] = {
      description: '',
      userId: '',
      serverId: '',
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

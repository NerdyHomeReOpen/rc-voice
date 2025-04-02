/* eslint-disable @typescript-eslint/no-require-imports */
const { QuickDB } = require('quick.db');
const db = new QuickDB();

// Constants
const { PORT, SERVER_URL, XP_SYSTEM } = require('../constant');

const set = {
  user: async (id, data) => {
    const users = await db.get('users');
    const ALLOWED_FIELDS = [
      'name',
      'avatar',
      'avatarUrl',
      'signature',
      'country',
      'level',
      'vip',
      'xp',
      'requiredXp',
      'progress',
      'birthYear',
      'birthMonth',
      'birthDay',
      'status',
      'gender',
      'currentChannelId',
      'currentServerId',
      'lastActiveAt',
      'createdAt',
    ];

    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    users[id] = {
      name: '',
      avatar: '',
      avatarUrl: `${SERVER_URL}:${PORT}/images/userAvatars/`,
      signature: '',
      country: 'taiwan',
      level: 0,
      vip: 0,
      xp: 0,
      requiredXp: XP_SYSTEM.BASE_REQUIRE_XP,
      progress: 0,
      birthYear: new Date().getFullYear() - 20,
      birthMonth: 1,
      birthDay: 1,
      status: 'online',
      gender: 'Male',
      currentChannelId: '',
      currentServerId: '',
      lastActiveAt: 0,
      createdAt: 0,
      ...users[id],
      ...filteredData,
      id,
    };
    await db.set(`users.${id}`, users[id]);
    return users[id];
  },

  // `us_${userId}_${serverId}`
  userServer: async (id, data) => {
    const userServers = await db.get('userServers');
    const ALLOWED_FIELDS = [
      'recent',
      'owned',
      'favorite',
      'userId',
      'serverId',
      'timestamp',
    ];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    userServers[id] = {
      recent: false,
      owned: false,
      favorite: false,
      userId: '',
      serverId: '',
      timestamp: 0,
      ...userServers[id],
      ...filteredData,
      id,
    };
    await db.set(`userServers.${id}`, userServers[id]);
    return userServers[id];
  },

  // `ub_${userId}_${badgeId}`
  userBadge: async (id, data) => {
    const userBadges = await db.get('userBadges');
    const ALLOWED_FIELDS = ['userId', 'badgeId', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    userBadges[id] = {
      userId: '',
      badgeId: '',
      createdAt: 0,
      ...userBadges[id],
      ...filteredData,
      id,
    };
    await db.set(`userBadges.${id}`, userBadges[id]);
    return userBadges[id];
  },

  server: async (id, data) => {
    const servers = await db.get('servers');
    const ALLOWED_FIELDS = [
      'name',
      'avatar',
      'avatarUrl',
      'announcement',
      'applyNotice',
      'description',
      'displayId',
      'slogan',
      'level',
      'wealth',
      'receiveApply',
      'allowDirectMessage',
      'type',
      'visibility',
      'lobbyId',
      'ownerId',
      'createdAt',
    ];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    servers[id] = {
      name: '',
      avatar: '',
      avatarUrl: `${SERVER_URL}:${PORT}/images/serverAvatars/`,
      announcement: '',
      applyNotice: '',
      description: '',
      displayId: '',
      slogan: '',
      level: 0,
      wealth: 0,
      receiveApply: true,
      allowDirectMessage: true,
      type: 'other',
      visibility: 'public',
      lobbyId: '',
      ownerId: '',
      createdAt: 0,
      ...servers[id],
      ...filteredData,
      id,
    };
    await db.set(`servers.${id}`, servers[id]);
    return servers[id];
  },

  channel: async (id, data) => {
    const channels = await db.get('channels');
    const ALLOWED_FIELDS = [
      'name',
      'order',
      'bitrate',
      'userLimit',
      'guestTextGapTime',
      'guestTextWaitTime',
      'guestTextMaxLength',
      'isRoot',
      'isLobby',
      'slowmode',
      'forbidText',
      'forbidGuestText',
      'forbidGuestUrl',
      'type',
      'visibility',
      'voiceMode',
      'categoryId',
      'serverId',
      'createdAt',
    ];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    channels[id] = {
      name: '',
      order: 0,
      bitrate: 64000,
      userLimit: 0,
      guestTextGapTime: 0,
      guestTextWaitTime: 0,
      guestTextMaxLength: 2000,
      isLobby: false,
      isRoot: false,
      slowmode: false,
      forbidText: false,
      forbidGuestText: false,
      forbidGuestUrl: false,
      type: 'channel',
      visibility: 'public',
      voiceMode: 'free',
      categoryId: '',
      serverId: '',
      createdAt: 0,
      ...channels[id],
      ...filteredData,
      id,
    };
    await db.set(`channels.${id}`, channels[id]);
    return channels[id];
  },

  // `fd_${userId}-${targetId}`
  friend: async (id, data) => {
    const friends = await db.get('friends');
    const ALLOWED_FIELDS = [
      'isBlocked',
      'friendGroupId',
      'userId',
      'targetId',
      'createdAt',
    ];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    friends[id] = {
      isBlocked: false,
      friendGroupId: '',
      userId: '',
      targetId: '',
      createdAt: 0,
      ...friends[id],
      ...filteredData,
      id,
    };
    await db.set(`friends.${id}`, friends[id]);
    return friends[id];
  },

  // `fa_${senderId}-${receiverId}`
  friendApplication: async (id, data) => {
    const applications = await db.get('friendApplications');
    const ALLOWED_FIELDS = [
      'description',
      'applicationStatus',
      'senderId',
      'receiverId',
      'createdAt',
    ];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    applications[id] = {
      description: '',
      applicationStatus: 'pending',
      senderId: '',
      receiverId: '',
      createdAt: 0,
      ...applications[id],
      ...filteredData,
      id,
    };
    await db.set(`friendApplications.${id}`, applications[id]);
    return applications[id];
  },

  friendGroup: async (id, data) => {
    const friendGroups = await db.get('friendGroups');
    const ALLOWED_FIELDS = ['name', 'order', 'userId', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    friendGroups[id] = {
      id: '',
      name: '',
      order: 0,
      userId: '',
      createdAt: 0,
      ...friendGroups[id],
      ...filteredData,
      id,
    };
    await db.set(`friendGroups.${id}`, friendGroups[id]);
    return friendGroups[id];
  },

  // `mb_${userId}-${serverId}`
  member: async (id, data) => {
    const members = await db.get('members');
    const ALLOWED_FIELDS = [
      'nickname',
      'contribution',
      'lastMessageTime',
      'isBlocked',
      'permissionLevel',
      'userId',
      'serverId',
      'createdAt',
    ];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    members[id] = {
      nickname: null,
      contribution: 0,
      lastMessageTime: 0,
      isBlocked: false,
      permissionLevel: 1,
      userId: '',
      serverId: '',
      createdAt: 0,
      ...members[id],
      ...filteredData,
      id,
    };
    await db.set(`members.${id}`, members[id]);
    return members[id];
  },

  // `ma_${userId}-${serverId}`
  memberApplications: async (id, data) => {
    const applications = await db.get('memberApplications');
    const ALLOWED_FIELDS = [
      'description',
      'applicationStatus',
      'userId',
      'serverId',
      'createdAt',
    ];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    applications[id] = {
      description: '',
      applicationStatus: 'pending',
      userId: '',
      serverId: '',
      createdAt: 0,
      ...applications[id],
      ...filteredData,
      id,
    };
    await db.set(`memberApplications.${id}`, applications[id]);
    return applications[id];
  },

  message: async (id, data) => {
    const messages = await db.get('messages');
    const ALLOWED_FIELDS = [
      'content',
      'type',
      'senderId',
      'receiverId',
      'channelId',
      'timestamp',
    ];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    messages[id] = {
      type: 'general',
      content: '',
      senderId: '',
      receiverId: '',
      channelId: '',
      timestamp: 0,
      ...messages[id],
      ...filteredData,
      id,
    };
    await db.set(`messages.${id}`, messages[id]);
    return messages;
  },

  directMessage: async (id, data) => {
    const directMessages = await db.get('directMessages');
    const ALLOWED_FIELDS = ['content', 'userId', 'targetId', 'timestamp'];
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    directMessages[id] = {
      type: 'dm',
      content: '',
      userId: '',
      targetId: '',
      timestamp: 0,
      ...directMessages[id],
      ...filteredData,
      id,
    };
    await db.set(`directMessages.${id}`, directMessages[id]);
    return directMessages[id];
  },
};

module.exports = { ...set };

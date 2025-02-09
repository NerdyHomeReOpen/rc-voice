const { QuickDB } = require('quick.db');
const db = new QuickDB();

const account_password = {
  Whydog: 'c2hhd255aW4xMDE0MjA3',
  yeci226: 'c2hhd255aW4xMDE0MjA3',
  miso: 'c2hhd255aW4xMDE0MjA3',
};
const servers = {
  '4d7d-9426-689e-a73af1d2': {
    id: '4d7d-9426-689e-a73af1d2',
    name: '543 Random Chat',
    level: 0,
    announcement: 'Example Announcement',
    icon: null,
    lobbyId: '4d7d-9426-a73af1d2689e',
    displayId: 543,
    ownerId: '612a7797-f970-4f23-9983-f08d863d9552',
    channelIds: ['4d7d-9426-a73af1d2689e', '4d7d-9426-689e-a73af1d3'],
    createdAt: 1738758855886,
    settings: {
      visibility: 'public',
      allowDirectMessage: true,
      defaultChannelId: '1234567890',
    },
  },
};
const members = {
  member_1: {
    id: 'sm_1',
    serverId: '4d7d-9426-689e-a73af1d2',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    nickname: 'Whydog',
    color: '#FF5733',
    permissionLevel: 6,
    managedChannels: ['1234567890', '1234567891'],
    contribution: 20,
    joinedAt: 1738234723000,
  },
  member_2: {
    id: 'sm_2',
    serverId: '4d7d-9426-689e-a73af1d2',
    userId: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    nickname: 'yeci',
    color: '#33FF57',
    permissionLevel: 5,
    managedChannels: [],
    contribution: 2,
    joinedAt: 1738234723000,
  },
  member_3: {
    id: 'sm_3',
    serverId: '4d7d-9426-689e-a73af1d2',
    userId: 'a66af1d2-689e-4d7d-9426-3421cce3ada5',
    nickname: 'miso',
    color: '#33FF57',
    permissionLevel: 5,
    managedChannels: [],
    contribution: 2,
    joinedAt: 1738234723000,
  },
};
const users = {
  '612a7797-f970-4f23-9983-f08d863d9552': {
    id: '612a7797-f970-4f23-9983-f08d863d9552',
    name: 'Whydog',
    account: 'Whydog',
    gender: 'Male',
    level: 100,
    state: 'online',
    signature: 'Im cool.',
    settings: {
      theme: 'dark',
      notifications: true,
    },
    recommendedServers: {},
    joinedServers: {},
    createdAt: 1738234723000,
  },
  'a73af1d2-689e-4d7d-9426-3421cce3ade4': {
    id: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    name: 'yeci',
    account: 'yeci226',
    gender: 'Male',
    level: 100,
    state: 'online',
    signature: 'Im gay.',
    settings: {
      theme: 'dark',
      notifications: true,
    },
    recommendedServers: {},
    joinedServers: {},
    createdAt: 1738234723000,
  },
  'a66af1d2-689e-4d7d-9426-3421cce3ada5': {
    id: 'a66af1d2-689e-4d7d-9426-3421cce3ada5',
    name: 'miso',
    account: 'miso',
    gender: 'Female',
    level: 100,
    state: 'online',
    signature: 'Im gay.',
    settings: {
      theme: 'dark',
      notifications: true,
    },
    recommendedServers: {},
    joinedServers: {},
    createdAt: 1738234723000,
  },
};
const channels = {
  '4d7d-9426-a73af1d2689e': {
    id: '4d7d-9426-a73af1d2689e',
    name: 'example home',
    type: 'text',
    isCategory: false,
    isLobby: true,
    serverId: '4d7d-9426-689e-a73af1d2',
    userIds: [],
    messageIds: [],
    parentId: null,
    createdAt: 1738758855886,
    settings: {
      visibility: 'public',
      slowMode: false,
      topic: 'Welcome to the lobby',
      userLimit: 0,
      bitrate: 64000,
    },
  },
  '4d7d-9426-689e-a73af1d3': {
    id: '4d7d-9426-689e-a73af1d3',
    name: 'Voice Channel',
    type: 'voice',
    isCategory: true,
    isLobby: false,
    serverId: '4d7d-9426-689e-a73af1d2',
    userIds: [],
    messageIds: [],
    parentId: null,
    createdAt: 1738758855886,
    settings: {
      visibility: 'public',
      slowMode: false,
      topic: 'Welcome to the lobby',
      userLimit: 0,
      bitrate: 64000,
    },
  },
};
const messages = {
  msg_1: {
    id: 'msg_1',
    type: 'info',
    content: 'This channel is now open for free discussion',
    channelId: '1234567890',
    senderId: 'system',
    pinned: false,
    createdAt: 1738234723000,
  },
};
const presenceStates = {
  'presence_612a7797-f970-4f23-9983-f08d863d9552': {
    id: 'presence_612a7797-f970-4f23-9983-f08d863d9552',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    currentServerId: '123456789',
    currentChannelId: '1234567890',
    status: 'online',
    customStatus: 'Playing games',
    lastActiveAt: 1738234723000,
    updatedAt: 1738234723000,
  },
  'presence_a73af1d2-689e-4d7d-9426-3421cce3ade4': {
    id: 'presence_a73af1d2-689e-4d7d-9426-3421cce3ade4',
    userId: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    currentServerId: '4d7d-9426-689e-a73af1d2',
    currentChannelId: '4d7d-9426-a73af1d2689e',
    status: 'online',
    customStatus: 'Playing games',
    lastActiveAt: 1738234723000,
    updatedAt: 1738234723000,
  },
  'presence_a66af1d2-689e-4d7d-9426-3421cce3ada5': {
    id: 'presence_a66af1d2-689e-4d7d-9426-3421cce3ada5',
    userId: 'a66af1d2-689e-4d7d-9426-3421cce3ada5',
    currentServerId: '4d7d-9426-689e-a73af1d2',
    currentChannelId: '4d7d-9426-a73af1d2689e',
    status: 'online',
    customStatus: 'Playing games',
    lastActiveAt: 1738234723000,
    updatedAt: 1738234723000,
  },
};
const badgeList = {
  nerdy: {
    id: 'nerdy',
    name: '超級書呆子',
    description: '官方認證的超級書呆子',
    order: 99999, // 越高越前面
    ownedBy: [
      '612a7797-f970-4f23-9983-f08d863d9552',
      'a73af1d2-689e-4d7d-9426-3421cce3ade4',
      'a66af1d2-689e-4d7d-9426-3421cce3ada5',
    ],
  },
  mygo: {
    id: 'mygo',
    name: '又在夠',
    description: '歐內該 如果沒有買夠的話 瓦塔西',
    order: 0,
    ownedBy: [
      '612a7797-f970-4f23-9983-f08d863d9552',
      'a73af1d2-689e-4d7d-9426-3421cce3ade4',
      'a66af1d2-689e-4d7d-9426-3421cce3ada5',
    ],
  },
};
const voiceStates = {
  vs_whydog: {
    id: 'vs_1',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    channelId: '1234567891',
    isMuted: false,
    isDeafened: false,
    isSpeaking: false,
    joinedAt: 1738234723000,
  },
};
const posts = {
  'post_612a7797-f970-4f23-9983-f08d863d9552': {
    id: 'post_612a7797-f970-4f23-9983-f08d863d9552',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    content: 'Hello everyone!',
    visibility: 'friends',
    createdAt: 1738234723000,
  },
};
const friendCategories = {
  'cat_612a7797-f970-4f23-9983-f08d863d9552': {
    id: 'cat_612a7797-f970-4f23-9983-f08d863d9552',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    name: 'My Friends',
    friendIds: [
      'a73af1d2-689e-4d7d-9426-3421cce3ade4',
      'a66af1d2-689e-4d7d-9426-3421cce3ada5',
    ],
    order: 0,
    createdAt: 1738234723000,
  },
};
const directMessages = {
  dm_1: {
    id: 'dm_1',
    senderId: '612a7797-f970-4f23-9983-f08d863d9552',
    receiverId: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    content: 'Hi there!',
    type: 'text',
    status: 'sent',
    createdAt: 1738234723000,
  },
};
const blocks = {
  block_1: {
    id: 'block_1',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    blockedId: 'vvvf-vs',
    reason: 'spam',
    createdAt: 1738234723000,
  },
};

const init = async () => {
  await db.deleteAll();
  await db.set('account_password', account_password);
  await db.set('servers', servers);
  await db.set('members', members);
  await db.set('users', users);
  await db.set('channels', channels);
  await db.set('messages', messages);
  await db.set('presenceStates', presenceStates);
  await db.set('badgeList', badgeList);
  await db.set('voiceStates', voiceStates);
  await db.set('posts', posts);
  await db.set('friendCategories', friendCategories);
  await db.set('directMessages', directMessages);
  await db.set('blocks', blocks);
  console.log('Database initialized');
};

init();

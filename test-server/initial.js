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
    iconUrl: null,
    level: 0,
    announcement: 'Example Announcement',
    channelIds: ['4d7d-9426-a73af1d2689e', '4d7d-9426-689e-a73af1d3'],
    displayId: 543,
    lobbyId: '4d7d-9426-a73af1d2689e',
    ownerId: '612a7797-f970-4f23-9983-f08d863d9552',
    settings: {
      allowDirectMessage: true,
      visibility: 'public',
      defaultChannelId: '4d7d-9426-a73af1d2689e',
    },
    createdAt: 1738758855886,
  },
};
const members = {
  member_1: {
    id: 'sm_1',
    nickname: 'Whydog_nickname',
    serverId: '4d7d-9426-689e-a73af1d2',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    contribution: 20,
    managedChannels: ['1234567890', '1234567891'],
    permissionLevel: 6,
    joinedAt: 1738234723000,
  },
  member_2: {
    id: 'sm_2',
    nickname: 'yeci_nickname',
    serverId: '4d7d-9426-689e-a73af1d2',
    userId: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    contribution: 2,
    managedChannels: [],
    permissionLevel: 5,
    joinedAt: 1738234723000,
  },
  member_3: {
    id: 'sm_3',
    nickname: 'miso_nickname',
    serverId: '4d7d-9426-689e-a73af1d2',
    userId: 'a66af1d2-689e-4d7d-9426-3421cce3ada5',
    contribution: 2,
    managedChannels: [],
    permissionLevel: 5,
    joinedAt: 1738234723000,
  },
};
const users = {
  '612a7797-f970-4f23-9983-f08d863d9552': {
    id: '612a7797-f970-4f23-9983-f08d863d9552',
    name: 'Whydog',
    account: 'Whydog',
    avatar: null,
    gender: 'Male',
    level: 100,
    signature: 'Im cool.',
    badgeIds: ['nerdy', 'mygo'],
    ownedServerIds: ['4d7d-9426-689e-a73af1d2'],
    settings: {
      theme: 'dark',
      notifications: true,
    },
    createdAt: 1738234723000,
  },
  'a73af1d2-689e-4d7d-9426-3421cce3ade4': {
    id: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    name: 'yeci',
    account: 'yeci226',
    avatar: null,
    gender: 'Male',
    level: 100,
    signature: 'Im yeci.',
    badgeIds: ['nerdy'],
    ownedServerIds: [],
    settings: {
      theme: 'dark',
      notifications: true,
    },
    createdAt: 1738234723000,
  },
  'a66af1d2-689e-4d7d-9426-3421cce3ada5': {
    id: 'a66af1d2-689e-4d7d-9426-3421cce3ada5',
    name: 'miso',
    account: 'miso',
    avatar: null,
    gender: 'Female',
    level: 100,
    signature: 'Im yeci.',
    badgeIds: ['mygo'],
    ownedServerIds: [],
    settings: {
      theme: 'dark',
      notifications: true,
    },
    createdAt: 1738234723000,
  },
};
const channels = {
  '4d7d-9426-a73af1d2689e': {
    id: '4d7d-9426-a73af1d2689e',
    name: '測試大廳',
    messageIds: [],
    serverId: '4d7d-9426-689e-a73af1d2',
    parentId: null,
    userIds: [],
    isCategory: false,
    isLobby: true,
    settings: {
      bitrate: 64000,
      slowMode: false,
      userLimit: 0,
      visibility: 'public',
    },
    createdAt: 1738758855886,
  },
  '4d7d-9426-689e-a73af1d3': {
    id: '4d7d-9426-689e-a73af1d3',
    name: '測試語音2',
    messageIds: [],
    serverId: '4d7d-9426-689e-a73af1d2',
    parentId: null,
    userIds: [],
    isCategory: false,
    isLobby: false,
    settings: {
      bitrate: 64000,
      slowMode: false,
      userLimit: 0,
      visibility: 'public',
    },
    createdAt: 1738758855886,
  },
};
const messages = {};
const presenceStates = {
  'presence_612a7797-f970-4f23-9983-f08d863d9552': {
    id: 'presence_612a7797-f970-4f23-9983-f08d863d9552',
    status: 'online',
    currentServerId: '123456789',
    currentChannelId: '1234567890',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    customStatus: 'Playing games',
    lastActiveAt: 1738234723000,
    updatedAt: 1738234723000,
  },
  'presence_a73af1d2-689e-4d7d-9426-3421cce3ade4': {
    id: 'presence_a73af1d2-689e-4d7d-9426-3421cce3ade4',
    status: 'online',
    currentServerId: '4d7d-9426-689e-a73af1d2',
    currentChannelId: '4d7d-9426-a73af1d2689e',
    userId: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    customStatus: 'Playing games',
    lastActiveAt: 1738234723000,
    updatedAt: 1738234723000,
  },
  'presence_a66af1d2-689e-4d7d-9426-3421cce3ada5': {
    id: 'presence_a66af1d2-689e-4d7d-9426-3421cce3ada5',
    status: 'online',
    currentServerId: '4d7d-9426-689e-a73af1d2',
    currentChannelId: '4d7d-9426-a73af1d2689e',
    userId: 'a66af1d2-689e-4d7d-9426-3421cce3ada5',
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
  },
  mygo: {
    id: 'mygo',
    name: '又在夠',
    description: '歐內該 如果沒有買夠的話 瓦塔西',
    order: 0,
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
    friendIds: ['a73af1d2-689e-4d7d-9426-3421cce3ade4'],
    order: 0,
    createdAt: 1738234723000,
  },
  'cat_a73af1d2-689e-4d7d-9426-3421cce3ade4': {
    id: 'cat_a73af1d2-689e-4d7d-9426-3421cce3ade4',
    userId: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    name: 'My Friends',
    friendIds: ['612a7797-f970-4f23-9983-f08d863d9552'],
    order: 0,
    createdAt: 1738234723000,
  },
};
const friends = {
  fd_1: {
    id: 'fd_1',
    userIds: [
      '612a7797-f970-4f23-9983-f08d863d9552',
      'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    ],
    messageIds: [],
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
  await db.set('friends', friends);
  await db.set('blocks', blocks);
  console.log('Database initialized');
};

init();

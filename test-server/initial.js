const { QuickDB } = require('quick.db');
const db = new QuickDB();

const serverList = {
  123456789: {
    id: '123456789',
    name: '543隨你聊',
    announcement: 'Example Announcement',
    icon: 'https://preview.redd.it/the-context-behind-the-2015-jsal-pfp-also-the-images-are-in-v0-huyzsah41x8c1.jpg?width=640&crop=smart&auto=webp&s=bffb81c9d6a4a40896acd6e1b72bb82c0a73b03c',
    lobbyId: '1234567890',
    level: 0,
    createdAt: 1738758855886,
    displayId: 543,
    ownerId: '612a7797-f970-4f23-9983-f08d863d9552',
    settings: {
      allowDirectMessage: true,
      defaultChannelId: '1234567890',
    },
  },
};

const serverMembers = {
  sm_1: {
    id: 'sm_1',
    serverId: '123456789',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    nickname: 'Whydog',
    color: '#FF5733',
    permission: 6,
    managedChannels: ['1234567890', '1234567891'],
    contribution: 20,
    joinedAt: 1738234723000,
  },
  sm_2: {
    id: 'sm_2',
    serverId: '123456789',
    userId: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    nickname: 'yeci',
    color: '#33FF57',
    permission: 5,
    managedChannels: [],
    contribution: 2,
    joinedAt: 1738234723000,
  },
};

const userList = {
  '612a7797-f970-4f23-9983-f08d863d9552': {
    id: '612a7797-f970-4f23-9983-f08d863d9552',
    name: 'Whydog',
    account: 'Whydog',
    password: 'c2hhd255aW4xMDE0MjA3',
    gender: 'Male',
    level: 100,
    state: 'online',
    signature: 'Im cool.',
    recommendedServers: {},
    joinedServers: {},
    createdAt: 1738234723000,
    settings: {
      theme: 'dark',
      notifications: true,
    },
  },
  'a73af1d2-689e-4d7d-9426-3421cce3ade4': {
    id: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    name: 'yeci',
    account: 'yeci226',
    password: 'c2hhd255aW4xMDE0MjA3',
    gender: 'Male',
    level: 100,
    state: 'online',
    signature: 'Im gay.',
    recommendedServers: {},
    joinedServers: {},
  },
  'a66af1d2-689e-4d7d-9426-3421cce3ada5': {
    id: 'a66af1d2-689e-4d7d-9426-3421cce3ada5',
    name: 'miso',
    account: 'miso',
    password: 'c2hhd255aW4xMDE0MjA3',
    gender: 'Female',
    level: 10000,
    currentChannelId: '',
    state: 'online',
    createdAt: 1738234723000,
    friendIds: [],
    friendGroups: [],
    signature: 'Im misu.',
    recommendedServers: {},
    joinedServers: {},
    createdAt: 1738234723000,
    settings: {
      theme: 'light',
      notifications: true,
    },
  },
  '847a0655-3b57-41c4-a755-f685760ae098': {
    account: 'cablate',
    createdAt: 1738998806932,
    gender: 'Male',
    id: '847a0655-3b57-41c4-a755-f685760ae098',
    level: 0,
    name: 'cablate',
    password: 'd3d3NTQxMDI=',
    settings: {
      notifications: true,
      theme: 'light',
    },
    signature: '',
    state: 'online',
    createdAt: 1738234723000,
    friendIds: [],
    friendGroups: [],
    signature: 'Im vvvf.',
    recommendedServers: {},
    joinedServers: {},
  },
};

const channelList = {
  1234567890: {
    id: '1234567890',
    serverId: '123456789',
    name: 'example home',
    type: 'text',
    permission: 'public',
    allowedUsers: [],
    isLobby: true,
    parentId: null,
    settings: {
      slowMode: false,
      topic: '歡迎來到大廳',
    },
  },
  1234567891: {
    id: '1234567891',
    serverId: '123456789',
    name: '語音頻道',
    type: 'voice',
    permission: 'public',
    allowedUsers: [],
    isLobby: false,
    parentId: null,
    settings: {
      userLimit: 0,
      bitrate: 64000,
    },
  },
};

const messageList = {
  msg_1: {
    id: 'msg_1',
    channelId: '1234567890',
    senderId: 'system',
    type: 'info',
    content: '此頻道已被設為自由發言',
    pinned: false,
    createdAt: 1738234723000,
  },
};

const userPresence = {
  presence_1: {
    id: 'presence_1',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    currentServerId: '123456789',
    currentChannelId: '1234567890',
    status: 'online',
    customStatus: 'Playing games',
    lastActiveAt: 1738234723000,
    updatedAt: 1738234723000,
  },
};

const voiceStates = {
  vs_1: {
    id: 'vs_1',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    channelId: '1234567891',
    isMuted: false,
    isDeafened: false,
    isSpeaking: false,
    joinedAt: 1738234723000,
  },
};

const userPosts = {
  post_1: {
    id: 'post_1',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    content: 'Hello everyone!',
    visibility: 'friends',
    createdAt: 1738234723000,
  },
};

const friendships = {
  cat_default_612a7797: {
    id: 'cat_default_612a7797',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    name: '我的好友',
    friendIds: [
      'a73af1d2-689e-4d7d-9426-3421cce3ade4',
      'a66af1d2-689e-4d7d-9426-3421cce3ada5',
    ],
    order: 0,
    createdAt: 1738234723000,
  },
  cat_default_a73af1d2: {
    id: 'cat_default_a73af1d2',
    userId: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    name: '我的好友',
    friendIds: ['612a7797-f970-4f23-9983-f08d863d9552'],
    order: 0,
    createdAt: 1738234723000,
  },
  cat_default_847a0655: {
    createdAt: 1738234723000,
    friendIds: ['612a7797-f970-4f23-9983-f08d863d9552'],
    id: 'cat_default_a73af1d2',
    name: '我的好友',
    order: 0,
    userId: '847a0655-3b57-41c4-a755-f685760ae098',
  },
};

const directMessages = {
  dm_1: {
    id: 'dm_1',
    senderId: '612a7797-f970-4f23-9983-f08d863d9552',
    receiverId: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    content: 'Hi there!',
    type: 'text',
    status: 'sent', // sent/delivered/read
    createdAt: 1738234723000,
  },
};

const userBlocks = {
  block_1: {
    id: 'block_1',
    userId: '612a7797-f970-4f23-9983-f08d863d9552',
    blockedId: 'vvvf-vs',
    reason: 'spam',
    createdAt: 1738234723000,
  },
};

async function main() {
  await db.set('serverList', serverList);
  await db.set('serverMembers', serverMembers);
  await db.set('userList', userList);
  await db.set('channelList', channelList);
  await db.set('messageList', messageList);
  await db.set('userPresence', userPresence);
  await db.set('voiceStates', voiceStates);
  await db.set('userPosts', userPosts);
  await db.set('friendships', friendships);
  await db.set('directMessages', directMessages);
  await db.set('userBlocks', userBlocks);
  console.log('Database initialized');
}

main();

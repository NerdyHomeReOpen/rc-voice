const { QuickDB } = require('quick.db');
const db = new QuickDB();

const serverList = {
  123456789: {
    id: '123456789',
    name: '543隨你聊',
    announcement: 'Example Aassnnouncement',
    icon: 'https://preview.redd.it/the-context-behind-the-2015-jsal-pfp-also-the-images-are-in-v0-huyzsah41x8c1.jpg?width=640&crop=smart&auto=webp&s=bffb81c9d6a4a40896acd6e1b72bb82c0a73b03c',
    userIds: [
      '612a7797-f970-4f23-9983-f08d863d9552',
      'a73af1d2-689e-4d7d-9426-3421cce3ade4',
      'a66af1d2-689e-4d7d-9426-3421cce3ada5',
    ],
    channelIds: [
      '1234567890',
      '1234567891',
      '1234567892',
      '12345678911',
      '12345678912',
      '123456789111',
    ],
    lobbyId: '1234567890', // Lobby channel
    permissions: {
      '612a7797-f970-4f23-9983-f08d863d9552': 7,
      'a73af1d2-689e-4d7d-9426-3421cce3ade4': 8,
      'a66af1d2-689e-4d7d-9426-3421cce3ada5': 6,
    },
    contributions: {
      'vvvf-vs': 5,
      '612a7797-f970-4f23-9983-f08d863d9552': 20,
      'a73af1d2-689e-4d7d-9426-3421cce3ade4': 2,
      'a66af1d2-689e-4d7d-9426-3421cce3ada5': 5,
    },
    joinDate: {
      '612a7797-f970-4f23-9983-f08d863d9552': 1738234723000,
      'a73af1d2-689e-4d7d-9426-3421cce3ade4': 1738234723000,
      'a66af1d2-689e-4d7d-9426-3421cce3ada5': 1738234723000,
    },
    applications: {
      'vvvf-vs': 'I want to join this server',
    },
    nicknames: {},
    level: 0,
    createdAt: 1738758855886,
  },
};

const userList = {
  '612a7797-f970-4f23-9983-f08d863d9552': {
    id: '612a7797-f970-4f23-9983-f08d863d9552',
    name: 'Whydog',
    account: 'Whydog',
    password: 'c2hhd255aW4xMDE0MjA3', // shawnyin1014207
    gender: 'Male',
    level: 100,
    currentChannelId: '',
    state: 'online',
    createdAt: 1738234723000,
    friendIds: [
      'a73af1d2-689e-4d7d-9426-3421cce3ade4',
      'a66af1d2-689e-4d7d-9426-3421cce3ada5',
      'vvvf-vs',
    ],
    friendGroups: [
      {
        id: 'uuid_1',
        name: 'Best Friends',
        friendIds: [
          'a73af1d2-689e-4d7d-9426-3421cce3ade4',
          'a66af1d2-689e-4d7d-9426-3421cce3ada5',
          'vvvf-vs',
        ],
      },
      {
        id: 'uuid_2',
        name: 'nigga',
        friendIds: [
          'a73af1d2-689e-4d7d-9426-3421cce3ade4',
          'a66af1d2-689e-4d7d-9426-3421cce3ada5',
          'vvvf-vs',
        ],
      },
    ],
    signature: 'Im cool.',
  },
  'a73af1d2-689e-4d7d-9426-3421cce3ade4': {
    id: 'a73af1d2-689e-4d7d-9426-3421cce3ade4',
    name: 'yeci',
    account: 'yeci226',
    password: 'c2hhd255aW4xMDE0MjA3',
    gender: 'Male',
    level: 100,
    currentChannelId: '',
    state: 'online',
    createdAt: 1738234723000,
    friendIds: [],
    friendGroups: [],
    signature: 'Im gay.',
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
  },
  'vvvf-vs': {
    id: 'vvvf-vs',
    name: 'asdmi',
    account: 'asdmi',
    password: 'c2hhd255aW4xMDE0MjA3',
    gender: 'Female',
    level: 10,
    currentChannelId: '',
    state: 'online',
    createdAt: 1738234723000,
    friendIds: [],
    friendGroups: [],
    signature: 'Im vvvf.',
  },
};

const messageList = {
  info: {
    id: 'info',
    senderId: '',
    content: '此頻道已被設為自由發言',
    timestamp: 1738234723000,
    type: 'info',
  },
};

const channelList = {
  1234567890: {
    id: '1234567890',
    name: 'example home',
    permission: 'public',
    isLobby: true,
    isCategory: false,
    userIds: [],
    messageIds: ['info'],
    parentId: null,
  },
  1234567891: {
    id: '1234567891',
    name: 'example category',
    permission: 'public',
    isLobby: false,
    isCategory: true,
    userIds: [],
    messageIds: [],
    parentId: null,
  },
  1234567892: {
    id: '1234567892',
    name: 'example channel',
    permission: 'public',
    isLobby: false,
    isCategory: false,
    userIds: [],
    messageIds: [],
    parentId: null,
  },
  12345678911: {
    id: '12345678911',
    name: 'example sub-channel',
    permission: 'private',
    isLobby: false,
    isCategory: false,
    userIds: [],
    messageIds: [],
    parentId: '1234567891',
  },
  12345678912: {
    id: '12345678912',
    name: 'example sub-category',
    permission: 'private',
    isLobby: false,
    isCategory: true,
    userIds: [],
    messageIds: [],
    parentId: '1234567891',
  },
  123456789111: {
    id: '123456789111',
    name: 'example sub-sub-channel',
    permission: 'private',
    isLobby: false,
    isCategory: false,
    userIds: [],
    messageIds: [],
    parentId: '12345678912',
  },
};

async function main() {
  await db.set('serverList', serverList);
  await db.set('usersList', userList);
  await db.set('messageList', messageList);
  await db.set('channelList', channelList);
  console.log('Database initialized');
}

main();

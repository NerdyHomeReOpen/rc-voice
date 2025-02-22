const serverData = [
  {
    id: '27315392',
    title: '永恆-Night Star☆彡',
    image: '/api/placeholder/48/48',
    description: '創建中',
  },
  {
    id: '27100337',
    title: '黑夜kmiko私人工作室',
    image: '/api/placeholder/48/48',
  },
  {
    id: '1725',
    title: '●●●● ※Purely 米糊糊 ...',
    image: '/api/placeholder/48/48',
    description: '勿忘初衷、黑純將你的那個自己...',
  },
  {
    id: '27100881',
    title: 'Disillusionment小居服幻博誌',
    image: '/api/placeholder/48/48',
  },
  {
    id: '26531753',
    title: '【C8 Online 】InFinTe',
    image: '/api/placeholder/48/48',
    description: '申請會員請告知你的ID謝...',
  },
  {
    id: '27349728',
    title: '一一* InFinitely☆彡',
    image: '/api/placeholder/48/48',
  },
];

const serverList = serverData.reduce((acc, server) => {
  acc[server.id] = {
    id: server.id,
    name: server.title,
    icon: server.image,
    announcement: server.description || '',
    level: 0, // Default value
    userIds: [],
    channelIds: [],
    createdAt: Date.now(),
    applications: {},
    permissions: {},
    nicknames: {},
    contributions: {},
    joinDate: {},
  };
  return acc;
}, {});

console.log(serverList);

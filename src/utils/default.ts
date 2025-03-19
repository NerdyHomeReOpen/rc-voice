import {
  User,
  Channel,
  Server,
  FriendApplication,
  MemberApplication,
  ServerMember,
  Permission,
  UserMember,
  Member,
  Friend,
  UserFriend,
} from '@/types';

export const createDefault = {
  user: (overrides: Partial<User> = {}): User => ({
    id: '',
    name: '未知使用者',
    avatar: '',
    avatarUrl: '',
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
    ...overrides,
  }),

  channel: (overrides: Partial<Channel> = {}): Channel => ({
    id: '',
    name: '未知頻道',
    isLobby: false,
    // isCategory: false,
    isRoot: false,
    serverId: '',
    voiceMode: 'free',
    chatMode: 'free',
    order: 0,
    settings: {
      bitrate: 0,
      visibility: 'public',
      slowmode: false,
      userLimit: 0,
    },
    createdAt: 0,
    ...overrides,
  }),

  server: (overrides: Partial<Server> = {}): Server => ({
    id: '',
    name: '未知伺服器',
    avatar: '',
    avatarUrl: '',
    level: 0,
    description: '',
    wealth: 0,
    slogan: '',
    announcement: '',
    type: '',
    displayId: '',
    lobbyId: '',
    ownerId: '',
    settings: {
      allowDirectMessage: true,
      visibility: 'public',
      defaultChannelId: '',
    },
    createdAt: 0,
    ...overrides,
  }),

  friend: (overrides: Partial<Friend> = {}): Friend => ({
    isBlocked: false,
    friendGroupId: '',
    user1Id: '',
    user2Id: '',
    createdAt: 0,
    ...overrides,
  }),

  userFriend: (overrides: Partial<UserFriend> = {}): UserFriend => ({
    ...createDefault.friend(),
    ...createDefault.user(),
    ...overrides,
  }),

  member: (overrides: Partial<Member> = {}): Member => ({
    isBlocked: false,
    nickname: '',
    contribution: 0,
    permissionLevel: Permission.Guest,
    userId: '',
    serverId: '',
    createdAt: 0,
    ...overrides,
  }),

  userMember: (overrides: Partial<UserMember> = {}): UserMember => ({
    ...createDefault.member(),
    ...createDefault.server(),
    ...overrides,
  }),

  serverMember: (overrides: Partial<ServerMember> = {}): ServerMember => ({
    ...createDefault.member(),
    ...createDefault.user(),
    ...overrides,
  }),

  friendApplication: (
    overrides: Partial<FriendApplication> = {},
  ): FriendApplication => ({
    senderId: '',
    receiverId: '',
    description: '',
    ...createDefault.user(),
    ...overrides,
  }),

  memberApplication: (
    overrides: Partial<MemberApplication> = {},
  ): MemberApplication => ({
    userId: '',
    serverId: '',
    description: '',
    ...createDefault.user(),
    ...overrides,
  }),
};

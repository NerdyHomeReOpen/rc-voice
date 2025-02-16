export type Visibility = 'public' | 'private' | 'readonly';
export const enum Permission {
  Guest = 1,
  Member = 2,
  ChannelAdmin = 3,
  ChannelManager = 4,
  ServerAdmin = 5,
  ServerOwner = 6,
  EventStaff = 7,
  Official = 8,
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string | null;
  gender: 'Male' | 'Female';
  xp: number;
  level: number;
  signature: string;
  badgeIds: string[];
  ownedServerIds: string[];
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  badges?: Badge[];
  presence?: Presence | null;
  members?: {
    [serverId: string]: Member;
  } | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface FriendCategory {
  id: string;
  name: string;
  userId: string;
  friendIds: string[]; // This is userId not friendId
  order: number;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  friends?: Friend[] | null;
}

export interface Presence {
  id: string;
  userId: string;
  status: 'online' | 'dnd' | 'idle' | 'gn';
  currentChannelId: string;
  currentServerId: string;
  customStatus: string;
  lastActiveAt: number;
  updatedAt: number;
}

export interface Friend {
  id: string;
  status: 'accepted' | 'pending' | 'blocked';
  messageIds: string[];
  userIds: string[];
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  messages?: Message[] | null;
  user?: User | null;
}

export interface Member {
  id: string;
  nickname: string;
  serverId: string;
  userId: string;
  contribution: number;
  managedChannels: string[];
  permissionLevel: Permission;
  joinedAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  user: User | null;
  server: Server | null;
}

export interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  level: number;
  announcement: string;
  channelIds: string[];
  displayId: string;
  lobbyId: string;
  ownerId: string;
  settings: {
    allowDirectMessage: boolean;
    visibility: 'public' | 'private' | 'invisible';
    defaultChannelId: string;
  };
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  channels?: Channel[] | null;
  lobby?: Channel | null;
  owner?: User | null;
  members?: {
    [userId: string]: Member;
  } | null;
  applications?: Application[] | null;
}

export interface Application {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  userId: string;
  serverId: string;
  description: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  user?: User | null;
  server?: Server | null;
}

export interface Channel {
  id: string;
  name: string;
  messageIds: string[];
  parentId: string | null;
  userIds: string[];
  isCategory: boolean;
  isLobby: boolean;
  order?: number;
  settings: {
    bitrate: number;
    slowmode: boolean;
    userLimit: number;
    visibility: Visibility;
  };
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  messages?: Message[] | null;
  parent?: Channel | null;
  users?: User[] | null;
}

export interface Message {
  id: string;
  content: string;
  type: 'general' | 'info';
  senderId: string;
  timestamp: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  sender?: User | null;
}
export interface MessageList {
  [messageId: string]: Message;
}

export interface ModalTabItem {
  id: string;
  label: string;
  onClick: () => void;
}
export interface ModalButton {
  label: string;
  type?: 'submit';
  style: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}
export interface ContextMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

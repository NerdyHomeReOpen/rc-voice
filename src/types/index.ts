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
  signature: string;
  level: number;
  xp: number;
  requiredXp: number;
  progress: number;
  status: 'online' | 'dnd' | 'idle' | 'gn';
  currentChannelId: string;
  currentServerId: string;
  lastActiveAt: number;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  badges: Badge[];
  members: Members | null;
  friendGroups: FriendGroup[] | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Friend {
  id: string;
  status: 'accepted' | 'pending' | 'blocked';
  groupId: string;
  user1Id: string;
  user2Id: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  users: User[] | null;
}

export interface Friends {
  [id: string]: Friend | null;
}

export interface FriendGroup {
  id: string;
  name: string;
  order: number;
  userId: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  friends: Friend[] | null;
}

export interface FriendApplication {
  id: string;
  senderId: string;
  receiverId: string;
  description: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
}

export interface Member {
  id: string;
  nickname: string;
  contribution: number;
  permissionLevel: Permission;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
}

export interface Members {
  [id: string]: Member | null;
}

export interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  level: number;
  description: string;
  wealth: number; // 財富值，但不知道是做什麼用的
  slogan: string;
  announcement: string;
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
  channels: Channel[] | null;
  applications: ServerApplication[] | null;
  lobby: Channel | null;
  members: Members | null;
  owner: User | null;
}

export interface ServerApplication {
  id: string;
  userId: string;
  serverId: string;
  description: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
}

export interface Channel {
  id: string;
  name: string;
  isCategory: boolean;
  isLobby: boolean;
  order: number;
  serverId: string;
  settings: {
    bitrate: number;
    slowmode: boolean;
    userLimit: number;
    visibility: Visibility;
  };
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  subChannels: Channel[] | null;
  messages: Message[] | null;
  users: User[] | null;
}

export interface Message {
  id: string;
  content: string;
  type: 'general' | 'info';
  senderId: string;
  timestamp: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  sender: User | null;
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
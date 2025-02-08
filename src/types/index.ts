
export interface UserList {
  [userId: string]: User;
}
export interface User {
  id: string;
  name: string;
  gender: "Male" | "Female";
  level: number;
  badges: Badge[];
  signature: string;
  avatarUrl: string | null;
  presence: Presence | null;
  friendCategories?: FriendCategory[];
  joinedServers?: Server[];
  recommendedServers?: Server[];
  members: {
    [serverId: string]: Member
  };
}
export interface Badge {
  id: string;
  name: string;
  description: string;
  order: number; // Higher order means it will be displayed first
}
export interface Presence {
  id : string;
  status: "online" | "dnd" | "idle" | "gn"; 
  currentChannelId: string;
  currentServerId: string;
  customStatus: string;
  lastActiveAt: number;
  updatedAt: number;
}
export interface FriendCategory {
  id: string;
  name: string;
  order: number;
  friends: User[];
}
export interface FriendCategories {
  [categoryId: string]: FriendCategory;
}
export interface Member {
  id: string;
  userId: string;
  serverId: string;
  permissionLevel: ServerPermission;
  joinedAt: number;
  nickname: string;
  managedChannels: string[];
}
export const enum ServerPermission {
  Guest = 1,
  Member = 2,
  ChannelAdmin = 3,
  ChannelManager = 4,
  ServerAdmin = 5,
  ServerOwner = 6,
  EventStaff = 7,
  Official = 8,
}
export interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  announcement: string;
  level: number;
  createdAt: number;
  displayId: number;
  lobbyId: string;
  lobby: Channel;
  channelIds: string[];
  channels: Channel[];
  ownerId: string;
  owner: User;
  settings: {
    allowDirectMessage: boolean;
    visibility: "public" | "private" | "invisible";
    defaultChannelId: string;
  }
  members: {
    [userId: string]: Member
  };
}
export interface ServerList {
  [serverId: string]: Server;
}
export type ChannelPermission = "public" | "private" | "readonly";
export interface Channel {
  id: string;
  name: string;
  permission: ChannelPermission;
  isCategory: boolean;
  isLobby: boolean;
  userIds: string[];
  users: User[];
  messageIds: string[];
  messages: Message[];
  parentId: string | null;
  parent: Channel | null;
  createdAt: number;
  settings: {
    bitrate: number;
    visibility: "public" | "private" | "invisible";
    slowmode: number;
    topic: string;
    userLimit: number;
  }
}
export interface ChannelList {
  [channelId: string]: Channel;
}
export interface Message {
  id: string;
  content: string;
  type: "general" | "info";
  timestamp: number;
  senderId: string;
  sender: User;
}
export interface MessageList {
  [messageId: string]: Message;
}
export interface ModalTabItem {
  id: string;
  label: string;
  onClick: () => void;
}
export interface ContextMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface User {
  id: string; // UUID
  name: string; // Display name
  account: string;
  password: string;
  gender: "Male" | "Female";
  avatar?: string;
  level: number;
  createdAt: number;
  lastLoginAt?: number;
  state: UserState; // ["online" | "dnd" | "idle" | "gn"]
  currentChannelId?: string;
}

export type UserState = "online" | "dnd" | "idle" | "gn";
export type MessageType = "general" | "info";

export interface UserList {
  [userId: string]: User;
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  announcement: string;
  level: number;
  userIds: string[];
  channelIds: string[];
  createdAt: number;
  applications: Record<string, string>;
  permissions: Record<string, number>;
  nicknames: Record<string, string>;
  contributions: Record<string, number>;
  joinDate: Record<string, number>;
}
export interface ServerList {
  [serverId: string]: Server;
}

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

export type ChannelPermission = "public" | "private" | "readonly";

export interface Channel {
  id: string;
  name: string;
  permission: ChannelPermission;
  isLobby: boolean;
  isCategory: boolean;
  userIds: string[];
  messageIds: string[];
  parentId: string | null;
}
export interface ChannelList {
  [channelId: string]: Channel;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  type: MessageType;
}

export interface MessageList {
  [messageId: string]: Message;
}

export interface UserData {
  id: string;
  name: string;
  account: string;
  gender: string;
}

export interface MenuItem {
  id: string;
  label: string;
}

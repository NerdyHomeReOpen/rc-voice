export type UserState = "online" | "dnd" | "idle" | "gn";
export interface User {
  id: string;
  name: string;
  account: string; // Move to another list for security
  password: string; // Move to another list for security
  gender: "Male" | "Female";
  avatar?: string;
  level: number;
  createdAt: number;
  lastLoginAt?: number;
  state: UserState; 
  currentChannelId?: string;
  friendIds: string[];
  friendGroups: [
    {
      id: string;
      name: string;
      friendIds: string[];
    }
  ];
  signature: string;
  recommendedServers: ServerList;
  joinedServers: ServerList;
}
export interface UserList {
  [userId: string]: User;
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
export interface Server {
  id: string;
  displayId: number;
  name: string;
  icon: string;
  announcement: string;
  level: number;
  userIds: string[];
  channelIds: string[];
  lobbyId: string;
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

export type MessageType = "general" | "info";
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

// export interface MenuItem {
//   id: string;
//   label: string;
// }

export interface ModalTabItem {
  id: string;
  label: string;
}

export interface ContextMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

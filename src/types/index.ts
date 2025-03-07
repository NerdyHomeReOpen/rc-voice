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
  avatar: string | null;
  avatarUrl: string | null;
  signature: string;
  status: 'online' | 'dnd' | 'idle' | 'gn';
  gender: 'Male' | 'Female';
  level: number;
  xp: number;
  requiredXp: number;
  progress: number;
  currentChannelId: string;
  currentServerId: string;
  lastActiveAt: number;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  members?: Member[];
  badges?: Badge[];
  friends?: Friend[];
  friendGroups?: FriendGroup[];
  friendApplications?: FriendApplication[];
  recentServers?: Server[];
  ownedServers?: Server[];
  favServers?: Server[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Friend {
  id: string;
  isBlocked: boolean;
  groupId: string;
  user1Id: string;
  user2Id: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  user?: User;
  directMessages?: DirectMessage[];
}

export interface FriendGroup {
  id: string;
  name: string;
  order: number;
  userId: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  friends?: Friend[];
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
  isBlocked: boolean;
  nickname: string;
  contribution: number;
  permissionLevel: Permission;
  userId: string;
  serverId: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  user: User | null;
}

export interface Server {
  id: string;
  name: string;
  avatar: string | null;
  avatarUrl: string | null;
  announcement: string;
  description: string;
  displayId: string;
  slogan: string;
  level: number;
  wealth: number; // 財富值，但不知道是做什麼用的
  lobbyId: string;
  ownerId: string;
  settings: {
    allowDirectMessage: boolean;
    visibility: 'public' | 'private' | 'invisible';
    defaultChannelId: string;
  };
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  lobby?: Channel;
  owner?: User;
  users?: User[];
  channels?: Channel[];
  applications?: ServerApplication[];
  members?: {
    [userId: string]: Member;
  };
}

export interface ServerApplication {
  id: string;
  description: string;
  userId: string;
  serverId: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  user: User | null;
}

export interface Channel {
  id: string;
  name: string;
  isRoot: boolean;
  isCategory: boolean;
  isLobby: boolean;
  voiceMode: 'free' | 'queue' | 'forbidden';
  chatMode: 'free' | 'forbidden';
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
  subChannels?: Channel[];
  messages?: Message[];
  users?: User[];
  rtcConnections?: string[];
}

export interface voicePresences {
  id: string;
  username: string;
  isSpeaker: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
}

export interface Message {
  id: string;
  content: string;
  type: 'general' | 'info';
  permissionLevel: Permission;
  senderId: string;
  channelId: string;
  timestamp: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  sender?: User | null;
}

export interface DirectMessage {
  id: string;
  content: string;
  type: 'general' | 'info';
  senderId: string;
  friendId: string;
  timestamp: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  sender?: User | null;
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
  id?: string;
  label: string;
  show?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export interface Emoji {
  id: number;
  alt: string;
  path: string;
}

export enum SocketClientEvent {
  CONNECT_USER = 'connectUser',
  DISCONNECT_USER = 'disconnectUser',
  UPDATE_USER = 'updateUser',
  CONNECT_SERVER = 'connectServer',
  DISCONNECT_SERVER = 'disconnectServer',
  CREATE_SERVER = 'createServer',
  UPDATE_SERVER = 'updateServer',
  DELETE_SERVER = 'deleteServer',
  CONNECT_CHANNEL = 'connectChannel',
  DISCONNECT_CHANNEL = 'disconnectChannel',
  CREATE_CHANNEL = 'createChannel',
  UPDATE_CHANNEL = 'updateChannel',
  DELETE_CHANNEL = 'deleteChannel',
  SEND_MESSAGE = 'message',
  SEND_DIRECT_MESSAGE = 'directMessage',
  RTC_OFFER = 'RTCOffer',
  RTC_ANSWER = 'RTCAnswer',
  RTC_ICE_CANDIDATE = 'RTCIceCandidate',
  GET_SEARCH_RESULT = 'getSearchResult',
}

export enum SocketServerEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  NOTIFICATION = 'notification', // not used yet
  USER_CONNECT = 'userConnect', // deprecated
  USER_DISCONNECT = 'userDisconnect', // deprecated
  USER_UPDATE = 'userUpdate',
  SERVER_CONNECT = 'serverConnect',
  SERVER_DISCONNECT = 'serverDisconnect',
  SERVER_UPDATE = 'serverUpdate',
  CHANNEL_CONNECT = 'channelConnect',
  CHANNEL_DISCONNECT = 'channelDisconnect',
  CHANNEL_UPDATE = 'channelUpdate',
  ERROR = 'error',
  RTC_CONNECT = 'RTCConnect',
  RTC_OFFER = 'RTCOffer',
  RTC_ANSWER = 'RTCAnswer',
  RTC_ICE_CANDIDATE = 'RTCIceCandidate',
  RTC_JOIN = 'RTCJoin',
  RTC_LEAVE = 'RTCLeave',
  SEARCH_RESULTS = 'searchResults',
}

export enum popupType {
  CREATE_SERVER = 'createServer',
  EDIT_SERVER = 'editServer',
  DELETE_SERVER = 'deleteServer',
  CREATE_CHANNEL = 'createChannel',
  EDIT_CHANNEL = 'editChannel',
  DELETE_CHANNEL = 'deleteChannel',
  EDIT_USER = 'editUser',
  APPLY_MEMBER = 'applyMember',
  APPLY_FRIEND = 'applyFriend',
  DIRECT_MESSAGE = 'directMessage',
  ERROR = 'error',
}

export interface discordPresence {
  details: string;
  state: string;
  largeImageKey: string;
  largeImageText: string;
  smallImageKey: string;
  smallImageText: string;
  timestamp: number;
  buttons: {
    label: string;
    url: string;
  }[];
}

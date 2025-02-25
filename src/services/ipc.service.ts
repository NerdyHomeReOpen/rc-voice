import { electronService } from './electron.service';

export enum SocketClientEvent {
  UPDATE_SESSION_ID = 'updateSessionId',
  CONNECT_USER = 'connectUser',
  DISCONNECT_USER = 'disconnectUser',
  UPDATE_USER = 'updateUser',
  CONNECT_SERVER = 'connectServer',
  DISCONNECT_SERVER = 'disconnectServer',
  UPDATE_SERVER = 'updateServer',
};

export enum SocketServerEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  USER_CONNECT = 'userConnect',
  USER_DISCONNECT = 'userDisconnect',
  USER_UPDATE = 'userUpdate',
  SERVER_CONNECT = 'serverConnect',
  SERVER_DISCONNECT = 'serverDisconnect',
  SERVER_UPDATE = 'serverUpdate',
  CHANNEL_CONNECT = 'channelConnect',
  CHANNEL_DISCONNECT = 'channelDisconnect',
  CHANNEL_UPDATE = 'channelUpdate',
  DIRECT_MESSAGE = 'directMessage',
  PLAY_SOUND = 'playSound',
}

// export const SOCKET_IPC_CHANNEL = 'socket-event';

export const ipcService = {
  sendSocketEvent: (event: SocketClientEvent, data: any) => {
    electronService.sendSocketEvent(event, data);
  },

  onSocketEvent: (event: SocketServerEvent, callback: (data: any) => void) => {
    electronService.onSocketEvent(event, callback);
  },

  removeListener: (event: SocketServerEvent) => {
    electronService.removeListener(event);
  },
};



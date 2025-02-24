import { electronService } from './electron.service';

export type SocketServerEventData = {
  type:
    | 'connect'
    | 'disconnect'
    | 'error'
    | 'userConnect'
    | 'userDisconnect'
    | 'userUpdate'
    | 'serverConnect'
    | 'serverDisconnect'
    | 'serverUpdate'
    | 'channelConnect'
    | 'channelDisconnect'
    | 'channelUpdate'
    | 'directMessage'
    | 'playSound';
  payload?: any;
  error?: string;
};

export const SOCKET_IPC_CHANNEL = 'socket-event';

export const ipcService = {
  sendToMain: (channel: string, data: SocketServerEventData) => {
    electronService.sendToMain(channel, data);
  },

  onFromMain: (channel: string, callback: (data: SocketServerEventData) => void) => {
    electronService.onFromMain(channel, callback);
  },

  removeListener: (channel: string) => {
    electronService.removeListener(channel);
  },
};



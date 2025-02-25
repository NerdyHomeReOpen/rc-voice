// Safe reference to electron's ipcRenderer
let ipcRenderer: any = null;

// Initialize ipcRenderer only in client-side and Electron environment
if (typeof window !== 'undefined' && window.require) {
  try {
    const electron = window.require('electron');
    ipcRenderer = electron.ipcRenderer;
  } catch (error) {
    console.warn('Not in Electron environment:', error);
  }
}

export const isElectron = !!ipcRenderer;

export const electronService = {
  // Get service availability
  getAvailability: () => !!ipcRenderer,

  // Send message to main process (sendSocketEvent)
  sendSocketEvent: (event: string, data: any) => {
    if (isElectron) {
      ipcRenderer.send(event, data);
    } else {
      console.warn('IPC not available - not in Electron environment');
    }
  },

  // Listen for messages from main process (onSocketEvent)
  onSocketEvent: (event: string, callback: (data: any) => void) => {
    if (isElectron) {
      ipcRenderer.on(event, (data: any) => callback(data));
    } else {
      console.warn('IPC not available - not in Electron environment');
    }
  },

  // Remove all listeners for a specific channel
  removeListener: (event: string) => {
    if (isElectron) {
      ipcRenderer.removeAllListeners(event);
    } else {
      console.warn('IPC not available - not in Electron environment');
    }
  },

  // Window control methods
  window: {
    minimize: () => {
      if (isElectron) {
        ipcRenderer.send('window-control', 'minimize');
      }
    },
    maximize: () => {
      if (isElectron) {
        ipcRenderer.send('window-control', 'maximize');
      }
    },
    unmaximize: () => {
      if (isElectron) {
        ipcRenderer.send('window-control', 'unmaximize');
      }
    },
    close: () => {
      if (isElectron) {
        ipcRenderer.send('window-control', 'close');
      }
    },
    onMaximize: (callback: () => void) => {
      if (isElectron) {
        ipcRenderer.on('window-maximized', callback);
      }
    },
    onUnmaximize: (callback: () => void) => {
      if (isElectron) {
        ipcRenderer.on('window-unmaximized', callback);
      }
    },
    offMaximize: (callback: () => void) => {
      if (isElectron) {
        ipcRenderer.removeListener('window-maximized', callback);
      }
    },
    offUnmaximize: (callback: () => void) => {
      if (isElectron) {
        ipcRenderer.removeListener('window-unmaximized', callback);
      }
    },
  },

  // Auth related methods
  auth: {
    login: (sessionId: string) => {
      if (isElectron) {
        ipcRenderer.send('login', sessionId);
      }
    },
    logout: () => {
      if (isElectron) {
        ipcRenderer.send('logout');
      }
    },
  },
};

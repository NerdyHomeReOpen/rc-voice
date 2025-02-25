/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const net = require('net');
const DiscordRPC = require('discord-rpc');
const { Socket, io } = require('socket.io-client');

const baseUri = isDev
  ? 'http://127.0.0.1:3000' // Load localhost:3000 in development mode
  : `file://${path.join(__dirname, '../build/index.html')}`; // Load built files in production mode

// Track windows
let mainWindow = null;
let authWindow = null;

// Socket connection
const WS_URL = 'http://localhost:4500';
let socketInstance = null;

// Disocrd RPC
const clientId = '1242441392341516288';
DiscordRPC.register(clientId);
const rpc = new DiscordRPC.Client({ transport: 'ipc' });
let currentActivity = {
  details: '正在啟動應用',
  state: '準備中',
  startTimestamp: Date.now(),
  largeImageKey: 'app_icon',
  largeImageText: '應用名稱',
  smallImageKey: 'status_icon',
  smallImageText: '狀態說明',
  instance: false,
  buttons: [
    {
      label: '加入我們的Discord伺服器',
      url: 'https://discord.gg/adCWzv6wwS',
    },
  ],
};

function waitForPort(port) {
  return new Promise((resolve, reject) => {
    let timeout = 30000; // 30 seconds timeout
    let timer;

    function tryConnect() {
      const client = new net.Socket();

      client.once('connect', () => {
        clearTimeout(timer);
        client.destroy();
        resolve();
      });

      client.once('error', (error) => {
        client.destroy();

        if (timeout <= 0) {
          clearTimeout(timer);
          reject(new Error('Timeout waiting for port'));
          return;
        }

        setTimeout(tryConnect, 1000);
        timeout -= 1000;
      });

      client.connect({ port: port, host: '127.0.0.1' });
    }

    tryConnect();
  });
}

async function createMainWindow() {
  if (isDev) {
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  mainWindow = new BrowserWindow({
    minWidth: 1200,
    minHeight: 800,
    frame: false,
    transparent: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadURL(`${baseUri}`);

  // Open DevTools in development mode
  if (isDev) mainWindow.webContents.openDevTools();

  // wait for page load to send initial state
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send(
      mainWindow.isMaximized() ? 'window-maximized' : 'window-unmaximized',
    );
  });

  // listen for window state change
  mainWindow.on('maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized');
    }
  });

  mainWindow.on('unmaximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-unmaximized');
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

async function createAuthWindow() {
  if (isDev) {
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  const authWindow = new BrowserWindow({
    width: 1000,
    height: 650,
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  authWindow.loadURL(`${baseUri}/auth`);

  // Open DevTools in development mode
  if (isDev) authWindow.webContents.openDevTools();

  // wait for page load to send initial state
  authWindow.webContents.on('did-finish-load', () => {
    authWindow.webContents.send(
      authWindow.isMaximized() ? 'window-maximized' : 'window-unmaximized',
    );
  });

  // listen for window state change
  authWindow.on('maximize', () => {
    if (authWindow && !authWindow.isDestroyed()) {
      authWindow.webContents.send('window-maximized');
    }
  });

  authWindow.on('unmaximize', () => {
    if (authWindow && !authWindow.isDestroyed()) {
      authWindow.webContents.send('window-unmaximized');
    }
  });

  // Handle window closed
  authWindow.on('closed', () => {
    authWindow = null;
  });

  return authWindow;
}

async function createPopup(page) {
  if (isDev) {
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  const popup = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  popup.loadURL(`${baseUri}/popup?type=${type}`); // Add page query parameter

  // Open DevTools in development mode
  if (isDev) popup.webContents.openDevTools();

  return popup;
}

function connectSocket(sessionId) {
  const socket = io(WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: false,
    query: {
      sessionId,
    },
  });

  socket.on('connect', () => {
    BrowserWindow.getAllWindows().forEach((window) =>
      window.webContents.send('connect', socket.id),
    );
    socket.on('connect_error', (error) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('connect_error', error),
      );
    });
    socket.on('error', (error) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('error', error),
      );
    });
    socket.on('disconnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('disconnect', data),
      );
    });
    socket.on('userConnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('userConnect', data),
      );
    });
    socket.on('userDisconnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('userDisconnect', data),
      );
    });
    socket.on('userUpdate', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('userUpdate', data),
      );
    });
    socket.on('serverConnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('serverConnect', data),
      );
    });
    socket.on('serverDisconnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('serverDisconnect', data),
      );
    });
    socket.on('serverUpdate', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('serverUpdate', data),
      );
    });
    socket.on('channelConnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('channelConnect', data),
      );
    });
    socket.on('channelDisconnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('channelDisconnect', data),
      );
    });
    socket.on('channelUpdate', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('channelUpdate', data),
      );
    });

    // Socket IPC event handling
    ipcMain.on('updateUser', (_, data) => socket.emit('updateUser', data));
    ipcMain.on('updateServer', (_, data) => socket.emit('updateServer', data));
    ipcMain.on('updateChannel', (_, data) =>
      socket.emit('updateChannel', data),
    );

    // Close auth window and create main window
    if (authWindow) {
      authWindow.close();
      authWindow = null;
    }
    createMainWindow();
  });

  return socket;
}

function disconnectSocket(socket) {
  if (socket) socket.disconnect();

  // Close main window and create auth window
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  createAuthWindow();

  return null;
}

async function setActivity() {
  if (!rpc) return;

  try {
    rpc.setActivity(currentActivity);
  } catch (error) {
    console.error('設置Rich Presence時出錯:', error);
  }
}

rpc.on('ready', () => {
  setActivity();

  setInterval(() => {
    setActivity();
  }, 15000);
});

app.whenReady().then(async () => {
  await createAuthWindow();

  app.on('before-quit', () => {
    if (rpc) {
      rpc.destroy().catch(console.error);
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Window management IPC handlers
  ipcMain.on('login', (_, sessionId) => {
    if (!socketInstance) socketInstance = connectSocket(sessionId);
    socketInstance.connect();
  });
  ipcMain.on('logout', () => {
    socketInstance = disconnectSocket(socketInstance);
  });

  // Window control handlers
  ipcMain.on('minimize-window', () => {
    const currentWindow = BrowserWindow.getFocusedWindow();
    if (currentWindow) {
      currentWindow.minimize();
    }
  });
  ipcMain.on('maximize-window', () => {
    const currentWindow = BrowserWindow.getFocusedWindow();
    if (currentWindow) {
      if (currentWindow.isMaximized()) {
        currentWindow.unmaximize();
      } else {
        currentWindow.maximize();
      }
    }
  });
  ipcMain.on('close-window', () => {
    const currentWindow = BrowserWindow.getFocusedWindow();
    if (currentWindow) {
      currentWindow.close();
    }
  });

  // Popup handlers
  ipcMain.on('open-popup', (type) => createPopup(type));

  // listen for window control event
  ipcMain.on('window-control', (event, command) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;

    switch (command) {
      case 'minimize':
        window.minimize();
        break;
      case 'maximize':
        if (window.isMaximized()) {
          window.unmaximize();
        } else {
          window.maximize();
        }
        break;
      case 'unmaximize':
        window.unmaximize();
        break;
      case 'close':
        window.close();
        break;
    }
  });

  return () => {
    socket.disconnect();
  };
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createAuthWindow();
  }
});

ipcMain.on('update-discord-presence', (event, presenceData) => {
  try {
    const {
      details,
      state,
      largeImageKey,
      largeImageText,
      smallImageKey,
      smallImageText,
      buttons,
      resetTimer,
    } = presenceData;

    Object.assign(currentActivity, {
      ...(details !== undefined && { details }),
      ...(state !== undefined && { state }),
      ...(largeImageKey !== undefined && { largeImageKey }),
      ...(largeImageText !== undefined && { largeImageText }),
      ...(smallImageKey !== undefined && { smallImageKey }),
      ...(smallImageText !== undefined && { smallImageText }),
    });

    if (buttons?.length > 0) {
      const validButtons = buttons.slice(0, 2).filter((button) => {
        return (
          button?.label &&
          button?.url &&
          typeof button.url === 'string' &&
          /^https?:\/\//.test(button.url)
        );
      });

      if (validButtons.length > 0) {
        currentActivity.buttons = validButtons;
      }
    }

    if (resetTimer) {
      currentActivity.startTimestamp = Date.now();
    }

    setActivity();
  } catch (error) {
    console.error('更新Discord Presence時發生錯誤:', error);
    try {
      const basicActivity = {
        details: '正在使用應用',
        state: '瀏覽中',
        startTimestamp: Date.now(),
      };
      rpc.setActivity(basicActivity);
    } catch (e) {
      console.error('使用基本設置恢復失敗:', e);
    }
  }
});

ipcMain.on('open-window', async (event, window) => {
  switch (window) {
    case 'main':
      await createMainWindow();
      break;
    case 'auth':
      await createAuthWindow();
      break;
    default:
      break;
  }
});

// Window management IPC handlers
ipcMain.on('login', () => {
  // Close auth window and create main window
  if (authWindow) {
    authWindow.close();
    authWindow = null;
  }
  createMainWindow();
});

ipcMain.on('logout', () => {
  // Close main window and create auth window
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  createAuthWindow();
});

// Window control handlers
ipcMain.on('minimize-window', () => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    currentWindow.minimize();
  }
});

ipcMain.on('maximize-window', () => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    if (currentWindow.isMaximized()) {
      currentWindow.unmaximize();
    } else {
      currentWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    currentWindow.close();
  }
});

// Socket IPC event handling
ipcMain.on('socket-event', (event, data) => {
  // Forward the event to all other windows except the sender
  BrowserWindow.getAllWindows().forEach((window) =>
    window.webContents.send('socket-event', data),
  );
});

// Popup handlers
ipcMain.on('open-popup', (popup) => {
  switch (popup) {
    case 'create-server':
      createCreateServerPopup();
      break;
    default:
      break;
  }
});

// listen for window control event
ipcMain.on('window-control', (event, command) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return;

  switch (command) {
    case 'minimize':
      window.minimize();
      break;
    case 'maximize':
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
      break;
    case 'unmaximize':
      window.unmaximize();
      break;
    case 'close':
      window.close();
      break;
  }
});

rpc.login({ clientId }).catch(console.error);

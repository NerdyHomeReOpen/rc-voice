/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const serve = require('electron-serve');
const net = require('net');
const DiscordRPC = require('discord-rpc');
const { io } = require('socket.io-client');
const { autoUpdater } = require('electron-updater');
const { SocketClientEvent, SocketServerEvent } = require('./src/types');

let isDev = process.argv.includes('--dev');

const appServe = app.isPackaged
  ? serve({
      directory: path.join(__dirname, './out'),
    })
  : !isDev
  ? serve({
      directory: path.join(__dirname, './out'),
    })
  : null;

let baseUri = '';

if (isDev) {
  baseUri = 'http://127.0.0.1:3000';
}

// Track windows
let mainWindow = null;
let authWindow = null;
let popups = {};

// Socket connection
const WS_URL = 'http://localhost:4500';
let socketInstance = null;

// Disocrd RPC
const clientId = '1242441392341516288';
DiscordRPC.register(clientId);
let rpc = new DiscordRPC.Client({ transport: 'ipc' });

const defaultPrecence = {
  details: '正在使用應用',
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
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return mainWindow;
  }

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
    minWidth: 1400,
    minHeight: 800,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (app.isPackaged || !isDev) {
    appServe(mainWindow).then(() => {
      mainWindow.loadURL('app://-');
    });
  } else {
    mainWindow.loadURL(`${baseUri}`);
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send(
      mainWindow.isMaximized() ? 'window-maximized' : 'window-unmaximized',
    );
  });

  mainWindow.webContents.on('close', () => {
    app.quit();
  });

  return mainWindow;
}

async function createAuthWindow() {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.focus();
    return authWindow;
  }

  if (isDev) {
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  authWindow = new BrowserWindow({
    width: 610,
    height: 450,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (app.isPackaged || !isDev) {
    appServe(authWindow).then(() => {
      authWindow.loadURL('app://./auth.html');
    });
  } else {
    authWindow.loadURL(`${baseUri}/auth`);
    // Open DevTools in development mode
    authWindow.webContents.openDevTools();
  }

  authWindow.webContents.on('did-finish-load', () => {
    authWindow.webContents.send(
      authWindow.isMaximized() ? 'window-maximized' : 'window-unmaximized',
    );
  });

  authWindow.webContents.on('close', () => {
    app.quit();
  });

  return authWindow;
}

async function createPopup(type, height, width) {
  // Track popup windows
  if (popups[type] && !popups[type].isDestroyed()) {
    popups[type].focus();
    return popups[type];
  }

  if (isDev) {
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  popups[type] = new BrowserWindow({
    width: width ?? 800,
    height: height ?? 600,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    modal: true,
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (app.isPackaged || !isDev) {
    appServe(popups[type]).then(() => {
      popups[type].loadURL(`app://./popup.html?type=${type}`);
    });
  } else {
    popups[type].loadURL(`${baseUri}/popup?type=${type}`);
    // Open DevTools in development mode
    popups[type].webContents.openDevTools();
  }

  popups[type].webContents.on('closed', () => {
    popups[type] = null;
  });

  return popups[type];
}

function connectSocket(token) {
  const socket = io(WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: false,
    query: {
      jwt: token,
    },
  });

  socket.on('connect', () => {
    // 定義所有 IPC 處理器
    const ipcHandlers = Object.values(SocketClientEvent).reduce(
      (acc, event) => {
        acc[event] = (_, data) => socket.emit(event, data);
        return acc;
      },
      {},
    );

    // 註冊 IPC 處理器
    Object.entries(ipcHandlers).forEach(([event, handler]) => {
      ipcMain.on(event, handler);
    });

    // 註冊所有 Socket 事件
    Object.values(SocketServerEvent).forEach((event) => {
      socket.on(event, (data) => {
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send(event, data);
        });
      });
    });

    mainWindow?.show();
    authWindow?.hide();
  });

  // 將處理函數存儲在 socket 實例上，以便後續清理
  socket.ipcHandlers = ipcHandlers;

  return socket;
}

function disconnectSocket(socket) {
  if (!socket) return null;

  // 移除所有 IPC 事件處理函數
  if (socket.ipcHandlers) {
    Object.entries(socket.ipcHandlers).forEach(([event, handler]) => {
      ipcMain.removeListener(event, handler);
    });
  }

  socket.disconnect();
  return null;
}

async function setActivity(activity) {
  if (!rpc) return;
  try {
    rpc.setActivity(activity);
  } catch (error) {
    console.error('設置Rich Presence時出錯:', error);
    rpc.setActivity(defaultPrecence);
  }
}

rpc.on('ready', () => {
  setActivity(defaultPrecence);
});

app.on('ready', async () => {
  await createAuthWindow();
  await createMainWindow();
  autoUpdater.checkForUpdatesAndNotify();

  mainWindow.hide();
  authWindow.show();

  app.on('before-quit', () => {
    if (rpc) rpc.destroy().catch(console.error);
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  ipcMain.on('login', (_, token) => {
    mainWindow.show();
    authWindow.hide();
    if (!socketInstance) socketInstance = connectSocket(token);
    socketInstance.connect();
  });

  ipcMain.on('logout', () => {
    mainWindow.hide();
    authWindow.show();
    socketInstance = disconnectSocket(socketInstance);
  });

  // Initial data request handlers
  ipcMain.on('request-initial-data', (_, to) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('request-initial-data', to);
    });
  });
  ipcMain.on('response-initial-data', (_, from, data) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('response-initial-data', from, data);
    });
  });

  // Popup submit handlers
  ipcMain.on('popup-submit', (_, to) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('popup-submit', to);
    });
  });

  // Popup handlers
  ipcMain.on('open-popup', async (_, type, height, width) => {
    createPopup(type, height, width);
  });

  // Window control event handlers
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

  // Discord RPC handlers
  ipcMain.on('update-discord-presence', (_, updatePresence) => {
    setActivity(updatePresence);
  });

  ipcMain.on('openDevtool', () => {
    if (isDev) {
      const currentWindow = BrowserWindow.getFocusedWindow();

      if (currentWindow)
        currentWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createAuthWindow();
    await createMainWindow();

    mainWindow.hide();
    authWindow.show();
  }
});

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: '有新版本可用',
    message: '正在下載新版本，請稍後...',
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog
    .showMessageBox({
      type: 'question',
      title: '更新已下載',
      message: '應用程式已下載新版本，請重新啟動以完成更新。',
      buttons: ['立即重啟'],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});

rpc.login({ clientId }).catch(() => {
  console.log('Discord RPC登錄失敗, 將不會顯示Discord Rich Presence');
  rpc = null;
});

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const net = require('net');

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

const baseUri = isDev
  ? 'http://127.0.0.1:3000' // Load localhost:3000 in development mode
  : `file://${path.join(__dirname, '../build/index.html')}`; // Load built files in production mode

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

  const mainWindow = new BrowserWindow({
    minWidth: 1200,
    minHeight: 800,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.loadURL(`${baseUri}`);

  // Open DevTools in development mode
  // if (isDev) mainWindow.webContents.openDevTools();
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
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  authWindow.loadURL(`${baseUri}`);

  // Open DevTools in development mode
  // if (isDev) authWindow.webContents.openDevTools();
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
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  popup.loadURL(`${baseUri}/popup?page=${page}`); // Add page query parameter

  // Open DevTools in development mode
  // if (isDev) createServerPopup.webContents.openDevTools();
}

app.whenReady().then(async () => {
  await createAuthWindow();

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createAuthWindow();
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

ipcMain.on('open-popup', async (event, popup) => {
  switch (popup) {
    case 'create-server':
      await createPopup('create-server');
      break;
    default:
      break;
  }
});

ipcMain.on('close', () => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    currentWindow.close();
  }
});

ipcMain.on('reload', () => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    currentWindow.webContents.reload();
  }
});

ipcMain.on('minimize', () => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    currentWindow.minimize();
  }
});

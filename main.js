/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const {
  app,
  BrowserWindow,
  ipcMain,
  ipcRenderer,
  contextBridge,
} = require('electron');
const isDev = require('electron-is-dev');

const baseUri = isDev
  ? 'http://localhost:3000' // Load localhost:3000 in development mode
  : `file://${path.join(__dirname, '../build/index.html')}`; // Load built files in production mode

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadURL(`${baseUri}`);

  // Open DevTools in development mode
  if (isDev) mainWindow.webContents.openDevTools();
}

function createAuthWindow() {
  const authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  authWindow.loadURL(`${baseUri}/auth`);

  // Open DevTools in development mode
  if (isDev) authWindow.webContents.openDevTools();
}

function createCreateServerPopup() {
  const createServerPopup = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  createServerPopup.loadURL(`${baseUri}/popups/create-server`);

  // Open DevTools in development mode
  if (isDev) createServerPopup.webContents.openDevTools();
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

ipcMain.on('open-popup', (popup) => {
  switch (popup) {
    case 'create-server':
      createCreateServerPopup();
      break;
    default:
      break;
  }
});

contextBridge.exposeInMainWorld('electron', {
  openPopup: () => ipcRenderer.send('open-popup'),
});

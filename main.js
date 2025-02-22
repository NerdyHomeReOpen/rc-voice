/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');

const baseUri = isDev
  ? 'http://localhost:3000' // Load localhost:3000 in development mode
  : `file://${path.join(__dirname, '../build/index.html')}`; // Load built files in production mode

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    minWidth: 1200,
    minHeight: 800,
    frame: false,
    transparent: true,
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
    width: 600,
    height: 450,
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  authWindow.loadURL(`${baseUri}/auth`);

  // Open DevTools in development mode
  if (isDev) authWindow.webContents.openDevTools();
}

function createPopup(page) {
  const popup = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  popup.loadURL(`${baseUri}/popup?page=${page}`); // Add page query parameter

  // Open DevTools in development mode
  if (isDev) createServerPopup.webContents.openDevTools();
}

app.whenReady().then(() => {
  createAuthWindow();
  // createMainWindow();

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createAuthWindow();
    // createMainWindow();
  }
});

ipcMain.on('open-popup', (popup) => {
  switch (popup) {
    case 'create-server':
      createPopup('create-server');
      break;
    default:
      break;
  }
});

ipcMain.on('close-popup', () => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    currentWindow.close();
  }
});

ipcMain.on('close-window', () => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    currentWindow.close();
  }
});

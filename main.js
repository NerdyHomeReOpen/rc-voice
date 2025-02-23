/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');

const baseUri = 'http://127.0.0.1:3000';
// const baseUri = isDev
//   ? 'http://127.0.0.1:3000' // Load localhost:3000 in development mode
//   : `file://${path.join(__dirname, '../build/index.html')}`; // Load built files in production mode

function createMainWindow() {
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

function createAuthWindow() {
  const authWindow = new BrowserWindow({
    width: 600,
    height: 450,
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  authWindow.loadURL(`${baseUri}/auth`);

  // Open DevTools in development mode
  // if (isDev) authWindow.webContents.openDevTools();
}

function createPopup(page) {
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

app.whenReady().then(() => {
  createAuthWindow();

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createAuthWindow();
  }
});

ipcMain.on('open-window', (window) => {
  switch (window) {
    case 'main':
      createMainWindow();
      break;
    case 'auth':
      createAuthWindow();
      break;
    default:
      break;
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

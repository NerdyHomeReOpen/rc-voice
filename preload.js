// /* eslint-disable @typescript-eslint/no-require-imports */
// import { contextBridge, ipcRenderer } from 'electron';

// // 使用 contextBridge 曝露 API 給渲染進程
// contextBridge.exposeInMainWorld('electron', {
//   openPopup: (page) => ipcRenderer.send('open-popup', page),
//   openWindow: (page) => ipcRenderer.send('open-window', page),
//   close: () => ipcRenderer.send('close'),
//   minimize: () => ipcRenderer.send('minimize'),
//   reload: () => ipcRenderer.send('reload'),
//   openDevtool: () => ipcRenderer.send('openDevtool'),

//   // Discord RPC
//   updateDiscordPresence: (presenceData) => {
//     ipcRenderer.send('update-discord-presence', presenceData);
//   },
// });

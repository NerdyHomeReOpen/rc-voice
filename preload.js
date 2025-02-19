const { contextBridge, ipcRenderer } = require('electron');

// 使用 contextBridge 曝露 API 給渲染進程
contextBridge.exposeInMainWorld('electron', {
  openPopup: () => ipcRenderer.send('open-popup'),
  closePopup: () => ipcRenderer.send('close-popup'),
  closeWindow: () => ipcRenderer.send('close-window'),
});

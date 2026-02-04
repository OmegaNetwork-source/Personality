const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openclaw: {
    check: () => ipcRenderer.invoke('openclaw:check'),
    generate: (params) => ipcRenderer.invoke('openclaw:generate', params)
  },
  app: {
    version: () => ipcRenderer.invoke('app:version'),
    platform: () => ipcRenderer.invoke('app:platform')
  }
})

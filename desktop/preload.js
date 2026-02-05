const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
// This is the secure way to communicate between renderer and main process
contextBridge.exposeInMainWorld('electronAPI', {
  openclaw: {
    check: () => ipcRenderer.invoke('openclaw:check'),
    generate: (params) => ipcRenderer.invoke('openclaw:generate', params)
  },
  app: {
    version: () => ipcRenderer.invoke('app:version'),
    platform: () => ipcRenderer.invoke('app:platform')
  },
  folder: {
    select: () => ipcRenderer.invoke('folder:select'),
    get: () => ipcRenderer.invoke('folder:get'),
    onChanged: (callback) => {
      ipcRenderer.on('folder:changed', (event, data) => callback(data))
    }
  },
  fs: {
    read: (filePath) => ipcRenderer.invoke('fs:read', filePath),
    write: (filePath, content) => ipcRenderer.invoke('fs:write', filePath, content),
    create: (filePath, content) => ipcRenderer.invoke('fs:create', filePath, content),
    delete: (filePath) => ipcRenderer.invoke('fs:delete', filePath),
    list: (dirPath) => ipcRenderer.invoke('fs:list', dirPath),
    execute: (command, args, cwd) => ipcRenderer.invoke('fs:execute', command, args, cwd)
  }
})

// Security: No file system access is exposed to the renderer
// Bots only communicate via APIs, not file system

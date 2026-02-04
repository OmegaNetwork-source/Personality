const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let openclawProcess = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  })

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'))
  }
}

// OpenCLaw integration for local hardware acceleration
function initializeOpenCLaw() {
  try {
    // OpenCLaw provides local GPU acceleration
    // This is a placeholder - actual OpenCLaw integration would go here
    console.log('Initializing OpenCLaw for local hardware acceleration...')
    
    // Example: Start OpenCLaw service if available
    // openclawProcess = spawn('openclaw', ['--gpu', '--port', '7862'])
    
    ipcMain.handle('openclaw:check', async () => {
      // Check if OpenCLaw is available
      return { available: false, message: 'OpenCLaw integration pending' }
    })

    ipcMain.handle('openclaw:generate', async (event, { type, prompt, options }) => {
      // Handle local generation requests
      // This would use OpenCLaw for local GPU acceleration
      return { success: false, message: 'OpenCLaw integration pending' }
    })
  } catch (error) {
    console.error('OpenCLaw initialization error:', error)
  }
}

app.whenReady().then(() => {
  createWindow()
  initializeOpenCLaw()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (openclawProcess) {
    openclawProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers for desktop-specific features
ipcMain.handle('app:version', () => {
  return app.getVersion()
})

ipcMain.handle('app:platform', () => {
  return process.platform
})

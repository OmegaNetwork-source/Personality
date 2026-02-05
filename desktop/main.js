const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs').promises
const { watch } = require('fs')

let mainWindow
let openclawProcess = null
let selectedFolder = null  // User-selected folder for bot access
let folderWatcher = null

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js')
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,  // Security: Disable node integration in renderer
      contextIsolation: true,  // Security: Enable context isolation
      enableRemoteModule: false,  // Security: Disable remote module (deprecated)
      preload: preloadPath  // Use preload script for secure IPC
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

// Moved to bottom after folder watcher setup

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

// Folder selection for bot access
ipcMain.handle('folder:select', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select folder for AI agent access'
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    selectedFolder = result.filePaths[0]
    
    // Store in app data
    const userDataPath = app.getPath('userData')
    await fs.writeFile(
      path.join(userDataPath, 'selected-folder.txt'),
      selectedFolder,
      'utf8'
    )
    
    // Start watching the folder
    startFolderWatcher(selectedFolder)
    
    return { success: true, folder: selectedFolder }
  }
  
  return { success: false }
})

ipcMain.handle('folder:get', async () => {
  if (selectedFolder) {
    return { folder: selectedFolder }
  }
  
  // Try to load from saved location
  try {
    const userDataPath = app.getPath('userData')
    const savedFolder = await fs.readFile(
      path.join(userDataPath, 'selected-folder.txt'),
      'utf8'
    )
    if (savedFolder && await fs.access(savedFolder).then(() => true).catch(() => false)) {
      selectedFolder = savedFolder.trim()
      startFolderWatcher(selectedFolder)
      return { folder: selectedFolder }
    }
  } catch (error) {
    // No saved folder
  }
  
  return { folder: null }
})

// File system operations (limited to selected folder)
ipcMain.handle('fs:read', async (event, filePath) => {
  if (!selectedFolder) {
    throw new Error('No folder selected')
  }
  
  const fullPath = path.resolve(selectedFolder, filePath)
  
  // Security: Ensure path is within selected folder
  if (!fullPath.startsWith(path.resolve(selectedFolder))) {
    throw new Error('Access denied: Path outside selected folder')
  }
  
  try {
    const content = await fs.readFile(fullPath, 'utf8')
    return { success: true, content }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:write', async (event, filePath, content) => {
  if (!selectedFolder) {
    throw new Error('No folder selected')
  }
  
  const fullPath = path.resolve(selectedFolder, filePath)
  
  // Security: Ensure path is within selected folder
  if (!fullPath.startsWith(path.resolve(selectedFolder))) {
    throw new Error('Access denied: Path outside selected folder')
  }
  
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, content, 'utf8')
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:create', async (event, filePath, content = '') => {
  if (!selectedFolder) {
    throw new Error('No folder selected')
  }
  
  const fullPath = path.resolve(selectedFolder, filePath)
  
  // Security: Ensure path is within selected folder
  if (!fullPath.startsWith(path.resolve(selectedFolder))) {
    throw new Error('Access denied: Path outside selected folder')
  }
  
  try {
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, content, 'utf8')
    return { success: true, path: fullPath }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:delete', async (event, filePath) => {
  if (!selectedFolder) {
    throw new Error('No folder selected')
  }
  
  const fullPath = path.resolve(selectedFolder, filePath)
  
  // Security: Ensure path is within selected folder
  if (!fullPath.startsWith(path.resolve(selectedFolder))) {
    throw new Error('Access denied: Path outside selected folder')
  }
  
  try {
    const stats = await fs.stat(fullPath)
    if (stats.isDirectory()) {
      await fs.rmdir(fullPath, { recursive: true })
    } else {
      await fs.unlink(fullPath)
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:list', async (event, dirPath = '') => {
  if (!selectedFolder) {
    throw new Error('No folder selected')
  }
  
  const fullPath = path.resolve(selectedFolder, dirPath)
  
  // Security: Ensure path is within selected folder
  if (!fullPath.startsWith(path.resolve(selectedFolder))) {
    throw new Error('Access denied: Path outside selected folder')
  }
  
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true })
    const items = await Promise.all(entries.map(async (entry) => {
      const entryPath = path.join(fullPath, entry.name)
      const stats = await fs.stat(entryPath)
      return {
        name: entry.name,
        path: path.relative(selectedFolder, entryPath),
        type: entry.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime
      }
    }))
    return { success: true, items }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('fs:execute', async (event, command, args = [], cwd = null) => {
  if (!selectedFolder) {
    throw new Error('No folder selected')
  }
  
  const workingDir = cwd ? path.resolve(selectedFolder, cwd) : selectedFolder
  
  // Security: Ensure working directory is within selected folder
  if (!workingDir.startsWith(path.resolve(selectedFolder))) {
    throw new Error('Access denied: Working directory outside selected folder')
  }
  
  return new Promise((resolve) => {
    const process = spawn(command, args, {
      cwd: workingDir,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let stdout = ''
    let stderr = ''
    
    process.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    process.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    process.on('close', (code) => {
      resolve({
        success: code === 0,
        exitCode: code,
        stdout,
        stderr
      })
    })
    
    process.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        stdout,
        stderr
      })
    })
  })
})

// Folder watching for 24/7 monitoring
function startFolderWatcher(folderPath) {
  if (folderWatcher) {
    folderWatcher.close()
  }
  
  try {
    folderWatcher = watch(folderPath, { recursive: true }, (eventType, filename) => {
      if (filename) {
        mainWindow.webContents.send('folder:changed', {
          event: eventType,
          file: filename,
          folder: folderPath
        })
      }
    })
    console.log(`[FolderWatcher] Watching folder: ${folderPath}`)
  } catch (error) {
    console.error(`[FolderWatcher] Error: ${error.message}`)
  }
}

// Load saved folder on startup
app.whenReady().then(async () => {
  try {
    const userDataPath = app.getPath('userData')
    const savedFolder = await fs.readFile(
      path.join(userDataPath, 'selected-folder.txt'),
      'utf8'
    ).catch(() => null)
    
    if (savedFolder) {
      selectedFolder = savedFolder.trim()
      startFolderWatcher(selectedFolder)
    }
  } catch (error) {
    // No saved folder
  }
  
  createWindow()
  initializeOpenCLaw()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

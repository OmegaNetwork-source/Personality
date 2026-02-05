# File System Agent - 24/7 Autonomous Operation

## Overview

The AI agent now has full file system access to a user-selected folder, allowing it to:
- ✅ Create, read, write, and delete files
- ✅ Execute commands in the selected folder
- ✅ Troubleshoot and auto-fix file issues
- ✅ Run 24/7 with minimal input
- ✅ Monitor folder changes automatically

## Security

**Important**: The agent only has access to ONE folder that you explicitly select. It cannot access files outside this folder.

### How It Works

1. **User selects a folder** via Electron app or web UI
2. **Agent gets access** only to that folder and its subdirectories
3. **All operations are sandboxed** - cannot access files outside the selected folder
4. **Path validation** ensures security at every operation

## Features

### 1. File Operations
- **Create files**: Create new files with content
- **Read files**: Read file contents
- **Write files**: Write/update file contents
- **Delete files**: Delete files or directories
- **List directory**: List files and folders

### 2. Command Execution
- Execute shell commands in the selected folder
- Run scripts, build tools, etc.
- Commands are executed with the selected folder as working directory

### 3. Troubleshooting & Auto-Fix
- **Troubleshoot**: Analyze files for issues (syntax errors, formatting, etc.)
- **Auto-fix**: Automatically fix common issues:
  - JSON formatting errors
  - Python syntax issues
  - Trailing whitespace
  - And more...

### 4. 24/7 Autonomous Operation
- **Task scheduler** runs continuously
- **File watching** monitors folder for changes
- **Auto-recovery** from errors
- **Self-healing** capabilities

## Usage

### Electron App

1. **Select Folder**:
   ```javascript
   const result = await window.electronAPI.folder.select()
   // Returns: { success: true, folder: "/path/to/folder" }
   ```

2. **Read File**:
   ```javascript
   const result = await window.electronAPI.fs.read("file.txt")
   // Returns: { success: true, content: "..." }
   ```

3. **Write File**:
   ```javascript
   await window.electronAPI.fs.write("file.txt", "content")
   ```

4. **Create File**:
   ```javascript
   await window.electronAPI.fs.create("newfile.txt", "content")
   ```

5. **Execute Command**:
   ```javascript
   const result = await window.electronAPI.fs.execute("npm", ["install"], ".")
   ```

6. **Troubleshoot File**:
   ```javascript
   const result = await window.electronAPI.fs.troubleshoot("script.py")
   // Returns: { success: true, issues: [...], suggestions: [...] }
   ```

### Backend API

All operations are also available via REST API:

- `POST /api/filesystem/set-folder` - Set base folder
- `POST /api/filesystem/read` - Read file
- `POST /api/filesystem/write` - Write file
- `POST /api/filesystem/create` - Create file
- `POST /api/filesystem/delete` - Delete file
- `GET /api/filesystem/list` - List directory
- `POST /api/filesystem/troubleshoot` - Troubleshoot file
- `POST /api/filesystem/autofix` - Auto-fix file
- `POST /api/filesystem/execute` - Execute command

### Autonomous Tasks

Create tasks that run automatically:

```json
{
  "task_type": "file_create",
  "task_data": {
    "file_path": "script.py",
    "content": "print('Hello, World!')"
  },
  "schedule": "daily"
}
```

Task types:
- `file_create` - Create files
- `file_read` - Read files
- `file_write` - Write files
- `file_troubleshoot` - Troubleshoot files
- `file_autofix` - Auto-fix files
- `execute_command` - Run commands

## Example: Autonomous Development Agent

The agent can now:
1. **Monitor** your project folder for changes
2. **Detect** issues automatically
3. **Fix** problems without user input
4. **Run** tests and builds
5. **Update** files based on requirements

### Example Task: Auto-Fix Python Scripts

```json
{
  "task_type": "file_troubleshoot",
  "task_data": {
    "file_path": "src/main.py"
  },
  "schedule": "every_5_minutes"
}
```

If issues are found, automatically fix them:

```json
{
  "task_type": "file_autofix",
  "task_data": {
    "file_path": "src/main.py"
  },
  "schedule": "once"
}
```

## 24/7 Operation

The agent runs continuously:
- ✅ **Task scheduler** checks every minute for pending tasks
- ✅ **File watcher** monitors folder changes
- ✅ **Auto-recovery** handles errors gracefully
- ✅ **Self-healing** fixes issues automatically
- ✅ **Minimal input** - runs with little or no user interaction

## Security Reminders

- Agent only has access to the folder you select
- Cannot access files outside the selected folder
- All paths are validated before operations
- Commands run in sandboxed environment
- No network access unless explicitly configured

## Next Steps

1. Select a folder in the Electron app
2. Create autonomous tasks
3. Let the agent work 24/7
4. Monitor progress via API or web UI

The agent is now fully autonomous and can create, troubleshoot, fix, and run tasks with minimal input!

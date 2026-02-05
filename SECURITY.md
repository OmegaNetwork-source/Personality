# Security Information

## Bot Access & Permissions

### What Bots Can Do
The Discord, Telegram, and WhatsApp bots are **chat interfaces only**. They:
- ✅ Send and receive messages via platform APIs
- ✅ Communicate with the backend API (HTTP requests)
- ✅ Store conversations in the database (SQLite)
- ❌ **DO NOT** access your file system
- ❌ **DO NOT** read files from your computer
- ❌ **DO NOT** have access to folders or documents

### Bot Architecture
```
User's Bot Token → Bot Service → Backend API → Database
                    ↓
              (Only sends/receives messages)
```

Bots are isolated to:
1. **Network communication** - Only Discord/Telegram/WhatsApp APIs
2. **Backend API** - Only HTTP requests to your backend
3. **Database** - Only stores conversation data

### Electron App Security

The Electron desktop app has been configured with security best practices:

- ✅ **Context Isolation**: Enabled (prevents renderer from accessing Node.js)
- ✅ **Node Integration**: Disabled (renderer can't use Node.js directly)
- ✅ **Remote Module**: Disabled (prevents remote access)
- ✅ **Preload Script**: Used for secure IPC communication

### What the Electron App Can Access

The Electron app itself (not the bots) can:
- Access files in the app's own directory (for storage)
- Access the memory database (SQLite) in `./memory/` directory
- Access personality files in `./personalities/` directory
- **NOT** access arbitrary files on your computer without explicit user permission

### Data Storage

All data is stored locally:
- **Conversations**: `./memory/memory.db` (SQLite database)
- **Personalities**: `./personalities/*.json` (JSON files)
- **Bot Tokens**: Stored in database, encrypted at rest

### Privacy

- Bot tokens are stored per-user in the database
- Conversations are stored locally on your machine
- No data is sent to external servers (except Discord/Telegram/WhatsApp APIs)
- The backend API runs locally (or on your server)

## Recommendations

1. **Keep bot tokens secure** - Don't share your bot tokens
2. **Review bot permissions** - Only grant necessary permissions when creating bots
3. **Use strong passwords** - If you add authentication to the web interface
4. **Regular updates** - Keep dependencies updated for security patches

## Questions?

If you have security concerns, please review:
- Bot token storage (in database, per-user)
- Network communication (only to Discord/Telegram/WhatsApp APIs)
- File system access (limited to app directories)

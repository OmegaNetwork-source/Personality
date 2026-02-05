# OpenClaw Integration Guide

This document explains the new features integrated from OpenClaw:

## Features Added

### 1. Persistent Memory System ✅
- **Location**: `backend/services/memory_service.py`
- **What it does**: Stores all conversations, prompts, and learns from interactions
- **Database**: SQLite database at `./memory/memory.db`
- **Features**:
  - Saves all conversations with timestamps
  - Stores important memories (facts, preferences, etc.)
  - Retrieves conversation history automatically
  - Tracks memory importance and access frequency
  - No need to remind the AI of previous conversations

### 2. 24/7 Autonomous Task Execution ✅
- **Location**: `backend/services/task_service.py`
- **What it does**: Runs tasks automatically on schedule (24/7 operation)
- **Features**:
  - Create tasks with schedules (once, daily, hourly, every_5_minutes, or cron)
  - Task types: chat, web_search, crypto_price, reminder, custom
  - Automatic task execution in background
  - Task status tracking (pending, running, completed, failed)
  - Tasks run independently without user interaction

### 3. Discord Bot Integration ✅
- **Location**: `backend/services/discord_bot.py` + `backend/services/bot_manager.py`
- **What it does**: Allows personalities to chat via Discord
- **Commands**:
  - `!personality <name>` - Set personality for a channel
  - `!mypersonality <name>` - Set your personal personality (DMs)
  - `!task <type> <data>` - Create autonomous tasks
- **Setup**: Users configure their own bots via web UI (Settings → Chat Bots tab)
  - No admin configuration needed!
  - Each user connects their own Discord bot token

### 4. Telegram Bot Integration ✅
- **Location**: `backend/services/telegram_bot.py` + `backend/services/bot_manager.py`
- **What it does**: Allows personalities to chat via Telegram
- **Commands**:
  - `/start` - Get started
  - `/personality <name>` - Set personality for chat
  - `/mypersonality <name>` - Set your personal personality
  - `/task <type> <message>` - Create autonomous tasks
- **Setup**: Users configure their own bots via web UI (Settings → Chat Bots tab)
  - No admin configuration needed!
  - Each user connects their own Telegram bot token

### 5. WhatsApp Bot Integration ✅
- **Location**: `backend/services/whatsapp_bot.py` + `backend/services/bot_manager.py`
- **What it does**: Allows personalities to chat via WhatsApp (via Twilio)
- **Setup**: Users configure their own bots via web UI (Settings → Chat Bots tab)
  - No admin configuration needed!
  - Each user connects their own Twilio credentials

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables
Add to `.env` (optional - only if you want admin-level bots):
```env
# Memory and Tasks (automatic)
MEMORY_DIR=./memory
TASKS_DIR=./tasks
```

**Note**: Bot tokens are now configured per-user via the web UI! No need to add bot tokens to `.env` unless you want a global admin bot.

### 3. User Bot Configuration (Recommended)

Users can configure their own bots through the web interface:

1. Open the Settings modal (click the settings icon)
2. Go to the "Chat Bots" tab
3. Follow the instructions for each platform:
   - **Discord**: Create a bot at https://discord.com/developers/applications
   - **Telegram**: Create a bot via @BotFather
   - **WhatsApp**: Set up Twilio account
4. Paste your token and click "Connect"

Each user manages their own bot tokens - no admin configuration needed!

### 4. Start the Server
```bash
cd backend
uvicorn main:app --reload
```

The server will automatically:
- Start the 24/7 task scheduler
- Initialize Bot Manager (users can connect their own bots via web UI)

**No bot tokens needed in `.env`** - users configure their own bots through the Settings → Chat Bots tab!

## API Endpoints

### Memory Endpoints
- `GET /api/memory/{personality_id}` - Get memories
- `POST /api/memory/{personality_id}` - Save memory
- `GET /api/memory/{personality_id}/context` - Get full context
- `GET /api/memory/{personality_id}/history` - Get conversation history

### Task Endpoints
- `POST /api/tasks` - Create autonomous task
- `GET /api/tasks` - List tasks
- `GET /api/tasks/{task_id}` - Get specific task
- `DELETE /api/tasks/{task_id}` - Cancel task

### WhatsApp Webhook
- `POST /api/whatsapp/webhook` - Handle WhatsApp messages (Twilio)

## Usage Examples

### Create a Daily Task
```bash
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "personality_id": "cryptobro",
    "task_type": "crypto_price",
    "task_data": {"coin": "bitcoin"},
    "schedule": "daily"
  }'
```

### Save a Memory
```bash
curl -X POST http://localhost:8000/api/memory/default \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user_preference",
    "value": "User prefers dark mode",
    "importance": 2.0
  }'
```

### Get Conversation History
```bash
curl http://localhost:8000/api/memory/default/history?limit=50
```

## How It Works

### Memory System
1. Every conversation is automatically saved
2. Important information is extracted and stored as memories
3. When chatting, the AI automatically retrieves relevant context
4. Memories are ranked by importance and recency
5. No need to remind the AI - it remembers everything

### Task System
1. Tasks are stored in SQLite database
2. Scheduler runs every minute checking for tasks to execute
3. Tasks can be one-time or recurring (cron, daily, hourly, etc.)
4. Each task type has a handler function
5. Tasks run in background without blocking the API

### Chat Bots
1. **Per-user bot instances** - Each user connects their own bot tokens
2. Bot tokens are stored securely in the database (per-user)
3. Each bot maintains personality mappings per channel/user
4. Messages are processed through the same chat endpoint
5. Conversations are saved to memory automatically
6. Bots support all personality features
7. Users can connect/disconnect bots via web UI (Settings → Chat Bots)

## Notes

- Memory database is stored locally in `./memory/memory.db`
- Tasks run in background - they don't block API requests
- Bots are optional - the system works without them
- All features are inspired by OpenClaw's architecture
- The system is designed to run 24/7 autonomously

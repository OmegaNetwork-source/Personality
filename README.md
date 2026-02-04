# AI Personality Platform - Open Source AI for Everyone

A comprehensive AI platform providing text, image, and video generation with customizable personalities - completely free and open-source.

## Features

- 🤖 **Best-in-class coding AI** - Llama 3.1 70B with Cursor-like features (code completion, context awareness, chat)
- 🎨 **Image Generation** - Stable Diffusion/FLUX (no filters, complete freedom)
- 🎬 **Video Generation** - Stable Video Diffusion/AnimateDiff
- 👤 **Personality System** - Customizable AI personas
- 🌐 **Web Interface** - Full-featured web app
- 💻 **Desktop App** - Local hardware acceleration with OpenCLaw integration
- ☁️ **Cloud Deployment** - RunPod-ready configuration
- 🧠 **Persistent Memory** - Remembers all conversations and learns from interactions (inspired by OpenClaw)
- ⚙️ **24/7 Autonomous Tasks** - Runs tasks automatically on schedule without user interaction
- 💬 **Multi-Platform Chat** - Discord, Telegram, and WhatsApp integration

## Architecture

```
┌─────────────┐
│   Website   │
│  (React)    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Backend API    │
│   (FastAPI)     │
└──────┬──────────┘
       │
       ├──► Ollama (Text/Coding)
       ├──► Stable Diffusion (Images)
       └──► Video Generation (Videos)
```

## Setup

### Backend Setup

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Configure services in `.env`:
```
OLLAMA_URL=http://localhost:11434
STABLE_DIFFUSION_URL=http://localhost:7860
VIDEO_GEN_URL=http://localhost:7861
```

3. Run backend:
```bash
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Desktop App Setup

```bash
cd desktop
npm install
npm run build
npm start
```

## RunPod Deployment

See `runpod/` directory for deployment configurations.

## New Features (OpenClaw Integration)

### 🧠 Persistent Memory System
- Automatically saves all conversations
- Remembers user preferences and important facts
- No need to remind the AI - it remembers everything
- Learns from interactions and improves over time

### ⚙️ 24/7 Autonomous Task Execution
- Create tasks that run automatically on schedule
- Supports cron expressions, daily, hourly, and custom schedules
- Task types: chat, web_search, crypto_price, reminder, custom
- Runs in background without blocking the API

### 💬 Multi-Platform Chat Integration
- **Discord**: Full bot integration with personality support
- **Telegram**: Complete bot with commands and personality switching
- **WhatsApp**: Integration via Twilio API

See [OPENCLAW_INTEGRATION.md](backend/OPENCLAW_INTEGRATION.md) for detailed setup instructions.

## License

MIT - Free for everyone, no restrictions.

# Local Setup Guide - CharacterOS

Run everything on your local computer (no RunPod needed!)

## Prerequisites

- ✅ Ollama installed (already done!)
- ✅ Python 3.8+ installed
- ✅ Node.js and npm installed

## Quick Start

### Option 1: Use the startup script (Windows)

```bash
# Just double-click or run:
start_local.bat
```

This will:
- Start Ollama (if not running)
- Start Backend API on port 8000
- Start Frontend on port 3000

### Option 2: Manual start

**1. Start Ollama (if not already running):**
```bash
ollama serve
```
(Ollama usually runs automatically on Windows after installation)

**2. Start Backend:**
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**3. Start Frontend (in a new terminal):**
```bash
cd frontend
npm run dev
```

## Access Your App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Ollama**: http://localhost:11434

## Configuration

The backend automatically uses:
- **Ollama URL**: `http://localhost:11434` (default)
- **Model**: `llama3.1:8b` (default)

To change these, create a `backend/.env` file:
```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

## Troubleshooting

**Backend can't connect to Ollama:**
- Make sure Ollama is running: `ollama list`
- Check if Ollama is on port 11434: `curl http://localhost:11434/api/tags`

**Frontend can't connect to Backend:**
- Make sure backend is running on port 8000
- Check `frontend/src/components/Chat.tsx` - `API_URL` should be `http://localhost:8000` for local

**Model not found:**
- Verify model is installed: `ollama list`
- If missing, pull it: `ollama pull llama3.1:8b`

## Next Steps

Once everything is running locally, you can:
1. Test the chat interface
2. Customize personalities
3. Deploy frontend to Vercel (backend stays local, use ngrok to expose it)

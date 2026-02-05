#!/bin/bash

# Quick Start Script - Start Ollama, Backend API, and ngrok
# Run this after your RunPod server restarts

echo "🚀 Starting CharacterOS services..."

# Install screen if not available
if ! command -v screen &> /dev/null; then
    echo "📦 Installing screen..."
    apt-get update -qq
    apt-get install -y screen
fi

# Navigate to workspace
cd /workspace || cd ~

# 1. Start Ollama (Text Generation)
echo "🦙 Starting Ollama..."
if pgrep -x "ollama" > /dev/null; then
    echo "   ⚠️  Ollama is already running"
else
    screen -dmS ollama bash -c "ollama serve; exec bash"
    sleep 3
    echo "   ✅ Ollama started"
fi

# 2. Start Backend API
echo "🐍 Starting Backend API..."
cd /workspace/Personality/backend || cd ~/Personality/backend || cd backend

# Check if backend is already running
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "   ⚠️  Backend is already running on port 8000"
else
    screen -dmS backend bash -c "python3 -m uvicorn main:app --host 0.0.0.0 --port 8000; exec bash"
    sleep 3
    echo "   ✅ Backend API started"
fi

# 3. Start ngrok
echo "🌐 Starting ngrok..."
if command -v ngrok &> /dev/null; then
    if pgrep -x "ngrok" > /dev/null; then
        echo "   ⚠️  ngrok is already running"
    else
        screen -dmS ngrok bash -c "ngrok http 8000; exec bash"
        sleep 3
        echo "   ✅ ngrok started"
    fi
    echo "   📋 Check ngrok URL at: http://localhost:4040"
else
    echo "   ⚠️  ngrok not found - install it or use RunPod proxy"
fi

echo ""
echo "✅ Services started in screen sessions!"
echo ""
echo "📋 To view/attach to sessions:"
echo "   screen -r ollama    # Text generation (Ollama)"
echo "   screen -r backend   # API server"
echo "   screen -r ngrok      # Tunnel"
echo ""
echo "📊 Check service status:"
echo "   curl http://localhost:8000/  # Backend health"
echo "   curl http://localhost:11434  # Ollama"
echo ""
echo "🔗 Get ngrok URL:"
echo "   curl http://localhost:4040/api/tunnels 2>/dev/null | grep -o '\"public_url\":\"[^\"]*' | head -1 | cut -d'\"' -f4"
echo ""
echo "💡 To list all screen sessions: screen -ls"
echo "💡 To detach from a session: Press Ctrl+A then D"

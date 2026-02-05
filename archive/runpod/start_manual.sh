#!/bin/bash

# Manual Start Script - Simple version without screen
# Run this if the main script doesn't work

echo "🚀 Starting CharacterOS services manually..."

# Navigate to workspace
cd /workspace || cd ~

# 1. Start Ollama
echo "🦙 Starting Ollama..."
if pgrep -x "ollama" > /dev/null 2>&1; then
    echo "   Ollama is already running"
else
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    sleep 3
    echo "   ✅ Ollama started (PID: $!)"
fi

# 2. Start Backend API
echo "🐍 Starting Backend API..."
cd /workspace/Personality/backend || cd ~/Personality/backend || cd backend

if netstat -tuln 2>/dev/null | grep -q ":8000 " || ss -tuln 2>/dev/null | grep -q ":8000 "; then
    echo "   Backend is already running on port 8000"
else
    nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
    sleep 3
    echo "   ✅ Backend started (PID: $!)"
fi

# 3. Start ngrok
echo "🌐 Starting ngrok..."
if command -v ngrok &> /dev/null; then
    if pgrep -x "ngrok" > /dev/null 2>&1; then
        echo "   ngrok is already running"
    else
        nohup ngrok http 8000 > /tmp/ngrok.log 2>&1 &
        sleep 3
        echo "   ✅ ngrok started (PID: $!)"
    fi
else
    echo "   ⚠️  ngrok not found"
fi

echo ""
echo "✅ Services started!"
echo ""
echo "📊 Check service status:"
echo "   curl http://localhost:8000/  # Backend"
echo "   curl http://localhost:11434/api/tags  # Ollama"
echo ""
echo "📝 View logs:"
echo "   tail -f /tmp/ollama.log"
echo "   tail -f /tmp/backend.log"
echo "   tail -f /tmp/ngrok.log"
echo ""
echo "🔗 Get ngrok URL:"
echo "   curl http://localhost:4040/api/tunnels 2>/dev/null | grep -o '\"public_url\":\"[^\"]*' | head -1 | cut -d'\"' -f4"

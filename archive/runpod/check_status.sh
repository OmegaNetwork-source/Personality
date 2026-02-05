#!/bin/bash

# Check Status Script - See what's actually running

echo "🔍 Checking service status..."
echo ""

# Check if processes are running
echo "📊 Running processes:"
echo "Ollama:"
ps aux | grep -E "[o]llama serve" || echo "   ❌ Not running"
echo ""
echo "Backend (uvicorn):"
ps aux | grep -E "[u]vicorn" || echo "   ❌ Not running"
echo ""
echo "ngrok:"
ps aux | grep -E "[n]grok" || echo "   ❌ Not running"
echo ""

# Check ports
echo "🔌 Port status:"
echo "Port 8000 (Backend):"
netstat -tuln 2>/dev/null | grep ":8000 " || ss -tuln 2>/dev/null | grep ":8000 " || echo "   ❌ Not listening"
echo ""
echo "Port 11434 (Ollama):"
netstat -tuln 2>/dev/null | grep ":11434 " || ss -tuln 2>/dev/null | grep ":11434 " || echo "   ❌ Not listening"
echo ""

# Check logs for errors
echo "📝 Recent log errors:"
echo "Backend log (last 10 lines):"
tail -10 /tmp/backend.log 2>/dev/null || echo "   No log file found"
echo ""
echo "Ollama log (last 10 lines):"
tail -10 /tmp/ollama.log 2>/dev/null || echo "   No log file found"
echo ""

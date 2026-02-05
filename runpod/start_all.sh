#!/bin/bash

# Quick Start Script - Start all services in screen sessions
# Run this after your RunPod server restarts

echo "🚀 Starting all CharacterOS services..."

# Navigate to workspace
cd /workspace || cd ~

# 1. Start Ollama (Text Generation)
echo "🦙 Starting Ollama..."
screen -dmS ollama bash -c "ollama serve; exec bash"
sleep 3

# 2. Start Stable Diffusion (Image Generation)
echo "🎨 Starting Stable Diffusion..."
cd /workspace/stable-diffusion-webui || cd ~/stable-diffusion-webui
screen -dmS sd bash -c "./webui.sh --api --listen 0.0.0.0 --port 7860; exec bash"
sleep 5

# 3. Start ComfyUI (Video Generation) - if you have it set up
echo "🎬 Starting ComfyUI (Video)..."
cd /workspace/ComfyUI || cd ~/ComfyUI
if [ -d "ComfyUI" ]; then
    screen -dmS video_gen bash -c "cd ComfyUI && python3 main.py --listen 0.0.0.0 --port 7862; exec bash"
    sleep 3
else
    echo "   ⚠️  ComfyUI not found, skipping video generation"
fi

# 4. Start Backend API
echo "🐍 Starting Backend API..."
cd /workspace/Personality/backend || cd ~/Personality/backend
screen -dmS backend bash -c "python3 -m uvicorn main:app --host 0.0.0.0 --port 8000; exec bash"
sleep 3

# 5. Start ngrok (if installed)
echo "🌐 Starting ngrok..."
if command -v ngrok &> /dev/null; then
    screen -dmS ngrok bash -c "ngrok http 8000; exec bash"
    sleep 2
    echo "   ✅ ngrok started - check http://localhost:4040 for URL"
else
    echo "   ⚠️  ngrok not found, skipping"
fi

echo ""
echo "✅ All services started in screen sessions!"
echo ""
echo "📋 To view/attach to sessions:"
echo "   screen -r ollama    # Text generation"
echo "   screen -r sd        # Image generation"
echo "   screen -r video_gen # Video generation"
echo "   screen -r backend   # API server"
echo "   screen -r ngrok     # Tunnel (if running)"
echo ""
echo "📊 Check service status:"
echo "   curl http://localhost:8000/  # Backend health"
echo "   curl http://localhost:7860   # Stable Diffusion"
echo "   curl http://localhost:7862  # ComfyUI"
echo ""
echo "🔗 Get ngrok URL:"
echo "   curl http://localhost:4040/api/tunnels | grep -o '\"public_url\":\"[^\"]*' | head -1"

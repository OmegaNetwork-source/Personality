#!/bin/bash

# ==========================================
# 🔧 AI Personality Platform - Fix & Start All
# ==========================================

echo "🚀 Starting Comprehensive Fix & Setup..."

# 1. System Dependencies (Fixes missing FFmpeg for video)
echo "📦 Installing system dependencies..."
apt-get update
apt-get install -y ffmpeg git python3 python3-pip python3-venv curl wget screen htop net-tools

# 2. Setup Workspace
cd /workspace
mkdir -p backend/personalities backend/services
mkdir -p logs

# 3. Setup Ollama (Text)
echo "🦙 Checking Ollama..."
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
fi

# 4. Setup Stable Diffusion (Images)
echo "🎨 Checking Stable Diffusion..."
if [ ! -d "stable-diffusion-webui" ]; then
    git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
fi
# Ensure requirements are installed
cd stable-diffusion-webui
pip3 install -r requirements.txt
cd ..

# 5. Setup ComfyUI (Video) - This is often the missing piece!
echo "🎬 Checking ComfyUI (Video Generation)..."
if [ ! -d "ComfyUI" ]; then
    git clone https://github.com/comfyanonymous/ComfyUI.git
fi

# Install ComfyUI dependencies
cd ComfyUI
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip3 install -r requirements.txt

# Install AnimateDiff (Critical for video)
cd custom_nodes
if [ ! -d "ComfyUI-AnimateDiff-Evolved" ]; then
    git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved.git
    cd ComfyUI-AnimateDiff-Evolved
    pip3 install -r requirements.txt
    cd ..
fi
cd ../..

# 6. Setup Backend
echo "🐍 Checking Backend..."
cd backend
pip3 install fastapi uvicorn httpx python-dotenv aiofiles python-multipart websockets openai pillow numpy pydantic
cd ..

# 7. Configure Environment
echo "⚙️ Configuring Environment..."
cat > backend/.env << EOF
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b
STABLE_DIFFUSION_URL=http://localhost:7860
VIDEO_GEN_URL=http://localhost:7861
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=*
EOF

# 8. Start Everything
echo "🔄 Restarting all services..."

# Kill existing
pkill -f ollama
pkill -f python3
pkill -f uvicorn

# Start Ollama
echo "   Starting Ollama..."
ollama serve > /workspace/logs/ollama.log 2>&1 &
sleep 5
ollama pull llama3.1:70b > /workspace/logs/model_pull.log 2>&1 &

# Start Stable Diffusion (API Mode)
echo "   Starting Stable Diffusion..."
cd stable-diffusion-webui
./webui.sh --api --listen 0.0.0.0 --port 7860 --xformers --nowebui > /workspace/logs/sd.log 2>&1 &
cd ..

# Start ComfyUI
echo "   Starting Video Gen (ComfyUI)..."
cd ComfyUI
python3 main.py --listen 0.0.0.0 --port 7861 > /workspace/logs/video.log 2>&1 &
cd ..

# Start Backend
echo "   Starting Backend API..."
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 > /workspace/logs/backend.log 2>&1 &
cd ..

echo "=========================================="
echo "✅ SETUP COMPLETE & SERVICES STARTED"
echo "=========================================="
echo "📊 Status Check:"
echo "   - Text (Ollama): Port 11434"
echo "   - Image (SD):    Port 7860"
echo "   - Video (Comfy): Port 7861"
echo "   - API (Backend): Port 8000"
echo ""
echo "📝 Logs are available in /workspace/logs/"
echo "   tail -f /workspace/logs/backend.log"

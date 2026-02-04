#!/bin/bash

# ==========================================
# 🔧 AI Personality Platform - Fix & Start All
# ==========================================

echo "🚀 Starting Comprehensive Fix & Setup..."

# 1. Path Detection
# -----------------
# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Assuming script is in /runpod folder, the repo root is one level up
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Start in /workspace for heavy tools (SD/Comfy) if it exists, otherwise use repo root
if [ -d "/workspace" ]; then
    TOOLS_DIR="/workspace"
else
    TOOLS_DIR="$REPO_ROOT"
fi

echo "📂 Repo Root:  $REPO_ROOT"
echo "📂 Tools Dir:  $TOOLS_DIR"

# 2. System Dependencies
# ----------------------
echo "📦 Installing system dependencies..."
apt-get update
apt-get install -y ffmpeg git python3 python3-pip python3-venv curl wget screen htop net-tools

# 3. Setup Workspace Directories
mkdir -p "$TOOLS_DIR/logs"

# 4. Setup Ollama (Text)
# ----------------------
echo "🦙 Checking Ollama..."
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
fi

# 5. Setup Stable Diffusion (Images)
# ----------------------------------
echo "🎨 Checking Stable Diffusion..."
cd "$TOOLS_DIR"
if [ ! -d "stable-diffusion-webui" ]; then
    git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
fi
# Ensure requirements are installed
cd stable-diffusion-webui
pip3 install -r requirements.txt

# 6. Setup ComfyUI (Video)
# ------------------------
echo "🎬 Checking ComfyUI (Video Generation)..."
cd "$TOOLS_DIR"
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

# 7. Setup Backend
# ----------------
echo "🐍 Checking Backend..."
cd "$REPO_ROOT/backend"
pip3 install fastapi uvicorn httpx python-dotenv aiofiles python-multipart websockets openai pillow numpy pydantic

# 8. Configure Environment
# ------------------------
echo "⚙️ Configuring Environment..."
cat > .env << EOF
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b
STABLE_DIFFUSION_URL=http://localhost:7860
VIDEO_GEN_URL=http://localhost:7861
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=*
EOF

# 9. Start Everything
# -------------------
echo "🔄 Restarting all services..."

# Kill existing to prevent port conflicts
pkill -f ollama
pkill -f python3
pkill -f uvicorn

# Start Ollama
echo "   Starting Ollama..."
ollama serve > "$TOOLS_DIR/logs/ollama.log" 2>&1 &
sleep 5
ollama pull llama3.1:70b > "$TOOLS_DIR/logs/model_pull.log" 2>&1 &

# Start Stable Diffusion (API Mode)
echo "   Starting Stable Diffusion..."
cd "$TOOLS_DIR/stable-diffusion-webui"
./webui.sh --api --listen 0.0.0.0 --port 7860 --xformers --nowebui > "$TOOLS_DIR/logs/sd.log" 2>&1 &

# Start ComfyUI
echo "   Starting Video Gen (ComfyUI)..."
cd "$TOOLS_DIR/ComfyUI"
python3 main.py --listen 0.0.0.0 --port 7861 > "$TOOLS_DIR/logs/video.log" 2>&1 &

# Start Backend
echo "   Starting Backend API..."
cd "$REPO_ROOT/backend"
uvicorn main:app --host 0.0.0.0 --port 8000 > "$TOOLS_DIR/logs/backend.log" 2>&1 &

echo "=========================================="
echo "✅ SETUP COMPLETE & SERVICES STARTED"
echo "=========================================="
echo "📊 Status Check:"
echo "   - Text (Ollama): Port 11434"
echo "   - Image (SD):    Port 7860"
echo "   - Video (Comfy): Port 7861"
echo "   - API (Backend): Port 8000"
echo ""
echo "📝 Logs are available in $TOOLS_DIR/logs/"
echo "   tail -f $TOOLS_DIR/logs/backend.log"

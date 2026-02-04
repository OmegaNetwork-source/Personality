#!/bin/bash

echo "🚀 Setting up AI Personality Platform on RunPod..."

# Update system
apt-get update && apt-get upgrade -y

# Install dependencies
apt-get install -y curl git python3 python3-pip nvidia-cuda-toolkit

# Install Ollama
echo "📦 Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama service
echo "🔄 Starting Ollama..."
ollama serve &
sleep 5

# Pull recommended models
echo "📥 Downloading AI models (this may take a while)..."
ollama pull llama3.1:70b &
ollama pull codellama:34b &
ollama pull mistral:7b &

# Setup Python backend
echo "🐍 Setting up Python backend..."
cd /workspace/backend || cd backend
pip3 install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << EOF
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b
STABLE_DIFFUSION_URL=http://localhost:7860
VIDEO_GEN_URL=http://localhost:7861
HOST=0.0.0.0
PORT=8000
EOF
fi

# Setup Stable Diffusion (Automatic1111)
echo "🎨 Setting up Stable Diffusion..."
cd /workspace || cd ~
if [ ! -d "stable-diffusion-webui" ]; then
    git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
fi
cd stable-diffusion-webui
pip3 install -r requirements.txt

# Start services in background
echo "🚀 Starting services..."
cd /workspace/backend || cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &

cd /workspace/stable-diffusion-webui || cd ~/stable-diffusion-webui
./webui.sh --api --listen 0.0.0.0 --port 7860 &

echo "✅ Setup complete!"
echo ""
echo "Services running:"
echo "  - Ollama: http://localhost:11434"
echo "  - Backend API: http://localhost:8000"
echo "  - Stable Diffusion: http://localhost:7860"
echo ""
echo "⚠️  Note: Video generation setup requires additional configuration"
echo "📖 See runpod/README.md for full deployment guide"

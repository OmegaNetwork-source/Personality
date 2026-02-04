#!/bin/bash

echo "🚀 Automated Setup for AI Personality Platform"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}📦 Updating system...${NC}"
apt-get update && apt-get upgrade -y
apt-get install -y curl git wget python3 python3-pip screen htop

# Install Ollama
echo -e "${YELLOW}📦 Installing Ollama...${NC}"
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo -e "${GREEN}✓ Ollama already installed${NC}"
fi

# Start Ollama
echo -e "${YELLOW}🔄 Starting Ollama service...${NC}"
pkill ollama 2>/dev/null
ollama serve > /dev/null 2>&1 &
sleep 5

# Verify Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo -e "${GREEN}✓ Ollama is running${NC}"
else
    echo -e "${RED}✗ Ollama failed to start${NC}"
    exit 1
fi

# Setup workspace directory
echo -e "${YELLOW}📁 Setting up workspace...${NC}"
cd /workspace
mkdir -p models/Stable-diffusion
mkdir -p backend/personalities
mkdir -p backend/services

# Download models (user can choose which ones)
echo -e "${YELLOW}📥 Ready to download models...${NC}"
echo -e "${GREEN}You can download models with:${NC}"
echo "  ollama pull llama3.1:70b    # Best coding model (~40GB)"
echo "  ollama pull llama3.2:3b     # Fast testing model (~2GB)"
echo "  ollama pull codellama:34b   # Coding specialist (~20GB)"

# Setup Stable Diffusion
echo -e "${YELLOW}🎨 Setting up Stable Diffusion...${NC}"
cd /workspace

if [ ! -d "stable-diffusion-webui" ]; then
    echo "Cloning Stable Diffusion WebUI..."
    git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
    cd stable-diffusion-webui
    
    # Install PyTorch with CUDA
    pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu121
    
    echo -e "${GREEN}✓ Stable Diffusion cloned${NC}"
    echo -e "${YELLOW}⚠️  First run will download dependencies (5-10 min)${NC}"
else
    echo -e "${GREEN}✓ Stable Diffusion already cloned${NC}"
fi

# Setup Backend
echo -e "${YELLOW}🐍 Setting up Python backend...${NC}"
cd /workspace

# Install Python dependencies
pip3 install fastapi uvicorn httpx python-dotenv aiofiles python-multipart websockets openai pillow numpy pydantic

# Create .env file if it doesn't exist
if [ ! -f /workspace/backend/.env ]; then
    cat > /workspace/backend/.env << EOF
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b
STABLE_DIFFUSION_URL=http://localhost:7860
VIDEO_GEN_URL=http://localhost:7861
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=*
PERSONALITIES_DIR=/workspace/backend/personalities
EOF
    echo -e "${GREEN}✓ Created .env file${NC}"
fi

# Create startup script
cat > /workspace/start_services.sh << 'EOF'
#!/bin/bash
cd /workspace

# Start Ollama
echo "Starting Ollama..."
pkill ollama 2>/dev/null
ollama serve > /tmp/ollama.log 2>&1 &
sleep 5

# Start Stable Diffusion
echo "Starting Stable Diffusion..."
cd /workspace/stable-diffusion-webui
./webui.sh --api --listen 0.0.0.0 --port 7860 --xformers > /tmp/sd.log 2>&1 &

# Start Backend (if files exist)
if [ -f /workspace/backend/main.py ]; then
    echo "Starting Backend API..."
    cd /workspace/backend
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
fi

echo "Services starting..."
echo "Check logs:"
echo "  tail -f /tmp/ollama.log"
echo "  tail -f /tmp/sd.log"
echo "  tail -f /tmp/backend.log"
EOF

chmod +x /workspace/start_services.sh

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Download models: ollama pull llama3.1:70b"
echo "2. Start services: /workspace/start_services.sh"
echo "3. Configure network endpoint in RunPod dashboard (port 8000)"
echo "4. Test: curl http://localhost:8000/"
echo ""
echo "For detailed instructions, see: runpod/QUICK_START.md"

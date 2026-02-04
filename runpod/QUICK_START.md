# Quick Start Guide - RunPod Deployment

## Step 1: Wait for Pod to Deploy ✅
Your pod is currently deploying. Wait until status shows "Running" (green).

## Step 2: Connect to Your Pod

### Option A: SSH (Recommended)
1. In RunPod dashboard, click on your pod
2. Click "Connect" → "SSH" tab
3. Copy the SSH command (looks like: `ssh root@xxx-xxx-xxx.runpod.io -p xxxxx`)
4. Run it in your terminal

### Option B: Web Terminal
1. Click "Connect" → "HTTP Service" or "Terminal"
2. Opens browser-based terminal

## Step 3: Initial Setup

Once connected, run these commands:

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install basic tools
apt-get install -y curl git wget python3 python3-pip

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama in background
ollama serve &
sleep 5
```

## Step 4: Download AI Models

```bash
# Pull the best coding model (Llama 3.1 70B - ~40GB, takes 10-30 min)
ollama pull llama3.1:70b

# Pull a smaller model for testing (optional, faster)
ollama pull llama3.2:3b

# Pull coding-specific model
ollama pull codellama:34b
```

**Note:** Model downloads take time. The 70B model is ~40GB. You can test with smaller models first.

## Step 5: Setup Stable Diffusion

```bash
# Navigate to workspace (persistent storage)
cd /workspace

# Clone Automatic1111 WebUI
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
cd stable-diffusion-webui

# Install dependencies
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# Download a model (SDXL recommended)
mkdir -p models/Stable-diffusion
cd models/Stable-diffusion
wget https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors

# Go back to webui directory
cd /workspace/stable-diffusion-webui

# Start Stable Diffusion API
./webui.sh --api --listen 0.0.0.0 --port 7860 --xformers &
```

**Note:** First startup takes 5-10 minutes to download dependencies.

## Step 6: Setup Backend API

```bash
# Clone your repository (or upload files)
cd /workspace
# If you have git repo:
# git clone <your-repo-url>
# cd "Personality bot"

# Or create the directory structure manually
mkdir -p backend
cd backend

# Install Python dependencies
pip3 install fastapi uvicorn httpx python-dotenv aiofiles python-multipart websockets openai pillow numpy

# Create .env file
cat > .env << EOF
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b
STABLE_DIFFUSION_URL=http://localhost:7860
VIDEO_GEN_URL=http://localhost:7861
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=*
EOF

# Create necessary directories
mkdir -p personalities services

# Copy your backend files here (or use git clone)
# For now, we'll create a minimal version
```

## Step 7: Test Services

```bash
# Test Ollama
curl http://localhost:11434/api/tags

# Test Stable Diffusion (wait for it to fully start)
curl http://localhost:7860

# Test Backend (once running)
curl http://localhost:8000/
```

## Step 8: Configure Network Endpoints

1. Go to RunPod dashboard
2. Click on your pod
3. Go to "Network" tab
4. Create endpoint:
   - **Name**: Backend API
   - **Port**: 8000
   - **Type**: Public HTTP
   - **Path**: /
5. Save and note the public URL (e.g., `https://xxxxx-8000.proxy.runpod.net`)

## Step 9: Start Backend (Keep Running)

```bash
cd /workspace/backend

# Start with nohup to keep running after disconnect
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# Or use screen/tmux for better control
screen -S backend
uvicorn main:app --host 0.0.0.0 --port 8000
# Press Ctrl+A then D to detach
```

## Step 10: Verify Everything Works

```bash
# Check all services are running
ps aux | grep ollama
ps aux | grep webui
ps aux | grep uvicorn

# Test API endpoint
curl https://your-pod-id-8000.proxy.runpod.net/
```

## Step 11: Update Frontend

Update your frontend to point to the RunPod URL:

```typescript
// In frontend/src/App.tsx or create a config file
const API_URL = 'https://your-pod-id-8000.proxy.runpod.net'
```

## Troubleshooting

### Ollama not responding
```bash
# Restart Ollama
pkill ollama
ollama serve &
```

### Stable Diffusion not starting
```bash
# Check if port is in use
netstat -tulpn | grep 7860

# Check logs
tail -f /workspace/stable-diffusion-webui/logs/webui.log
```

### Backend errors
```bash
# Check backend logs
tail -f /workspace/backend/backend.log

# Or if using screen
screen -r backend
```

### Out of memory
- Use smaller models
- Stop unused services
- Check with: `nvidia-smi`

## Next Steps

1. ✅ Test chat endpoint
2. ✅ Test image generation
3. ✅ Set up video generation (optional, more complex)
4. ✅ Deploy frontend (separate hosting or same pod)
5. ✅ Set up monitoring

## Important Notes

- **Models are stored in `/workspace`** - this persists between restarts
- **Use `screen` or `tmux`** to keep services running after disconnect
- **Monitor GPU usage**: `watch -n 1 nvidia-smi`
- **Save costs**: Stop pod when not in use (models persist in volume)

## Quick Commands Reference

```bash
# Check GPU
nvidia-smi

# Check disk space
df -h

# Check running services
ps aux | grep -E 'ollama|webui|uvicorn'

# View logs
tail -f /workspace/backend/backend.log
tail -f /workspace/stable-diffusion-webui/logs/webui.log

# Restart everything
pkill ollama && ollama serve &
cd /workspace/stable-diffusion-webui && ./webui.sh --api --listen 0.0.0.0 --port 7860 &
cd /workspace/backend && uvicorn main:app --host 0.0.0.0 --port 8000 &
```

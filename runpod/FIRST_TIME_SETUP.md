# First Time Setup - Step by Step

## ✅ Step 1: Wait for Pod to be "Running"
- Check RunPod dashboard
- Status should show green "Running"
- Note your pod ID

## ✅ Step 2: Connect via SSH

**In RunPod Dashboard:**
1. Click on your pod
2. Click "Connect" button
3. Go to "SSH" tab
4. Copy the SSH command (looks like: `ssh root@xxx.runpod.io -p xxxxx`)
5. Paste in your terminal and press Enter

**Or use Web Terminal:**
- Click "Connect" → "Terminal" (opens in browser)

## ✅ Step 3: Run Automated Setup

Once connected, run:

```bash
cd /workspace
curl -fsSL https://raw.githubusercontent.com/your-repo/setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```

**OR manually copy the setup script:**

```bash
# Copy and paste the entire setup_automated.sh content
# Or upload it via RunPod file manager
```

## ✅ Step 4: Download AI Models

This is the longest step (10-30 minutes for large models):

```bash
# Best coding model (recommended, ~40GB, takes 20-30 min)
ollama pull llama3.1:70b

# OR start with smaller model for testing (faster, ~2GB)
ollama pull llama3.2:3b
```

**While that downloads, you can continue with next steps in another terminal.**

## ✅ Step 5: Start Stable Diffusion

```bash
cd /workspace/stable-diffusion-webui

# First time: Downloads dependencies (5-10 min)
# Then starts the service
./webui.sh --api --listen 0.0.0.0 --port 7860 --xformers &
```

**Wait for:** "Running on local URL: http://0.0.0.0:7860"

## ✅ Step 6: Upload Backend Files

You need to get your backend code onto the pod. Options:

**Option A: Git Clone (if you have a repo)**
```bash
cd /workspace
git clone <your-repo-url>
cd "Personality bot"
```

**Option B: Upload via RunPod File Manager**
1. In RunPod dashboard → Your pod → "Files" tab
2. Upload the `backend/` folder to `/workspace/backend/`

**Option C: Copy-paste files**
- Use `nano` or `vi` to create files
- Or use SCP from your local machine

## ✅ Step 7: Start Backend API

```bash
cd /workspace/backend

# Install dependencies (if not done)
pip3 install -r requirements.txt

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

# Start backend (use screen to keep it running)
screen -S backend
uvicorn main:app --host 0.0.0.0 --port 8000
# Press Ctrl+A then D to detach
```

## ✅ Step 8: Configure Network Endpoint

**In RunPod Dashboard:**
1. Click your pod
2. Go to "Network" tab
3. Click "Add Endpoint"
4. Configure:
   - **Name**: Backend API
   - **Port**: 8000
   - **Type**: Public HTTP
   - **Path**: /
5. Click "Save"
6. **Copy the public URL** (e.g., `https://xxxxx-8000.proxy.runpod.net`)

## ✅ Step 9: Test Everything

```bash
# Test Ollama
curl http://localhost:11434/api/tags

# Test Stable Diffusion (wait for it to start)
curl http://localhost:7860

# Test Backend
curl http://localhost:8000/
curl https://your-pod-url-8000.proxy.runpod.net/
```

## ✅ Step 10: Update Frontend

Update your frontend to use the RunPod URL:

```typescript
// In frontend/src/App.tsx or create config.ts
export const API_URL = 'https://your-pod-url-8000.proxy.runpod.net'
```

## 🎉 You're Done!

Your API should now be accessible at:
- **Local**: `http://localhost:8000`
- **Public**: `https://your-pod-url-8000.proxy.runpod.net`
- **Docs**: `https://your-pod-url-8000.proxy.runpod.net/docs`

## Quick Commands Reference

```bash
# Check what's running
ps aux | grep -E 'ollama|webui|uvicorn'

# Check GPU usage
nvidia-smi

# View logs
tail -f /tmp/ollama.log
tail -f /tmp/sd.log
screen -r backend  # For backend logs

# Restart services
pkill ollama && ollama serve &
cd /workspace/stable-diffusion-webui && ./webui.sh --api --listen 0.0.0.0 --port 7860 &
screen -r backend  # Then restart uvicorn
```

## Troubleshooting

**"Connection refused" errors:**
- Service not started yet
- Check if process is running: `ps aux | grep ollama`

**"Out of memory" errors:**
- Use smaller models
- Check GPU: `nvidia-smi`

**"Port already in use":**
- Kill existing process: `pkill -f webui` or `pkill -f uvicorn`

**Services stop after disconnecting:**
- Use `screen` or `tmux` to keep them running
- Or use `nohup` command

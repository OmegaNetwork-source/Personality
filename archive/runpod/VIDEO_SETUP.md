# Video Generation Setup Guide

This guide will help you set up video generation on your RunPod server.

## 🎬 Options

### Option 1: ComfyUI with AnimateDiff (Recommended - Easier)
- **Pros**: Easier setup, good quality, active community
- **Cons**: Slightly less realistic than SVD
- **Best for**: General video generation, animations

### Option 2: Stable Video Diffusion (SVD)
- **Pros**: More realistic videos, better for image-to-video
- **Cons**: More complex setup, larger models
- **Best for**: Realistic video generation from images

## 🚀 Quick Setup (AnimateDiff - Recommended)

### Step 1: Run Setup Script

```bash
cd /workspace
chmod +x setup_video_gen_simple.sh
./setup_video_gen_simple.sh
```

### Step 2: Start Video Generation Service

```bash
# Using screen (recommended)
screen -S video_gen
cd /workspace
./start_video_gen.sh
# Press Ctrl+A then D to detach
```

### Step 3: Verify It's Running

```bash
# Check if service is running
curl http://localhost:7861

# Or check processes
ps aux | grep ComfyUI
```

### Step 4: Update Backend Configuration

Make sure your backend `.env` has:
```env
VIDEO_GEN_URL=http://localhost:7861
```

## 🔧 Manual Setup (Stable Video Diffusion)

If you prefer SVD for more realistic videos:

### Step 1: Run Setup Script

```bash
cd /workspace
chmod +x setup_video_gen.sh
./setup_video_gen.sh
```

### Step 2: Download SVD Model

You need to download the Stable Video Diffusion model from HuggingFace:

```bash
cd /workspace/ComfyUI/models/checkpoints
# Option 1: Use huggingface-cli
pip3 install huggingface_hub
huggingface-cli download stabilityai/stable-video-diffusion-img2vid --local-dir .

# Option 2: Manual download
# Visit: https://huggingface.co/stabilityai/stable-video-diffusion-img2vid
# Download svd.safetensors to this directory
```

### Step 3: Start Service

```bash
screen -S video_gen
cd /workspace
./start_video_gen.sh
# Press Ctrl+A then D to detach
```

## 🧪 Testing Video Generation

### Test via API

```bash
# Test health check
curl http://localhost:7861/

# Test via backend API
curl -X POST http://localhost:8000/api/video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over the ocean",
    "duration": 4,
    "fps": 24
  }'
```

### Test Image-to-Video

```bash
curl -X POST http://localhost:8000/api/video/generate-from-image \
  -F "file=@/path/to/image.jpg" \
  -F "duration=4"
```

## 📊 Resource Requirements

- **GPU**: RTX 3090 or better (24GB+ VRAM recommended)
- **RAM**: 32GB+ recommended
- **Storage**: 50GB+ for models
- **Time**: First generation takes 2-5 minutes (model loading)

## 🐛 Troubleshooting

### Service won't start
```bash
# Check if port is in use
netstat -tulpn | grep 7861

# Kill existing process
pkill -f ComfyUI

# Check logs
tail -f /workspace/ComfyUI/logs/*.log
```

### Out of memory errors
- Reduce video resolution in API calls
- Close other services temporarily
- Use a GPU with more VRAM

### Models not downloading
- Check internet connection
- Verify HuggingFace access
- Try manual download

## 🔗 Useful Links

- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)
- [AnimateDiff Extension](https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved)
- [Stable Video Diffusion](https://huggingface.co/stabilityai/stable-video-diffusion-img2vid)
- [ComfyUI API Docs](https://github.com/comfyanonymous/ComfyUI/wiki/API)

## ✅ Verification Checklist

- [ ] ComfyUI installed and running
- [ ] Service accessible at http://localhost:7861
- [ ] Backend can connect to video service
- [ ] Test generation works
- [ ] Models downloaded (check ~/.cache/huggingface or ComfyUI/models)

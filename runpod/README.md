# RunPod Deployment Guide

This guide explains how to deploy the AI Personality Platform on RunPod.

## Prerequisites

- RunPod account with credits
- Basic knowledge of Docker and containerization

## Quick Start

### Option 1: Using RunPod Templates (Recommended)

1. Go to RunPod and create a new pod
2. Select a GPU (RTX 3090, RTX 4090, or A100 recommended)
3. Use the "Ollama" template or "Custom" template
4. Once the pod is running, SSH into it
5. Clone this repository
6. Run the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

1. **Create RunPod Pod**
   - GPU: RTX 3090 or better (24GB+ VRAM recommended)
   - Storage: 100GB+ (for models)
   - Network: Public endpoint enabled

2. **SSH into Pod**
   ```bash
   ssh root@<pod-ip>
   ```

3. **Install Ollama**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ollama serve &
   ```

4. **Pull Models**
   ```bash
   ollama pull llama3.1:70b
   ollama pull codellama:34b
   ```

5. **Setup Stable Diffusion**
   ```bash
   # Using Automatic1111
   git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
   cd stable-diffusion-webui
   ./webui.sh --api --listen 0.0.0.0 --port 7860 &
   ```

6. **Setup Video Generation**
   ```bash
   # Using Stable Video Diffusion
   git clone https://github.com/Stability-AI/generative-models
   # Follow setup instructions for SVD
   ```

7. **Deploy Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000 &
   ```

8. **Configure Network Endpoints**
   - In RunPod dashboard, create network endpoints:
     - Backend API: Port 8000
     - Ollama: Port 11434 (optional, can be internal)
     - Stable Diffusion: Port 7860 (optional)
     - Video Gen: Port 7861 (optional)

## Environment Variables

Create a `.env` file in the backend directory:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b
STABLE_DIFFUSION_URL=http://localhost:7860
VIDEO_GEN_URL=http://localhost:7861
HOST=0.0.0.0
PORT=8000
```

## Cost Optimization

- **Start/Stop Pods**: Only run when needed to save costs
- **Use Spot Instances**: 50-70% cheaper than on-demand
- **Monitor Usage**: Track GPU hours to optimize spending
- **Model Selection**: Smaller models = faster = less GPU time

## Recommended GPU Configurations

### Budget Setup
- GPU: RTX 3090 (24GB)
- Cost: ~$0.29/hour
- Good for: Text + Image generation

### Recommended Setup
- GPU: RTX 4090 (24GB)
- Cost: ~$0.39/hour
- Good for: All features, faster responses

### High-End Setup
- GPU: A100 (40GB/80GB)
- Cost: ~$1.29/hour
- Good for: Large models, maximum performance

## Troubleshooting

### Out of Memory Errors
- Use smaller models
- Reduce batch sizes
- Enable model quantization

### Slow Generation
- Ensure GPU is being used (check `nvidia-smi`)
- Use smaller models
- Reduce image/video resolution

### Network Issues
- Check RunPod network endpoint configuration
- Verify firewall rules
- Test connectivity from external IP

## Security Notes

- Use API keys for backend authentication
- Restrict network endpoints to specific IPs if possible
- Regularly update dependencies
- Monitor for unusual activity

## Support

For issues, check:
- RunPod documentation
- Ollama documentation
- Stable Diffusion documentation

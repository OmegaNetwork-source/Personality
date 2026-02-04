# Complete Setup Guide

This guide will help you set up the entire AI Personality Platform.

## 🎯 Overview

This platform provides:
- **Text Generation**: Best-in-class coding AI (Llama 3.1 70B) with Cursor-like features
- **Image Generation**: Stable Diffusion (no filters, complete freedom)
- **Video Generation**: Stable Video Diffusion/AnimateDiff
- **Personality System**: Customizable AI personas
- **Web Interface**: Full-featured React app
- **Desktop App**: Electron app with OpenCLaw integration for local acceleration

## 📋 Prerequisites

### For Local Development:
- Python 3.11+
- Node.js 18+
- GPU (optional but recommended for image/video generation)
- 16GB+ RAM recommended

### For RunPod Deployment:
- RunPod account with credits
- Basic Docker knowledge

## 🚀 Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your service URLs

# Run backend
uvicorn main:app --reload
```

### 2. Install Ollama (for text generation)

**Linux/Mac:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1:70b
```

**Windows:**
Download from https://ollama.com/download

### 3. Install Stable Diffusion (for image generation)

```bash
# Option 1: Automatic1111 WebUI
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
cd stable-diffusion-webui
./webui.sh --api --listen 0.0.0.0 --port 7860
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 5. Desktop App (Optional)

```bash
cd desktop
npm install
npm run dev  # Development mode
npm run build  # Build for production
```

## ☁️ RunPod Deployment

See `runpod/README.md` for detailed deployment instructions.

Quick steps:
1. Create RunPod pod with GPU (RTX 3090+ recommended)
2. SSH into pod
3. Run `runpod/setup.sh`
4. Configure network endpoints in RunPod dashboard

## 🔧 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:70b

# Stable Diffusion
STABLE_DIFFUSION_URL=http://localhost:7860

# Video Generation
VIDEO_GEN_URL=http://localhost:7861

# Server
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=http://localhost:3000
```

### Frontend Configuration

Edit `frontend/src/App.tsx` to change API URL if needed:
```typescript
const API_URL = 'http://localhost:8000'  // Change for production
```

## 🎨 Features

### Text/Chat
- Multiple personalities
- Streaming responses
- Context-aware conversations

### Code Assistant (Cursor-like)
- Code completion
- Code explanation
- Code refactoring
- Language detection

### Image Generation
- No filters - complete freedom
- Customizable size, steps, guidance
- Negative prompts supported

### Video Generation
- Text-to-video
- Image-to-video
- Custom duration and FPS

## 🐛 Troubleshooting

### Backend won't start
- Check if ports 8000, 11434, 7860 are available
- Verify Python version (3.11+)
- Check .env file exists and is configured

### Ollama not responding
- Ensure Ollama is running: `ollama serve`
- Check if model is downloaded: `ollama list`
- Verify OLLAMA_URL in .env

### Image generation fails
- Ensure Stable Diffusion is running
- Check GPU availability (nvidia-smi)
- Verify STABLE_DIFFUSION_URL in .env

### Frontend can't connect
- Check CORS_ORIGINS in backend .env
- Verify backend is running on correct port
- Check browser console for errors

## 📚 API Documentation

Once backend is running, visit:
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/

## 🎯 Next Steps

1. **Customize Personalities**: Edit files in `backend/personalities/`
2. **Add Models**: Pull more Ollama models as needed
3. **Deploy**: Use RunPod for cloud deployment
4. **Extend**: Add more features as needed

## 🤝 Contributing

This is an open-source project. Feel free to:
- Report issues
- Suggest features
- Submit pull requests
- Share with others who can't afford AI services

## 📝 License

MIT - Free for everyone, no restrictions.

## 💡 Tips

- Start with smaller models for testing
- Use GPU for faster generation
- Monitor resource usage
- Start/stop RunPod pods to save costs
- Customize personalities for your use case

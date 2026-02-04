# Deployment Guide

## RunPod Deployment (Recommended for High-End Server)

### Step 1: Create RunPod Pod

1. Go to [RunPod](https://www.runpod.io)
2. Create a new pod
3. Select GPU:
   - **Budget**: RTX 3090 (24GB) - $0.29/hour
   - **Recommended**: RTX 4090 (24GB) - $0.39/hour
   - **High-End**: A100 (40GB+) - $1.29/hour
4. Storage: 100GB+ (for models)
5. Enable public network endpoint

### Step 2: Setup

SSH into your pod and run:

```bash
# Clone repository
git clone <your-repo-url>
cd "Personality bot"

# Make setup script executable
chmod +x runpod/setup.sh

# Run setup
./runpod/setup.sh
```

### Step 3: Configure Network Endpoints

In RunPod dashboard:
1. Go to your pod
2. Click "Network" tab
3. Create endpoints:
   - **Backend API**: Port 8000 (Public)
   - **Ollama**: Port 11434 (Optional, can be internal)
   - **Stable Diffusion**: Port 7860 (Optional)
   - **Video Gen**: Port 7861 (Optional)

### Step 4: Update Frontend

Update `frontend/src/App.tsx` with your RunPod endpoint:

```typescript
const API_URL = 'https://your-pod-id.runpod.net:8000'
```

### Step 5: Test

Visit your RunPod endpoint:
- API: `https://your-pod-id.runpod.net:8000`
- Docs: `https://your-pod-id.runpod.net:8000/docs`

## Alternative: VPS Deployment

### DigitalOcean / Linode / Vultr

1. Create VPS (8GB+ RAM, 4+ cores)
2. Install Docker:
```bash
curl -fsSL https://get.docker.com | sh
```

3. Clone and deploy:
```bash
git clone <your-repo-url>
cd "Personality bot"
docker-compose -f runpod/docker-compose.yml up -d
```

4. Configure firewall:
```bash
ufw allow 8000/tcp
ufw allow 11434/tcp
ufw allow 7860/tcp
```

## Desktop App Distribution

### Build for Windows
```bash
cd desktop
npm run build
# Output in desktop/release/
```

### Build for Mac
```bash
cd desktop
npm run build
# Output in desktop/release/
```

### Build for Linux
```bash
cd desktop
npm run build
# Output in desktop/release/
```

## Production Considerations

### Security
- Add API authentication
- Use HTTPS (Let's Encrypt)
- Rate limiting
- Input validation

### Performance
- Use CDN for frontend
- Enable caching
- Load balancing for high traffic
- Database for conversation history

### Monitoring
- Set up logging
- Monitor GPU usage
- Track costs
- Alert on errors

## Cost Optimization

### RunPod
- Use spot instances (50-70% cheaper)
- Start/stop pods when not in use
- Monitor GPU hours
- Use smaller models when possible

### VPS
- Choose right-sized instances
- Use reserved instances for 24/7
- Monitor resource usage
- Scale down when possible

## Scaling

### Horizontal Scaling
- Multiple backend instances
- Load balancer
- Shared model storage

### Vertical Scaling
- Upgrade GPU
- More RAM
- Faster storage (NVMe)

## Backup

### Models
- Backup model files
- Use RunPod volumes
- Regular snapshots

### Configuration
- Version control
- Environment variable backups
- Document changes

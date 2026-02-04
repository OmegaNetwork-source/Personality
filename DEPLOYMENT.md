# Deployment Guide - CharacterOS

This guide will help you deploy CharacterOS to production for showcasing.

## Architecture Overview

- **Frontend**: Deploy to Vercel (free, easy, fast)
- **Backend**: Keep running on RunPod (your GPU server)
- **Connection**: Frontend connects to backend via ngrok or RunPod proxy URL

## Step 1: Deploy Frontend to Vercel

### Option A: Deploy via GitHub (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel**:
   - Visit https://vercel.com
   - Sign up/Login with GitHub
   - Click "Add New Project"
   - Import your GitHub repository: `OmegaNetwork-source/Personality`

3. **Configure Vercel Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (IMPORTANT!)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL = https://your-ngrok-url.ngrok-free.dev
     ```
   - Replace with your actual ngrok URL or RunPod proxy URL

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at `your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No (first time)
# - Project name? characteros (or your choice)
# - Directory? ./
# - Override settings? No

# Set environment variable
vercel env add VITE_API_URL
# Enter your ngrok URL when prompted
```

## Step 2: Keep Backend Running on RunPod

### Make sure your backend is running:

```bash
# SSH into your RunPod or use web terminal

# Check if backend is running
ps aux | grep uvicorn

# If not running, start it:
cd /workspace/Personality/backend
screen -S backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
# Press Ctrl+A then D to detach
```

### Keep ngrok running:

```bash
# Check if ngrok is running
ps aux | grep ngrok

# If not, start it:
screen -S ngrok
ngrok http 8000
# Press Ctrl+A then D to detach

# Get your ngrok URL
curl http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | head -1
```

### Alternative: Use RunPod Proxy URL

If you have RunPod proxy enabled, you can use that instead of ngrok:
- Format: `https://your-pod-id-8000.proxy.runpod.net`
- Set this as `VITE_API_URL` in Vercel

## Step 3: Update Environment Variables

After deployment, update Vercel environment variables if your ngrok URL changes:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `VITE_API_URL` with your current backend URL
3. Redeploy (Vercel will auto-redeploy on git push, or manually trigger)

## Step 4: Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `characteros.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

## Troubleshooting

### Frontend can't connect to backend:
- ✅ Check ngrok is running: `curl http://localhost:4040/api/tunnels`
- ✅ Check backend is running: `curl http://localhost:8000/`
- ✅ Verify `VITE_API_URL` in Vercel matches your ngrok URL
- ✅ Check CORS settings in backend (should allow all origins)

### Build fails on Vercel:
- ✅ Make sure `Root Directory` is set to `frontend` in Vercel settings
- ✅ Check that `package.json` exists in `frontend/` directory
- ✅ Verify all dependencies are in `package.json`

### ngrok URL changes:
- ngrok free tier gives you a new URL each time you restart
- Update `VITE_API_URL` in Vercel when it changes
- Or upgrade to ngrok paid plan for static URL

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and linked to GitHub
- [ ] Root directory set to `frontend` in Vercel
- [ ] Environment variable `VITE_API_URL` set in Vercel
- [ ] Backend running on RunPod
- [ ] ngrok running (or RunPod proxy configured)
- [ ] Test the deployed site
- [ ] Share your live URL! 🚀

## Production URLs

After deployment, you'll have:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-ngrok-url.ngrok-free.dev` (or RunPod proxy)

Your frontend will automatically connect to your backend using the `VITE_API_URL` environment variable.

# Render Deployment Guide - Backend API

This guide will help you deploy the CharacterOS backend to Render.

## Prerequisites

- ✅ Render account (free tier available)
- ✅ GitHub repository with your code
- ✅ Ollama running somewhere (local or cloud)

## Important Note: Ollama on Render

⚠️ **Render free tier doesn't support GPU**, and Ollama needs significant resources. You have two options:

### Option 1: Keep Ollama Local (Recommended for now)
- Run Ollama on your local machine
- Use ngrok to expose it: `ngrok http 11434`
- Set `OLLAMA_URL` in Render to your ngrok URL

### Option 2: Use External Ollama Service
- Deploy Ollama to a GPU cloud service (RunPod, Vast.ai, etc.)
- Set `OLLAMA_URL` in Render to that service URL

## Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

## Step 2: Create Render Web Service

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**:
   - Select `OmegaNetwork-source/Personality`
   - Click "Connect"

4. **Configure the service**:
   - **Name**: `characteros-backend` (or your choice)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend` ⚠️ **IMPORTANT!**
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
     - ⚠️ Render uses `$PORT` environment variable, not hardcoded 8000

## Step 3: Set Environment Variables

Go to **Environment** tab in Render and add:

### Required Variables:

```env
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
# OR if using ngrok: OLLAMA_URL=https://your-ngrok-url.ngrok-free.app
# OR if using cloud Ollama: OLLAMA_URL=https://your-ollama-service.com

OLLAMA_MODEL=tinyllama
# OR: llama3.1:8b, phi, etc.

# CORS Configuration (allow your Vercel frontend)
CORS_ORIGINS=https://your-project.vercel.app,http://localhost:3000
# OR use * for all origins: CORS_ORIGINS=*

# Port (Render sets this automatically, but you can override)
PORT=8000
```

### Optional Variables:

```env
# Brave Search API (for web search feature)
BRAVE_API_KEY=your-brave-api-key

# CoinGecko API (for crypto prices)
COINGECKO_API_KEY=your-coingecko-api-key

# Discord Bot (if using)
DISCORD_BOT_TOKEN=your-discord-token

# Telegram Bot (if using)
TELEGRAM_BOT_TOKEN=your-telegram-token

# WhatsApp/Twilio (if using)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

## Step 4: Update Start Command

⚠️ **CRITICAL**: Render uses dynamic port via `$PORT` environment variable.

Update the **Start Command** in Render settings:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

If your `main.py` doesn't read `$PORT`, you may need to update it. Check if it uses:
```python
port = int(os.getenv("PORT", "8000"))
```

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Build your service
   - Deploy it

3. Wait for deployment to complete (usually 2-5 minutes)

4. Your backend will be live at: `https://your-service-name.onrender.com`

## Step 6: Update Vercel Frontend

Once your Render backend is deployed:

1. **Get your Render URL**: `https://your-service-name.onrender.com`

2. **Update Vercel Environment Variable**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update `VITE_API_URL` to: `https://your-service-name.onrender.com`
   - Redeploy your Vercel project

## Step 7: Test Your Deployment

1. **Health Check**: Visit `https://your-service-name.onrender.com/`
   - Should return API info

2. **API Docs**: Visit `https://your-service-name.onrender.com/docs`
   - Should show FastAPI documentation

3. **Test Chat Endpoint**: 
   ```bash
   curl -X POST https://your-service-name.onrender.com/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "hi", "personality": "default"}'
   ```

## Troubleshooting

### Build Fails

**Issue**: "Module not found" or import errors
- ✅ Check `Root Directory` is set to `backend`
- ✅ Verify `requirements.txt` exists in `backend/` directory
- ✅ Check build logs for specific errors

**Issue**: "Port already in use"
- ✅ Make sure start command uses `$PORT` not hardcoded `8000`

### Service Won't Start

**Issue**: "Ollama connection failed"
- ✅ Check `OLLAMA_URL` is correct
- ✅ If using ngrok, make sure ngrok is running
- ✅ Test Ollama URL: `curl https://your-ollama-url/api/tags`

**Issue**: "CORS errors" from frontend
- ✅ Add your Vercel URL to `CORS_ORIGINS`
- ✅ Or set `CORS_ORIGINS=*` for all origins

### Slow Responses

**Issue**: Requests timeout
- ⚠️ Render free tier spins down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes ~30 seconds (cold start)
- 💡 Upgrade to paid plan for always-on service

### Personality Files Not Found

**Issue**: "Personality not found" errors
- ✅ Make sure `personalities/` directory is in your repository
- ✅ Check that personality JSON files are committed to git

## Render Free Tier Limitations

- ⚠️ **Spins down after 15 minutes** of inactivity
- ⚠️ **Cold start** takes ~30 seconds
- ⚠️ **No GPU** - can't run Ollama directly
- ⚠️ **512MB RAM** - limited for large models
- 💡 **Paid plans** start at $7/month for always-on service

## Recommended Setup

For best performance:

1. **Backend on Render**: Deploy FastAPI backend to Render
2. **Ollama Local**: Keep Ollama running on your local machine
3. **ngrok for Ollama**: Expose local Ollama via ngrok
4. **Frontend on Vercel**: Deploy React frontend to Vercel
5. **Connect Everything**: 
   - Vercel → Render backend
   - Render backend → ngrok Ollama

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web service created with correct root directory (`backend`)
- [ ] Environment variables set (especially `OLLAMA_URL`)
- [ ] Start command uses `$PORT`
- [ ] CORS configured for Vercel domain
- [ ] Service deployed successfully
- [ ] Health check passes
- [ ] Vercel `VITE_API_URL` updated to Render URL
- [ ] Test end-to-end from Vercel frontend

## Production URLs

After deployment:
- **Backend**: `https://your-service-name.onrender.com`
- **Frontend**: `https://your-project.vercel.app`
- **API Docs**: `https://your-service-name.onrender.com/docs`

Your frontend will connect to your Render backend automatically via `VITE_API_URL`!

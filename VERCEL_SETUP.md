# Vercel Configuration Guide

## Current Setup

The frontend uses the `VITE_API_URL` environment variable with a fallback to `http://localhost:8000` for local development.

## Local Development (Current Setup)

**No changes needed!** The code already defaults to `http://localhost:8000` when `VITE_API_URL` is not set.

- Frontend runs on: `http://localhost:3000` (or port from Vite)
- Backend runs on: `http://localhost:8000`
- API URL: Automatically uses `http://localhost:8000`

## Vercel Production Deployment

Since you're running the backend locally, you have two options:

### Option 1: Keep Backend Local (Current Setup)

**For local testing only:**
- Frontend on Vercel will NOT be able to connect to your local backend
- This setup only works when both frontend and backend run locally

**Vercel Environment Variables:**
- You can leave `VITE_API_URL` unset or remove it
- The frontend will try to use `http://localhost:8000` (won't work from Vercel)

### Option 2: Use ngrok or Public Backend URL

**If you want Vercel frontend to connect to your local backend:**

1. **Start ngrok** (or use another tunnel service):
   ```bash
   ngrok http 8000
   ```

2. **Get your ngrok URL** (e.g., `https://abc123.ngrok-free.app`)

3. **Set Vercel Environment Variable:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add/Update:
     ```
     VITE_API_URL = https://abc123.ngrok-free.app
     ```
   - Make sure to select all environments (Production, Preview, Development)

4. **Redeploy** your Vercel project for changes to take effect

### Option 3: Deploy Backend to Cloud (Recommended)

If you deploy your backend to Render (or Railway, Fly.io, etc.):

1. **Deploy backend to Render** (see `RENDER_DEPLOYMENT.md` for full guide)

2. **Set Vercel Environment Variable:**
   ```
   VITE_API_URL = https://your-service-name.onrender.com
   ```

3. **Update backend CORS** in Render environment variables:
   ```
   CORS_ORIGINS=https://your-project.vercel.app,http://localhost:3000
   ```

**See `RENDER_DEPLOYMENT.md` for complete Render setup instructions!**

## Quick Reference

| Setup | Frontend | Backend | VITE_API_URL |
|------|----------|---------|--------------|
| **Local Dev** | `localhost:3000` | `localhost:8000` | Not needed (defaults) |
| **Vercel + Local** | `your-app.vercel.app` | `localhost:8000` | ngrok URL required |
| **Vercel + Cloud** | `your-app.vercel.app` | `cloud-backend.com` | Cloud backend URL |

## Current Code Status

✅ **Already configured correctly:**
- All components use: `import.meta.env.VITE_API_URL || 'http://localhost:8000'`
- Local development works out of the box
- No code changes needed

⚠️ **For Vercel deployment:**
- You MUST set `VITE_API_URL` environment variable in Vercel
- Use ngrok URL if backend is local
- Use cloud backend URL if backend is deployed

## How to Update Vercel Environment Variables

1. Go to https://vercel.com
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add or edit:
   - **Name**: `VITE_API_URL`
   - **Value**: Your backend URL (ngrok or cloud)
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your project (or wait for next deployment)

## Testing

After updating Vercel environment variables:
1. Trigger a new deployment (push to GitHub or manually redeploy)
2. Check browser console on Vercel site
3. Verify API calls go to correct URL

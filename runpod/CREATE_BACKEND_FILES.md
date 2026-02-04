# Create Backend Files on RunPod

Copy and paste these commands into your RunPod terminal:

## Step 1: Create Directory Structure

```bash
cd /workspace
mkdir -p backend/services backend/personalities
```

## Step 2: Create requirements.txt

```bash
cat > /workspace/backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
httpx==0.25.2
python-dotenv==1.0.0
aiofiles==23.2.1
python-multipart==0.0.6
websockets==12.0
openai==1.3.7
pillow==10.1.0
numpy==1.26.2
EOF
```

## Step 3: Create services/__init__.py

```bash
touch /workspace/backend/services/__init__.py
```

## Step 4: Use RunPod File Manager (EASIEST)

Instead of creating files manually, use RunPod's file manager:

1. Go to RunPod dashboard → Your pod → "Files" tab
2. Navigate to `/workspace/backend/`
3. Create files using the web editor:
   - Click "New File"
   - Name it (e.g., `main.py`)
   - Paste the content
   - Save

## OR: Download from GitHub

If you have the files in a GitHub repo:

```bash
cd /workspace
git clone <your-repo-url>
# Or download as zip and extract
```

## Files You Need:

1. `backend/main.py` - Main FastAPI app
2. `backend/services/ollama_service.py` - Ollama integration
3. `backend/services/image_service.py` - Image generation
4. `backend/services/video_service.py` - Video generation  
5. `backend/services/personality_service.py` - Personality system
6. `backend/services/__init__.py` - Empty file
7. `backend/personalities/*.json` - Personality files (optional, auto-created)

The easiest way is to use RunPod's File Manager to create/edit files directly in the browser!

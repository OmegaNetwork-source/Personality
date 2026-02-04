#!/bin/bash
# Helper script to upload backend files to RunPod
# Run this from your LOCAL machine (not on RunPod)

echo "📤 Upload Backend Files to RunPod"
echo "=================================="
echo ""
echo "This script helps you upload backend files to your RunPod pod."
echo ""
read -p "Enter your RunPod pod SSH command (e.g., root@xxx.runpod.io -p xxxxx): " SSH_CMD

if [ -z "$SSH_CMD" ]; then
    echo "Error: SSH command required"
    exit 1
fi

echo ""
echo "Uploading backend files..."
echo ""

# Create backend directory structure on remote
ssh $SSH_CMD "mkdir -p /workspace/backend/{services,personalities}"

# Upload main files
scp -r backend/main.py $SSH_CMD:/workspace/backend/
scp -r backend/requirements.txt $SSH_CMD:/workspace/backend/
scp -r backend/services/* $SSH_CMD:/workspace/backend/services/
scp -r backend/personalities/* $SSH_CMD:/workspace/backend/personalities/

echo ""
echo "✅ Upload complete!"
echo ""
echo "Next steps on RunPod:"
echo "1. cd /workspace/backend"
echo "2. pip3 install -r requirements.txt"
echo "3. Create .env file"
echo "4. Start with: uvicorn main:app --host 0.0.0.0 --port 8000"

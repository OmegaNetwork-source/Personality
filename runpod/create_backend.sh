#!/bin/bash
# Script to create all backend files on RunPod

cd /workspace
mkdir -p backend/services backend/personalities

# Create requirements.txt
cat > backend/requirements.txt << 'EOF'
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

# Create services/__init__.py
touch backend/services/__init__.py

echo "✅ Backend structure created!"
echo "Now run the Python script to create all the code files..."
echo "Or I can provide individual file creation commands."

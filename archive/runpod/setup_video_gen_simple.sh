#!/bin/bash

# Simpler setup using AnimateDiff (easier to set up)
echo "🎬 Setting up Video Generation (AnimateDiff via ComfyUI)..."

cd /workspace || cd ~

# Install dependencies
apt-get update
apt-get install -y git python3 python3-pip

# Clone ComfyUI
if [ ! -d "ComfyUI" ]; then
    git clone https://github.com/comfyanonymous/ComfyUI.git
fi

cd ComfyUI

# Install dependencies
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip3 install -r requirements.txt

# Install AnimateDiff extension (easier than SVD)
cd custom_nodes
if [ ! -d "ComfyUI-AnimateDiff-Evolved" ]; then
    git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved.git
fi
cd ComfyUI-AnimateDiff-Evolved
pip3 install -r requirements.txt
cd ../../..

# Create startup script
cat > /workspace/start_video_gen.sh << 'EOF'
#!/bin/bash
cd /workspace/ComfyUI
python3 main.py --listen 0.0.0.0 --port 7861 --enable-cors-header "*"
EOF

chmod +x /workspace/start_video_gen.sh

echo "✅ Video generation setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Download AnimateDiff models (they'll download automatically on first use)"
echo "2. Start the service:"
echo "   screen -S video_gen"
echo "   /workspace/start_video_gen.sh"
echo "   Press Ctrl+A then D to detach"
echo ""
echo "The service will be available at: http://localhost:7861"

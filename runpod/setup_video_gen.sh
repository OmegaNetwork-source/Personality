#!/bin/bash

echo "🎬 Setting up Video Generation (Stable Video Diffusion)..."

# Navigate to workspace
cd /workspace || cd ~

# Install dependencies
apt-get update
apt-get install -y git wget python3 python3-pip python3-venv

# Clone ComfyUI (best option for video generation)
echo "📦 Installing ComfyUI..."
if [ ! -d "ComfyUI" ]; then
    git clone https://github.com/comfyanonymous/ComfyUI.git
fi

cd ComfyUI

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install PyTorch with CUDA support
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install ComfyUI requirements
pip3 install -r requirements.txt

# Install Stable Video Diffusion extension
echo "📥 Installing Stable Video Diffusion models..."
cd custom_nodes

# Clone SVD extension
if [ ! -d "ComfyUI-Stable-Video-Diffusion" ]; then
    git clone https://github.com/Fannovel16/comfyui-stable-video-diffusion.git ComfyUI-Stable-Video-Diffusion
fi

cd ComfyUI-Stable-Video-Diffusion
pip3 install -r requirements.txt
cd ../..

# Download Stable Video Diffusion models
mkdir -p models/checkpoints
cd models/checkpoints

# Download SVD model (you'll need to get the actual download link from HuggingFace)
echo "📥 Downloading Stable Video Diffusion model..."
echo "⚠️  Note: You need to download the model manually from HuggingFace:"
echo "   https://huggingface.co/stabilityai/stable-video-diffusion-img2vid"
echo ""
echo "Or use wget if you have the direct link:"
echo "wget -O svd.safetensors https://huggingface.co/stabilityai/stable-video-diffusion-img2vid/resolve/main/svd.safetensors"

cd ../../..

# Create startup script
cat > start_video_gen.sh << 'EOF'
#!/bin/bash
cd /workspace/ComfyUI
source venv/bin/activate
python3 main.py --listen 0.0.0.0 --port 7861 --enable-cors-header "*"
EOF

chmod +x start_video_gen.sh

echo "✅ Video generation setup complete!"
echo ""
echo "To start video generation service:"
echo "  cd /workspace && ./start_video_gen.sh"
echo ""
echo "Or use screen to keep it running:"
echo "  screen -S video_gen"
echo "  cd /workspace && ./start_video_gen.sh"
echo "  Press Ctrl+A then D to detach"

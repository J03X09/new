#!/usr/bin/env bash
# One-shot setup script for the YouTube Shorts Clipper

set -e

echo "=============================="
echo "  YouTube Shorts Clipper Setup"
echo "=============================="

# Check Python 3.9+
python_version=$(python3 -c 'import sys; print(sys.version_info[:2])')
echo "Python: $python_version"

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo ""
    echo "FFmpeg not found. Installing..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -qq && sudo apt-get install -y ffmpeg
    elif command -v brew &> /dev/null; then
        brew install ffmpeg
    else
        echo "ERROR: Please install FFmpeg manually: https://ffmpeg.org/download.html"
        exit 1
    fi
else
    echo "FFmpeg: $(ffmpeg -version 2>&1 | head -1)"
fi

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo ""
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

echo ""
echo "Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

# Copy .env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "Created .env — please add your ANTHROPIC_API_KEY:"
    echo "  echo 'ANTHROPIC_API_KEY=sk-ant-...' >> .env"
fi

echo ""
echo "=============================="
echo "  Setup complete!"
echo "=============================="
echo ""
echo "Usage:"
echo "  source .venv/bin/activate"
echo "  python main.py 'https://www.youtube.com/watch?v=VIDEO_ID'"
echo ""

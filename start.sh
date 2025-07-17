#!/bin/bash

# YourTour TTS Server Startup Script

set -e

echo "🚀 Starting YourTour TTS Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p models audio uploads downloads

# Check if .env exists, create from example if not
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp env.example .env
    echo "✅ Created .env file. You may want to edit it with your preferences."
fi

# Check if Piper is installed
if ! command -v piper &> /dev/null; then
    echo "⚠️  Piper TTS engine not found."
    echo "   Please install Piper first:"
    echo "   - Windows: winget install piper-tts"
    echo "   - macOS: brew install piper-tts"
    echo "   - Linux: sudo apt install piper-tts"
    echo ""
    echo "   Or download from: https://github.com/rhasspy/piper/releases"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Piper TTS engine found: $(piper --version)"
fi

# Check if models exist
if [ ! -f "models/en_US-amy-low.onnx" ]; then
    echo "📥 Downloading TTS models..."
    npm run install-piper
else
    echo "✅ TTS models found"
fi

# Start the server
echo "🎤 Starting TTS server..."
echo "   Server will be available at: http://localhost:3001"
echo "   Press Ctrl+C to stop"
echo ""

npm start 
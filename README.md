# YourTour TTS Server

A Node.js Text-to-Speech server using the Piper TTS engine. This server provides a REST API for generating high-quality speech from text.

## Features

- 🎤 High-quality TTS using Piper engine
- 🌍 Multiple voice models (English, various quality levels)
- 📡 RESTful API endpoints
- 📁 File upload support for long texts
- 🧹 Automatic cleanup of old audio files
- 🔧 Configurable via environment variables
- 🚀 Easy setup and deployment

## Prerequisites

- Ubuntu 20.04+ (or other Debian-based Linux distributions)
- Node.js 16+ 
- Piper TTS engine installed
- FFmpeg (optional, for audio format conversion)

## Installation

### Quick Start (Ubuntu)
```bash
# One-liner for Ubuntu setup
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && \
sudo apt-get install -y nodejs build-essential python3-dev libespeak-ng-dev && \
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_amd64.tar.gz && \
sudo tar -xzf piper_linux_amd64.tar.gz -C /usr/local/bin --strip-components=1 && \
sudo chmod +x /usr/local/bin/piper && rm piper_linux_amd64.tar.gz && \
npm install && npm run install-piper && cp env.example .env
```

### Detailed Installation

1. **Update system packages:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js (if not already installed):**
   ```bash
   # Using NodeSource repository for latest version
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Verify installation
   node --version
   npm --version
   ```

3. **Install system dependencies:**
   ```bash
   sudo apt install -y build-essential python3-dev libespeak-ng-dev
   ```

4. **Install Piper TTS engine:**
   
   **Option A: Using apt (Ubuntu 22.04+):**
   ```bash
   sudo apt install piper-tts
   ```
   
   **Option B: Manual installation (recommended for latest version):**
   ```bash
   # Download latest Piper release
   wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_amd64.tar.gz
   
   # Extract to /usr/local/bin
   sudo tar -xzf piper_linux_amd64.tar.gz -C /usr/local/bin --strip-components=1
   
   # Make executable
   sudo chmod +x /usr/local/bin/piper
   
   # Clean up
   rm piper_linux_amd64.tar.gz
   
   # Verify installation
   piper --version
   ```

5. **Clone and install dependencies:**
   ```bash
   npm install
   ```

6. **Download TTS models:**
   ```bash
   npm run install-piper
   ```

7. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your preferences
   ```

8. **Start the server:**
   ```bash
   npm start
   # Or for development: npm run dev
   ```

## API Endpoints

### Health Check
```http
GET /health
```
Returns server status and Piper availability.

### List Models
```http
GET /models
```
Returns available TTS models.

### Generate TTS
```http
POST /tts
Content-Type: application/json

{
  "text": "Hello, world!",
  "model": "en_US-amy-low.onnx",
  "format": "wav"
}
```

### Generate TTS from File
```http
POST /tts/upload
Content-Type: multipart/form-data

text: [text file]
model: en_US-amy-low.onnx
format: wav
```

### Download Audio
```http
GET /audio/{filename}
```
Download generated audio file.

### Cleanup
```http
POST /cleanup
```
Remove old audio files (older than 24 hours).

## Usage Examples

### Basic TTS Generation
```bash
curl -X POST http://localhost:3001/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Welcome to YourTour!", "model": "en_US-amy-low.onnx"}'
```

### Using JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3001/tts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Hello from YourTour!',
    model: 'en_US-amy-low.onnx'
  })
});

const result = await response.json();
console.log('Audio file:', result.audioFile);
console.log('Download URL:', result.downloadUrl);
```

### Using Python
```python
import requests

response = requests.post('http://localhost:3001/tts', json={
    'text': 'Hello from Python!',
    'model': 'en_US-amy-low.onnx'
})

result = response.json()
print(f"Audio file: {result['audioFile']}")
print(f"Download URL: {result['downloadUrl']}")
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `PIPER_PATH` | `piper` | Path to Piper executable |
| `DEFAULT_MODEL` | `en_US-amy-low.onnx` | Default TTS model |
| `DEFAULT_CONFIG` | `en_US-amy-low.onnx.json` | Default model config |
| `DEBUG` | `false` | Enable debug logging |
| `MAX_TEXT_LENGTH` | `1000` | Maximum text length |
| `AUDIO_RETENTION_HOURS` | `24` | Audio file retention time |

### Available Models

The server comes with several pre-configured models:

- `en_US-amy-low.onnx` - Fast, lower quality
- `en_US-amy-medium.onnx` - Balanced quality/speed
- `en_US-amy-high.onnx` - High quality, slower

## Directory Structure

```
yourtour-tts-server/
├── server.js              # Main server file
├── package.json           # Dependencies
├── env.example           # Environment template
├── README.md             # This file
├── scripts/
│   └── install-piper.js  # Installation script
├── models/               # TTS models (auto-created)
├── audio/                # Generated audio files
└── uploads/              # Temporary uploads
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Adding New Models

1. Download model files from [Piper Voices](https://huggingface.co/rhasspy/piper-voices)
2. Place `.onnx` and `.onnx.json` files in `models/` directory
3. Update `DEFAULT_MODEL` in `.env` if needed

### Customizing Installation

Edit `scripts/install-piper.js` to add more models or change download URLs.

## Troubleshooting

### Piper Not Found
- Ensure Piper is installed and in your PATH
- Set `PIPER_PATH` in `.env` to the full path (e.g., `/usr/local/bin/piper`)
- Run `piper --version` to verify installation
- If using manual installation, ensure the binary is executable: `sudo chmod +x /usr/local/bin/piper`

### Ubuntu-Specific Issues

**Permission Denied Errors:**
```bash
# If you get permission errors, ensure proper ownership
sudo chown -R $USER:$USER /usr/local/bin/piper
```

**Missing Dependencies:**
```bash
# Install additional dependencies if needed
sudo apt install -y libespeak-ng1 libespeak-ng-dev
```

**Node.js Version Issues:**
```bash
# If you have an old Node.js version, update using NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Model Not Found
- Run `npm run install-piper` to download models
- Check `models/` directory for `.onnx` and `.onnx.json` files
- Verify model names in API requests
- Ensure you have sufficient disk space for model downloads

### Audio Generation Fails
- Check Piper logs for errors
- Verify text length (max 1000 chars by default)
- Ensure sufficient disk space
- Check if audio directory has proper permissions: `chmod 755 audio/`

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review Piper documentation: https://github.com/rhasspy/piper
- Open an issue on GitHub 
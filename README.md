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

- Node.js 16+ 
- Piper TTS engine installed
- FFmpeg (optional, for audio format conversion)

## Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Install Piper TTS engine:**
   
   **Windows:**
   ```bash
   winget install piper-tts
   # Or download from: https://github.com/rhasspy/piper/releases
   ```
   
   **macOS:**
   ```bash
   brew install piper-tts
   ```
   
   **Linux:**
   ```bash
   sudo apt install piper-tts
   # Or download from: https://github.com/rhasspy/piper/releases
   ```

3. **Download TTS models:**
   ```bash
   npm run install-piper
   ```

4. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your preferences
   ```

5. **Start the server:**
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
- Set `PIPER_PATH` in `.env` to the full path
- Run `piper --version` to verify installation

### Model Not Found
- Run `npm run install-piper` to download models
- Check `models/` directory for `.onnx` and `.onnx.json` files
- Verify model names in API requests

### Audio Generation Fails
- Check Piper logs for errors
- Verify text length (max 1000 chars by default)
- Ensure sufficient disk space

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
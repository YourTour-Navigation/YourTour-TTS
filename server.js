const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Ensure directories exist
const AUDIO_DIR = path.join(__dirname, 'audio');
const MODELS_DIR = path.join(__dirname, 'models');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

fs.ensureDirSync(AUDIO_DIR);
fs.ensureDirSync(MODELS_DIR);
fs.ensureDirSync(UPLOADS_DIR);

// Piper configuration
const PIPER_CONFIG = {
  executable: process.env.PIPER_PATH || 'piper',
  modelsDir: MODELS_DIR,
  audioDir: AUDIO_DIR,
  defaultModel: process.env.DEFAULT_MODEL || 'en_US-amy-low.onnx',
  defaultConfig: process.env.DEFAULT_CONFIG || 'en_US-amy-low.onnx.json'
};

// Utility function to check if Piper is available
async function checkPiperAvailability() {
  return new Promise((resolve) => {
    const piper = spawn(PIPER_CONFIG.executable, ['--help']);
    
    piper.on('error', () => {
      resolve(false);
    });
    
    piper.on('close', (code) => {
      resolve(code === 0);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      piper.kill();
      resolve(false);
    }, 5000);
  });
}

// Generate TTS using Piper
async function generateTTS(text, modelName = null, outputFormat = 'wav') {
  return new Promise(async (resolve, reject) => {
    try {
      const model = modelName || PIPER_CONFIG.defaultModel;
      const config = model.replace('.onnx', '.onnx.json');
      const modelPath = path.join(PIPER_CONFIG.modelsDir, model);
      const configPath = path.join(PIPER_CONFIG.modelsDir, config);
      const outputFile = path.join(PIPER_CONFIG.audioDir, `${uuidv4()}.${outputFormat}`);
      
      // Check if model exists
      if (!await fs.pathExists(modelPath)) {
        return reject(new Error(`Model ${model} not found. Please download it first.`));
      }
      
      if (!await fs.pathExists(configPath)) {
        return reject(new Error(`Config ${config} not found. Please download it first.`));
      }
      
      const args = [
        '--model', modelPath,
        '--config', configPath,
        '--output_file', outputFile
      ];
      
      const piper = spawn(PIPER_CONFIG.executable, args);
      
      let stderr = '';
      
      piper.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      piper.on('error', (error) => {
        reject(new Error(`Piper execution failed: ${error.message}`));
      });
      
      piper.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            audioFile: outputFile,
            filename: path.basename(outputFile)
          });
        } else {
          reject(new Error(`Piper failed with code ${code}: ${stderr}`));
        }
      });
      
      // Send text to Piper
      piper.stdin.write(text);
      piper.stdin.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    piperAvailable: false // Will be updated by checkPiperAvailability
  });
});

// Get available models
app.get('/models', async (req, res) => {
  try {
    const models = await fs.readdir(PIPER_CONFIG.modelsDir);
    const modelList = models
      .filter(file => file.endsWith('.onnx'))
      .map(model => ({
        name: model,
        config: model.replace('.onnx', '.onnx.json'),
        available: true
      }));
    
    res.json({
      success: true,
      models: modelList,
      defaultModel: PIPER_CONFIG.defaultModel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate TTS
app.post('/tts', async (req, res) => {
  try {
    const { text, model, format = 'wav' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long (max 1000 characters)'
      });
    }
    
    const result = await generateTTS(text, model, format);
    
    res.json({
      success: true,
      audioFile: result.filename,
      downloadUrl: `/audio/${result.filename}`,
      text: text,
      model: model || PIPER_CONFIG.defaultModel
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate TTS with file upload
app.post('/tts/upload', upload.single('text'), async (req, res) => {
  try {
    const { model, format = 'wav' } = req.body;
    let text = req.body.text;
    
    // If text file was uploaded, read its contents
    if (req.file) {
      text = await fs.readFile(req.file.path, 'utf8');
      // Clean up uploaded file
      await fs.remove(req.file.path);
    }
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long (max 5000 characters)'
      });
    }
    
    const result = await generateTTS(text, model, format);
    
    res.json({
      success: true,
      audioFile: result.filename,
      downloadUrl: `/audio/${result.filename}`,
      textLength: text.length,
      model: model || PIPER_CONFIG.defaultModel
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download audio file
app.get('/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(PIPER_CONFIG.audioDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: 'Audio file not found'
    });
  }
  
  res.download(filePath, filename, (err) => {
    if (err) {
      res.status(500).json({
        success: false,
        error: 'Error downloading file'
      });
    }
  });
});

// Clean up old audio files (older than 24 hours)
app.post('/cleanup', async (req, res) => {
  try {
    const files = await fs.readdir(PIPER_CONFIG.audioDir);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(PIPER_CONFIG.audioDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > oneDay) {
        await fs.remove(filePath);
        deletedCount++;
      }
    }
    
    res.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} old audio files`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
async function startServer() {
  try {
    // Check Piper availability
    const piperAvailable = await checkPiperAvailability();
    
    if (!piperAvailable) {
      console.warn('⚠️  Piper TTS engine not found. Please install Piper first.');
      console.warn('   Run: npm run install-piper');
    } else {
      console.log('✅ Piper TTS engine is available');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 TTS Server running on port ${PORT}`);
      console.log(`📖 API Documentation:`);
      console.log(`   GET  /health - Health check`);
      console.log(`   GET  /models - List available models`);
      console.log(`   POST /tts - Generate TTS from text`);
      console.log(`   POST /tts/upload - Generate TTS from uploaded file`);
      console.log(`   GET  /audio/:filename - Download audio file`);
      console.log(`   POST /cleanup - Clean up old audio files`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 
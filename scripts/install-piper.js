const { spawn, exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

// Configuration
const PIPER_REPO = 'https://github.com/rhasspy/piper/releases';
const MODELS_DIR = path.join(__dirname, '..', 'models');
const DOWNLOAD_URLS = {
  'en_US-amy-low': {
    model: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/low/en_US-amy-low.onnx',
    config: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/low/en_US-amy-low.onnx.json'
  },
  'en_US-amy-medium': {
    model: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx',
    config: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx.json'
  },
  'en_US-amy-high': {
    model: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/high/en_US-amy-high.onnx',
    config: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/high/en_US-amy-high.onnx.json'
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function getPlatform() {
  const platform = process.platform;
  const arch = process.arch;
  
  if (platform === 'win32') {
    return arch === 'x64' ? 'windows-x64' : 'windows-x86';
  } else if (platform === 'darwin') {
    return arch === 'x64' ? 'macos-x64' : 'macos-arm64';
  } else if (platform === 'linux') {
    return arch === 'x64' ? 'linux-x64' : 'linux-arm64';
  }
  
  throw new Error(`Unsupported platform: ${platform} ${arch}`);
}

async function downloadFile(url, filepath) {
  log(`Downloading ${path.basename(filepath)}...`);
  
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    timeout: 300000 // 5 minutes
  });
  
  await pipelineAsync(response.data, fs.createWriteStream(filepath));
  log(`Downloaded ${path.basename(filepath)}`, 'success');
}

async function checkPiperInstalled() {
  return new Promise((resolve) => {
    exec('piper --version', (error) => {
      resolve(!error);
    });
  });
}

async function installPiper() {
  const platform = getPlatform();
  log(`Detected platform: ${platform}`);
  
  // Check if Piper is already installed
  if (await checkPiperInstalled()) {
    log('Piper is already installed', 'success');
    return true;
  }
  
  log('Piper not found. Please install it manually:');
  log('1. Visit: https://github.com/rhasspy/piper/releases');
  log('2. Download the latest release for your platform');
  log('3. Extract and add to your PATH');
  log('');
  log('Or use your package manager:');
  
  if (platform.includes('windows')) {
    log('Windows: Use winget or download from releases');
  } else if (platform.includes('macos')) {
    log('macOS: brew install piper-tts');
  } else if (platform.includes('linux')) {
    log('Linux: sudo apt install piper-tts');
  }
  
  return false;
}

async function downloadModels() {
  log('Creating models directory...');
  await fs.ensureDir(MODELS_DIR);
  
  for (const [modelName, urls] of Object.entries(DOWNLOAD_URLS)) {
    try {
      const modelFile = path.join(MODELS_DIR, `${modelName}.onnx`);
      const configFile = path.join(MODELS_DIR, `${modelName}.onnx.json`);
      
      // Check if files already exist
      if (await fs.pathExists(modelFile) && await fs.pathExists(configFile)) {
        log(`Model ${modelName} already exists`, 'success');
        continue;
      }
      
      log(`Downloading model: ${modelName}`);
      
      // Download model and config files
      await Promise.all([
        downloadFile(urls.model, modelFile),
        downloadFile(urls.config, configFile)
      ]);
      
      log(`Model ${modelName} downloaded successfully`, 'success');
      
    } catch (error) {
      log(`Failed to download model ${modelName}: ${error.message}`, 'error');
    }
  }
}

async function main() {
  try {
    log('🚀 Starting Piper TTS installation...');
    
    // Install Piper
    const piperInstalled = await installPiper();
    
    if (!piperInstalled) {
      log('Please install Piper manually and run this script again', 'warning');
      return;
    }
    
    // Download models
    await downloadModels();
    
    log('🎉 Installation completed successfully!', 'success');
    log('');
    log('Next steps:');
    log('1. Start the server: npm start');
    log('2. Test the API: curl -X POST http://localhost:3001/tts -H "Content-Type: application/json" -d \'{"text":"Hello world"}\'');
    
  } catch (error) {
    log(`Installation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { installPiper, downloadModels }; 
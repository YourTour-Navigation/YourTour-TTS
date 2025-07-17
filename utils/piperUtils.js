const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');

// Ensure directories exist
const AUDIO_DIR = path.join(__dirname, '..', 'audio');
const MODELS_DIR = path.join(__dirname, '..', 'models');

fs.ensureDirSync(AUDIO_DIR);
fs.ensureDirSync(MODELS_DIR);

// Piper configuration
const PIPER_CONFIG = {
  modelsDir: MODELS_DIR,
  audioDir: AUDIO_DIR,
  defaultModel: process.env.DEFAULT_MODEL || 'en_US-amy-low'
};

// Generate TTS using Piper
async function generateTTS(text, modelName = null, outputFormat = 'wav') {
  return new Promise(async (resolve, reject) => {
    try {
      let model = modelName || PIPER_CONFIG.defaultModel;
      const outputFile = path.join(PIPER_CONFIG.audioDir, `${uuidv4()}.${outputFormat}`);

      // Append .onnx to model name if it doesn't exist
    //   if (!model.endsWith('.onnx')) {
    //     model += '.onnx';
    //   }

      // Check if model exists
      const modelPath = path.join(PIPER_CONFIG.modelsDir, `${model}.onnx`);
      if (!await fs.pathExists(modelPath)) {
        console.log(`Downloading new model ${model}...`);
        
        // Download model and wait for completion
        await new Promise((downloadResolve, downloadReject) => {
          const downloadProcess = spawn('python3', ['-m', 'piper.download_voices', model, '--data-dir', PIPER_CONFIG.modelsDir]);
          
          let downloadStderr = '';
          
          downloadProcess.stderr.on('data', (data) => {
            downloadStderr += data.toString();
          });
          
          downloadProcess.on('error', (error) => {
            downloadReject(new Error(`Failed to download model: ${error.message}`));
          });
          
          downloadProcess.on('close', (code) => {
            if (code === 0) {
              downloadResolve();
            } else {
              downloadReject(new Error(`Failed to download model: Process exited with code ${code}. Error: ${downloadStderr}`));
            }
          });
        });
      }
      
      const piper = spawn("python3", ["-m", "piper", "--model", model, "--data-dir", PIPER_CONFIG.modelsDir, "--output-file", outputFile]);
      
      let stderr = '';
      
      piper.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      piper.on('error', (error) => {
        reject(new Error(`Piper execution failed: ${error.message}`));
      });
      
      piper.on('close', async (code) => {
        if (code === 0) {
          try {
            // Read the generated audio file and convert to base64
            const audioBuffer = await fs.readFile(outputFile);
            const base64Audio = audioBuffer.toString('base64');
            
            // Delete the temporary file
            await fs.remove(outputFile);
            
            resolve({
              success: true,
              base64: base64Audio,
              size: audioBuffer.length
            });
          } catch (readError) {
            // Try to clean up the file even if reading failed
            try {
              await fs.remove(outputFile);
            } catch (cleanupError) {
              // Ignore cleanup errors
            }
            reject(new Error(`Failed to read generated audio file: ${readError.message}`));
          }
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

module.exports = {
  PIPER_CONFIG,
  generateTTS
}; 
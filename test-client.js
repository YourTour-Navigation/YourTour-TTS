const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const TTS_SERVER_URL = 'http://localhost:3001';

class TTSTestClient {
  constructor(serverUrl = TTS_SERVER_URL) {
    this.serverUrl = serverUrl;
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.serverUrl}/health`);
      console.log('✅ Health check:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return null;
    }
  }

  async getModels() {
    try {
      const response = await axios.get(`${this.serverUrl}/models`);
      console.log('📋 Available models:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get models:', error.message);
      return null;
    }
  }

  async generateTTS(text, model = null) {
    try {
      console.log(`🎤 Generating TTS for: "${text}"`);
      
      const payload = { text };
      if (model) {
        payload.model = model;
      }

      const response = await axios.post(`${this.serverUrl}/tts`, payload);
      
      console.log('✅ TTS generated successfully:');
      console.log('   Audio file:', response.data.audioFile);
      console.log('   Download URL:', response.data.downloadUrl);
      console.log('   Model used:', response.data.model);
      
      return response.data;
    } catch (error) {
      console.error('❌ TTS generation failed:', error.response?.data || error.message);
      return null;
    }
  }

  async downloadAudio(filename) {
    try {
      const response = await axios.get(`${this.serverUrl}/audio/${filename}`, {
        responseType: 'stream'
      });

      const downloadDir = path.join(__dirname, 'downloads');
      await fs.ensureDir(downloadDir);
      
      const filePath = path.join(downloadDir, filename);
      const writer = fs.createWriteStream(filePath);
      
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ Audio downloaded to: ${filePath}`);
          resolve(filePath);
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('❌ Audio download failed:', error.message);
      return null;
    }
  }

  async generateTTSFromFile(filePath, model = null) {
    try {
      console.log(`📁 Generating TTS from file: ${filePath}`);
      
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('text', fs.createReadStream(filePath));
      
      if (model) {
        formData.append('model', model);
      }

      const response = await axios.post(`${this.serverUrl}/tts/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      
      console.log('✅ TTS from file generated successfully:');
      console.log('   Audio file:', response.data.audioFile);
      console.log('   Download URL:', response.data.downloadUrl);
      console.log('   Text length:', response.data.textLength);
      
      return response.data;
    } catch (error) {
      console.error('❌ TTS from file failed:', error.response?.data || error.message);
      return null;
    }
  }

  async cleanup() {
    try {
      const response = await axios.post(`${this.serverUrl}/cleanup`);
      console.log('🧹 Cleanup completed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      return null;
    }
  }
}

// Example usage
async function runTests() {
  const client = new TTSTestClient();
  
  console.log('🚀 Starting TTS Server Tests\n');
  
  // Health check
  console.log('1. Health Check');
  await client.healthCheck();
  console.log('');
  
  // Get models
  console.log('2. Get Available Models');
  await client.getModels();
  console.log('');
  
  // Generate TTS
  console.log('3. Generate TTS');
  const ttsResult = await client.generateTTS('Hello from YourTour! Welcome to our amazing TTS service.');
  console.log('');
  
  if (ttsResult) {
    // Download audio
    console.log('4. Download Audio');
    await client.downloadAudio(ttsResult.audioFile);
    console.log('');
  }
  
  // Generate TTS with specific model
  console.log('5. Generate TTS with Specific Model');
  await client.generateTTS('This is a test with a specific model.', 'en_US-amy-medium.onnx');
  console.log('');
  
  // Create test file
  console.log('6. Generate TTS from File');
  const testFile = path.join(__dirname, 'test-text.txt');
  await fs.writeFile(testFile, 'This is a test text file for TTS generation. It contains multiple sentences to demonstrate the file upload functionality.');
  
  await client.generateTTSFromFile(testFile);
  
  // Clean up test file
  await fs.remove(testFile);
  console.log('');
  
  // Cleanup old files
  console.log('7. Cleanup Old Files');
  await client.cleanup();
  console.log('');
  
  console.log('🎉 All tests completed!');
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = TTSTestClient; 
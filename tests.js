const http = require('http');

const BASE_URL = 'http://localhost:4000';

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test 1: Health Check
async function testHealth() {
  console.log('\n🏥 Testing Health Endpoint...');
  try {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('✅ Health Status:', response.statusCode);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Health Error:', error.message);
  }
}

// Test 2: Get Available Models
async function testModels() {
  console.log('\n🤖 Testing Models Endpoint...');
  try {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/models',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log('✅ Models Status:', response.statusCode);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ Models Error:', error.message);
    return null;
  }
}

// Test 3: Generate TTS
async function testTTS() {
  console.log('\n🎵 Testing TTS Endpoint...');
  try {
    const requestData = JSON.stringify({
      text: "Hello world! This is a test of the text to speech system.",
      model: null // Use default model
    });
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/tts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    const response = await makeRequest(options, requestData);
    console.log('✅ TTS Status:', response.statusCode);
    
    if (response.data.success) {
      console.log('🎉 TTS Generated Successfully!');
      console.log('📝 Text:', response.data.text);
      console.log('🤖 Model:', response.data.model);
      console.log('📏 Size:', response.data.size, 'bytes');
      console.log('🎵 Base64 Length:', response.data.base64 ? response.data.base64.length : 'N/A');
      
      // Optionally save the audio to a file
      if (response.data.base64) {
        const fs = require('fs');
        const audioBuffer = Buffer.from(response.data.base64, 'base64');
        fs.writeFileSync('test-output.wav', audioBuffer);
        console.log('💾 Saved audio to test-output.wav');
      }
    } else {
      console.log('❌ TTS Failed:', response.data.error);
    }
    
    console.log('📊 Full Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ TTS Error:', error.message);
  }
}

// Test 4: Error Handling
async function testErrors() {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test empty text
  try {
    const requestData = JSON.stringify({
      text: "",
      model: null
    });
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/tts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    const response = await makeRequest(options, requestData);
    console.log('📝 Empty Text Test - Status:', response.statusCode);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Empty Text Error:', error.message);
  }
  
  // Test very long text
  try {
    const longText = "A".repeat(1500); // Over the 1000 character limit
    const requestData = JSON.stringify({
      text: longText,
      model: null
    });
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/tts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    const response = await makeRequest(options, requestData);
    console.log('📏 Long Text Test - Status:', response.statusCode);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Long Text Error:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting YourTour-TTS API Tests...');
  console.log('🌐 Base URL:', BASE_URL);
  
  await testHealth();
  await testModels();
  await testTTS();
  await testErrors();
  
  console.log('\n✨ Tests completed!');
}

// Check if server is running before starting tests
async function checkServer() {
  try {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET'
    };
    
    await makeRequest(options);
    console.log('✅ Server is running on port 4000');
    return true;
  } catch (error) {
    console.log('❌ Server not running on port 4000');
    console.log('💡 Please start the server with: node server.js');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

main().catch(console.error);

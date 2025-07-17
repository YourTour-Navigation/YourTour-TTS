const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import route modules
const healthRoutes = require('./routes/health');
const modelsRoutes = require('./routes/models');
const ttsRoutes = require('./routes/tts');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/health', healthRoutes);
app.use('/models', modelsRoutes);
app.use('/tts', ttsRoutes);

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
    app.listen(4000, () => {
      console.log(`Piper TTS Server running on port 4000`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 
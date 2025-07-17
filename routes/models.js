const express = require('express');
const fs = require('fs-extra');
const { PIPER_CONFIG } = require('../utils/piperUtils');

const router = express.Router();

// Get available models
router.get('/', async (req, res) => {
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

module.exports = router; 
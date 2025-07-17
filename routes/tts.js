const express = require('express');
const { generateTTS, PIPER_CONFIG } = require('../utils/piperUtils');

const router = express.Router();

// Generate TTS
router.post('/', async (req, res) => {
  try {
    const { text, model } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    if (text.length > process.env.MAX_TEXT_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Text too long (max ${process.env.MAX_TEXT_LENGTH} characters)`
      });
    }
    
    const result = await generateTTS(text, model);
    
    res.json({
      success: true,
      text: text,
      model: model || PIPER_CONFIG.defaultModel,
      base64: result.base64,
      size: result.size
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 
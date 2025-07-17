const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { PIPER_CONFIG } = require('../utils/piperUtils');

const router = express.Router();

// Clean up old audio files (older than 24 hours)
router.post('/', async (req, res) => {
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

module.exports = router; 
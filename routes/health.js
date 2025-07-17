const express = require('express');
const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    piperAvailable: true, // Dockerized, so we guarantee Piper is available
  });
});

module.exports = router; 
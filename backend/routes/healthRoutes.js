// GET /api/health — see README section 6 (Phase 0: Scaffolding).

const express = require('express');
const { pingDB } = require('../config/db');

const router = express.Router();

router.get('/health', async (req, res) => {
  const dbConnected = await pingDB();
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'saferoute-backend',
      dbConnected,
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;

// SafeRoute backend entry point.
// Phase 0 (Scaffolding): just enough to boot the server and answer a health check.
// Routers/controllers/middleware get wired in as each later phase implements them —
// see README section 6.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'saferoute-backend',
      timestamp: new Date().toISOString(),
    },
  });
});

app.listen(PORT, () => {
  logger.info(`SafeRoute backend listening on port ${PORT}`);
});

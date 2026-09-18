// SafeRoute backend entry point.
// Phase 0 (Scaffolding) + Phase 1 (Database & Models) + Phase 2 (Auth & RBAC): boot the
// server, connect to MongoDB, and answer a health check that reflects real DB reachability.
// Remaining routers/controllers get wired in as each later phase implements them —
// see README section 6.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const logger = require('./utils/logger');
const { connectDB } = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const AppError = require('./utils/AppError');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// credentials: true is required alongside axios's withCredentials on the frontend — otherwise
// the browser silently drops the JWT cookie on cross-origin requests.
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', healthRoutes);
app.use('/api', authRoutes);

// Catches requests to routes that don't exist yet (later phases add more under /api).
app.use((req, res, next) => next(new AppError(404, `Not found: ${req.method} ${req.originalUrl}`)));

// Must be registered last — Express identifies error handlers by their 4-argument signature.
app.use(errorMiddleware);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`SafeRoute backend listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB, exiting:', err.message);
    process.exit(1);
  });

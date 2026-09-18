// Centralized error handler — every route funnels errors here via asyncHandler/next(err),
// and every response leaving this handler matches the API contract in README section 7:
// { success: false, error }.

const logger = require('../utils/logger');

function errorMiddleware(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose duplicate-key error (unique index on email/phone) — surface which field collided
  // instead of the raw Mongo E11000 message.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    statusCode = 409;
    message = `An account with that ${field} already exists`;
  }

  // Mongoose schema validation error — collapse to the first message so the client gets one
  // readable string per the API contract, rather than the full ValidationError object.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)[0]?.message || 'Validation failed';
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired session';
  }

  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  }

  res.status(statusCode).json({ success: false, error: message });
}

module.exports = errorMiddleware;

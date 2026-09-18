// Signs/verifies the auth JWT and derives the matching cookie maxAge from JWT_EXPIRES_IN.

const jwt = require('jsonwebtoken');

// JWT_EXPIRES_IN uses jsonwebtoken's own shorthand (e.g. "7d", "12h") — parse the same
// grammar here so the cookie always expires exactly when the token does.
const DURATION_UNITS_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

function durationToMs(duration) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    throw new Error(`Unsupported JWT_EXPIRES_IN format: ${duration}`);
  }
  const [, amount, unit] = match;
  return Number(amount) * DURATION_UNITS_MS[unit];
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function getCookieMaxAgeMs() {
  return durationToMs(process.env.JWT_EXPIRES_IN || '7d');
}

module.exports = { signToken, verifyToken, getCookieMaxAgeMs };

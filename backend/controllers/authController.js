// Register/login/logout/me — see README section 7 (API Reference).

const bcrypt = require('bcrypt');
const User = require('../models/User');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, getCookieMaxAgeMs } = require('../utils/jwt');

const BCRYPT_ROUNDS = 12; // matches scripts/seed.js — keep the two in sync
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Never include passwordHash in an API response, even by accident.
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  trustScore: user.trustScore,
});

// The cookie is HTTP-only (unreadable by client JS, mitigating XSS token theft) and
// SameSite=Lax (sent on top-level navigation but not cross-site subrequests, mitigating CSRF)
// per README section 6, Phase 2. COOKIE_SECURE must be true in production (HTTPS-only).
function setAuthCookie(res, userId) {
  const token = signToken({ sub: userId.toString() });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: getCookieMaxAgeMs(),
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !phone || !password) {
    throw new AppError(400, 'name, email, phone, and password are required');
  }
  if (!EMAIL_RE.test(email)) {
    throw new AppError(400, 'Invalid email address');
  }
  if (password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters');
  }
  if (role && !ROLES.includes(role)) {
    throw new AppError(400, `role must be one of: ${ROLES.join(', ')}`);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role: role || 'CITIZEN',
  });

  setAuthCookie(res, user._id);
  res.status(201).json({ success: true, data: toPublicUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError(400, 'email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // Same error for "no such user" and "wrong password" — don't let the response leak which
  // half of the credential pair was wrong.
  const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash));
  if (!passwordMatches) {
    throw new AppError(401, 'Invalid email or password');
  }

  setAuthCookie(res, user._id);
  res.json({ success: true, data: toPublicUser(user) });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, data: null });
});

// Runs after authMiddleware's `protect`, which already loaded req.user (minus passwordHash).
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: toPublicUser(req.user) });
});

module.exports = { register, login, logout, me };

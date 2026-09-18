// Verifies the HTTP-only JWT cookie set by authController and attaches the corresponding
// user document (minus passwordHash) to req.user for downstream handlers/rbacMiddleware.

const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/jwt');

const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    throw new AppError(401, 'Not authenticated');
  }

  const { sub } = verifyToken(token); // throws JsonWebTokenError/TokenExpiredError -> errorMiddleware
  const user = await User.findById(sub).select('-passwordHash');
  if (!user) {
    throw new AppError(401, 'Not authenticated');
  }

  req.user = user;
  next();
});

module.exports = protect;

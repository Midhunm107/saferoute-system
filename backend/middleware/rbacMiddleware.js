// Role guard — usage: router.get('/x', protect, rbacMiddleware('POLICE', 'ADMIN'), handler).
// Must run after authMiddleware's `protect` so req.user is already populated.

const AppError = require('../utils/AppError');

const rbacMiddleware = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user?.role)) {
    return next(new AppError(403, 'You do not have permission to perform this action'));
  }
  next();
};

module.exports = rbacMiddleware;

// Wraps an async Express route handler so rejected promises reach errorMiddleware via next().

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

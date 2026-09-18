// Error subclass carrying an HTTP status code, so errorMiddleware can trust `err.statusCode`
// instead of pattern-matching messages.

class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = AppError;

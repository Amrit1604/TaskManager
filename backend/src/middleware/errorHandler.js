/**
 * middleware/errorHandler.js
 * Global error handler — must be registered LAST in Express middleware chain.
 * Returns a consistent JSON shape: { error: true, message, ...(dev: stack) }
 */
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log stack in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${status}: ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(status).json({
    error: true,
    message,
    // Expose stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;

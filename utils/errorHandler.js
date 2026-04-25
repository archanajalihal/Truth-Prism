/**
 * utils/errorHandler.js
 * Global Express error handling middleware.
 * Catches all unhandled errors thrown in controllers/services
 * and returns a clean, standardized JSON response.
 */

const logger = require("./logger");
const { sendError } = require("./responseHandler");

/**
 * 404 handler — must be registered AFTER all routes.
 */
const notFoundHandler = (req, res) => {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
};

/**
 * Global error handler — must be registered LAST with 4 params.
 * Express identifies it as an error handler by its 4-argument signature.
 */
const globalErrorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}: ${err.message}`);

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return sendError(res, "File too large. Maximum allowed size is 200MB.", 413);
  }

  // Multer unexpected field error
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return sendError(res, `Unexpected file field: "${err.field}". Check the field name in your request.`, 400);
  }

  // JSON parse error (malformed request body)
  if (err.type === "entity.parse.failed") {
    return sendError(res, "Invalid JSON in request body.", 400);
  }

  // Payload too large
  if (err.status === 413) {
    return sendError(res, "Request payload too large.", 413);
  }

  // Default fallback
  const statusCode = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again."
      : err.message;

  return sendError(res, message, statusCode);
};

module.exports = { notFoundHandler, globalErrorHandler };

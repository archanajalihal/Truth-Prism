/**
 * utils/responseHandler.js
 * Standardized response helpers to ensure every API response follows
 * the same shape regardless of which controller sends it.
 */

/**
 * Send a standardized success response.
 * @param {object} res         - Express response object
 * @param {object} data        - Payload to include in response
 * @param {number} statusCode  - HTTP status code (default: 200)
 */
const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    timestamp: new Date().toISOString(),
    ...data,
  });
};

/**
 * Send a standardized error response.
 * @param {object} res         - Express response object
 * @param {string} message     - Human-readable error message
 * @param {number} statusCode  - HTTP status code (default: 500)
 * @param {object} [details]   - Optional extra debug info (omitted in prod)
 */
const sendError = (res, message, statusCode = 500, details = null) => {
  const payload = {
    success: false,
    timestamp: new Date().toISOString(),
    error: message,
  };

  // Only include raw details outside of production
  if (details && process.env.NODE_ENV !== "production") {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess, sendError };

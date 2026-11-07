/**
 * Wrapper for async route controllers to catch errors and forward to centralized error handler.
 * @param {Function} requestHandler - Async route handler function
 */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

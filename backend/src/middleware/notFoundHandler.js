import { ApiError } from '../utils/ApiError.js';

/**
 * Catches 404 routes and passes ApiError to the centralized error handler.
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

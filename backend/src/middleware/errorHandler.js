import { ApiError } from '../utils/ApiError.js';

/**
 * Centralized error handling middleware.
 * Maps Mongoose / JWT errors to standard ApiError responses.
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid resource identifier for field: ${err.path}`);
  }
  // Handle Mongoose ValidationError
  else if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    error = ApiError.badRequest('Validation Error: ' + messages.join(', '), messages);
  }
  // Handle MongoDB duplicate key (E11000)
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`A record with this ${field} already exists`);
  }
  // Handle JWT verification errors
  else if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authorization token signature');
  } else if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Authorization token has expired');
  }
  // Normalize unknown errors to ApiError
  else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  return res.status(error.statusCode).json(response);
};

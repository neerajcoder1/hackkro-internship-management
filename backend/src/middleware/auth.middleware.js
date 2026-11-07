import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Middleware to authenticate requests using JWT Bearer token.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required: Token missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new ApiError(401, 'Authentication required: Token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Session expired. Please log in again.');
    }
    throw new ApiError(401, 'Invalid authentication token');
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw new ApiError(401, 'User account associated with this token no longer exists');
  }

  // Attach authenticated user to request
  req.user = user;
  next();
});

/**
 * Middleware for role-based access control.
 * @param  {...string} roles - Array of allowed roles (e.g. 'admin', 'intern')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied: Role '${req.user.role}' is not authorized to access this resource`)
      );
    }

    next();
  };
};

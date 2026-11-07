import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public User Registration
 * Enforces role: 'intern'.
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new ApiError(400, 'Name is required and must be at least 2 characters');
  }

  if (!email || !emailRegex.test(email.trim())) {
    throw new ApiError(400, 'A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new ApiError(400, 'Password is required and must be at least 6 characters long');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check duplicate email
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email address already exists');
  }

  // Security enforcement: public registration MUST strictly create an intern
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'intern',
  });

  const token = user.generateAuthToken();

  return res.status(201).json(
    new ApiResponse(201, { user, token }, 'Registration successful')
  );
});

/**
 * User Login
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    throw new ApiError(400, 'Valid email and password strings are required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find user and explicitly include password for validation
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = user.generateAuthToken();

  return res.status(200).json(
    new ApiResponse(200, { user, token }, 'Login successful')
  );
});

/**
 * Get Authenticated User Profile
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, { user: req.user }, 'Current user profile retrieved successfully')
  );
});

/**
 * User Logout
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, null, 'Logged out successfully')
  );
});

/**
 * Get All Registered Interns (Admin only)
 * GET /api/auth/interns
 */
export const getInterns = asyncHandler(async (req, res) => {
  const interns = await User.find({ role: 'intern' })
    .select('name email role createdAt')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, interns, 'Interns retrieved successfully')
  );
});

/**
 * Controlled Admin Registration
 * Requires private administrative master key.
 * POST /api/auth/register-admin
 */
export const registerAdmin = asyncHandler(async (req, res) => {
  const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
  const configuredKey = process.env.ADMIN_CREATION_KEY;

  if (!configuredKey || !adminKey || adminKey !== configuredKey) {
    throw new ApiError(403, 'Forbidden: Invalid or missing administrative creation authorization');
  }

  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new ApiError(400, 'Name is required and must be at least 2 characters');
  }

  if (!email || !emailRegex.test(email.trim())) {
    throw new ApiError(400, 'A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new ApiError(400, 'Password is required and must be at least 6 characters long');
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email address already exists');
  }

  const adminUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'admin',
  });

  const token = adminUser.generateAuthToken();

  return res.status(201).json(
    new ApiResponse(201, { user: adminUser, token }, 'Admin user created successfully')
  );
});

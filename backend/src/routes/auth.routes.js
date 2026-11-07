import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  registerAdmin,
  getInterns,
} from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/register-admin', registerAdmin);

// Protected routes (any authenticated user)
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

// Admin-only user management
router.get('/interns', authenticate, authorize('admin'), getInterns);

// Role-protected test route for verifying RBAC
router.get('/admin-only', authenticate, authorize('admin'), (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, { admin: req.user.name }, 'Admin access authorized')
  );
});

export default router;

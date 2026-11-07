import { Router } from 'express';
import {
  submitTask,
  getAllSubmissions,
  getMySubmissions,
  getMyPoints,
  reviewSubmission,
} from '../controllers/submission.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Intern endpoints (specific routes precede generic parameter routes)
router.post('/', authenticate, submitTask);
router.get('/my-submissions', authenticate, getMySubmissions);
router.get('/my-points', authenticate, getMyPoints);

// Admin-only endpoints
router.get('/', authenticate, authorize('admin'), getAllSubmissions);
router.patch('/:id/review', authenticate, authorize('admin'), reviewSubmission);

export default router;

import { Router } from 'express';
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getMyTasks,
} from '../controllers/task.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Intern endpoints (specific route must precede /:id)
router.get('/my-tasks', authenticate, getMyTasks);

// Admin-only collection endpoints
router.post('/', authenticate, authorize('admin'), createTask);
router.get('/', authenticate, authorize('admin'), getAllTasks);

// Item endpoints
router.get('/:id', authenticate, getTaskById);
router.patch('/:id', authenticate, authorize('admin'), updateTask);
router.delete('/:id', authenticate, authorize('admin'), deleteTask);

export default router;

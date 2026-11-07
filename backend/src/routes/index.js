import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import taskRoutes from './task.routes.js';
import submissionRoutes from './submission.routes.js';

const router = Router();

// Mount modular sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/submissions', submissionRoutes);

export default router;

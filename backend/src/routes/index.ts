import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/users.routes';
import courseRoutes from '../modules/courses/courses.routes';
import courseFileRoutes from '../modules/course-file/courseFile.routes';
import submissionRoutes from '../modules/submissions/submissions.routes';
import consolidationRoutes from '../modules/consolidation/consolidation.routes';
import generationRoutes from '../modules/generation/generation.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/course-file', courseFileRoutes);
router.use('/submissions', submissionRoutes);
router.use('/consolidation', consolidationRoutes);
router.use('/generation', generationRoutes);

export default router;

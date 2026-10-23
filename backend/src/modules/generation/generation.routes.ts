import { Router } from 'express';
import { ROLES } from '../../constants/roles';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { asyncHandler } from '../../utils/asyncHandler';
import { generationController } from './generation.controller';

const router = Router();

router.use(authenticate, requireRole(ROLES.COURSE_COORDINATOR));

router.post('/course/:courseId', asyncHandler(generationController.generate));
router.get('/course/:courseId/latest', asyncHandler(generationController.getLatest));

export default router;

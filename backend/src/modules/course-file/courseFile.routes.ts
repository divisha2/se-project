import { Router } from 'express';
import { ROLES } from '../../constants/roles';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { asyncHandler } from '../../utils/asyncHandler';
import { courseFileController } from './courseFile.controller';

const router = Router();

router.use(authenticate);

router.get('/:courseId/sections', asyncHandler(courseFileController.listSections));
router.put(
  '/:courseId/sections',
  requireRole(ROLES.ADMIN),
  asyncHandler(courseFileController.upsertSection),
);
router.get(
  '/:courseId/completion',
  requireRole(ROLES.COURSE_COORDINATOR),
  asyncHandler(courseFileController.completionStatus),
);

export default router;

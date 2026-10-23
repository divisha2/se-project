import { Router } from 'express';
import { z } from 'zod';
import { ROLES } from '../../constants/roles';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { coursesController } from './courses.controller';

const router = Router();

router.use(authenticate);

// Any logged-in user: returns only the courses they are allowed to see.
router.get('/', asyncHandler(coursesController.list));

// Administrator: course / section / assignment management (FR-ADM-05..08)
router.post('/', requireRole(ROLES.ADMIN), asyncHandler(coursesController.create));
router.patch('/:courseId', requireRole(ROLES.ADMIN), asyncHandler(coursesController.update));
router.post('/:courseId/sections', requireRole(ROLES.ADMIN), asyncHandler(coursesController.createSection));
router.post('/:courseId/faculty', requireRole(ROLES.ADMIN), asyncHandler(coursesController.assignFaculty));
router.put(
  '/:courseId/coordinator',
  requireRole(ROLES.ADMIN),
  validate(z.object({ userId: z.string().min(1) })),
  asyncHandler(coursesController.assignCoordinator),
);

// Course Coordinator: common course-level information (FR-CC-01)
router.get(
  '/:courseId/common-info',
  requireRole(ROLES.COURSE_COORDINATOR, ROLES.ADMIN),
  asyncHandler(coursesController.getCommonInfo),
);
router.put(
  '/:courseId/common-info',
  requireRole(ROLES.COURSE_COORDINATOR),
  asyncHandler(coursesController.updateCommonInfo),
);

export default router;

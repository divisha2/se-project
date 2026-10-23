import { Router } from 'express';
import { z } from 'zod';
import { ROLES } from '../../constants/roles';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { upload } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { submissionsController } from './submissions.controller';

const router = Router();

router.use(authenticate);

// ---- Faculty ----
router.get('/mine', requireRole(ROLES.FACULTY), asyncHandler(submissionsController.listMine));
router.post(
  '/',
  requireRole(ROLES.FACULTY),
  upload.single('file'),
  asyncHandler(submissionsController.upload),
);
router.put(
  '/:documentId',
  requireRole(ROLES.FACULTY),
  upload.single('file'),
  asyncHandler(submissionsController.replace),
);
router.delete('/:documentId', requireRole(ROLES.FACULTY), asyncHandler(submissionsController.remove));

// ---- Faculty + Coordinator ----
router.get(
  '/:documentId/versions',
  requireRole(ROLES.FACULTY, ROLES.COURSE_COORDINATOR),
  asyncHandler(submissionsController.listVersions),
);

// ---- Course Coordinator ----
router.get(
  '/course/:courseId',
  requireRole(ROLES.COURSE_COORDINATOR),
  asyncHandler(submissionsController.listForCourse),
);
router.put(
  '/course/:courseId/deadline',
  requireRole(ROLES.COURSE_COORDINATOR),
  validate(z.object({ deadline: z.string().datetime() })),
  asyncHandler(submissionsController.setDeadline),
);
router.post(
  '/:documentId/reopen',
  requireRole(ROLES.COURSE_COORDINATOR),
  asyncHandler(submissionsController.reopen),
);

export default router;

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

// ---- Faculty: item-centric (an item = one Course File section for one course section) ----
router.get('/mine', requireRole(ROLES.FACULTY), asyncHandler(submissionsController.listMine));

// Upload a file (multipart field "file") OR enter text (field "text"). First call = version 1,
// later calls = a new version that becomes current.
router.post(
  '/items/:itemId',
  requireRole(ROLES.FACULTY),
  upload.single('file'),
  asyncHandler(submissionsController.saveVersion),
);
router.delete('/items/:itemId', requireRole(ROLES.FACULTY), asyncHandler(submissionsController.remove));
router.post(
  '/items/:itemId/versions/:versionNumber/restore',
  requireRole(ROLES.FACULTY),
  asyncHandler(submissionsController.restoreVersion),
);

// ---- Faculty + Coordinator ----
router.get(
  '/items/:itemId/versions',
  requireRole(ROLES.FACULTY, ROLES.COURSE_COORDINATOR),
  asyncHandler(submissionsController.listVersions),
);
router.get(
  '/:submissionId/download',
  requireRole(ROLES.FACULTY, ROLES.COURSE_COORDINATOR),
  asyncHandler(submissionsController.download),
);

// ---- Course Coordinator ----
router.get('/course/:courseId', requireRole(ROLES.COURSE_COORDINATOR), asyncHandler(submissionsController.listForCourse));
router.put(
  '/course/:courseId/deadline',
  requireRole(ROLES.COURSE_COORDINATOR),
  validate(
    z.object({
      deadline: z.string().datetime(),
      partId: z.number().int().positive().optional(),
      sectionId: z.number().int().positive().optional(),
    }),
  ),
  asyncHandler(submissionsController.setDeadline),
);
router.post(
  '/items/:itemId/reopen',
  requireRole(ROLES.COURSE_COORDINATOR),
  validate(z.object({ until: z.string().datetime().optional(), reason: z.string().max(500).optional() })),
  asyncHandler(submissionsController.reopen),
);
router.post(
  '/:submissionId/review',
  requireRole(ROLES.COURSE_COORDINATOR),
  validate(z.object({ status: z.enum(['APPROVED', 'REVISION_REQUESTED', 'REJECTED']), comments: z.string().min(1).max(1000) })),
  asyncHandler(submissionsController.review),
);

export default router;

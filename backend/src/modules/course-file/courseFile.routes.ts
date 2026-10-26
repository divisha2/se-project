import { Router } from 'express';
import { ROLES } from '../../constants/roles';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { asyncHandler } from '../../utils/asyncHandler';
import { courseFileController } from './courseFile.controller';

const router = Router();

router.use(authenticate);

// Template structure (any signed-in user with access to the course); admin can edit it.
router.get('/:courseId/sections', asyncHandler(courseFileController.listSections));
router.put('/:courseId/sections', requireRole(ROLES.ADMIN), asyncHandler(courseFileController.upsertSection));

// Faculty: my sections -> parts -> items, and the part / complete-submission actions.
router.get('/:courseId/workspace', requireRole(ROLES.FACULTY), asyncHandler(courseFileController.workspace));
router.post(
  '/:courseId/sections/:sectionId/parts/:partId/submit',
  requireRole(ROLES.FACULTY),
  asyncHandler(courseFileController.submitPart),
);
router.post(
  '/:courseId/sections/:sectionId/complete',
  requireRole(ROLES.FACULTY),
  asyncHandler(courseFileController.completeSubmission),
);

// Coordinator: overview + send a part back.
router.get('/:courseId/completion', requireRole(ROLES.COURSE_COORDINATOR), asyncHandler(courseFileController.completionStatus));
router.post(
  '/:courseId/sections/:sectionId/parts/:partId/reopen',
  requireRole(ROLES.COURSE_COORDINATOR),
  asyncHandler(courseFileController.reopenPart),
);

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { ROLES } from '../../constants/roles';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { consolidationController } from './consolidation.controller';

const router = Router();

// Everything here is Course Coordinator only.
router.use(authenticate, requireRole(ROLES.COURSE_COORDINATOR));

// Trigger AI processing (async - returns 202 and runs through the job queue)
router.post('/course/:courseId/run', asyncHandler(consolidationController.runForCourse));
router.post(
  '/course/:courseId/sections/:templateSectionId/run',
  asyncHandler(consolidationController.runForSection),
);

// Review / edit / accept / reject
router.get('/course/:courseId/content', asyncHandler(consolidationController.listContent));
router.post(
  '/course/:courseId/content',
  validate(z.object({ templateSectionId: z.coerce.number().int().positive(), text: z.string().min(1) })),
  asyncHandler(consolidationController.addManualContent),
);
router.get('/content/:contentId/sources', asyncHandler(consolidationController.getSources));
router.put(
  '/content/:contentId',
  validate(z.object({ text: z.string().min(1) })),
  asyncHandler(consolidationController.editContent),
);
router.patch(
  '/content/:contentId/decision',
  validate(z.object({ decision: z.enum(['ACCEPTED', 'REJECTED']) })),
  asyncHandler(consolidationController.setDecision),
);

export default router;

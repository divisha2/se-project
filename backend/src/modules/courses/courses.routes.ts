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

// Lookup data for the admin "new course" form (must stay above "/:courseId").
router.get('/meta', requireRole(ROLES.ADMIN), asyncHandler(coursesController.meta));

router.get('/:courseId', asyncHandler(coursesController.get));

// Administrator: course / section / assignment management (FR-ADM-05..08)
router.post(
  '/',
  requireRole(ROLES.ADMIN),
  validate(
    z.object({
      programId: z.coerce.number().int().positive(),
      code: z.string().min(2),
      title: z.string().min(2),
      credits: z.coerce.number().positive().max(20).optional(),
      description: z.string().optional(),
      coordinatorId: z.coerce.number().int().positive(),
      semesterId: z.coerce.number().int().positive().optional(),
      sections: z.array(z.string().min(1)).optional(),
    }),
  ),
  asyncHandler(coursesController.create),
);
router.patch('/:courseId', requireRole(ROLES.ADMIN), asyncHandler(coursesController.update));
router.post(
  '/:courseId/sections',
  requireRole(ROLES.ADMIN),
  validate(z.object({ name: z.string().min(1), capacity: z.coerce.number().int().positive().optional() })),
  asyncHandler(coursesController.createSection),
);
router.post(
  '/:courseId/faculty',
  requireRole(ROLES.ADMIN),
  validate(
    z.object({
      sectionId: z.coerce.number().int().positive(),
      facultyId: z.coerce.number().int().positive(),
      assignmentRole: z.enum(['PRIMARY_INSTRUCTOR', 'CO_INSTRUCTOR', 'LAB_INSTRUCTOR']).optional(),
    }),
  ),
  asyncHandler(coursesController.assignFaculty),
);
router.put(
  '/:courseId/coordinator',
  requireRole(ROLES.ADMIN),
  validate(z.object({ userId: z.coerce.number().int().positive() })),
  asyncHandler(coursesController.assignCoordinator),
);
router.put('/:courseId/institution', requireRole(ROLES.ADMIN), asyncHandler(coursesController.updateInstitution));

// Course Coordinator: common course-level information (FR-CC-01)
router.get('/:courseId/common-info', requireRole(ROLES.COURSE_COORDINATOR, ROLES.ADMIN), asyncHandler(coursesController.getCommonInfo));
router.put('/:courseId/common-info', requireRole(ROLES.COURSE_COORDINATOR), asyncHandler(coursesController.updateCommonInfo));

export default router;

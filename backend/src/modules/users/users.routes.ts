import { Router } from 'express';
import { z } from 'zod';
import { ROLES } from '../../constants/roles';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { usersController } from './users.controller';

const router = Router();

// FR-ADM-01..04: Administrator only.
router.use(authenticate, requireRole(ROLES.ADMIN));

const createSchema = z.object({
  employeeId: z.string().min(1),
  fullName: z.string().min(1),
  department: z.string().optional(),
  designation: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([ROLES.ADMIN, ROLES.FACULTY, ROLES.COURSE_COORDINATOR]),
});

router.get('/', asyncHandler(usersController.list));
router.post('/', validate(createSchema), asyncHandler(usersController.create));
router.patch(
  '/:id/role',
  validate(z.object({ role: z.enum([ROLES.ADMIN, ROLES.FACULTY, ROLES.COURSE_COORDINATOR]) })),
  asyncHandler(usersController.updateRole),
);
router.patch(
  '/:id/active',
  validate(z.object({ isActive: z.boolean() })),
  asyncHandler(usersController.setActive),
);

export default router;

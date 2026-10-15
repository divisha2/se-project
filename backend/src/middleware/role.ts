import { NextFunction, Request, Response } from 'express';
import { Role } from '../constants/roles';
import { ApiError } from '../utils/ApiError';

// FR-ADM-04: block functions not permitted for the user's role.
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Not allowed for your role'));
    next();
  };

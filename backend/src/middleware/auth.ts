
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../constants/roles';
import { ApiError } from '../utils/ApiError';

interface JwtPayload {
  userId: number;
  role: Role;
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(
      ApiError.unauthorized('Missing token')
    );
  }

  try {
    const payload = jwt.verify(
      header.slice(7),
      env.JWT_SECRET
    ) as JwtPayload;

    if (
      typeof payload.userId !== 'number' ||
      !payload.role
    ) {
      return next(
        ApiError.unauthorized('Invalid token payload')
      );
    }

    req.user = {
      id: payload.userId,
      role: payload.role,
    };

    next();
  } catch {
    next(
      ApiError.unauthorized('Invalid or expired token')
    );
  }
};

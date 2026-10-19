
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { signToken } from '../../utils/jwt';

export const authService = {
  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    // Find the user and their assigned roles.
    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Use the same message for invalid email or password.
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Compare the submitted password with the stored hash.
    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Extract the assigned role codes.
    const roles = user.roles.map(
      (userRole) => userRole.role.code
    );

    if (roles.length === 0) {
      throw ApiError.forbidden(
        'No role assigned to this account'
      );
    }

    // Keep a primary role for the existing JWT helper.
    const role =
      roles.find((r) => r === 'ADMIN') ??
      roles.find((r) => r === 'COURSE_COORDINATOR') ??
      roles[0];

    const token = signToken(user.id, role);

    return {
      token,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        email: user.email,
        fullName: user.fullName,
        role,
        roles,
        mustChangePassword: user.mustChangePassword,
      },
    };
  },

  async getProfile(userId: number | string) {
    const id = Number(userId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw ApiError.unauthorized('Invalid user ID');
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw ApiError.notFound('User not found');
    }

    const roles = user.roles.map(
      (userRole) => userRole.role.code
    );

    return {
      user: {
        id: user.id,
        employeeId: user.employeeId,
        email: user.email,
        fullName: user.fullName,
        role: roles[0] ?? null,
        roles,
        mustChangePassword: user.mustChangePassword,
      },
    };
  },
};

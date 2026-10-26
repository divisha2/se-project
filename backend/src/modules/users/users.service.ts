import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { toId } from '../../services/access';

// Admin user management.
//  FR-ADM-01 create user accounts   FR-ADM-02 assign roles   FR-ADM-03 activate / deactivate
const publicUser = {
  id: true, employeeId: true, fullName: true, email: true, phone: true, designation: true,
  department: true, isActive: true, mustChangePassword: true, createdAt: true,
  roles: { select: { role: { select: { code: true } } } },
} as const;

const shape = (u: any) => ({ ...u, roles: u.roles.map((r: any) => r.role.code), role: u.roles[0]?.role.code ?? null });

async function setSingleRole(userId: number, code: string) {
  const role = await prisma.role.findUnique({ where: { code: code as any } });
  if (!role) throw ApiError.badRequest(`Unknown role ${code}`);
  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId } }),
    prisma.userRole.create({ data: { userId, roleId: role.id } }),
  ]);
}

export const usersService = {
  async list(role?: string) {
    const users = await prisma.user.findMany({
      where: role ? { roles: { some: { role: { code: role as any } } } } : undefined,
      orderBy: [{ fullName: 'asc' }],
      select: publicUser,
    });
    return { users: users.map(shape) };
  },

  async create(data: any) {
    const email = String(data.email).trim().toLowerCase();
    if (await prisma.user.findFirst({ where: { OR: [{ email }, { employeeId: data.employeeId }] } })) {
      throw ApiError.conflict('A user with this email or employee id already exists');
    }
    const user = await prisma.user.create({
      data: {
        employeeId: data.employeeId,
        fullName: data.fullName,
        email,
        passwordHash: await bcrypt.hash(data.password, 12),
        mustChangePassword: true,
        department: data.department ?? null,
        designation: data.designation ?? null,
        schoolId: data.schoolId ?? null,
      },
    });
    await setSingleRole(user.id, data.role);
    return shape(await prisma.user.findUnique({ where: { id: user.id }, select: publicUser }));
  },

  async updateRole(id: string, role: string) {
    const userId = toId(id);
    if (!(await prisma.user.findUnique({ where: { id: userId } }))) throw ApiError.notFound('User not found');
    await setSingleRole(userId, role);
    return shape(await prisma.user.findUnique({ where: { id: userId }, select: publicUser }));
  },

  async setActive(id: string, isActive: boolean, actingUserId: number) {
    const userId = toId(id);
    if (userId === actingUserId && !isActive) throw ApiError.badRequest('You cannot deactivate your own account');
    const user = await prisma.user.update({ where: { id: userId }, data: { isActive }, select: publicUser }).catch(() => null);
    if (!user) throw ApiError.notFound('User not found');
    return shape(user);
  },
};

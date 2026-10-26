import { prisma } from '../config/prisma';

export const audit = async (
  userId: number | null,
  actionType: string,
  entityName: string,
  entityId: number,
  details?: Record<string, unknown>,
) => {
  try {
    await prisma.auditLog.create({
      data: { userId, actionType, entityName, entityId, details: (details ?? undefined) as any },
    });
  } catch (err) {
    console.error('audit log failed:', err);
  }
};

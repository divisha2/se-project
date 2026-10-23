// Roles from SRS 2.3. HOD is a future extension and not part of the core system.
export const ROLES = {
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  COURSE_COORDINATOR: 'COURSE_COORDINATOR',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

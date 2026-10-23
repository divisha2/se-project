
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

// Course listing for logged-in users.
// The Prisma query below assumes Course has a standard id field.
// Role-based filtering will need your actual Course relations.
export const coursesService = {
  async listCourses(_userId: number, _role: string) {
    const courses = await prisma.course.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    return { courses };
  },

  async createCourse(_data: unknown) {
    throw ApiError.notImplemented('courses.createCourse');
  },

  async updateCourse(_id: string, _data: unknown) {
    throw ApiError.notImplemented('courses.updateCourse');
  },

  async createSection(_courseId: string, _data: unknown) {
    throw ApiError.notImplemented('courses.createSection');
  },

  async assignFaculty(_courseId: string, _data: unknown) {
    throw ApiError.notImplemented('courses.assignFaculty');
  },

  async assignCoordinator(_courseId: string, _userId: string) {
    throw ApiError.notImplemented('courses.assignCoordinator');
  },

  async getCommonInfo(_courseId: string) {
    throw ApiError.notImplemented('courses.getCommonInfo');
  },

  async updateCommonInfo(_courseId: string, _data: unknown) {
    throw ApiError.notImplemented('courses.updateCommonInfo');
  },
};

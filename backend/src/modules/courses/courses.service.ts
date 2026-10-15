import { ApiError } from '../../utils/ApiError';

// Admin course setup + coordinator course info.
//  FR-ADM-05 create / manage courses
//  FR-ADM-06 create / manage sections of a course
//  FR-ADM-07 assign faculty to courses and sections
//  FR-ADM-08 assign a Course Coordinator to a course
//  FR-FAC-01 list courses/sections assigned to the logged-in faculty
//  FR-CC-01  maintain common course-level info (outcomes, CO-PO mapping, syllabus...)
export const coursesService = {
  async listCourses(_userId: string, _role: string) {
    throw ApiError.notImplemented('courses.listCourses');
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

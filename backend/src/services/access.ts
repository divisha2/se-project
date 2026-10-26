import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

const offeringId = (v: string | number) => {
  const id = Number(v);
  if (!Number.isSafeInteger(id) || id <= 0) throw ApiError.badRequest('Invalid id');
  return id;
};
export const toId = offeringId;

// NOTE: in this API a "course" in a URL (:courseId) is a CourseOffering id, i.e.
// a catalogue course in a given semester. That is what has sections, a Course File
// and a coordinator.
export async function assertCoordinator(userId: number, courseId: string | number) {
  const offering = await prisma.courseOffering.findUnique({
    where: { id: toId(courseId) },
    include: { course: true, semester: true, courseFile: true },
  });
  if (!offering) throw ApiError.notFound('Course not found');
  if (offering.coordinatorId !== userId) throw ApiError.forbidden('You are not the coordinator of this course');
  return offering;
}

export async function assertFacultyOnSection(userId: number, sectionId: number) {
  const link = await prisma.sectionFacultyAssignment.findUnique({
    where: { sectionId_facultyId: { sectionId, facultyId: userId } },
  });
  // FR-FAC-02: no submitting to courses/sections the faculty member isn't assigned to.
  if (!link) throw ApiError.forbidden('You are not assigned to this section');
}

export async function loadItem(itemId: string | number) {
  const item = await prisma.courseFileItem.findUnique({
    where: { id: toId(itemId) },
    include: {
      templateSection: { include: { part: true } },
      section: true,
      courseFile: { include: { offering: { include: { course: true, semester: true } } } },
    },
  });
  if (!item) throw ApiError.notFound('Course File item not found');
  return item;
}

// Faculty may only touch section-level items of sections they are assigned to.
export async function loadItemForFaculty(userId: number, itemId: string | number) {
  const item = await loadItem(itemId);
  if (!item.sectionId) throw ApiError.forbidden('This section is maintained by the Course Coordinator');
  await assertFacultyOnSection(userId, item.sectionId);
  return item;
}

export async function loadItemForCoordinator(userId: number, itemId: string | number) {
  const item = await loadItem(itemId);
  if (item.courseFile.offering.coordinatorId !== userId) {
    throw ApiError.forbidden('You are not the coordinator of this course');
  }
  return item;
}

import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { toId } from '../../services/access';
import { getCommonSections } from '../../services/commonInfo';
import { ensureCourseFile } from '../course-file/courseFile.service';

// NOTE: ":courseId" in these routes is a CourseOffering id (a course in a semester).
//  FR-ADM-05..08 courses, sections, faculty assignment, coordinator   FR-CC-01 common info

const offeringInclude = {
  course: { include: { program: true } },
  semester: true,
  coordinator: { select: { id: true, fullName: true, email: true } },
  courseFile: true,
  sections: { orderBy: { name: 'asc' as const }, include: { assignments: { include: { faculty: { select: { id: true, fullName: true, email: true } } } } } },
};

const toDto = (o: any) => {
  const facultyIds = new Set<number>();
  o.sections.forEach((s: any) => s.assignments.forEach((a: any) => facultyIds.add(a.facultyId)));
  return {
    id: o.id,
    courseId: o.courseId,
    code: o.course.code,
    title: o.course.title,
    description: o.course.description,
    credits: Number(o.course.credits),
    program: o.course.program?.name,
    semester: o.semester.name,
    semesterId: o.semesterId,
    isCurrentSemester: o.semester.isCurrent,
    status: o.status,
    courseFileStatus: o.courseFile?.status ?? null,
    coordinator: o.coordinator,
    facultyCount: facultyIds.size,
    sections: o.sections.map((s: any) => ({
      id: s.id,
      name: s.name,
      capacity: s.capacity,
      finalSubmittedAt: s.finalSubmittedAt,
      faculty: s.assignments.map((a: any) => ({ id: a.faculty.id, fullName: a.faculty.fullName, role: a.assignmentRole })),
    })),
  };
};

async function loadVisible(id: number, user: { id: number; role: string }) {
  const o = await prisma.courseOffering.findUnique({ where: { id }, include: offeringInclude });
  if (!o) throw ApiError.notFound('Course not found');
  if (user.role === 'COURSE_COORDINATOR' && o.coordinatorId !== user.id) throw ApiError.forbidden('Not your course');
  if (user.role === 'FACULTY' && !o.sections.some((s) => s.assignments.some((a) => a.facultyId === user.id))) {
    throw ApiError.forbidden('You are not assigned to this course');
  }
  return o;
}

async function requireRoleOf(userId: number, code: 'FACULTY' | 'COURSE_COORDINATOR') {
  const u = await prisma.user.findFirst({ where: { id: userId, isActive: true, roles: { some: { role: { code } } } } });
  if (!u) throw ApiError.badRequest(`User ${userId} is not an active ${code.toLowerCase().replace('_', ' ')}`);
  return u;
}

export const coursesService = {
  async listCourses(userId: number, role: string) {
    const where =
      role === 'ADMIN' ? {} : role === 'COURSE_COORDINATOR' ? { coordinatorId: userId } : { sections: { some: { assignments: { some: { facultyId: userId } } } } };
    const offerings = await prisma.courseOffering.findMany({
      where,
      include: offeringInclude,
      orderBy: [{ semester: { isCurrent: 'desc' } }, { course: { code: 'asc' } }],
    });
    // Faculty only see the sections they teach.
    const courses = offerings.map((o) => {
      const dto = toDto(o);
      if (role === 'FACULTY') dto.sections = dto.sections.filter((s: any) => s.faculty.some((f: any) => f.id === userId));
      return dto;
    });
    return { courses };
  },

  async getCourse(courseId: string, user: { id: number; role: string }) {
    return { course: toDto(await loadVisible(toId(courseId), user)) };
  },

  // Lookup data for the admin "new course" form.
  async meta() {
    const [programs, semesters, coordinators, faculty] = await Promise.all([
      prisma.program.findMany({ orderBy: { name: 'asc' }, select: { id: true, code: true, name: true } }),
      prisma.semester.findMany({ orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }], select: { id: true, name: true, isCurrent: true } }),
      prisma.user.findMany({ where: { isActive: true, roles: { some: { role: { code: 'COURSE_COORDINATOR' } } } }, select: { id: true, fullName: true } }),
      prisma.user.findMany({ where: { isActive: true, roles: { some: { role: { code: 'FACULTY' } } } }, select: { id: true, fullName: true } }),
    ]);
    return { programs, semesters, coordinators, faculty };
  },

  async createCourse(data: any) {
    await requireRoleOf(Number(data.coordinatorId), 'COURSE_COORDINATOR');
    const semester = data.semesterId
      ? await prisma.semester.findUnique({ where: { id: Number(data.semesterId) } })
      : await prisma.semester.findFirst({ where: { isCurrent: true } });
    if (!semester) throw ApiError.badRequest('No semester found');

    const course = await prisma.course.upsert({
      where: { code: data.code },
      update: {},
      create: { programId: Number(data.programId), code: data.code, title: data.title, credits: data.credits ?? 3, description: data.description ?? null },
    });
    if (await prisma.courseOffering.findUnique({ where: { courseId_semesterId: { courseId: course.id, semesterId: semester.id } } })) {
      throw ApiError.conflict('This course is already offered in that semester');
    }
    const offering = await prisma.courseOffering.create({
      data: {
        courseId: course.id,
        semesterId: semester.id,
        coordinatorId: Number(data.coordinatorId),
        sections: { create: (data.sections?.length ? data.sections : ['A']).map((name: string) => ({ name })) },
      },
    });
    await ensureCourseFile(offering.id);
    return { course: toDto(await loadVisible(offering.id, { id: 0, role: 'ADMIN' })) };
  },

  async updateCourse(courseId: string, data: any) {
    const o = await prisma.courseOffering.findUnique({ where: { id: toId(courseId) } });
    if (!o) throw ApiError.notFound('Course not found');
    await prisma.course.update({
      where: { id: o.courseId },
      data: { title: data.title, description: data.description, credits: data.credits, isActive: data.isActive },
    });
    if (data.status) await prisma.courseOffering.update({ where: { id: o.id }, data: { status: data.status } });
    return { course: toDto(await loadVisible(o.id, { id: 0, role: 'ADMIN' })) };
  },

  async createSection(courseId: string, data: any) {
    const o = await prisma.courseOffering.findUnique({ where: { id: toId(courseId) } });
    if (!o) throw ApiError.notFound('Course not found');
    const section = await prisma.section.create({ data: { courseOfferingId: o.id, name: data.name, capacity: data.capacity ?? 60 } }).catch(() => {
      throw ApiError.conflict('A section with this name already exists');
    });
    await ensureCourseFile(o.id); // creates this section's items for every template section
    return section;
  },

  async assignFaculty(courseId: string, data: { sectionId: number; facultyId: number; assignmentRole?: string }) {
    const o = await prisma.courseOffering.findUnique({ where: { id: toId(courseId) } });
    if (!o) throw ApiError.notFound('Course not found');
    const section = await prisma.section.findFirst({ where: { id: data.sectionId, courseOfferingId: o.id } });
    if (!section) throw ApiError.notFound('Section not found in this course');
    await requireRoleOf(data.facultyId, 'FACULTY');

    const assignmentRole = (data.assignmentRole ?? 'PRIMARY_INSTRUCTOR') as any;
    const row = await prisma.sectionFacultyAssignment.upsert({
      where: { sectionId_facultyId: { sectionId: section.id, facultyId: data.facultyId } },
      update: { assignmentRole },
      create: { sectionId: section.id, facultyId: data.facultyId, assignmentRole },
    });
    // Items that had no responsible faculty member now point at the first one assigned.
    await prisma.courseFileItem.updateMany({ where: { sectionId: section.id, assignedFacultyId: null }, data: { assignedFacultyId: data.facultyId } });
    return row;
  },

  async assignCoordinator(courseId: string, userId: number) {
    await requireRoleOf(userId, 'COURSE_COORDINATOR');
    const o = await prisma.courseOffering.update({ where: { id: toId(courseId) }, data: { coordinatorId: userId } }).catch(() => null);
    if (!o) throw ApiError.notFound('Course not found');
    await prisma.courseFileItem.updateMany({ where: { courseFile: { courseOfferingId: o.id }, sectionId: null }, data: { assignedFacultyId: userId } });
    return { courseId: o.id, coordinatorId: userId };
  },

  // Admin: institution text that feeds the vision/mission and PEO/PO sections.
  async updateInstitution(courseId: string, data: { vision?: string; mission?: string; peos?: string; posPsos?: string }) {
    const o = await prisma.courseOffering.findUnique({ where: { id: toId(courseId) }, include: { course: { include: { program: true } } } });
    if (!o) throw ApiError.notFound('Course not found');
    await prisma.school.update({ where: { id: o.course.program.schoolId }, data: { vision: data.vision, mission: data.mission } });
    await prisma.program.update({ where: { id: o.course.programId }, data: { peos: data.peos, posPsos: data.posPsos } });
    return { ok: true };
  },

  // FR-CC-01
  async getCommonInfo(courseId: string, user: { id: number; role: string }) {
    const o = await loadVisible(toId(courseId), user);
    const outcomes = await prisma.courseOutcome.findMany({ where: { courseId: o.courseId }, include: { mappings: true }, orderBy: { code: 'asc' } });
    return {
      course: { description: o.course.description, objectives: o.course.objectives, syllabus: o.course.syllabus },
      outcomes: outcomes.map((c) => ({ code: c.code, description: c.description, type: c.type, mappings: c.mappings.map((m) => ({ mappedCode: m.mappedCode, level: m.level })) })),
      sections: await getCommonSections(o.id),
    };
  },

  async updateCommonInfo(courseId: string, userId: number, data: any) {
    const o = await prisma.courseOffering.findUnique({ where: { id: toId(courseId) }, include: { courseFile: true } });
    if (!o) throw ApiError.notFound('Course not found');
    if (o.coordinatorId !== userId) throw ApiError.forbidden('Not your course');
    const courseFile = o.courseFile ?? (await ensureCourseFile(o.id));

    await prisma.course.update({
      where: { id: o.courseId },
      data: { description: data.description, objectives: data.objectives, syllabus: data.syllabus },
    });

    for (const c of data.outcomes ?? []) {
      const co = await prisma.courseOutcome.upsert({
        where: { courseId_code: { courseId: o.courseId, code: c.code } },
        update: { description: c.description },
        create: { courseId: o.courseId, code: c.code, description: c.description, type: c.type ?? 'CO' },
      });
      for (const m of c.mappings ?? []) {
        await prisma.courseOutcomeMapping.upsert({
          where: { courseOutcomeId_mappedCode: { courseOutcomeId: co.id, mappedCode: m.mappedCode } },
          update: { level: m.level, createdBy: userId },
          create: { courseOutcomeId: co.id, mappedCode: m.mappedCode, level: m.level, createdBy: userId },
        });
      }
    }

    // Free-text for course-level sections (e.g. delivery plan, teaching methodology).
    for (const s of data.sections ?? []) {
      const ts = await prisma.templateSection.findFirst({ where: { id: s.templateSectionId, templateId: courseFile.templateId, scope: 'COURSE_LEVEL' } });
      if (!ts) continue;
      const existing = await prisma.consolidatedContent.findFirst({ where: { courseFileId: courseFile.id, templateSectionId: ts.id, isManual: true } });
      const text = String(s.text ?? '').trim();
      if (!text && existing) await prisma.consolidatedContent.delete({ where: { id: existing.id } });
      else if (text && existing) await prisma.consolidatedContent.update({ where: { id: existing.id }, data: { contentText: text, generatedBy: userId } });
      else if (text) {
        await prisma.consolidatedContent.create({
          data: { courseFileId: courseFile.id, templateSectionId: ts.id, title: ts.title, type: 'SECTION_TEXT', contentText: text, isManual: true, isAiGenerated: false, generatedBy: userId, reviewStatus: 'ACCEPTED', reviewedBy: userId, reviewedAt: new Date() },
        });
      }
    }
    return coursesService.getCommonInfo(courseId, { id: userId, role: 'COURSE_COORDINATOR' });
  },
};

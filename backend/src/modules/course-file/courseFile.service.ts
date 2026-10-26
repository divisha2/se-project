import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { audit } from '../../utils/audit';
import { displayStatus, isComplete, isItemLocked } from '../../utils/itemState';
import { assertCoordinator, assertFacultyOnSection, toId } from '../../services/access';
import { getCommonSections } from '../../services/commonInfo';

// ---------------------------------------------------------------------------
// Course File structure + the faculty "parts" flow.
//   FR-FAC-03 / FR-CC-04 / FR-FAC-11  predefined sections, mandatory vs optional
//   FR-CC-02 / FR-CC-03               completion overview for the coordinator
//   Parts: a faculty member submits each part (a group of sections) and then makes a
//   "complete submission" of their section's whole Course File.
// ---------------------------------------------------------------------------

const currentOf = (subs: { isCurrentVersion: boolean; isDeleted: boolean }[]) =>
  subs.find((s) => s.isCurrentVersion && !s.isDeleted) as any;

// Creates the Course File and one item per (template section x course section) if missing.
export async function ensureCourseFile(offeringId: number) {
  const offering = await prisma.courseOffering.findUnique({
    where: { id: offeringId },
    include: { sections: true, courseFile: true },
  });
  if (!offering) throw ApiError.notFound('Course not found');

  let courseFile = offering.courseFile;
  if (!courseFile) {
    const template = await prisma.courseFileTemplate.findFirst({ where: { isActive: true }, orderBy: { id: 'desc' } });
    if (!template) throw ApiError.conflict('No active Course File template. Run the seed first.');
    courseFile = await prisma.courseFile.create({ data: { courseOfferingId: offeringId, templateId: template.id } });
  }

  const templateSections = await prisma.templateSection.findMany({ where: { templateId: courseFile.templateId } });
  const existing = await prisma.courseFileItem.findMany({
    where: { courseFileId: courseFile.id },
    select: { templateSectionId: true, sectionId: true },
  });
  const key = (t: number, s: number | null) => `${t}:${s ?? 'x'}`;
  const have = new Set(existing.map((e) => key(e.templateSectionId, e.sectionId)));

  const toCreate: { courseFileId: number; templateSectionId: number; sectionId: number | null; assignedFacultyId?: number }[] = [];
  for (const ts of templateSections) {
    if (ts.scope === 'COURSE_LEVEL') {
      if (!have.has(key(ts.id, null))) {
        toCreate.push({ courseFileId: courseFile.id, templateSectionId: ts.id, sectionId: null, assignedFacultyId: offering.coordinatorId });
      }
    } else {
      for (const sec of offering.sections) {
        if (!have.has(key(ts.id, sec.id))) toCreate.push({ courseFileId: courseFile.id, templateSectionId: ts.id, sectionId: sec.id });
      }
    }
  }
  if (toCreate.length) await prisma.courseFileItem.createMany({ data: toCreate, skipDuplicates: true });
  return courseFile;
}

async function loadOfferingFor(courseId: string, user: { id: number; role: string }) {
  const id = toId(courseId);
  const offering = await prisma.courseOffering.findUnique({
    where: { id },
    include: { course: true, semester: true, coordinator: true, sections: { include: { assignments: { include: { faculty: true } } } } },
  });
  if (!offering) throw ApiError.notFound('Course not found');
  if (user.role === 'COURSE_COORDINATOR' && offering.coordinatorId !== user.id) throw ApiError.forbidden('Not your course');
  if (user.role === 'FACULTY' && !offering.sections.some((s) => s.assignments.some((a) => a.facultyId === user.id))) {
    throw ApiError.forbidden('You are not assigned to this course');
  }
  return offering;
}

export const courseFileService = {
  ensureCourseFile,

  // FR-FAC-03, FR-CC-04
  async listSections(courseId: string, user: { id: number; role: string }) {
    const offering = await loadOfferingFor(courseId, user);
    const courseFile = await ensureCourseFile(offering.id);
    const [parts, sections] = await Promise.all([
      prisma.templatePart.findMany({ where: { templateId: courseFile.templateId }, orderBy: { number: 'asc' } }),
      prisma.templateSection.findMany({ where: { templateId: courseFile.templateId }, orderBy: { number: 'asc' } }),
    ]);
    return { parts, sections };
  },

  // Maintainability (SRS 3.5): the template can be changed without code changes.
  async upsertSection(courseId: string, data: any) {
    const offering = await prisma.courseOffering.findUnique({ where: { id: toId(courseId) } });
    if (!offering) throw ApiError.notFound('Course not found');
    const courseFile = await ensureCourseFile(offering.id);
    const number = Number(data.number);
    if (!Number.isInteger(number) || number < 1) throw ApiError.badRequest('number is required');

    const fields = {
      title: String(data.title ?? '').trim(),
      description: data.description ?? null,
      scope: data.scope ?? (number <= 8 ? 'COURSE_LEVEL' : 'SECTION_LEVEL'),
      mandatory: data.mandatory ?? true,
      partId: data.partId ?? null,
      keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : undefined,
    };
    if (!fields.title) throw ApiError.badRequest('title is required');

    const saved = await prisma.templateSection.upsert({
      where: { templateId_number: { templateId: courseFile.templateId, number } },
      update: fields,
      create: { templateId: courseFile.templateId, number, ...fields, keywords: fields.keywords ?? [] },
    });
    await ensureCourseFile(offering.id); // creates items for a newly added section
    return saved;
  },

  // Faculty view: my sections -> parts -> items (the whole submission workspace).
  async getWorkspace(courseId: string, user: { id: number; role: string }) {
    const offering = await loadOfferingFor(courseId, user);
    const courseFile = await ensureCourseFile(offering.id);

    const mySections = offering.sections.filter((s) => s.assignments.some((a) => a.facultyId === user.id));
    const parts = await prisma.templatePart.findMany({
      where: { templateId: courseFile.templateId },
      orderBy: { number: 'asc' },
      include: { sections: { where: { scope: 'SECTION_LEVEL' }, orderBy: { number: 'asc' } } },
    });
    const items = await prisma.courseFileItem.findMany({
      where: { courseFileId: courseFile.id, sectionId: { in: mySections.map((s) => s.id) } },
      include: { templateSection: true, submissions: { orderBy: { versionNumber: 'desc' }, include: { uploader: { select: { fullName: true } } } } },
    });
    const partSubs = await prisma.partSubmission.findMany({ where: { courseFileId: courseFile.id, sectionId: { in: mySections.map((s) => s.id) } } });
    const now = new Date();

    const sections = mySections.map((sec) => {
      const secItems = items.filter((i) => i.sectionId === sec.id);
      const toDto = (i: (typeof secItems)[number]) => {
        const cur = currentOf(i.submissions);
        const liveVersions = i.submissions.filter((s) => !s.isDeleted).length;
        return {
          itemId: i.id,
          number: i.templateSection.number,
          title: i.templateSection.title,
          description: i.templateSection.description,
          mandatory: i.templateSection.mandatory,
          deadline: i.deadline,
          locked: isItemLocked(i, now),
          reopenedUntil: i.reopenedUntil && i.reopenedUntil > now ? i.reopenedUntil : null,
          status: displayStatus(i, cur, now),
          validationStatus: cur?.validationStatus ?? null,
          validationMessage: cur?.validationMessage ?? null,
          complete: isComplete(cur),
          versionCount: liveVersions,
          current: cur
            ? {
                id: cur.id,
                versionNumber: cur.versionNumber,
                fileName: cur.fileName,
                isTextEntry: cur.isTextEntry,
                fileSizeBytes: Number(cur.fileSizeBytes),
                uploadedAt: cur.uploadedAt,
                uploadedBy: cur.uploader?.fullName,
              }
            : null,
        };
      };

      const partDtos = parts
        .map((p) => {
          const pItems = secItems.filter((i) => i.templateSection.partId === p.id).sort((a, b) => a.templateSection.number - b.templateSection.number).map(toDto);
          if (!pItems.length) return null;
          const ps = partSubs.find((x) => x.partId === p.id && x.sectionId === sec.id);
          const mandatory = pItems.filter((i) => i.mandatory);
          const done = mandatory.filter((i) => i.complete).length;
          return {
            id: p.id,
            number: p.number,
            name: p.name,
            description: p.description,
            status: ps?.status ?? 'OPEN',
            submittedAt: ps?.submittedAt ?? null,
            mandatoryTotal: mandatory.length,
            mandatoryDone: done,
            canSubmit: (ps?.status ?? 'OPEN') !== 'SUBMITTED' && done === mandatory.length,
            items: pItems,
          };
        })
        .filter(Boolean) as any[];

      const ungrouped = secItems.filter((i) => !i.templateSection.partId).map(toDto);
      const ungroupedOk = ungrouped.filter((i) => i.mandatory).every((i) => i.complete);
      const allPartsSubmitted = partDtos.length > 0 && partDtos.every((p) => p.status === 'SUBMITTED');
      const role = sec.assignments.find((a) => a.facultyId === user.id)?.assignmentRole;

      return {
        id: sec.id,
        name: sec.name,
        myRole: role,
        finalSubmittedAt: sec.finalSubmittedAt,
        canComplete: !sec.finalSubmittedAt && allPartsSubmitted && ungroupedOk,
        parts: partDtos,
        ungrouped,
      };
    });

    return {
      course: {
        id: offering.id,
        code: offering.course.code,
        title: offering.course.title,
        semester: offering.semester.name,
        coordinator: offering.coordinator.fullName,
      },
      courseFileStatus: courseFile.status,
      sections,
    };
  },

  // Submit one part (a group of sections) for one course section.
  async submitPart(userId: number, courseId: string, sectionId: string, partId: string, notes?: string) {
    const offeringId = toId(courseId);
    const secId = toId(sectionId);
    const pId = toId(partId);
    await assertFacultyOnSection(userId, secId);

    const section = await prisma.section.findUnique({ where: { id: secId } });
    if (!section || section.courseOfferingId !== offeringId) throw ApiError.notFound('Section not found in this course');
    const courseFile = await ensureCourseFile(offeringId);

    const items = await prisma.courseFileItem.findMany({
      where: { courseFileId: courseFile.id, sectionId: secId, templateSection: { partId: pId } },
      include: { templateSection: true, submissions: true },
    });
    if (!items.length) throw ApiError.notFound('Part not found');

    const problems = items
      .filter((i) => i.templateSection.mandatory)
      .map((i) => {
        const cur = currentOf(i.submissions);
        if (!cur) return { number: i.templateSection.number, title: i.templateSection.title, reason: 'Nothing submitted yet' };
        if (cur.validationStatus === 'INVALID') return { number: i.templateSection.number, title: i.templateSection.title, reason: 'Invalid submission - upload a corrected file' };
        if (cur.validationStatus === 'NOT_CHECKED') return { number: i.templateSection.number, title: i.templateSection.title, reason: 'Still being checked - try again in a moment' };
        return null;
      })
      .filter(Boolean);
    if (problems.length) throw ApiError.conflict('This part is not complete yet', { missing: problems });

    const now = new Date();
    const existing = await prisma.partSubmission.findFirst({ where: { courseFileId: courseFile.id, partId: pId, sectionId: secId } });
    const data = { status: 'SUBMITTED' as const, submittedBy: userId, submittedAt: now, notes: notes ?? null };
    const saved = existing
      ? await prisma.partSubmission.update({ where: { id: existing.id }, data })
      : await prisma.partSubmission.create({ data: { courseFileId: courseFile.id, partId: pId, sectionId: secId, ...data } });
    await audit(userId, 'PART_SUBMITTED', 'PartSubmission', saved.id, { sectionId: secId, partId: pId });
    return saved;
  },

  // "Complete submission": every part of this section is submitted -> hand the section's file over.
  async completeSubmission(userId: number, courseId: string, sectionId: string) {
    const offeringId = toId(courseId);
    const secId = toId(sectionId);
    await assertFacultyOnSection(userId, secId);
    const courseFile = await ensureCourseFile(offeringId);

    const sectionLevel = await prisma.templateSection.findMany({ where: { templateId: courseFile.templateId, scope: 'SECTION_LEVEL' } });
    const partIds = [...new Set(sectionLevel.map((t) => t.partId).filter((x): x is number => x !== null))];
    const subs = await prisma.partSubmission.findMany({ where: { courseFileId: courseFile.id, sectionId: secId, status: 'SUBMITTED' } });
    const notDone = partIds.filter((p) => !subs.some((s) => s.partId === p));
    if (notDone.length) {
      const parts = await prisma.templatePart.findMany({ where: { id: { in: notDone } } });
      throw ApiError.conflict('Submit every part before completing the submission', { missingParts: parts.map((p) => p.name) });
    }

    const ungroupedItems = await prisma.courseFileItem.findMany({
      where: { courseFileId: courseFile.id, sectionId: secId, templateSection: { partId: null, mandatory: true, scope: 'SECTION_LEVEL' } },
      include: { submissions: true, templateSection: true },
    });
    const ungroupedMissing = ungroupedItems.filter((i) => !isComplete(currentOf(i.submissions)));
    if (ungroupedMissing.length) {
      throw ApiError.conflict('Some mandatory sections are not complete', { missing: ungroupedMissing.map((i) => i.templateSection.title) });
    }

    const now = new Date();
    await prisma.section.update({ where: { id: secId }, data: { finalSubmittedAt: now, finalSubmittedBy: userId } });

    // When every section of the course is handed over, the whole Course File goes to the coordinator.
    const remaining = await prisma.section.count({ where: { courseOfferingId: offeringId, finalSubmittedAt: null } });
    if (remaining === 0) await prisma.courseFile.update({ where: { id: courseFile.id }, data: { status: 'SUBMITTED_FOR_REVIEW' } });
    await audit(userId, 'SECTION_COMPLETED', 'Section', secId, { courseId: offeringId });
    return { sectionId: secId, finalSubmittedAt: now, courseFileReady: remaining === 0 };
  },

  // Coordinator sends a part back to the faculty member for changes.
  async reopenPart(userId: number, courseId: string, sectionId: string, partId: string, reason?: string) {
    const offering = await assertCoordinator(userId, courseId);
    const courseFile = await ensureCourseFile(offering.id);
    const secId = toId(sectionId);
    const ps = await prisma.partSubmission.findFirst({ where: { courseFileId: courseFile.id, sectionId: secId, partId: toId(partId) } });
    if (!ps) throw ApiError.notFound('This part has not been submitted');
    await prisma.$transaction([
      prisma.partSubmission.update({ where: { id: ps.id }, data: { status: 'REOPENED', reopenedAt: new Date(), notes: reason ?? ps.notes } }),
      prisma.section.update({ where: { id: secId }, data: { finalSubmittedAt: null, finalSubmittedBy: null } }),
      prisma.courseFile.update({ where: { id: courseFile.id }, data: { status: 'IN_PROGRESS' } }),
    ]);
    await audit(userId, 'PART_REOPENED', 'PartSubmission', ps.id, { reason });
    return { ok: true };
  },

  // FR-CC-02 / FR-CC-03 / FR-CC-04 / FR-CC-05 / FR-CC-06
  async getCompletionStatus(courseId: string, userId: number) {
    const offering = await assertCoordinator(userId, courseId);
    const courseFile = await ensureCourseFile(offering.id);
    const now = new Date();

    const sections = await prisma.section.findMany({
      where: { courseOfferingId: offering.id },
      orderBy: { name: 'asc' },
      include: { assignments: { include: { faculty: { select: { id: true, fullName: true } } } } },
    });
    const parts = await prisma.templatePart.findMany({ where: { templateId: courseFile.templateId }, orderBy: { number: 'asc' } });
    const partSubs = await prisma.partSubmission.findMany({ where: { courseFileId: courseFile.id } });
    const items = await prisma.courseFileItem.findMany({
      where: { courseFileId: courseFile.id, sectionId: { not: null } },
      orderBy: [{ sectionId: 'asc' }, { templateSection: { number: 'asc' } }],
      include: {
        templateSection: { include: { part: true } },
        section: true,
        submissions: { where: { isDeleted: false }, orderBy: { versionNumber: 'desc' }, include: { uploader: { select: { fullName: true } } } },
      },
    });

    const rows = items.map((i) => {
      const cur = currentOf(i.submissions);
      return {
        itemId: i.id,
        templateSectionId: i.templateSectionId,
        sectionId: i.sectionId,
        sectionName: i.section?.name,
        number: i.templateSection.number,
        title: i.templateSection.title,
        partName: i.templateSection.part?.name ?? null,
        mandatory: i.templateSection.mandatory,
        status: displayStatus(i, cur, now),
        validationStatus: cur?.validationStatus ?? null,
        validationMessage: cur?.validationMessage ?? null,
        needsAttention: cur?.validationStatus === 'INVALID' || cur?.validationStatus === 'NEEDS_REVIEW',
        deadline: i.deadline,
        locked: isItemLocked(i, now),
        versionCount: i.submissions.length,
        current: cur
          ? { id: cur.id, fileName: cur.fileName, isTextEntry: cur.isTextEntry, versionNumber: cur.versionNumber, uploadedAt: cur.uploadedAt, uploadedBy: cur.uploader?.fullName }
          : null,
      };
    });

    const sectionSummaries = sections.map((sec) => {
      const mine = rows.filter((r) => r.sectionId === sec.id);
      const mandatory = mine.filter((r) => r.mandatory);
      return {
        id: sec.id,
        name: sec.name,
        faculty: sec.assignments.map((a) => ({ id: a.faculty.id, name: a.faculty.fullName, role: a.assignmentRole })),
        mandatoryTotal: mandatory.length,
        completed: mandatory.filter((r) => r.validationStatus === 'VALID' || r.validationStatus === 'NEEDS_REVIEW').length,
        pending: mandatory.filter((r) => !r.current).length,
        invalid: mine.filter((r) => r.validationStatus === 'INVALID').length,
        needsReview: mine.filter((r) => r.validationStatus === 'NEEDS_REVIEW').length,
        locked: mine.filter((r) => r.locked).length,
        finalSubmittedAt: sec.finalSubmittedAt,
        parts: parts
          .map((p) => {
            const ps = partSubs.find((x) => x.partId === p.id && x.sectionId === sec.id);
            return { id: p.id, name: p.name, status: ps?.status ?? 'OPEN', submittedAt: ps?.submittedAt ?? null };
          })
          .filter((p) => mine.some((r) => r.partName === p.name)),
      };
    });

    const common = await getCommonSections(offering.id);

    return {
      courseFileStatus: courseFile.status,
      sections: sectionSummaries,
      items: rows,
      common: common.map((c) => ({ number: c.number, title: c.title, filled: !!c.text, source: c.source })),
    };
  },
};

// Called by submissions when a faculty member edits an item after submitting its part.
export async function markPartDirty(item: { courseFileId: number; sectionId: number | null; templateSection: { partId: number | null } }) {
  if (!item.sectionId) return;
  if (item.templateSection.partId) {
    await prisma.partSubmission.updateMany({
      where: { courseFileId: item.courseFileId, sectionId: item.sectionId, partId: item.templateSection.partId, status: 'SUBMITTED' },
      data: { status: 'REOPENED', reopenedAt: new Date() },
    });
  }
  await prisma.section.update({ where: { id: item.sectionId }, data: { finalSubmittedAt: null, finalSubmittedBy: null } });
  await prisma.courseFile.updateMany({ where: { id: item.courseFileId, status: 'SUBMITTED_FOR_REVIEW' }, data: { status: 'IN_PROGRESS' } });
}

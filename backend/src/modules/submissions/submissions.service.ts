import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { audit } from '../../utils/audit';
import { displayStatus, isItemLocked } from '../../utils/itemState';
import { safeName, signedUrl, uploadBuffer } from '../../utils/storage';
import { enqueueAiJob } from '../../jobs/aiQueue';
import { assertCoordinator, loadItem, loadItemForCoordinator, loadItemForFaculty, toId } from '../../services/access';
import { validateSubmission } from '../../services/validation';
import { markPartDirty } from '../course-file/courseFile.service';

// The full document-submission flow (SRS 3.2.2):
//   1. faculty picks an item (a Course File section for one of their sections) and uploads a
//      file OR types the content in            (FR-FAC-05..10)
//   2. every upload/replace creates a new version; the latest is current   (FR-FAC-16..19)
//   3. the relevance check runs in the background queue; a wrong-section file is
//      "Invalid Submission" and is not counted as complete        (FR-FAC-12..15, PR-05)
//   4. edits/deletes are blocked once the item is locked at its deadline   (FR-FAC-20..23)
//   5. the coordinator can review flagged files, see versions, and reopen locked items
//      (FR-CC-05..08, FR-FAC-24)
//   6. the faculty member then submits the part and makes the complete submission
//      (see course-file service)

const MIN_TEXT_LENGTH = 20;

async function currentOf(itemId: number) {
  return prisma.documentSubmission.findFirst({ where: { itemId, isCurrentVersion: true, isDeleted: false } });
}

const toDto = (s: any) => ({
  id: s.id,
  itemId: s.itemId,
  versionNumber: s.versionNumber,
  fileName: s.fileName,
  isTextEntry: s.isTextEntry,
  mimeType: s.mimeType,
  fileSizeBytes: Number(s.fileSizeBytes),
  isCurrentVersion: s.isCurrentVersion,
  isDeleted: s.isDeleted,
  validationStatus: s.validationStatus,
  validationMessage: s.validationMessage,
  notes: s.notes,
  uploadedAt: s.uploadedAt,
  uploadedBy: s.uploader?.fullName ?? undefined,
});

export const submissionsService = {
  // Faculty: flat list of my current submissions.
  async listMine(userId: number, courseId?: string) {
    const items = await prisma.courseFileItem.findMany({
      where: {
        section: { assignments: { some: { facultyId: userId } } },
        ...(courseId ? { courseFile: { courseOfferingId: toId(courseId) } } : {}),
        submissions: { some: { isCurrentVersion: true, isDeleted: false } },
      },
      include: {
        templateSection: true,
        section: true,
        submissions: { where: { isCurrentVersion: true, isDeleted: false }, include: { uploader: { select: { fullName: true } } } },
      },
      orderBy: [{ sectionId: 'asc' }, { templateSection: { number: 'asc' } }],
    });
    const now = new Date();
    return {
      submissions: items.map((i) => ({
        ...toDto(i.submissions[0]),
        sectionName: i.section?.name,
        templateSection: { number: i.templateSection.number, title: i.templateSection.title },
        status: displayStatus(i, i.submissions[0], now),
        deadline: i.deadline,
      })),
    };
  },

  // Upload a file or enter text. Creates version 1, or a new version when one already exists.
  async saveVersion(userId: number, itemId: string, input: { text?: string; notes?: string }, file?: Express.Multer.File) {
    const item = await loadItemForFaculty(userId, itemId);

    // FR-FAC-22: locked items can't be changed.
    if (isItemLocked(item)) throw ApiError.forbidden('This submission is locked. Ask the Course Coordinator to reopen it.');

    const text = input.text?.trim();
    if (!file && !text) throw ApiError.badRequest('Upload a file or enter text');
    if (!file && text && text.length < MIN_TEXT_LENGTH) throw ApiError.badRequest(`Text must be at least ${MIN_TEXT_LENGTH} characters`);

    const prev = await prisma.documentSubmission.findFirst({ where: { itemId: item.id }, orderBy: { versionNumber: 'desc' } });
    const versionNumber = (prev?.versionNumber ?? 0) + 1;

    let data: {
      fileName: string; storagePath: string; fileSizeBytes: bigint; mimeType: string;
      checksumSha256: string | null; isTextEntry: boolean; contentText: string | null;
    };

    if (file) {
      const offering = item.courseFile.offering;
      const where = `${offering.course.code}/${offering.semester.name.replace(/\s+/g, '')}/${item.section?.name ?? 'course'}/${String(item.templateSection.number).padStart(2, '0')}`;
      const storagePath = `${where}/v${versionNumber}-${Date.now()}-${safeName(file.originalname)}`;
      await uploadBuffer(storagePath, file.buffer, file.mimetype);
      data = {
        fileName: file.originalname,
        storagePath,
        fileSizeBytes: BigInt(file.size),
        mimeType: file.mimetype,
        checksumSha256: crypto.createHash('sha256').update(file.buffer).digest('hex'),
        isTextEntry: false,
        contentText: null,
      };
    } else {
      data = {
        fileName: `${item.templateSection.title} (entered text).txt`,
        storagePath: '',
        fileSizeBytes: BigInt(Buffer.byteLength(text!)),
        mimeType: 'text/plain',
        checksumSha256: crypto.createHash('sha256').update(text!).digest('hex'),
        isTextEntry: true,
        contentText: text!,
      };
    }

    // Old current version stops being current, new one takes over (one current per item).
    const created = await prisma.$transaction(async (tx) => {
      await tx.documentSubmission.updateMany({ where: { itemId: item.id, isCurrentVersion: true }, data: { isCurrentVersion: false } });
      const row = await tx.documentSubmission.create({
        data: { itemId: item.id, versionNumber, uploadedBy: userId, notes: input.notes ?? null, isCurrentVersion: true, validationStatus: 'NOT_CHECKED', ...data },
        include: { uploader: { select: { fullName: true } } },
      });
      await tx.courseFileItem.update({ where: { id: item.id }, data: { status: 'UNDER_REVIEW' } });
      return row;
    });

    await markPartDirty(item);
    await audit(userId, versionNumber === 1 ? 'SUBMISSION_UPLOADED' : 'SUBMISSION_REPLACED', 'DocumentSubmission', created.id, { itemId: item.id, versionNumber });

    // PR-05: the relevance check runs in the background queue.
    enqueueAiJob(() => validateSubmission(created.id));

    // FR-FAC-10: confirmation
    return { message: 'Submitted. Checking it against this section now.', submission: toDto(created) };
  },

  // FR-FAC-17: delete (soft) before the lock. History stays for the coordinator.
  async remove(userId: number, itemId: string) {
    const item = await loadItemForFaculty(userId, itemId);
    if (isItemLocked(item)) throw ApiError.forbidden('This submission is locked. Ask the Course Coordinator to reopen it.');
    const cur = await currentOf(item.id);
    if (!cur) throw ApiError.notFound('Nothing to delete');

    await prisma.$transaction([
      prisma.documentSubmission.update({ where: { id: cur.id }, data: { isDeleted: true, isCurrentVersion: false, deletedAt: new Date() } }),
      prisma.courseFileItem.update({ where: { id: item.id }, data: { status: 'PENDING' } }),
    ]);
    await markPartDirty(item);
    await audit(userId, 'SUBMISSION_DELETED', 'DocumentSubmission', cur.id, { itemId: item.id });
    return { message: 'Submission deleted' };
  },

  // Faculty can go back to an earlier version and make it current again (FR-FAC-16/18).
  async restoreVersion(userId: number, itemId: string, versionNumber: number) {
    const item = await loadItemForFaculty(userId, itemId);
    if (isItemLocked(item)) throw ApiError.forbidden('This submission is locked.');
    const target = await prisma.documentSubmission.findFirst({ where: { itemId: item.id, versionNumber, isDeleted: false } });
    if (!target) throw ApiError.notFound('Version not found');
    await prisma.$transaction([
      prisma.documentSubmission.updateMany({ where: { itemId: item.id, isCurrentVersion: true }, data: { isCurrentVersion: false } }),
      prisma.documentSubmission.update({ where: { id: target.id }, data: { isCurrentVersion: true } }),
    ]);
    await markPartDirty(item);
    return { message: `Version ${versionNumber} is now the current version` };
  },

  // FR-FAC-18/19 + FR-CC-07: faculty (own sections) and coordinator (own course).
  async listVersions(user: { id: number; role: string }, itemId: string) {
    if (user.role === 'COURSE_COORDINATOR') await loadItemForCoordinator(user.id, itemId);
    else await loadItemForFaculty(user.id, itemId);
    const versions = await prisma.documentSubmission.findMany({
      where: { itemId: toId(itemId) },
      orderBy: { versionNumber: 'desc' },
      include: { uploader: { select: { fullName: true } } },
    });
    return { versions: versions.map(toDto) };
  },

  async download(user: { id: number; role: string }, submissionId: string) {
    const sub = await prisma.documentSubmission.findUnique({ where: { id: toId(submissionId) } });
    if (!sub) throw ApiError.notFound('Submission not found');
    if (user.role === 'COURSE_COORDINATOR') await loadItemForCoordinator(user.id, sub.itemId);
    else await loadItemForFaculty(user.id, sub.itemId);
    if (sub.isTextEntry) return { text: sub.contentText, fileName: sub.fileName };
    return { url: await signedUrl(sub.storagePath, 300, sub.fileName), fileName: sub.fileName };
  },

  // FR-FAC-20: coordinator sets the deadline for the whole course, one part, or one section.
  async setDeadline(userId: number, courseId: string, deadline: Date, scope: { partId?: number; sectionId?: number } = {}) {
    const offering = await assertCoordinator(userId, courseId);
    if (!offering.courseFile) throw ApiError.conflict('Course File not created yet');
    const where: any = { courseFileId: offering.courseFile.id, sectionId: { not: null } };
    if (scope.partId) where.templateSection = { partId: scope.partId };
    if (scope.sectionId) where.sectionId = scope.sectionId;

    // Moving the deadline forward also unlocks items the old deadline had locked.
    const unlock = deadline > new Date() ? { isLocked: false, lockedAt: null, lockedBy: null, lockReason: null } : {};
    const res = await prisma.courseFileItem.updateMany({ where, data: { deadline, ...unlock } });
    await audit(userId, 'DEADLINE_SET', 'CourseOffering', offering.id, { deadline, ...scope, items: res.count });
    return { updated: res.count, deadline };
  },

  // FR-FAC-24 / FR-CC-08: reopen a locked item for a limited time.
  async reopen(userId: number, itemId: string, input: { until?: string; reason?: string }) {
    const item = await loadItemForCoordinator(userId, itemId);
    const until = input.until ? new Date(input.until) : new Date(Date.now() + 3 * 24 * 3600 * 1000);
    if (Number.isNaN(until.getTime()) || until <= new Date()) throw ApiError.badRequest('"until" must be a future date');

    await prisma.courseFileItem.update({
      where: { id: item.id },
      data: { isLocked: false, lockedAt: null, lockedBy: null, lockReason: null, reopenedUntil: until, reopenedBy: userId, reopenedAt: new Date(), reopenReason: input.reason ?? null },
    });
    await audit(userId, 'ITEM_REOPENED', 'CourseFileItem', item.id, { until, reason: input.reason });
    return { itemId: item.id, reopenedUntil: until };
  },

  // FR-CC-05/06: browse a course's items, filter to ones needing attention.
  async listForCourse(userId: number, courseId: string, filter: { status?: string; facultyId?: string } = {}) {
    const offering = await assertCoordinator(userId, courseId);
    if (!offering.courseFile) return { submissions: [] };
    const now = new Date();
    const items = await prisma.courseFileItem.findMany({
      where: {
        courseFileId: offering.courseFile.id,
        sectionId: { not: null },
        ...(filter.facultyId ? { section: { assignments: { some: { facultyId: toId(filter.facultyId) } } } } : {}),
      },
      include: {
        templateSection: true,
        section: true,
        submissions: { where: { isCurrentVersion: true, isDeleted: false }, include: { uploader: { select: { fullName: true } } } },
      },
      orderBy: [{ sectionId: 'asc' }, { templateSection: { number: 'asc' } }],
    });
    let rows = items.map((i) => ({
      itemId: i.id,
      sectionName: i.section?.name,
      number: i.templateSection.number,
      title: i.templateSection.title,
      status: displayStatus(i, i.submissions[0], now),
      deadline: i.deadline,
      current: i.submissions[0] ? toDto(i.submissions[0]) : null,
    }));
    if (filter.status) rows = rows.filter((r) => r.status === filter.status!.toUpperCase());
    return { submissions: rows };
  },

  // Coordinator decision on a flagged (or any) submission.
  async review(userId: number, submissionId: string, input: { status: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED'; comments: string }) {
    const sub = await prisma.documentSubmission.findUnique({ where: { id: toId(submissionId) } });
    if (!sub) throw ApiError.notFound('Submission not found');
    const item = await loadItemForCoordinator(userId, sub.itemId);
    if (!sub.isCurrentVersion || sub.isDeleted) throw ApiError.conflict('Only the current version can be reviewed');

    const approved = input.status === 'APPROVED';
    await prisma.$transaction([
      prisma.submissionReview.create({ data: { submissionId: sub.id, reviewedBy: userId, status: input.status, comments: input.comments } }),
      prisma.documentSubmission.update({
        where: { id: sub.id },
        data: { validationStatus: approved ? 'VALID' : 'INVALID', validationMessage: approved ? 'Approved by the Course Coordinator.' : `Coordinator: ${input.comments}` },
      }),
      prisma.courseFileItem.update({ where: { id: item.id }, data: { status: approved ? 'APPROVED' : input.status === 'REJECTED' ? 'PENDING' : 'REVISION_REQUESTED' } }),
    ]);
    if (!approved) await markPartDirty(item);
    await audit(userId, 'SUBMISSION_REVIEWED', 'DocumentSubmission', sub.id, { status: input.status });
    return { message: approved ? 'Approved' : 'Sent back to the faculty member' };
  },
};

// FR-FAC-21: persist locks once deadlines pass. (Writes are also checked live via isItemLocked.)
export async function lockExpiredItems() {
  const now = new Date();
  const res = await prisma.courseFileItem.updateMany({
    where: {
      isLocked: false,
      deadline: { lte: now },
      OR: [{ reopenedUntil: null }, { reopenedUntil: { lte: now } }],
    },
    data: { isLocked: true, lockedAt: now, lockReason: 'Deadline reached' },
  });
  if (res.count) console.log(`Locked ${res.count} item(s) past their deadline`);
}

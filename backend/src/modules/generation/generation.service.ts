import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { audit } from '../../utils/audit';
import { assertCoordinator } from '../../services/access';
import { getCommonSections } from '../../services/commonInfo';
import { safeName, signedUrl, uploadBuffer } from '../../utils/storage';
import { ensureCourseFile } from '../course-file/courseFile.service';

// Final Course File: an editable .docx with all template sections in order (FR-CC-17..20).
//  - course-level sections (1-8) come from the coordinator's common info
//  - faculty sections (9-25) come from the consolidated content the coordinator accepted/edited,
//    not from the raw uploads pasted together (FR-CC-20)
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const paragraphs = (text: string) =>
  text.split(/\n/).map((line) => new Paragraph({ children: [new TextRun(line)], spacing: { after: 120 } }));

export const generationService = {
  async generate(userId: number, courseId: string, force = false) {
    const offering = await assertCoordinator(userId, courseId);
    const courseFile = await ensureCourseFile(offering.id);

    const sections = await prisma.templateSection.findMany({ where: { templateId: courseFile.templateId }, orderBy: { number: 'asc' } });
    const common = new Map((await getCommonSections(offering.id)).map((c) => [c.number, c]));
    const content = await prisma.consolidatedContent.findMany({
      where: { courseFileId: courseFile.id, templateSectionId: { not: null }, reviewStatus: { in: ['ACCEPTED', 'EDITED'] } },
    });
    const bySection = new Map<number, string[]>();
    for (const c of content) {
      if (!c.contentText) continue;
      bySection.set(c.templateSectionId!, [...(bySection.get(c.templateSectionId!) ?? []), c.contentText]);
    }

    // FR-CC-17: only generate once the required material has been reviewed.
    const notReady = sections.filter((s) => s.mandatory && (s.scope === 'COURSE_LEVEL' ? !common.get(s.number)?.text : !bySection.has(s.id)));
    if (notReady.length && !force) {
      throw ApiError.conflict('Some required sections have no reviewed content yet', {
        missing: notReady.map((s) => ({ number: s.number, title: s.title })),
      });
    }

    const course = await prisma.course.findUniqueOrThrow({ where: { id: offering.courseId } });
    const children: Paragraph[] = [
      new Paragraph({ text: 'COURSE FILE', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `${course.code} - ${course.title}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: offering.semester.name, alignment: AlignmentType.CENTER }),
    ];

    for (const s of sections) {
      children.push(new Paragraph({ text: `${s.number}. ${s.title}`, heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 120 }, pageBreakBefore: s.number === 1 }));
      const text = s.scope === 'COURSE_LEVEL' ? common.get(s.number)?.text : bySection.get(s.id)?.join('\n\n');
      if (text) children.push(...paragraphs(text));
      else children.push(new Paragraph({ children: [new TextRun({ text: s.mandatory ? '[Pending - no reviewed content yet]' : '[Not provided]', italics: true })] }));
    }

    const buffer = await Packer.toBuffer(new Document({ sections: [{ children }] }));
    const fileName = `${safeName(course.code)}_${safeName(offering.semester.name)}_CourseFile.docx`;
    const storagePath = `generated/${offering.id}/${Date.now()}-${fileName}`;
    await uploadBuffer(storagePath, buffer, DOCX_MIME);

    const row = await prisma.consolidatedContent.create({
      data: {
        courseFileId: courseFile.id,
        title: 'Final Course File',
        type: 'FULL_COURSE_FILE_ARCHIVE',
        storagePath,
        fileName,
        mimeType: DOCX_MIME,
        fileSizeBytes: BigInt(buffer.length),
        generatedBy: userId,
        reviewStatus: 'DRAFT',
        summaryNotes: notReady.length ? `Generated with ${notReady.length} section(s) still pending` : 'All sections included',
      },
    });
    await audit(userId, 'COURSE_FILE_GENERATED', 'ConsolidatedContent', row.id, { pendingSections: notReady.map((s) => s.number) });
    return { id: row.id, fileName, pendingSections: notReady.map((s) => s.number), url: await signedUrl(storagePath, 600, fileName) };
  },

  async getLatest(userId: number, courseId: string) {
    const offering = await assertCoordinator(userId, courseId);
    if (!offering.courseFile) throw ApiError.notFound('No Course File yet');
    const latest = await prisma.consolidatedContent.findFirst({
      where: { courseFileId: offering.courseFile.id, type: 'FULL_COURSE_FILE_ARCHIVE' },
      orderBy: { id: 'desc' },
    });
    if (!latest?.storagePath) throw ApiError.notFound('The Course File has not been generated yet');
    return { id: latest.id, fileName: latest.fileName, generatedAt: latest.generatedAt, notes: latest.summaryNotes, url: await signedUrl(latest.storagePath, 600, latest.fileName ?? undefined) };
  },
};

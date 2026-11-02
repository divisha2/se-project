import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
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

const parseLineRuns = (line: string): TextRun[] => {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({ text: part.slice(2, -2), bold: true });
    }
    return new TextRun({ text: part });
  });
};

function parseMarkdownTableToDocx(tableLines: string[]): Table | null {
  const rowsData: string[][] = [];
  for (const line of tableLines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    // Skip separator rows (|---|---|)
    if (/^\|(\s*[-:]+\s*\|)+$/.test(trimmed)) continue;

    const parts = trimmed.split('|');
    const cells = parts.slice(1, parts.length - 1).map((c) => c.trim());
    if (cells.length > 0) {
      rowsData.push(cells);
    }
  }

  if (rowsData.length === 0) return null;

  const maxCols = Math.max(...rowsData.map((r) => r.length));
  const normalizedRows = rowsData.map((r) => {
    const copy = [...r];
    while (copy.length < maxCols) copy.push('');
    return copy;
  });

  const cellBorder = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: 'CBD5E1',
  };

  const borders = {
    top: cellBorder,
    bottom: cellBorder,
    left: cellBorder,
    right: cellBorder,
  };

  const tableRows = normalizedRows.map((rowCells, rowIndex) => {
    const isHeader = rowIndex === 0;
    return new TableRow({
      tableHeader: isHeader,
      children: rowCells.map((cellText) => {
        return new TableCell({
          borders,
          shading: isHeader ? { fill: 'F1F5F9', type: ShadingType.CLEAR } : undefined,
          margins: {
            top: 120,
            bottom: 120,
            left: 150,
            right: 150,
          },
          children: [
            new Paragraph({
              children: isHeader
                ? [new TextRun({ text: cellText, bold: true })]
                : parseLineRuns(cellText),
              spacing: { after: 0 },
            }),
          ],
        });
      }),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

const renderContentElements = (text: string): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [];
  const lines = text.split(/\n/);
  let tableBuffer: string[] = [];

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      const table = parseMarkdownTableToDocx(tableBuffer);
      if (table) {
        elements.push(new Paragraph({ spacing: { after: 80 } }));
        elements.push(table);
        elements.push(new Paragraph({ spacing: { after: 120 } }));
      } else {
        elements.push(
          ...tableBuffer.map(
            (l) => new Paragraph({ children: parseLineRuns(l), spacing: { after: 120 } })
          )
        );
      }
      tableBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('|')) {
      tableBuffer.push(line);
    } else {
      flushTable();
      if (!line) {
        elements.push(new Paragraph({ spacing: { after: 120 } }));
      } else if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          new Paragraph({
            children: parseLineRuns(line.replace(/^[•\-*]\s+/, '')),
            bullet: { level: 0 },
            spacing: { after: 80 },
          })
        );
      } else if (/^\d+\.\s+/.test(line)) {
        elements.push(
          new Paragraph({
            children: parseLineRuns(line.replace(/^\d+\.\s+/, '')),
            spacing: { after: 80 },
          })
        );
      } else {
        elements.push(
          new Paragraph({
            children: parseLineRuns(line),
            spacing: { after: 120 },
          })
        );
      }
    }
  }
  flushTable();

  return elements;
};

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
    const children: (Paragraph | Table)[] = [
      new Paragraph({ text: 'COURSE FILE', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `${course.code} - ${course.title}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: offering.semester.name, alignment: AlignmentType.CENTER }),
    ];

    for (const s of sections) {
      children.push(new Paragraph({ text: `${s.number}. ${s.title}`, heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 120 }, pageBreakBefore: s.number === 1 }));
      const text = s.scope === 'COURSE_LEVEL' ? common.get(s.number)?.text : bySection.get(s.id)?.join('\n\n');
      if (text) children.push(...renderContentElements(text));
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

  async getEditorData(userId: number, courseId: string) {
    const offering = await assertCoordinator(userId, courseId);
    const courseFile = await ensureCourseFile(offering.id);

    const sections = await prisma.templateSection.findMany({
      where: { templateId: courseFile.templateId },
      orderBy: { number: 'asc' },
    });
    const common = new Map((await getCommonSections(offering.id)).map((c) => [c.templateSectionId, c]));

    const content = await prisma.consolidatedContent.findMany({
      where: { courseFileId: courseFile.id, templateSectionId: { not: null } },
      orderBy: { id: 'desc' },
    });

    const contentBySection = new Map<number, any>();
    for (const c of content) {
      if (!contentBySection.has(c.templateSectionId!)) {
        contentBySection.set(c.templateSectionId!, c);
      }
    }

    const course = await prisma.course.findUniqueOrThrow({
      where: { id: offering.courseId },
      include: { program: true },
    });

    const coordinator = await prisma.user.findUnique({
      where: { id: offering.coordinatorId },
      select: { fullName: true, email: true, designation: true },
    });

    const latest = await prisma.consolidatedContent.findFirst({
      where: { courseFileId: courseFile.id, type: 'FULL_COURSE_FILE_ARCHIVE' },
      orderBy: { id: 'desc' },
    });

    const latestFile = latest?.storagePath
      ? {
          fileName: latest.fileName,
          generatedAt: latest.generatedAt,
          url: await signedUrl(latest.storagePath, 600, latest.fileName ?? undefined),
        }
      : null;

    const sectionItems = sections.map((s) => {
      const cItem = contentBySection.get(s.id);
      const commonItem = common.get(s.id);

      const text = cItem?.contentText || commonItem?.text || '';
      let status: 'ACCEPTED' | 'EDITED' | 'DRAFT' | 'PENDING' = 'PENDING';
      let source = 'none';

      if (cItem) {
        status = cItem.reviewStatus as any;
        source = cItem.isManual ? 'manual' : cItem.isAiGenerated ? 'ai' : 'faculty';
      } else if (commonItem?.text) {
        status = 'ACCEPTED';
        source = commonItem.source;
      }

      return {
        id: s.id,
        number: s.number,
        title: s.title,
        scope: s.scope,
        mandatory: s.mandatory,
        text,
        status,
        source,
        contentId: cItem?.id ?? null,
      };
    });

    return {
      course: {
        code: course.code,
        title: course.title,
        semester: offering.semester.name,
        coordinator: coordinator?.fullName ?? 'Course Coordinator',
      },
      sections: sectionItems,
      latestFile,
    };
  },

  async saveSection(userId: number, courseId: string, sectionId: number, text: string) {
    const offering = await assertCoordinator(userId, courseId);
    const courseFile = await ensureCourseFile(offering.id);

    const ts = await prisma.templateSection.findUniqueOrThrow({ where: { id: sectionId } });

    // Look for existing content row for this templateSectionId
    const existing = await prisma.consolidatedContent.findFirst({
      where: { courseFileId: courseFile.id, templateSectionId: ts.id },
      orderBy: { id: 'desc' },
    });

    if (existing) {
      const updated = await prisma.consolidatedContent.update({
        where: { id: existing.id },
        data: {
          contentText: text,
          reviewStatus: 'EDITED',
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });
      return { success: true, id: updated.id, status: 'EDITED' };
    }

    const created = await prisma.consolidatedContent.create({
      data: {
        courseFileId: courseFile.id,
        templateSectionId: ts.id,
        title: ts.title,
        type: 'SECTION_TEXT',
        contentText: text,
        isManual: true,
        generatedBy: userId,
        reviewStatus: 'ACCEPTED',
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });

    return { success: true, id: created.id, status: 'ACCEPTED' };
  },
};

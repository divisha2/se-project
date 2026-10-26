import { prisma } from '../config/prisma';

// Course-level ("common") sections 1-8: maintained once by the coordinator
// (FR-CC-01) instead of being collected from each faculty member.
export interface CommonSection {
  templateSectionId: number;
  number: number;
  title: string;
  text: string | null;
  source: 'manual' | 'course' | 'program' | 'school' | 'derived' | 'none';
}

export async function getCommonSections(offeringId: number): Promise<CommonSection[]> {
  const offering = await prisma.courseOffering.findUnique({
    where: { id: offeringId },
    include: {
      course: { include: { outcomes: { include: { mappings: true }, orderBy: { code: 'asc' } }, program: { include: { school: true } } } },
      coordinator: true,
      courseFile: { include: { template: { include: { sections: { where: { scope: 'COURSE_LEVEL' }, orderBy: { number: 'asc' } } } } } },
    },
  });
  if (!offering?.courseFile) return [];

  const manual = await prisma.consolidatedContent.findMany({
    where: { courseFileId: offering.courseFile.id, isManual: true },
  });
  const manualBySection = new Map(manual.map((m) => [m.templateSectionId, m]));

  const { course, coordinator } = offering;
  const cos = course.outcomes.filter((o) => o.type === 'CO');

  return offering.courseFile.template.sections.map((ts) => {
    const base = { templateSectionId: ts.id, number: ts.number, title: ts.title };
    const m = manualBySection.get(ts.id);
    if (m?.contentText) return { ...base, text: m.contentText, source: 'manual' as const };

    const t = ts.title.toLowerCase();
    let text: string | null = null;
    let source: CommonSection['source'] = 'none';

    if (t.includes('syllabus')) [text, source] = [course.syllabus, 'course'];
    else if (t.includes('objective')) [text, source] = [course.objectives, 'course'];
    else if (t.includes('mapping')) {
      const rows = cos.flatMap((o) => o.mappings.filter((x) => x.level !== 'NONE').map((x) => `${o.code} -> ${x.mappedCode}: ${x.level}`));
      [text, source] = [rows.length ? rows.join('\n') : null, 'course'];
    } else if (t.includes('outcome') && !t.includes('attainment')) {
      [text, source] = [cos.length ? cos.map((o) => `${o.code}: ${o.description}`).join('\n') : null, 'course'];
    } else if (t.includes('coordinator')) {
      [text, source] = [
        `${coordinator.fullName}${coordinator.designation ? `, ${coordinator.designation}` : ''}${coordinator.department ? `, ${coordinator.department}` : ''}\n${coordinator.email}`,
        'derived',
      ];
    } else if (t.includes('vision') || t.includes('mission')) {
      const s = course.program.school;
      [text, source] = [[s.vision && `Vision: ${s.vision}`, s.mission && `Mission: ${s.mission}`].filter(Boolean).join('\n') || null, 'school'];
    } else if (t.includes('description')) [text, source] = [course.description, 'course'];

    return { ...base, text: text?.trim() ? text : null, source: text?.trim() ? source : 'none' };
  });
}

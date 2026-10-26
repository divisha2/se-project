import { prisma } from '../config/prisma';
import { downloadBuffer } from '../utils/storage';
import { extractText } from '../utils/extractText';
import { isLlmConfigured, lastUsage, llmJson } from './llm';
import { env } from '../config/env';

// FR-FAC-12..15: decide whether an uploaded document fits the Course File section it
// was submitted under. SRS 2.2 says doubtful cases are flagged, not auto-rejected, so:
//   VALID         - looks right
//   NEEDS_REVIEW  - unsure / unreadable: counts as submitted, flagged for the coordinator
//   INVALID       - confidently the wrong kind of document: "Invalid Submission", not complete
type Verdict = {
  status: 'VALID' | 'INVALID' | 'NEEDS_REVIEW';
  message: string;
  confidence: number;
  suggestedNumber: number | null;
  method: 'llm' | 'keywords' | 'unreadable';
};

const tokenize = (t: string) => t.toLowerCase();
const hits = (text: string, keywords: string[]) => keywords.filter((k) => text.includes(k.toLowerCase())).length;

export async function getSubmissionText(submission: {
  id: number;
  isTextEntry: boolean;
  contentText: string | null;
  storagePath: string;
  mimeType: string;
}): Promise<string | null> {
  if (submission.isTextEntry) return submission.contentText;
  const cached = await prisma.aIProcessingRecord.findFirst({
    where: { submissionId: submission.id, extractedText: { not: null } },
    orderBy: { id: 'desc' },
    select: { extractedText: true },
  });
  if (cached?.extractedText) return cached.extractedText;
  return extractText(await downloadBuffer(submission.storagePath), submission.mimeType);
}

export async function validateSubmission(submissionId: number): Promise<void> {
  const sub = await prisma.documentSubmission.findUnique({
    where: { id: submissionId },
    include: { item: { include: { templateSection: true } } },
  });
  if (!sub || sub.isDeleted) return;

  const record = await prisma.aIProcessingRecord.create({
    data: { submissionId, taskType: 'SECTION_RELEVANCE_CHECK', status: 'PROCESSING' },
  });

  try {
    const text = await getSubmissionText(sub);
    const target = sub.item.templateSection;
    const all = await prisma.templateSection.findMany({
      where: { templateId: target.templateId },
      select: { id: true, number: true, title: true, keywords: true },
    });

    let verdict: Verdict;

    if (!text || text.length < 20) {
      verdict = {
        status: 'NEEDS_REVIEW',
        message: 'The text of this file could not be read automatically (scanned or unsupported). The coordinator will check it.',
        confidence: 0,
        suggestedNumber: null,
        method: 'unreadable',
      };
    } else if (isLlmConfigured()) {
      try {
        const out = await llmJson<{ fits: boolean; confidence: number; reason: string; suggestedSectionNumber: number | null }>(
          'You check whether an uploaded document belongs under a given section of a university Course File. ' +
            'Fields: fits (boolean), confidence (0..1), reason (one short sentence), suggestedSectionNumber (number from the list or null).',
          `Selected section: ${target.number}. ${target.title}\nAll sections:\n${all
            .map((s) => `${s.number}. ${s.title}`)
            .join('\n')}\n\nDocument excerpt:\n${text.slice(0, 6000)}`,
        );
        const conf = Math.max(0, Math.min(1, Number(out.confidence) || 0));
        verdict = {
          status: out.fits ? 'VALID' : conf >= 0.7 ? 'INVALID' : 'NEEDS_REVIEW',
          message: out.reason || (out.fits ? 'Matches the selected section.' : 'Does not match the selected section.'),
          confidence: conf,
          suggestedNumber: out.suggestedSectionNumber ?? null,
          method: 'llm',
        };
      } catch (err) {
        console.error('LLM validation failed, using keywords:', err);
        verdict = keywordVerdict(text, target, all);
      }
    } else {
      verdict = keywordVerdict(text, target, all);
    }

    const suggested = verdict.suggestedNumber ? all.find((s) => s.number === verdict.suggestedNumber) : undefined;

    await prisma.$transaction([
      prisma.aIProcessingRecord.update({
        where: { id: record.id },
        data: {
          status: 'COMPLETED',
          extractedText: text,
          summary: verdict.message,
          confidenceScore: verdict.confidence,
          findings: { status: verdict.status, method: verdict.method, suggestedSection: verdict.suggestedNumber } as any,
          suggestedTemplateSectionId: suggested?.id ?? null,
          modelName: verdict.method === 'llm' ? env.LLM_MODEL ?? null : null,
          promptTokens: verdict.method === 'llm' ? lastUsage.prompt : null,
          completionTokens: verdict.method === 'llm' ? lastUsage.completion : null,
          processedAt: new Date(),
        },
      }),
      prisma.documentSubmission.update({
        where: { id: submissionId },
        data: {
          validationStatus: verdict.status,
          validationMessage:
            verdict.status === 'INVALID'
              ? `Invalid Submission: ${verdict.message}${suggested ? ` (looks like "${suggested.title}")` : ''}`
              : verdict.message,
        },
      }),
      // An invalid file is not a completed submission (FR-FAC-14).
      prisma.courseFileItem.update({
        where: { id: sub.itemId },
        data: { status: verdict.status === 'INVALID' ? 'PENDING' : 'SUBMITTED' },
      }),
    ]);
  } catch (err) {
    console.error('validateSubmission failed:', err);
    await prisma.aIProcessingRecord.update({
      where: { id: record.id },
      data: { status: 'FAILED', errorMessage: err instanceof Error ? err.message : String(err) },
    });
    // Don't leave the faculty member stuck: flag for the coordinator instead.
    await prisma.documentSubmission.update({
      where: { id: submissionId },
      data: { validationStatus: 'NEEDS_REVIEW', validationMessage: 'Automatic check failed; the coordinator will review this file.' },
    });
    await prisma.courseFileItem.update({ where: { id: sub.itemId }, data: { status: 'SUBMITTED' } });
  }
}

function keywordVerdict(
  text: string,
  target: { number: number; title: string; keywords: string[] },
  all: { number: number; title: string; keywords: string[] }[],
): Verdict {
  const t = tokenize(text);
  if (!target.keywords.length) {
    return { status: 'NEEDS_REVIEW', message: 'No automatic check is configured for this section; the coordinator will review it.', confidence: 0, suggestedNumber: null, method: 'keywords' };
  }
  const own = hits(t, target.keywords);
  if (own >= 2 || own / target.keywords.length >= 0.3) {
    return { status: 'VALID', message: 'Content matches the selected section.', confidence: 0.6, suggestedNumber: null, method: 'keywords' };
  }
  const best = all
    .filter((s) => s.number !== target.number && s.keywords.length)
    .map((s) => ({ s, h: hits(t, s.keywords) }))
    .sort((a, b) => b.h - a.h)[0];
  if (best && best.h >= 2 && best.h >= own * 2 + 1) {
    return {
      status: 'INVALID',
      message: `This looks like "${best.s.title}" rather than "${target.title}".`,
      confidence: 0.7,
      suggestedNumber: best.s.number,
      method: 'keywords',
    };
  }
  return { status: 'NEEDS_REVIEW', message: 'Could not confirm this matches the selected section; flagged for the coordinator.', confidence: 0.3, suggestedNumber: null, method: 'keywords' };
}

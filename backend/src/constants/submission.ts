// Submission states from SRS 3.4: pending, submitted, invalid or locked.
export const SUBMISSION_STATUS = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  INVALID: 'INVALID',
  LOCKED: 'LOCKED',
} as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

// FR-FAC-07 / FR-FAC-08: PDF and DOC/DOCX primary, spreadsheets optional per section.
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // spreadsheets (only where a section requires them)
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

// FR-FAC-11: Sections 9-24 mandatory, Section 25 optional (current Course File structure).
export const MANDATORY_SECTION_RANGE = { from: 9, to: 24 } as const;
export const OPTIONAL_SECTIONS = [25] as const;

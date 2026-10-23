import { ApiError } from '../../utils/ApiError';

// Predefined Course File structure (from the institutional template).
//  FR-FAC-03 list predefined sections for a faculty's course/section
//  FR-FAC-11 sections 9-24 mandatory, section 25 optional (see constants/submission.ts)
//  FR-CC-04  distinguish mandatory vs optional sections
//  Maintainability (SRS 3.5): sections must be editable if the template changes,
//  so seed them in the DB rather than hardcoding.
export const courseFileService = {
  async listSections(_courseId: string) {
    throw ApiError.notImplemented('courseFile.listSections');
  },
  async upsertSection(_courseId: string, _data: unknown) {
    throw ApiError.notImplemented('courseFile.upsertSection');
  },
  async getCompletionStatus(_courseId: string) {
    // FR-CC-02 / FR-CC-03: completed vs pending mandatory submissions per faculty
    throw ApiError.notImplemented('courseFile.getCompletionStatus');
  },
};

import { ApiError } from '../../utils/ApiError';

// Faculty submissions + coordinator review of them.
//  FR-FAC-02 block submissions for unassigned course/section
//  FR-FAC-05/06 upload file, link to faculty, course, section, semester, Course File section
//     -> push buffer to Supabase Storage (config/supabase.ts), store path in DB
//  FR-FAC-10 return confirmation on success
//  FR-FAC-12..15 validate content vs selected section; INVALID is not a completed submission,
//     faculty can re-upload (flag for review, don't silently delete)
//  FR-FAC-16..19 edit/replace/delete before lock; every replace creates a new version;
//     latest version = current
//  FR-FAC-20..24 deadline, auto-lock (check lock state on every write), coordinator can reopen
//  FR-CC-05..08 coordinator views submissions, invalid ones, version history, reopens locked
export const submissionsService = {
  async listMine(_userId: string, _courseId?: string) {
    throw ApiError.notImplemented('submissions.listMine');
  },
  async upload(
    _userId: string,
    _input: { courseId: string; sectionId: string; fileSectionId: string },
    _file: Express.Multer.File,
  ) {
    throw ApiError.notImplemented('submissions.upload');
  },
  async replace(_userId: string, _documentId: string, _file: Express.Multer.File) {
    throw ApiError.notImplemented('submissions.replace');
  },
  async remove(_userId: string, _documentId: string) {
    throw ApiError.notImplemented('submissions.remove');
  },
  async listVersions(_documentId: string) {
    throw ApiError.notImplemented('submissions.listVersions');
  },
  async setDeadline(_courseId: string, _deadline: Date) {
    throw ApiError.notImplemented('submissions.setDeadline');
  },
  async reopen(_documentId: string) {
    throw ApiError.notImplemented('submissions.reopen');
  },
  async listForCourse(_courseId: string, _filter?: { status?: string; facultyId?: string }) {
    throw ApiError.notImplemented('submissions.listForCourse');
  },
};

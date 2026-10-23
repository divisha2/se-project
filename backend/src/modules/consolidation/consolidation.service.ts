import { ApiError } from '../../utils/ApiError';
// import { enqueueAiJob } from '../../jobs/aiQueue';

// AI-assisted processing + coordinator review.
//  FR-AI-01 process documents submitted under the same Course File section
//  FR-AI-02 extract relevant info (PDF/DOCX text extraction first)
//  FR-AI-03/04 detect similar info across faculty and reduce repetition
//  FR-AI-05/06 generate consolidated content grounded ONLY in the submitted documents
//  FR-AI-07 coordinator reviews before it enters the final file
//  FR-CC-09..12 organize by Course File structure, keep meaningful differences
//  FR-CC-13..16 review, edit, accept/reject, manually add content
//  SRS 3.4/3.6: keep a link from consolidated content back to its source documents
//  PR-05: run via enqueueAiJob(...) so requests return immediately
export const consolidationService = {
  async runForSection(_courseId: string, _fileSectionId: string) {
    throw ApiError.notImplemented('consolidation.runForSection');
  },
  async runForCourse(_courseId: string) {
    throw ApiError.notImplemented('consolidation.runForCourse');
  },
  async listContent(_courseId: string) {
    throw ApiError.notImplemented('consolidation.listContent');
  },
  async getSources(_contentId: string) {
    throw ApiError.notImplemented('consolidation.getSources');
  },
  async editContent(_contentId: string, _text: string) {
    throw ApiError.notImplemented('consolidation.editContent');
  },
  async setDecision(_contentId: string, _decision: 'ACCEPTED' | 'REJECTED') {
    throw ApiError.notImplemented('consolidation.setDecision');
  },
  async addManualContent(_courseId: string, _fileSectionId: string, _text: string) {
    throw ApiError.notImplemented('consolidation.addManualContent');
  },
};

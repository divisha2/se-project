import { ApiError } from '../../utils/ApiError';

// Final Course File generation.
//  FR-CC-17 coordinator initiates generation after required submissions are reviewed
//  FR-CC-18 combine common course info + reviewed/consolidated faculty content
//  FR-CC-19 produce an EDITABLE file in the project's chosen format (likely .docx -> `docx` package)
//  FR-CC-20 output contains consolidated info, not the raw faculty submissions pasted together
// Output format is still open in the SRS (3.6); decide before implementing.
export const generationService = {
  async generate(_courseId: string) {
    throw ApiError.notImplemented('generation.generate');
  },
  async getLatest(_courseId: string) {
    throw ApiError.notImplemented('generation.getLatest');
  },
};

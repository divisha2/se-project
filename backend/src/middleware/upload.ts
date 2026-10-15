import multer from 'multer';
import { env } from '../config/env';
import { ALLOWED_MIME_TYPES } from '../constants/submission';
import { ApiError } from '../utils/ApiError';

// Files are kept in memory, then pushed to Supabase Storage by the submissions service.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // FR-FAC-09: reject unsupported file formats.
    if ((ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) return cb(null, true);
    cb(ApiError.badRequest('Unsupported file format. Upload PDF or DOC/DOCX.'));
  },
});

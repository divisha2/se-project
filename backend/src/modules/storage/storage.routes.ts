import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../../utils/ApiError';

const router = Router();
const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), 'uploads');

router.get('/files', (req, res, next) => {
  const relativePath = req.query.path as string;
  const downloadName = (req.query.name as string) || (relativePath ? path.basename(relativePath) : 'file');

  if (!relativePath) {
    return next(ApiError.badRequest('Missing path parameter'));
  }

  // Prevent directory traversal attacks
  const resolved = path.resolve(LOCAL_STORAGE_DIR, relativePath);
  if (!resolved.startsWith(LOCAL_STORAGE_DIR)) {
    return next(ApiError.forbidden('Access denied'));
  }

  if (!fs.existsSync(resolved)) {
    return next(ApiError.notFound('File not found'));
  }

  res.download(resolved, downloadName);
});

export default router;


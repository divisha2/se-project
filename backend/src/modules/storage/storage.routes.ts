import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../../utils/ApiError';
import { getLocalStorageDir } from '../../utils/storage';

const router = Router();

router.get('/files', (req, res, next) => {
  const relativePath = req.query.path as string;
  const downloadName = (req.query.name as string) || (relativePath ? path.basename(relativePath) : 'file');

  if (!relativePath) {
    return next(ApiError.badRequest('Missing path parameter'));
  }

  const localStorageDir = getLocalStorageDir();
  // Prevent directory traversal attacks
  const resolved = path.resolve(localStorageDir, relativePath);
  if (!resolved.startsWith(localStorageDir)) {
    return next(ApiError.forbidden('Access denied'));
  }

  if (!fs.existsSync(resolved)) {
    return next(ApiError.notFound('File not found'));
  }

  res.download(resolved, downloadName);
});

export default router;


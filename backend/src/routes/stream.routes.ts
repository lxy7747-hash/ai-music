import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

import { Router } from 'express';

import { config } from '../config.js';
import { HttpError } from '../middleware/error-handler.js';

export const streamRoutes = Router();

// router.use(authMiddleware); // TODO: T14

const cacheRoot = path.resolve(process.cwd(), config.ttsCacheDir);

streamRoutes.get('/audio/*', (req, res, next) => {
  try {
    const requestedPath = decodeURIComponent(req.path.replace(/^\/audio\/?/, ''));
    const filePath = path.resolve(cacheRoot, requestedPath);
    const relativePath = path.relative(cacheRoot, filePath);

    if (!filePath.startsWith(cacheRoot + path.sep) || relativePath.startsWith('..')) {
      throw new HttpError(403, 'FORBIDDEN_PATH', 'Requested audio path is outside the TTS cache directory');
    }

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      throw new HttpError(404, 'AUDIO_NOT_FOUND', 'Audio file not found');
    }

    if (path.extname(filePath).toLowerCase() !== '.mp3') {
      throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Only mp3 audio files are supported');
    }

    res.type('audio/mpeg');
    createReadStream(filePath).pipe(res);
  } catch (error) {
    next(error);
  }
});

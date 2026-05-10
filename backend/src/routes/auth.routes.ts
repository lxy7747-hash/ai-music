import { Router } from 'express';

import { asyncHandler, HttpError } from '../middleware/error-handler.js';
import { neteaseService } from '../services/netease.service.js';

export const authRoutes = Router();

authRoutes.post(
  '/qr-key',
  asyncHandler(async (_req, res) => {
    const key = await neteaseService.getLoginQRKey();
    res.json({ key });
  }),
);

authRoutes.post(
  '/qr-check',
  asyncHandler(async (req, res) => {
    const key = String(req.body?.key ?? '');

    if (!key) {
      throw new HttpError(400, 'KEY_REQUIRED', 'key is required');
    }

    const status = await neteaseService.checkQRStatus(key);
    res.json(status);
  }),
);

authRoutes.get('/status', (_req, res) => {
  res.json({
    loggedIn: false,
    user: null,
    // TODO: T14/T16 - replace with persisted encrypted cookie/session lookup.
  });
});

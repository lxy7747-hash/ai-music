import { Router } from 'express';

import { asyncHandler, HttpError } from '../middleware/error-handler.js';
import { neteaseService } from '../services/netease.service.js';
import { userService } from '../services/user.service.js';

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

    if (status.code === 803 && status.cookie) {
      const loginStatus = await neteaseService.getLoginStatus(status.cookie);
      const user = userService.upsertUser({
        neteaseUid: loginStatus.neteaseUid,
        nickname: loginStatus.nickname ?? status.nickname,
        avatarUrl: loginStatus.avatarUrl,
        cookie: status.cookie,
      });

      res.json({
        code: status.code,
        loggedIn: true,
        user: {
          neteaseUid: user.neteaseUid,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        },
      });
      return;
    }

    res.json(status);
  }),
);

authRoutes.get('/status', (_req, res) => {
  const user = userService.getCurrentUser();

  res.json({
    loggedIn: Boolean(user),
    user: user
      ? {
          neteaseUid: user.neteaseUid,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        }
      : null,
  });
});

authRoutes.post('/logout', (_req, res) => {
  userService.clearUsers();
  res.json({ loggedIn: false, user: null });
});

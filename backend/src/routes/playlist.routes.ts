import { Router } from 'express';

import { asyncHandler, HttpError } from '../middleware/error-handler.js';
import { llmService } from '../services/llm.service.js';
import { neteaseService } from '../services/netease.service.js';
import { userService } from '../services/user.service.js';

export const playlistRoutes = Router();

// router.use(authMiddleware); // TODO: T14

playlistRoutes.get(
  '/',
  asyncHandler(async (_req, res) => {
    const user = userService.getCurrentUser();

    if (!user) {
      throw new HttpError(401, 'NOT_LOGGED_IN', 'login is required to load playlists');
    }

    const playlists = await neteaseService.getUserPlaylists(user.neteaseUid, user.cookie);
    res.json({ playlists });
  }),
);

playlistRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = userService.getCurrentUser();

    if (!user) {
      throw new HttpError(401, 'NOT_LOGGED_IN', 'login is required to load playlist tracks');
    }

    const playlistId = String(req.params.id);
    const tracks = await neteaseService.getPlaylistTracks(playlistId, 1000, 0, user.cookie);

    res.json({
      playlistId,
      tracks,
    });
  }),
);

playlistRoutes.post(
  '/:id/analyze',
  asyncHandler(async (req, res) => {
    const user = userService.getCurrentUser();

    if (!user) {
      throw new HttpError(401, 'NOT_LOGGED_IN', 'login is required to analyze playlists');
    }

    const tracks = await neteaseService.getPlaylistTracks(String(req.params.id), 1000, 0, user.cookie);
    const analysis = await llmService.analyzePlaylist(tracks);

    res.json({ analysis });
  }),
);

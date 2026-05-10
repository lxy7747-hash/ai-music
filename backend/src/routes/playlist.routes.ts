import { Router } from 'express';

import { asyncHandler, HttpError } from '../middleware/error-handler.js';
import { llmService } from '../services/llm.service.js';
import { neteaseService } from '../services/netease.service.js';

export const playlistRoutes = Router();

// router.use(authMiddleware); // TODO: T14

playlistRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const uid = String(req.query.uid ?? '');

    if (!uid) {
      throw new HttpError(400, 'UID_REQUIRED', 'uid query parameter is required until auth middleware is implemented');
    }

    const playlists = await neteaseService.getUserPlaylists(uid);
    res.json({ playlists });
  }),
);

playlistRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const playlistId = String(req.params.id);
    const tracks = await neteaseService.getPlaylistTracks(playlistId);

    res.json({
      playlistId,
      tracks,
    });
  }),
);

playlistRoutes.post(
  '/:id/analyze',
  asyncHandler(async (req, res) => {
    const tracks = await neteaseService.getPlaylistTracks(String(req.params.id));
    const analysis = await llmService.analyzePlaylist(tracks);

    res.json({ analysis });
  }),
);

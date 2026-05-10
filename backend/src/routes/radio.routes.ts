import { Router } from 'express';

import { asyncHandler, HttpError } from '../middleware/error-handler.js';
import { radioEngineService } from '../services/radio-engine.service.js';

export const radioRoutes = Router();

radioRoutes.post(
  '/start',
  asyncHandler(async (req, res) => {
    const playlistId = String(req.body?.playlistId ?? '');
    const lat = Number(req.body?.lat);
    const lon = Number(req.body?.lon);

    if (!playlistId) {
      throw new HttpError(400, 'PLAYLIST_ID_REQUIRED', 'playlistId is required');
    }

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new HttpError(400, 'INVALID_LATITUDE', 'lat must be a number between -90 and 90');
    }

    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw new HttpError(400, 'INVALID_LONGITUDE', 'lon must be a number between -180 and 180');
    }

    const result = await radioEngineService.startSession({
      playlistId,
      lat,
      lon,
      city: req.body?.city ? String(req.body.city) : undefined,
      name: req.body?.name ? String(req.body.name) : undefined,
    });

    res.status(201).json(result);
  }),
);

radioRoutes.post(
  '/:id/next',
  asyncHandler(async (req, res) => {
    const segment = await radioEngineService.getNextSegment(String(req.params.id));
    res.json({ segment });
  }),
);

radioRoutes.post('/:id/pause', (req, res) => {
  radioEngineService.pauseSession(String(req.params.id));
  res.json({ status: 'paused' });
});

radioRoutes.post('/:id/resume', (req, res) => {
  radioEngineService.resumeSession(String(req.params.id));
  res.json({ status: 'running' });
});

radioRoutes.post('/:id/stop', (req, res) => {
  radioEngineService.stopSession(String(req.params.id));
  res.json({ status: 'stopped' });
});

radioRoutes.get('/:id/status', (req, res) => {
  const status = radioEngineService.getSessionStatus(String(req.params.id));
  res.json(status);
});

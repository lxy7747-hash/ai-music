import { Router } from 'express';

import { asyncHandler, HttpError } from '../middleware/error-handler.js';
import { weatherService } from '../services/weather.service.js';

export const weatherRoutes = Router();

// router.use(authMiddleware); // TODO: T14

weatherRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new HttpError(400, 'INVALID_LATITUDE', 'lat must be a number between -90 and 90');
    }

    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw new HttpError(400, 'INVALID_LONGITUDE', 'lon must be a number between -180 and 180');
    }

    const weather = await weatherService.getWeather(lat, lon);
    res.json({ weather });
  }),
);

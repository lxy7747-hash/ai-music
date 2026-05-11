import 'dotenv/config';

import path from 'node:path';

import { config as dotenvConfig } from 'dotenv';
import express from 'express';

dotenvConfig({ path: path.resolve(process.cwd(), '..', '.env') });

import { config } from './config.js';
import { initializeDatabase } from './db/schema.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRoutes } from './routes/auth.routes.js';
import { playlistRoutes } from './routes/playlist.routes.js';
import { radioRoutes } from './routes/radio.routes.js';
import { streamRoutes } from './routes/stream.routes.js';
import { weatherRoutes } from './routes/weather.routes.js';

const app = express();

initializeDatabase();

app.use(corsMiddleware);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/radio', radioRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/stream', streamRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`AI Radio backend listening on port ${config.port} (${config.nodeEnv})`);
});

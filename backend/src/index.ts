import 'dotenv/config';

import path from 'node:path';

import { config as dotenvConfig } from 'dotenv';
import express from 'express';

dotenvConfig({ path: path.resolve(process.cwd(), '..', '.env') });

const { config } = await import('./config.js');
const { initializeDatabase } = await import('./db/schema.js');
const { corsMiddleware } = await import('./middleware/cors.js');
const { errorHandler, notFoundHandler } = await import('./middleware/error-handler.js');
const { authRoutes } = await import('./routes/auth.routes.js');
const { playlistRoutes } = await import('./routes/playlist.routes.js');
const { radioRoutes } = await import('./routes/radio.routes.js');
const { streamRoutes } = await import('./routes/stream.routes.js');
const { weatherRoutes } = await import('./routes/weather.routes.js');

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

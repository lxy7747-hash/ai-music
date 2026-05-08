import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { config } from './config.js';
import { initializeDatabase } from './db/schema.js';

const app = express();

initializeDatabase();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

app.listen(config.port, () => {
  console.log(`AI Radio backend listening on port ${config.port} (${config.nodeEnv})`);
});

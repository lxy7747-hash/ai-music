import cors, { type CorsOptions } from 'cors';

import { config } from '../config.js';

const localOrigins = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];

const productionOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.nodeEnv !== 'production' && localOrigins.some((allowed) => allowed.test(origin))) {
      callback(null, true);
      return;
    }

    if (productionOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
};

export const corsMiddleware = cors(corsOptions);

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const optionalIntEnv = (name: string, defaultValue: number): number => {
  const value = process.env[name];

  if (!value) {
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid integer`);
  }

  return parsed;
};

export const config = {
  neteaseApiUrl: process.env.NETEASE_API_URL ?? 'http://localhost:3000',
  geminiApiKey: requiredEnv('GEMINI_API_KEY'),
  port: optionalIntEnv('PORT', 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  dbPath: process.env.DB_PATH ?? './data/radio.db',
  ttsCacheDir: process.env.TTS_CACHE_DIR ?? './data/tts-cache',
  logLevel: process.env.LOG_LEVEL ?? 'debug',
  cookieEncryptionKey: process.env.COOKIE_ENCRYPTION_KEY,
  corsOrigins: (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;

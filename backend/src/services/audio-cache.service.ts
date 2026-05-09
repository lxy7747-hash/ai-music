import { mkdirSync, rmSync, statSync } from 'node:fs';
import { readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { config } from '../config.js';

class AudioCacheService {
  private readonly cacheRoot = resolve(process.cwd(), config.ttsCacheDir);

  getCachePath(sessionId: string, segmentIndex: number): string {
    const sessionDir = resolve(this.cacheRoot, sessionId);
    mkdirSync(sessionDir, { recursive: true });

    return join(sessionDir, `${segmentIndex}.mp3`);
  }

  cleanup(sessionId: string): void {
    const sessionDir = resolve(this.cacheRoot, sessionId);

    if (!sessionDir.startsWith(this.cacheRoot)) {
      throw new Error('Refusing to clean up cache outside configured cache root');
    }

    rmSync(sessionDir, { recursive: true, force: true });
  }

  async cleanupOld(days = 7): Promise<void> {
    mkdirSync(this.cacheRoot, { recursive: true });
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const entries = await readdir(this.cacheRoot, { withFileTypes: true });

    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const path = join(this.cacheRoot, entry.name);
          const stats = statSync(path);

          if (stats.mtimeMs < cutoff) {
            await rm(path, { recursive: true, force: true });
          }
        }),
    );
  }
}

export const audioCacheService = new AudioCacheService();

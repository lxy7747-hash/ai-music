import { access } from 'node:fs/promises';

import { ttsSave } from 'edge-tts/out/index.js';

class TtsService {
  private readonly timeoutMs = 15_000;
  private readonly defaultVoice = 'zh-CN-XiaoxiaoNeural';

  async synthesize(text: string, outputPath: string, voice = this.defaultVoice): Promise<void> {
    if (await this.exists(outputPath)) {
      return;
    }

    await this.withTimeout(ttsSave(text, outputPath, { voice }), this.timeoutMs);
  }

  test(): boolean {
    return typeof ttsSave === 'function';
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeout: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error(`TTS synthesis timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}

export const ttsService = new TtsService();

import { access, writeFile } from 'node:fs/promises';

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

class TtsService {
  private readonly timeoutMs = 15_000;
  private readonly defaultVoice = 'zh-CN-XiaoxiaoNeural';

  async synthesize(text: string, outputPath: string, voice = this.defaultVoice): Promise<void> {
    if (await this.exists(outputPath)) {
      return;
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = await tts.toStream(text);
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`TTS synthesis timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      audioStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      audioStream.on('end', () => {
        clearTimeout(timeout);
        resolve();
      });
      audioStream.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    await writeFile(outputPath, Buffer.concat(chunks));
  }

  test(): boolean {
    return typeof MsEdgeTTS === 'function';
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}

export const ttsService = new TtsService();

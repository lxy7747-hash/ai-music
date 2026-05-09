import { config } from '../config.js';
import type { Track } from './netease.service.js';
import type { WeatherData } from './weather.service.js';

export interface PlaylistAnalysis {
  genreDistribution: Record<string, number>;
  moodDistribution: Record<string, number>;
  tempoCluster: string;
}

export interface DjScriptContext {
  weather?: WeatherData;
  currentTrack?: Track;
  nextTrack?: Track;
  playlistStyle?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

class LlmService {
  private readonly endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  private readonly timeoutMs = 10_000;

  async analyzePlaylist(tracks: Track[]): Promise<PlaylistAnalysis> {
    const sample = tracks
      .slice(0, 30)
      .map((track) => `${track.name} - ${track.artists.join('/')}`)
      .join('\n');
    const prompt = [
      'Analyze this playlist for an AI radio station.',
      'Return compact JSON with genreDistribution, moodDistribution, and tempoCluster.',
      sample,
    ].join('\n\n');

    const text = await this.generateWithRetry(prompt);

    try {
      return JSON.parse(text) as PlaylistAnalysis;
    } catch {
      return this.fallbackAnalysis();
    }
  }

  async generateDjScript(context: DjScriptContext): Promise<string> {
    const weather = context.weather
      ? `${context.weather.weatherDescription}, ${context.weather.temperature}C`
      : 'weather unavailable';
    const current = context.currentTrack
      ? `${context.currentTrack.name} - ${context.currentTrack.artists.join('/')}`
      : 'opening';
    const next = context.nextTrack
      ? `${context.nextTrack.name} - ${context.nextTrack.artists.join('/')}`
      : 'the next song';
    const prompt = [
      'Write a warm, concise Chinese DJ announcement for a personal AI radio station.',
      `Weather: ${weather}`,
      `Current: ${current}`,
      `Next: ${next}`,
      `Playlist style: ${context.playlistStyle ?? 'mixed personal playlist'}`,
      'Keep it under 80 Chinese characters.',
    ].join('\n');

    return this.generateWithRetry(prompt);
  }

  private async generateWithRetry(prompt: string): Promise<string> {
    const delays = [1_000, 2_000, 4_000];

    for (let attempt = 0; attempt <= delays.length; attempt += 1) {
      try {
        return await this.generate(prompt);
      } catch {
        if (attempt === delays.length) {
          return this.fallbackScript();
        }

        await this.sleep(delays[attempt] ?? 1_000);
      }
    }

    return this.fallbackScript();
  }

  private async generate(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.endpoint}?key=${encodeURIComponent(config.geminiApiKey)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned ${response.status}`);
      }

      const body = (await response.json()) as GeminiResponse;
      const text = body.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim();

      if (!text) {
        throw new Error('Gemini response did not include text');
      }

      return text;
    } finally {
      clearTimeout(timeout);
    }
  }

  private fallbackAnalysis(): PlaylistAnalysis {
    return {
      genreDistribution: { unknown: 1 },
      moodDistribution: { balanced: 1 },
      tempoCluster: 'medium',
    };
  }

  private fallbackScript(): string {
    return '接下来这首歌，和此刻的天气刚好合拍。把音量交给心情，我们继续听。';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

export const llmService = new LlmService();

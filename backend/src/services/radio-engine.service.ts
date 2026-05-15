import { randomUUID } from 'node:crypto';

import { db } from '../db/connection.js';
import { audioCacheService } from './audio-cache.service.js';
import { llmService, type PlaylistAnalysis } from './llm.service.js';
import { neteaseService, type Track } from './netease.service.js';
import { ttsService } from './tts.service.js';
import { weatherService, type WeatherData } from './weather.service.js';

type SessionLifecycle = 'idle' | 'running' | 'paused' | 'stopped';
type QueueEntryType = 'song' | 'dj_announcement';
type QueueStatus = 'pending' | 'playing' | 'played' | 'skipped';

export interface StartSessionParams {
  playlistId: string;
  lat: number;
  lon: number;
  city?: string;
  name?: string;
}

export interface Segment {
  id: number;
  sessionId: string;
  position: number;
  type: QueueEntryType;
  url: string | null;
  track?: Track;
  djScript?: string;
  status: QueueStatus;
}

export interface StartResult {
  sessionId: string;
  firstSegment: Segment;
  weather: WeatherData;
  analysis: PlaylistAnalysis;
}

export interface SessionStatus {
  sessionId: string;
  status: SessionLifecycle;
  queueLength: number;
  currentPosition?: number;
}

interface QueueRow {
  id: number;
  session_id: string;
  position: number;
  entry_type: QueueEntryType;
  track_id: string | null;
  dj_script: string | null;
  dj_audio_path: string | null;
  status: QueueStatus;
}

interface TrackRow {
  id: string;
  name: string;
  artists: string;
  album: string | null;
  duration_ms: number;
}

interface SessionRow {
  id: string;
  playlist_id: string;
  status: SessionLifecycle;
}

class RadioEngineService {
  private readonly generating = new Map<string, Promise<Segment>>();

  async startSession(params: StartSessionParams): Promise<StartResult> {
    const sessionId = randomUUID();
    const tracks = await neteaseService.getPlaylistTracks(params.playlistId);

    if (tracks.length === 0) {
      throw new Error(`Playlist ${params.playlistId} did not return any tracks`);
    }

    const [analysis, weather] = await Promise.all([
      llmService.analyzePlaylist(tracks),
      weatherService.getWeather(params.lat, params.lon),
    ]);
    const djScript = await llmService.generateDjScript({
      weather,
      nextTrack: tracks[0],
      playlistStyle: analysis.tempoCluster,
    });
    const djAudioPath = audioCacheService.getCachePath(sessionId, 0);

    let ttsOk = true;

    try {
      await ttsService.synthesize(djScript, djAudioPath);
    } catch (err) {
      console.error(
        '[RadioEngine] startSession TTS failed, skipping intro DJ:',
        err instanceof Error ? err.message : err,
      );
      ttsOk = false;
    }

    const transaction = db.transaction(() => {
      const userId = this.ensureSystemUser();
      this.upsertPlaylist(params.playlistId, userId, params.name ?? `Playlist ${params.playlistId}`, tracks.length);
      this.upsertTracks(params.playlistId, tracks);

      db.prepare(
        `
        INSERT INTO radio_sessions (
          id, name, playlist_id, status, weather_city, weather_data, started_at
        )
        VALUES (?, ?, ?, 'running', ?, ?, CURRENT_TIMESTAMP)
        `,
      ).run(
        sessionId,
        params.name ?? `Radio ${new Date().toISOString()}`,
        params.playlistId,
        params.city ?? null,
        JSON.stringify(weather),
      );

      if (ttsOk) {
        db.prepare(
          `
          INSERT INTO session_queue (
            session_id, position, entry_type, dj_script, dj_audio_path, status
          )
          VALUES (?, 0, 'dj_announcement', ?, ?, 'pending')
          `,
        ).run(sessionId, djScript, djAudioPath);

        db.prepare(
          `
          INSERT INTO session_queue (
            session_id, position, entry_type, track_id, status
          )
          VALUES (?, 1, 'song', ?, 'pending')
          `,
        ).run(sessionId, tracks[0]?.id);
      } else {
        db.prepare(
          `
          INSERT INTO session_queue (
            session_id, position, entry_type, track_id, status
          )
          VALUES (?, 0, 'song', ?, 'pending')
          `,
        ).run(sessionId, tracks[0]?.id);
      }
    });

    transaction();

    return {
      sessionId,
      firstSegment: await this.getNextPendingSegment(sessionId),
      weather,
      analysis,
    };
  }

  async getNextSegment(sessionId: string): Promise<Segment> {
    const playing = db
      .prepare("SELECT id FROM session_queue WHERE session_id = ? AND status = 'playing'")
      .get(sessionId) as { id: number } | undefined;

    if (playing) {
      db.prepare("UPDATE session_queue SET status = 'played', played_at = CURRENT_TIMESTAMP WHERE id = ?").run(
        playing.id,
      );
    }

    const pending = this.findNextPendingRow(sessionId);

    if (pending) {
      return this.rowToSegment(pending);
    }

    const existing = this.generating.get(sessionId);

    if (existing) {
      return existing;
    }

    const generated = this.generateNextPair(sessionId).finally(() => {
      this.generating.delete(sessionId);
    });

    this.generating.set(sessionId, generated);
    return generated;
  }

  pauseSession(sessionId: string): void {
    this.updateSessionStatus(sessionId, 'paused');
  }

  resumeSession(sessionId: string): void {
    this.updateSessionStatus(sessionId, 'running');
  }

  stopSession(sessionId: string): void {
    db.prepare(
      "UPDATE radio_sessions SET status = 'stopped', ended_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(sessionId);
  }

  getSessionStatus(sessionId: string): SessionStatus {
    const session = this.getSession(sessionId);
    const queueLength = db
      .prepare('SELECT COUNT(*) AS count FROM session_queue WHERE session_id = ?')
      .get(sessionId) as { count: number };
    const current = db
      .prepare("SELECT position FROM session_queue WHERE session_id = ? AND status = 'playing'")
      .get(sessionId) as { position: number } | undefined;

    return {
      sessionId,
      status: session.status,
      queueLength: queueLength.count,
      currentPosition: current?.position,
    };
  }

  private async getNextPendingSegment(sessionId: string): Promise<Segment> {
    const row = this.findNextPendingRow(sessionId);

    if (!row) {
      throw new Error(`Session ${sessionId} has no pending queue entries`);
    }

    return this.rowToSegment(row);
  }

  private async generateNextPair(sessionId: string): Promise<Segment> {
    const session = this.getSession(sessionId);
    const tracks = db
      .prepare('SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY rowid ASC')
      .all(session.playlist_id) as TrackRow[];

    if (tracks.length === 0) {
      throw new Error(`Session ${sessionId} playlist has no cached tracks`);
    }

    const songCount = db
      .prepare("SELECT COUNT(*) AS count FROM session_queue WHERE session_id = ? AND entry_type = 'song'")
      .get(sessionId) as { count: number };
    const maxPosition = db
      .prepare('SELECT COALESCE(MAX(position), -1) AS position FROM session_queue WHERE session_id = ?')
      .get(sessionId) as { position: number };
    const nextTrack = this.trackRowToTrack(tracks[songCount.count % tracks.length]);
    const currentTrack = songCount.count > 0 ? this.trackRowToTrack(tracks[(songCount.count - 1) % tracks.length]) : undefined;
    const djPosition = maxPosition.position + 1;
    const songPosition = maxPosition.position + 2;
    const djScript = await llmService.generateDjScript({
      currentTrack,
      nextTrack,
      playlistStyle: 'continued',
    });
    const djAudioPath = audioCacheService.getCachePath(sessionId, djPosition);

    let ttsOk = true;

    try {
      await ttsService.synthesize(djScript, djAudioPath);
    } catch (err) {
      console.error('[RadioEngine] TTS failed, will skip DJ segment:', err instanceof Error ? err.message : err);
      ttsOk = false;
    }

    db.transaction(() => {
      if (ttsOk) {
        db.prepare(
          `
          INSERT INTO session_queue (
            session_id, position, entry_type, dj_script, dj_audio_path, status
          )
          VALUES (?, ?, 'dj_announcement', ?, ?, 'pending')
          `,
        ).run(sessionId, djPosition, djScript, djAudioPath);
      }

      const actualSongPosition = ttsOk ? songPosition : djPosition;
      db.prepare(
        `
        INSERT INTO session_queue (
          session_id, position, entry_type, track_id, status
        )
        VALUES (?, ?, 'song', ?, 'pending')
        `,
      ).run(sessionId, actualSongPosition, nextTrack.id);
    })();

    return this.getNextPendingSegment(sessionId);
  }

  private async rowToSegment(row: QueueRow): Promise<Segment> {
    db.prepare("UPDATE session_queue SET status = 'playing' WHERE id = ?").run(row.id);

    if (row.entry_type === 'dj_announcement') {
      return {
        id: row.id,
        sessionId: row.session_id,
        position: row.position,
        type: row.entry_type,
        url: `/api/stream/audio/${row.session_id}/${row.position}.mp3`,
        djScript: row.dj_script ?? undefined,
        status: 'playing',
      };
    }

    const track = row.track_id ? this.getTrack(row.track_id) : undefined;
    const url = row.track_id
      ? (await neteaseService.getTrackUrl(row.track_id)) ??
        `https://music.163.com/song/media/outer/url?id=${row.track_id}.mp3`
      : null;

    return {
      id: row.id,
      sessionId: row.session_id,
      position: row.position,
      type: row.entry_type,
      url,
      track,
      status: 'playing',
    };
  }

  private findNextPendingRow(sessionId: string): QueueRow | undefined {
    return db
      .prepare(
        `
        SELECT *
        FROM session_queue
        WHERE session_id = ? AND status = 'pending'
        ORDER BY position ASC
        LIMIT 1
        `,
      )
      .get(sessionId) as QueueRow | undefined;
  }

  private getSession(sessionId: string): SessionRow {
    const session = db.prepare('SELECT * FROM radio_sessions WHERE id = ?').get(sessionId) as
      | SessionRow
      | undefined;

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session;
  }

  private getTrack(trackId: string): Track | undefined {
    const row = db.prepare('SELECT * FROM playlist_tracks WHERE id = ?').get(trackId) as
      | TrackRow
      | undefined;

    return row ? this.trackRowToTrack(row) : undefined;
  }

  private trackRowToTrack(row: TrackRow): Track {
    return {
      id: row.id,
      name: row.name,
      artists: JSON.parse(row.artists) as string[],
      album: row.album ?? undefined,
      durationMs: row.duration_ms,
    };
  }

  private ensureSystemUser(): number {
    db.prepare(
      `
      INSERT OR IGNORE INTO users (netease_uid, nickname, avatar_url, cookie)
      VALUES ('system', 'System', NULL, '')
      `,
    ).run();
    const row = db.prepare("SELECT id FROM users WHERE netease_uid = 'system'").get() as { id: number };

    return row.id;
  }

  private upsertPlaylist(playlistId: string, userId: number, name: string, trackCount: number): void {
    db.prepare(
      `
      INSERT INTO playlists (id, user_id, name, track_count, synced_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        track_count = excluded.track_count,
        synced_at = CURRENT_TIMESTAMP
      `,
    ).run(playlistId, userId, name, trackCount);
  }

  private upsertTracks(playlistId: string, tracks: Track[]): void {
    const statement = db.prepare(
      `
      INSERT INTO playlist_tracks (
        id, playlist_id, name, artists, album, duration_ms, genre_tags, mood_tags
      )
      VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)
      ON CONFLICT(id) DO UPDATE SET
        playlist_id = excluded.playlist_id,
        name = excluded.name,
        artists = excluded.artists,
        album = excluded.album,
        duration_ms = excluded.duration_ms
      `,
    );

    for (const track of tracks) {
      statement.run(
        track.id,
        playlistId,
        track.name,
        JSON.stringify(track.artists),
        track.album ?? null,
        track.durationMs,
      );
    }
  }

  private updateSessionStatus(sessionId: string, status: SessionLifecycle): void {
    db.prepare('UPDATE radio_sessions SET status = ? WHERE id = ?').run(status, sessionId);
  }
}

export const radioEngineService = new RadioEngineService();

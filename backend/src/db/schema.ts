import { db } from './connection.js';
import { config } from '../config.js';
import { cookieCryptoService } from '../services/cookie-crypto.service.js';

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  netease_uid TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  cookie TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_netease_uid
ON users (netease_uid);

CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  cover_url TEXT,
  track_count INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playlists_user_id
ON playlists (user_id);

CREATE TABLE IF NOT EXISTS playlist_tracks (
  id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL,
  name TEXT NOT NULL,
  artists TEXT NOT NULL,
  album TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  genre_tags TEXT,
  mood_tags TEXT,
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id
ON playlist_tracks (playlist_id);

CREATE TABLE IF NOT EXISTS radio_sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  playlist_id TEXT NOT NULL,
  status TEXT NOT NULL,
  weather_city TEXT,
  weather_data TEXT,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT,
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE RESTRICT,
  CHECK (status IN ('idle', 'running', 'paused', 'stopped'))
);

CREATE INDEX IF NOT EXISTS idx_radio_sessions_status
ON radio_sessions (status);

CREATE INDEX IF NOT EXISTS idx_radio_sessions_playlist_id
ON radio_sessions (playlist_id);

CREATE TABLE IF NOT EXISTS session_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  entry_type TEXT NOT NULL,
  track_id TEXT,
  dj_script TEXT,
  dj_audio_path TEXT,
  weather_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  played_at TEXT,
  FOREIGN KEY (session_id) REFERENCES radio_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES playlist_tracks(id) ON DELETE SET NULL,
  CHECK (entry_type IN ('song', 'dj_announcement')),
  CHECK (status IN ('pending', 'playing', 'played', 'skipped'))
);

CREATE INDEX IF NOT EXISTS idx_session_queue_session_id
ON session_queue (session_id);

CREATE INDEX IF NOT EXISTS idx_session_queue_session_position
ON session_queue (session_id, position);
`;

export const initializeDatabase = (): void => {
  db.exec(schema);

  if (config.cookieEncryptionKey) {
    const plaintextRows = db
      .prepare("SELECT id, cookie FROM users WHERE cookie NOT LIKE 'aes-256-gcm:%'")
      .all() as Array<{ id: number; cookie: string }>;

    const update = db.prepare('UPDATE users SET cookie = ? WHERE id = ?');
    const tx = db.transaction(() => {
      for (const row of plaintextRows) {
        update.run(cookieCryptoService.encrypt(row.cookie), row.id);
      }
    });
    tx();
  }
};

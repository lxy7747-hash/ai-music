import { config } from '../config.js';

export interface Playlist {
  id: string;
  name: string;
  coverUrl?: string;
  trackCount: number;
  description?: string;
}

export interface Track {
  id: string;
  name: string;
  artists: string[];
  album?: string;
  durationMs: number;
  coverUrl?: string;
}

export interface TrackDetail extends Track {
  albumId?: string;
}

export interface SearchResult {
  songs: Track[];
  playlists: Playlist[];
}

export interface LoginStatus {
  neteaseUid: string;
  nickname?: string;
  avatarUrl?: string;
}

interface NeteaseArtist {
  name?: string;
}

interface NeteaseAlbum {
  id?: number | string;
  name?: string;
  picUrl?: string;
}

interface NeteaseSong {
  id: number | string;
  name?: string;
  ar?: NeteaseArtist[];
  artists?: NeteaseArtist[];
  al?: NeteaseAlbum;
  album?: NeteaseAlbum;
  dt?: number;
  duration?: number;
}

interface NeteasePlaylist {
  id: number | string;
  name?: string;
  coverImgUrl?: string;
  picUrl?: string;
  trackCount?: number;
  description?: string;
}

interface NeteaseUrlItem {
  id: number | string;
  url?: string | null;
  code?: number;
}

interface NeteaseLoginStatusResponse {
  data?: {
    account?: {
      id?: number | string;
      userName?: string;
    };
    profile?: {
      userId?: number | string;
      nickname?: string;
      avatarUrl?: string;
    };
  };
  account?: {
    id?: number | string;
    userName?: string;
  };
  profile?: {
    userId?: number | string;
    nickname?: string;
    avatarUrl?: string;
  };
}

export class NeteaseApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'NeteaseApiError';
  }
}

class NeteaseService {
  private readonly baseUrl = config.neteaseApiUrl;
  private readonly timeoutMs = 10_000;

  async getLoginQRKey(): Promise<string> {
    const response = await this.request<{ data?: { unikey?: string } }>('/login/qr/key');
    const key = response.data?.unikey;

    if (!key) {
      throw new NeteaseApiError('Netease QR key response did not include data.unikey');
    }

    return key;
  }

  async checkQRStatus(key: string): Promise<{ code: number; cookie?: string; nickname?: string }> {
    const response = await this.request<{
      code?: number;
      cookie?: string;
      nickname?: string;
      message?: string;
    }>('/login/qr/check', { key });

    return {
      code: response.code ?? 0,
      cookie: response.cookie,
      nickname: response.nickname,
    };
  }

  async getLoginStatus(cookie: string): Promise<LoginStatus> {
    const response = await this.request<NeteaseLoginStatusResponse>('/login/status', {}, cookie);
    const profile = response.data?.profile ?? response.profile;
    const account = response.data?.account ?? response.account;
    const neteaseUid = profile?.userId ?? account?.id;

    if (!neteaseUid) {
      throw new NeteaseApiError('Netease login status response did not include user id');
    }

    return {
      neteaseUid: String(neteaseUid),
      nickname: profile?.nickname ?? account?.userName,
      avatarUrl: profile?.avatarUrl,
    };
  }

  async getUserPlaylists(uid: string, cookie?: string): Promise<Playlist[]> {
    const response = await this.request<{ playlist?: NeteasePlaylist[] }>('/user/playlist', {
      uid,
    }, cookie);

    return (response.playlist ?? []).map(this.mapPlaylist);
  }

  async getPlaylistTracks(playlistId: string, limit = 1000, offset = 0, cookie?: string): Promise<Track[]> {
    const response = await this.request<{ songs?: NeteaseSong[] }>('/playlist/track/all', {
      id: playlistId,
      limit: String(limit),
      offset: String(offset),
    }, cookie);

    return (response.songs ?? []).map(this.mapTrack);
  }

  async getTrackUrl(trackId: string, level = 'standard', cookie?: string): Promise<string | null> {
    const response = await this.request<{ data?: NeteaseUrlItem[] }>('/song/url/v1', {
      id: trackId,
      level,
    }, cookie);
    const first = response.data?.[0];

    if (!first || first.code === 403 || !first.url) {
      return null;
    }

    return first.url;
  }

  async getTrackDetail(trackIds: string[], cookie?: string): Promise<TrackDetail[]> {
    const response = await this.request<{ songs?: NeteaseSong[] }>('/song/detail', {
      ids: trackIds.join(','),
    }, cookie);

    return (response.songs ?? []).map((song) => ({
      ...this.mapTrack(song),
      albumId: String(song.al?.id ?? song.album?.id ?? ''),
    }));
  }

  async search(keyword: string, type = 1, cookie?: string): Promise<SearchResult> {
    const response = await this.request<{
      result?: {
        songs?: NeteaseSong[];
        playlists?: NeteasePlaylist[];
      };
    }>('/cloudsearch', {
      keywords: keyword,
      type: String(type),
    }, cookie);

    return {
      songs: (response.result?.songs ?? []).map(this.mapTrack),
      playlists: (response.result?.playlists ?? []).map(this.mapPlaylist),
    };
  }

  async checkMusic(trackId: string, cookie?: string): Promise<boolean> {
    try {
      const response = await this.request<{ success?: boolean }>('/check/music', { id: trackId }, cookie);
      return response.success ?? true;
    } catch (error) {
      if (error instanceof NeteaseApiError && error.status && error.status < 500) {
        return false;
      }

      throw error;
    }
  }

  private async request<T>(path: string, params: Record<string, string> = {}, cookie?: string): Promise<T> {
    const url = new URL(path, this.baseUrl);
    url.searchParams.set('timestamp', String(Date.now()));

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const normalizedCookie = cookie ? this.normalizeCookie(cookie) : undefined;

    if (normalizedCookie) {
      url.searchParams.set('cookie', normalizedCookie);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new NeteaseApiError(`Netease API request failed: ${path}`, response.status);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof NeteaseApiError) {
        throw error;
      }

      throw new NeteaseApiError(
        `Netease API request failed: ${path} (${error instanceof Error ? error.message : 'unknown error'})`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeCookie(cookie: string): string {
    const ignoredAttributes = new Set([
      'domain',
      'expires',
      'httponly',
      'max-age',
      'path',
      'samesite',
      'secure',
    ]);
    const pairs: string[] = [];
    const seen = new Set<string>();

    for (const part of cookie.split(';')) {
      const trimmed = part.trim();

      if (!trimmed || !trimmed.includes('=')) {
        continue;
      }

      const [rawName] = trimmed.split('=', 1);
      const name = rawName.trim();

      if (!name || ignoredAttributes.has(name.toLowerCase()) || seen.has(name)) {
        continue;
      }

      seen.add(name);
      pairs.push(trimmed);
    }

    return pairs.join('; ');
  }

  private readonly mapPlaylist = (playlist: NeteasePlaylist): Playlist => ({
    id: String(playlist.id),
    name: playlist.name ?? 'Untitled playlist',
    coverUrl: playlist.coverImgUrl ?? playlist.picUrl,
    trackCount: playlist.trackCount ?? 0,
    description: playlist.description,
  });

  private readonly mapTrack = (song: NeteaseSong): Track => {
    const album = song.al ?? song.album;
    const artists = song.ar ?? song.artists ?? [];

    return {
      id: String(song.id),
      name: song.name ?? 'Untitled track',
      artists: artists.map((artist) => artist.name ?? 'Unknown artist'),
      album: album?.name,
      durationMs: song.dt ?? song.duration ?? 0,
      coverUrl: album?.picUrl,
    };
  };
}

export const neteaseService = new NeteaseService();

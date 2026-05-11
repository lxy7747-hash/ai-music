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

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  weatherDescription: string;
  windSpeed: number;
  cityName?: string;
}

export interface User {
  neteaseUid: string;
  nickname?: string;
  avatarUrl?: string;
}

export interface Segment {
  id: number;
  sessionId: string;
  position: number;
  type: 'song' | 'dj_announcement';
  url: string | null;
  track?: Track;
  djScript?: string;
  status: 'pending' | 'playing' | 'played' | 'skipped';
}

export interface RadioStartResult {
  sessionId: string;
  firstSegment: Segment;
  weather: WeatherData;
  analysis: {
    genreDistribution: Record<string, number>;
    moodDistribution: Record<string, number>;
    tempoCluster: string;
  };
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(
      response.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? `Request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as T;
};

export const api = {
  auth: {
    qrKey: () => request<{ key: string }>('/api/auth/qr-key', { method: 'POST' }),
    qrCheck: (key: string) =>
      request<{ code: number; loggedIn?: boolean; user?: User; cookie?: string; nickname?: string }>(
        '/api/auth/qr-check',
        {
          method: 'POST',
          body: JSON.stringify({ key }),
        },
      ),
    status: () => request<{ loggedIn: boolean; user: User | null }>('/api/auth/status'),
    logout: () => request<{ loggedIn: boolean; user: null }>('/api/auth/logout', { method: 'POST' }),
  },
  playlists: {
    list: () => request<{ playlists: Playlist[] }>('/api/playlists'),
    detail: (id: string) => request<{ playlistId: string; tracks: Track[] }>(`/api/playlists/${id}`),
    analyze: (id: string) =>
      request<{ analysis: unknown }>(`/api/playlists/${id}/analyze`, {
        method: 'POST',
      }),
  },
  radio: {
    start: (params: { playlistId: string; lat: number; lon: number; city?: string; name?: string }) =>
      request<RadioStartResult>('/api/radio/start', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    next: (sessionId: string) =>
      request<{ segment: Segment }>(`/api/radio/${encodeURIComponent(sessionId)}/next`, {
        method: 'POST',
      }),
    pause: (sessionId: string) =>
      request<{ status: string }>(`/api/radio/${encodeURIComponent(sessionId)}/pause`, { method: 'POST' }),
    resume: (sessionId: string) =>
      request<{ status: string }>(`/api/radio/${encodeURIComponent(sessionId)}/resume`, { method: 'POST' }),
    stop: (sessionId: string) =>
      request<{ status: string }>(`/api/radio/${encodeURIComponent(sessionId)}/stop`, { method: 'POST' }),
    status: (sessionId: string) =>
      request<{ sessionId: string; status: string; queueLength: number; currentPosition?: number }>(
        `/api/radio/${encodeURIComponent(sessionId)}/status`,
      ),
  },
  weather: {
    current: (lat: number, lon: number) => request<{ weather: WeatherData }>(`/api/weather?lat=${lat}&lon=${lon}`),
  },
};

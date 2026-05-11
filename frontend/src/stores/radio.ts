import { defineStore } from 'pinia';

import { api, type Playlist, type Segment, type WeatherData } from '../services/api';

interface RadioState {
  sessionId: string | null;
  status: 'idle' | 'running' | 'paused' | 'stopped';
  currentSegment: Segment | null;
  queue: Segment[];
  weather: WeatherData | null;
  sourcePlaylist: Playlist | null;
  loading: boolean;
  error: string | null;
}

export const useRadioStore = defineStore('radio', {
  state: (): RadioState => ({
    sessionId: null,
    status: 'idle',
    currentSegment: null,
    queue: [],
    weather: null,
    sourcePlaylist: null,
    loading: false,
    error: null,
  }),
  actions: {
    async start(playlist: Playlist, lat: number, lon: number, city?: string) {
      this.loading = true;
      this.error = null;

      try {
        const result = await api.radio.start({
          playlistId: playlist.id,
          lat,
          lon,
          city,
          name: playlist.name,
        });
        this.sessionId = result.sessionId;
        this.status = 'running';
        this.currentSegment = result.firstSegment;
        this.queue = [result.firstSegment];
        this.weather = result.weather;
        this.sourcePlaylist = playlist;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to start radio';
      } finally {
        this.loading = false;
      }
    },
    async next() {
      if (!this.sessionId) {
        return;
      }

      try {
        this.error = null;
        const response = await api.radio.next(this.sessionId);
        this.currentSegment = response.segment;
        this.queue.push(response.segment);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load next segment';
      }
    },
    async pause() {
      if (!this.sessionId) {
        return;
      }

      try {
        this.error = null;
        await api.radio.pause(this.sessionId);
        this.status = 'paused';
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to pause radio';
      }
    },
    async resume() {
      if (!this.sessionId) {
        return;
      }

      try {
        this.error = null;
        await api.radio.resume(this.sessionId);
        this.status = 'running';
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to resume radio';
      }
    },
    async stop() {
      if (!this.sessionId) {
        return;
      }

      try {
        this.error = null;
        await api.radio.stop(this.sessionId);
        this.status = 'stopped';
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to stop radio';
      }
    },
    markStopped(reason: string) {
      this.status = 'stopped';
      this.error = reason;
    },
  },
});

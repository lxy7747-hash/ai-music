import { defineStore } from 'pinia';

import type { Segment } from '../services/api';

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  audioType: Segment['type'] | null;
  currentItem: Segment | null;
}

export const usePlayerStore = defineStore('player', {
  state: (): PlayerState => ({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.85,
    audioType: null,
    currentItem: null,
  }),
  actions: {
    setCurrentItem(item: Segment | null) {
      this.currentItem = item;
      this.audioType = item?.type ?? null;
    },
    setPlaying(isPlaying: boolean) {
      this.isPlaying = isPlaying;
    },
    setProgress(currentTime: number, duration: number) {
      this.currentTime = currentTime;
      this.duration = duration;
    },
    setVolume(volume: number) {
      this.volume = volume;
    },
  },
});

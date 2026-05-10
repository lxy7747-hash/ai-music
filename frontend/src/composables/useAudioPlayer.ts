import { computed, ref } from 'vue';

import type { Segment } from '../services/api';
import { usePlayerStore } from '../stores/player';
import { useRadioStore } from '../stores/radio';
import { useMediaSession } from './useMediaSession';

const audio = new Audio();
const retryCount = ref(0);
let isInitialized = false;

export const useAudioPlayer = () => {
  const playerStore = usePlayerStore();
  const radioStore = useRadioStore();
  const queue = computed(() => radioStore.queue);
  const currentItem = computed(() => playerStore.currentItem);
  const progress = computed(() => ({
    currentTime: playerStore.currentTime,
    duration: playerStore.duration,
  }));
  const { registerControls } = useMediaSession();

  const load = (item: Segment) => {
    playerStore.setCurrentItem(item);
    audio.src = item.url ?? '';
    audio.volume = playerStore.volume;
    audio.load();
  };

  const play = async () => {
    if (!playerStore.currentItem && radioStore.currentSegment) {
      load(radioStore.currentSegment);
    }

    await audio.play();
    playerStore.setPlaying(true);
  };

  const pause = () => {
    audio.pause();
    playerStore.setPlaying(false);
  };

  const stop = () => {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    playerStore.setPlaying(false);
    playerStore.setProgress(0, 0);
    playerStore.setCurrentItem(null);
  };

  const next = async () => {
    await radioStore.next();

    if (radioStore.currentSegment) {
      load(radioStore.currentSegment);
      await play();
    }
  };

  const addToQueue = (item: Segment) => {
    radioStore.queue.push(item);
  };

  const handleEnded = async () => {
    try {
      retryCount.value = 0;
      await next();
    } catch (err) {
      console.error('[useAudioPlayer] next failed', err);
      playerStore.setPlaying(false);
    }
  };

  const handleError = () => {
    if (!playerStore.currentItem?.url) {
      playerStore.setPlaying(false);
      return;
    }

    if (retryCount.value >= 3) {
      playerStore.setPlaying(false);
      return;
    }

    retryCount.value += 1;
    window.setTimeout(() => {
      void play();
    }, 2_000);
  };

  const handleTimeUpdate = () => {
    playerStore.setProgress(audio.currentTime, Number.isFinite(audio.duration) ? audio.duration : 0);
  };

  if (!isInitialized) {
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    registerControls({ play: () => void play(), pause, next: () => void next(), stop });
    isInitialized = true;
  }

  return {
    isPlaying: computed(() => playerStore.isPlaying),
    currentItem,
    queue,
    progress,
    play,
    pause,
    next,
    stop,
    addToQueue,
    load,
  };
};

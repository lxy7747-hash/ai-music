import { computed, ref } from 'vue';

import { api, type Segment } from '../services/api';
import { usePlayerStore } from '../stores/player';
import { useRadioStore } from '../stores/radio';
import { useMediaSession } from './useMediaSession';

const audio = new Audio();
const retryCount = ref(0);
const isPrefetching = ref(false);
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
  const { registerControls, updatePlaybackState } = useMediaSession();

  const load = (item: Segment) => {
    playerStore.setCurrentItem(item);
    retryCount.value = 0;
    audio.src = item.url ?? '';
    audio.volume = playerStore.volume;
    audio.load();
  };

  const prefetchNextSegment = async () => {
    if (!radioStore.sessionId) {
      return;
    }

    if (isPrefetching.value) {
      return;
    }

    if (playerStore.currentItem?.type !== 'song') {
      return;
    }

    isPrefetching.value = true;

    try {
      const response = await api.radio.next(radioStore.sessionId);
      addToQueue(response.segment);
    } catch (err) {
      console.error('[useAudioPlayer] prefetch failed', err);
    } finally {
      isPrefetching.value = false;
    }
  };

  const play = async () => {
    if (!playerStore.currentItem && radioStore.currentSegment) {
      load(radioStore.currentSegment);
    }

    await audio.play();
    playerStore.setPlaying(true);
    updatePlaybackState(true);

    if (playerStore.currentItem?.type === 'song') {
      void prefetchNextSegment();
    }
  };

  const pause = async () => {
    audio.pause();
    playerStore.setPlaying(false);
    updatePlaybackState(false);
    await radioStore.pause();
  };

  const stop = async () => {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    playerStore.setPlaying(false);
    playerStore.setProgress(0, 0);
    playerStore.setCurrentItem(null);
    updatePlaybackState(false);
    await radioStore.stop();
  };

  const resume = async () => {
    if (!playerStore.currentItem) {
      if (radioStore.currentSegment) {
        load(radioStore.currentSegment);
      } else {
        return;
      }
    }

    await audio.play();
    playerStore.setPlaying(true);
    updatePlaybackState(true);
    await radioStore.resume();
  };

  const next = async () => {
    const current = radioStore.currentSegment;
    const currentIndex = current ? radioStore.queue.findIndex((item) => item.id === current.id) : -1;
    const queued =
      currentIndex >= 0
        ? radioStore.queue.slice(currentIndex + 1).find((item) => item.status !== 'played')
        : radioStore.queue.find((item) => item.status !== 'played' && item.id !== current?.id);

    if (queued) {
      radioStore.currentSegment = queued;
      load(queued);
      await play();
      return;
    }

    await radioStore.next();

    if (!radioStore.currentSegment) {
      playerStore.setPlaying(false);
      return;
    }

    await play();
  };

  const addToQueue = (item: Segment) => {
    const isCurrentItem = playerStore.currentItem?.id === item.id;
    const isAlreadyQueued = radioStore.queue.some((queued) => queued.id === item.id);

    if (!isCurrentItem && !isAlreadyQueued) {
      radioStore.queue.push(item);
    }
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
      updatePlaybackState(false);
      return;
    }

    if (retryCount.value >= 3) {
      playerStore.setPlaying(false);
      updatePlaybackState(false);
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

  const handleLoadedMetadata = () => {
    playerStore.setProgress(audio.currentTime, Number.isFinite(audio.duration) ? audio.duration : 0);
  };

  if (!isInitialized) {
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    registerControls({ play: () => void resume(), pause: () => void pause(), next: () => void next(), stop: () => void stop() });
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
    resume,
  };
};

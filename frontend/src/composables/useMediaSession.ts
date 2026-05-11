import { watch } from 'vue';

import type { Segment } from '../services/api';
import { usePlayerStore } from '../stores/player';

export const useMediaSession = () => {
  const playerStore = usePlayerStore();

  const updateMetadata = (item: Segment | null) => {
    if (!('mediaSession' in navigator) || !item) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: item.track?.name ?? item.djScript ?? 'AI Radio',
      artist: item.track?.artists.join(', ') ?? 'AI DJ',
      album: item.track?.album ?? 'AI Radio',
      artwork: item.track?.coverUrl
        ? [
            {
              src: item.track.coverUrl,
              sizes: '512x512',
              type: 'image/jpeg',
            },
          ]
        : [],
    });
  };

  const registerControls = (controls: { play: () => void; pause: () => void; next: () => void; stop: () => void }) => {
    if (!('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.setActionHandler('play', controls.play);
    navigator.mediaSession.setActionHandler('pause', controls.pause);
    navigator.mediaSession.setActionHandler('previoustrack', null);
    navigator.mediaSession.setActionHandler('nexttrack', controls.next);
    navigator.mediaSession.setActionHandler('stop', controls.stop);
  };

  const updatePlaybackState = (isPlaying: boolean) => {
    if (!('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  };

  watch(
    () => playerStore.currentItem,
    (item) => updateMetadata(item),
    { immediate: true },
  );

  watch(
    () => playerStore.isPlaying,
    (isPlaying) => updatePlaybackState(isPlaying),
    { immediate: true },
  );

  return {
    registerControls,
    updateMetadata,
    updatePlaybackState,
  };
};

<template>
  <footer class="fixed inset-x-0 bottom-0 border-t border-zinc-800 bg-zinc-950">
    <div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
      <button class="h-10 w-10 rounded bg-cyan-400 font-semibold text-zinc-950" :disabled="!currentItem?.url" @click="toggle">
        {{ isPlaying ? '||' : '>' }}
      </button>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">{{ title }}</p>
        <div class="mt-2 h-1.5 overflow-hidden rounded bg-zinc-800">
          <div class="h-full bg-cyan-400" :style="{ width: `${percent}%` }" />
        </div>
      </div>
      <button class="rounded border border-zinc-700 px-3 py-2 text-sm" :disabled="!radioStore.sessionId" @click="next">
        下一段
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useAudioPlayer } from '../composables/useAudioPlayer';
import { useRadioStore } from '../stores/radio';

const radioStore = useRadioStore();
const { isPlaying, currentItem, progress, resume, pause, next } = useAudioPlayer();

const title = computed(() => currentItem.value?.track?.name ?? currentItem.value?.djScript ?? '等待播放');
const percent = computed(() =>
  progress.value.duration > 0 ? Math.min(100, (progress.value.currentTime / progress.value.duration) * 100) : 0,
);

const toggle = () => {
  if (isPlaying.value) {
    void pause();
    return;
  }

  void resume();
};
</script>

<template>
  <div class="grid gap-5">
    <NowPlaying :segment="radioStore.currentSegment" />
    <RadioControls
      :can-control="Boolean(radioStore.sessionId)"
      @next="next"
      @pause="pause"
      @play="resume"
      @stop="stop"
    />
    <p v-if="radioStore.error" class="rounded bg-red-950 px-3 py-2 text-sm text-red-100">{{ radioStore.error }}</p>
    <SongList :items="radioStore.queue" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';

import NowPlaying from '../components/NowPlaying.vue';
import RadioControls from '../components/RadioControls.vue';
import SongList from '../components/SongList.vue';
import { useAudioPlayer } from '../composables/useAudioPlayer';
import { api } from '../services/api';
import { useRadioStore } from '../stores/radio';

const radioStore = useRadioStore();
const { resume, pause, next, stop } = useAudioPlayer();
let heartbeat: number | undefined;

const clearHeartbeat = () => {
  if (heartbeat) {
    window.clearInterval(heartbeat);
    heartbeat = undefined;
  }
};

const checkSession = async () => {
  if (!radioStore.sessionId || radioStore.status === 'stopped') {
    return;
  }

  try {
    const status = await api.radio.status(radioStore.sessionId);

    if (status.status === 'stopped') {
      radioStore.markStopped('电台会话已停止');
      clearHeartbeat();
    }
  } catch (error) {
    radioStore.error = error instanceof Error ? error.message : '电台会话检查失败';
  }
};

onMounted(() => {
  heartbeat = window.setInterval(() => {
    void checkSession();
  }, 15_000);
});

onBeforeUnmount(() => {
  clearHeartbeat();
});
</script>

<template>
  <div class="grid gap-5">
    <NowPlaying :segment="radioStore.currentSegment" />
    <RadioControls
      :can-control="Boolean(radioStore.sessionId)"
      @next="radioStore.next"
      @pause="radioStore.pause"
      @play="play"
      @stop="radioStore.stop"
    />
    <p v-if="radioStore.error" class="rounded bg-red-950 px-3 py-2 text-sm text-red-100">{{ radioStore.error }}</p>
    <SongList :items="radioStore.queue" />
  </div>
</template>

<script setup lang="ts">
import NowPlaying from '../components/NowPlaying.vue';
import RadioControls from '../components/RadioControls.vue';
import SongList from '../components/SongList.vue';
import { useAudioPlayer } from '../composables/useAudioPlayer';
import { useRadioStore } from '../stores/radio';

const radioStore = useRadioStore();
const { load, play: playAudio } = useAudioPlayer();

const play = async () => {
  if (radioStore.currentSegment) {
    load(radioStore.currentSegment);
  }

  await playAudio();
};
</script>

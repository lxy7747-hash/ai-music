<template>
  <div class="min-h-screen bg-zinc-950 pb-24 text-zinc-50">
    <TopBar />
    <main class="mx-auto w-full max-w-6xl px-4 py-6">
      <slot />
    </main>
    <AudioPlayer />
  </div>
</template>

<script setup lang="ts">
import AudioPlayer from '../AudioPlayer.vue';
import TopBar from './TopBar.vue';
</script>
